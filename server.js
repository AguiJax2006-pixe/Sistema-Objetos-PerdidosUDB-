require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const app = express();
const puerto = Number(process.env.PORT || 3000);
const direccionAplicacion = (
    process.env.APP_BASE_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const conexion = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

function correoConfigurado() {
    return Boolean(process.env.SMTP_USER && process.env.SMTP_APP_PASSWORD);
}

function crearTransportadorCorreo() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_APP_PASSWORD
        }
    });
}

function escaparHtml(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function responderPaginaVerificacion(res, estado, titulo, mensaje) {
    const pagina =
        '<!doctype html>' +
        '<html lang="es"><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<title>' + escaparHtml(titulo) + ' · BackToMe</title></head>' +
        '<body style="font-family:Arial,sans-serif;max-width:640px;margin:64px auto;padding:24px;color:#17324d">' +
        '<h1>' + escaparHtml(titulo) + '</h1>' +
        '<p>' + escaparHtml(mensaje) + '</p>' +
        '<p>Ya puedes volver a BackToMe e iniciar sesión.</p>' +
        '</body></html>';

    res.status(estado).type('html').send(pagina);
}

async function generarHashContrasena(contrasena) {
    const sal = crypto.randomBytes(16);
    const derivada = await scrypt(contrasena, sal, 64);
    return 'scrypt$' + sal.toString('hex') + '$' + derivada.toString('hex');
}

async function verificarContrasena(contrasena, hashGuardado) {
    const partes = String(hashGuardado || '').split('$');
    const algoritmo = partes[0];
    const salHex = partes[1];
    const derivadaHex = partes[2];

    if (
        algoritmo !== 'scrypt' ||
        !salHex ||
        !derivadaHex ||
        !/^[a-f0-9]+$/i.test(salHex) ||
        !/^[a-f0-9]+$/i.test(derivadaHex)
    ) {
        return false;
    }

    const sal = Buffer.from(salHex, 'hex');
    const derivadaEsperada = Buffer.from(derivadaHex, 'hex');
    const derivadaRecibida = await scrypt(
        contrasena,
        sal,
        derivadaEsperada.length
    );

    return (
        derivadaRecibida.length === derivadaEsperada.length &&
        crypto.timingSafeEqual(derivadaRecibida, derivadaEsperada)
    );
}

function usuarioPublico(usuario) {
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        carnet: usuario.carnet,
        carrera: usuario.carrera,
        correo: usuario.correo,
        rol: usuario.rol === 'administrador' ? 'admin' : 'usuario'
    };
}

function estadoSolicitudVisible(estado) {
    return String(estado || '').charAt(0).toUpperCase() + String(estado || '').slice(1);
}

function tipoObjetoVisible(tipo) {
    return tipo === 'encontrado' ? 'Encontrado' : 'Perdido';
}

function obtenerToken(req) {
    const encabezado = String(req.get('authorization') || '');
    const coincidencia = encabezado.match(/^Bearer\s+([a-f0-9]{64})$/i);
    return coincidencia ? coincidencia[1] : '';
}

async function exigirSesion(req, res, siguiente) {
    const token = obtenerToken(req);
    if (!token) {
        return res.status(401).json({ mensaje: 'Inicia sesión para continuar.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    try {
        const [sesiones] = await conexion.execute(
            'SELECT u.id, u.nombre, u.apellido, u.carnet, u.carrera, u.correo, u.rol ' +
            'FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id ' +
            'WHERE s.token_hash = ? AND s.vence_en > UTC_TIMESTAMP() LIMIT 1',
            [tokenHash]
        );
        if (!sesiones.length) {
            return res.status(401).json({ mensaje: 'La sesión venció. Inicia sesión nuevamente.' });
        }
        req.usuario = sesiones[0];
        siguiente();
    } catch (error) {
        console.error('Error al validar sesión:', error.message);
        res.status(500).json({ mensaje: 'No se pudo validar la sesión.' });
    }
}

function normalizarObjeto(fila) {
    return {
        id: fila.id,
        usuarioId: fila.usuario_id,
        usuarioNombre: [fila.nombre_usuario, fila.apellido_usuario].filter(Boolean).join(' '),
        nombre: fila.titulo,
        categoria: fila.categoria || 'Otros',
        descripcion: fila.descripcion,
        foto: fila.foto_url || '',
        ubicacion: fila.lugar,
        fecha: fila.fecha_del_suceso,
        estado: tipoObjetoVisible(fila.tipo),
        estadoPublicacion: fila.estado,
        fechaRegistro: fila.creado_en
    };
}

function normalizarSolicitud(fila) {
    return {
        id: fila.id,
        objetoId: fila.objeto_id,
        objetoNombre: fila.objeto_nombre,
        usuarioId: fila.solicitante_id,
        usuarioNombre: [fila.nombre_solicitante, fila.apellido_solicitante].filter(Boolean).join(' '),
        propietarioId: fila.propietario_id,
        propietarioNombre: [fila.nombre_propietario, fila.apellido_propietario].filter(Boolean).join(' '),
        estado: estadoSolicitudVisible(fila.estado),
        mensaje: fila.mensaje || '',
        fechaSolicitud: fila.creado_en,
        fechaRespuesta: fila.actualizado_en
    };
}

function normalizarMensaje(fila) {
    return {
        id: fila.id,
        autorId: fila.remitente_id,
        autorNombre: [fila.nombre_remitente, fila.apellido_remitente].filter(Boolean).join(' '),
        texto: fila.contenido,
        fecha: fila.enviado_en
    };
}

app.get('/api/db-test', async (req, res) => {
    try {
        const [resultado] = await conexion.query(
            'SELECT DATABASE() AS base'
        );

        res.json({
            mensaje: 'Conexión correcta',
            base: resultado[0].base
        });
    } catch (error) {
        console.error('Error al conectar con MySQL:', error.message);
        res.status(500).json({
            mensaje: 'No se pudo conectar con MySQL. Revisa el error en PowerShell.'
        });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const nombre = String(req.body?.nombre || '').trim();
    const apellido = String(req.body?.apellido || '').trim();
    const carnet = String(req.body?.carnet || '').trim().toUpperCase();
    const carrera = String(req.body?.carrera || '').trim();
    const correo = String(req.body?.correo || '').trim().toLowerCase();
    const contrasena = String(req.body?.password || '');

    if (!nombre || !apellido || !carnet || !carrera || !correo || !contrasena) {
        return res.status(400).json({
            mensaje: 'Completa todos los campos del formulario.'
        });
    }

    if (
        nombre.length > 100 ||
        apellido.length > 100 ||
        carnet.length > 40 ||
        carrera.length > 150 ||
        correo.length > 255
    ) {
        return res.status(400).json({
            mensaje: 'Uno o más campos superan la longitud permitida.'
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        return res.status(400).json({
            mensaje: 'Ingresa un correo electrónico válido.'
        });
    }

    if (contrasena.length < 8 || contrasena.length > 128) {
        return res.status(400).json({
            mensaje: 'La contraseña debe tener entre 8 y 128 caracteres.'
        });
    }

    if (!correoConfigurado()) {
        return res.status(503).json({
            mensaje: 'Falta configurar el envío de correo para activar el registro.'
        });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const hashContrasena = await generarHashContrasena(contrasena);
    const enlaceVerificacion =
        direccionAplicacion + '/api/auth/verify?token=' + token;
    const transportador = crearTransportadorCorreo();
    const conexionUsuario = await conexion.getConnection();

    try {
        await conexionUsuario.beginTransaction();

        const [resultadoUsuario] = await conexionUsuario.execute(
            'INSERT INTO usuarios ' +
            '(nombre, apellido, carnet, carrera, correo, contrasena_hash, rol, correo_verificado) ' +
            "VALUES (?, ?, ?, ?, ?, ?, 'usuario', FALSE)",
            [nombre, apellido, carnet, carrera, correo, hashContrasena]
        );

        await conexionUsuario.execute(
            'INSERT INTO verificaciones_correo ' +
            '(usuario_id, token_hash, vence_en) ' +
            'VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 24 HOUR))',
            [resultadoUsuario.insertId, tokenHash]
        );

        await transportador.sendMail({
            from: '"BackToMe" <' + process.env.SMTP_USER + '>',
            to: correo,
            subject: 'Verifica tu correo de BackToMe',
            text:
                'Hola ' + nombre + ',\n\n' +
                'Confirma tu correo abriendo este enlace dentro de las próximas 24 horas:\n' +
                enlaceVerificacion + '\n\n' +
                'Si no solicitaste esta cuenta, puedes ignorar este mensaje.',
            html:
                '<p>Hola ' + escaparHtml(nombre) + ',</p>' +
                '<p>Confirma tu correo de BackToMe abriendo este enlace dentro de las próximas 24 horas:</p>' +
                '<p><a href="' + escaparHtml(enlaceVerificacion) + '">Verificar mi correo</a></p>' +
                '<p>Si no solicitaste esta cuenta, puedes ignorar este mensaje.</p>'
        });

        await conexionUsuario.commit();

        res.status(201).json({
            mensaje: 'Cuenta creada. Revisa tu correo para verificarla.'
        });
    } catch (error) {
        await conexionUsuario.rollback();

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                mensaje: 'Ese correo o carnet ya está registrado.'
            });
        }

        console.error('Error durante el registro:', error.message);
        res.status(500).json({
            mensaje: 'No se pudo completar el registro. Revisa el error en PowerShell.'
        });
    } finally {
        conexionUsuario.release();
    }
});

app.get('/api/auth/verify', async (req, res) => {
    const token = String(req.query.token || '');

    if (!/^[a-f0-9]{64}$/i.test(token)) {
        return responderPaginaVerificacion(
            res,
            400,
            'Enlace inválido',
            'El enlace de verificación no es válido.'
        );
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const conexionUsuario = await conexion.getConnection();

    try {
        await conexionUsuario.beginTransaction();

        const [verificaciones] = await conexionUsuario.execute(
            'SELECT id, usuario_id FROM verificaciones_correo ' +
            'WHERE token_hash = ? AND usado_en IS NULL ' +
            'AND vence_en > UTC_TIMESTAMP() LIMIT 1 FOR UPDATE',
            [tokenHash]
        );

        if (verificaciones.length === 0) {
            await conexionUsuario.rollback();
            return responderPaginaVerificacion(
                res,
                400,
                'Enlace vencido o utilizado',
                'Solicita un nuevo enlace de verificación para continuar.'
            );
        }

        const verificacion = verificaciones[0];

        await conexionUsuario.execute(
            'UPDATE usuarios SET correo_verificado = TRUE WHERE id = ?',
            [verificacion.usuario_id]
        );

        await conexionUsuario.execute(
            'UPDATE verificaciones_correo SET usado_en = UTC_TIMESTAMP() WHERE id = ?',
            [verificacion.id]
        );

        await conexionUsuario.commit();

        responderPaginaVerificacion(
            res,
            200,
            'Correo verificado',
            'Tu cuenta de BackToMe ya está activa.'
        );
    } catch (error) {
        await conexionUsuario.rollback();
        console.error('Error al verificar el correo:', error.message);
        responderPaginaVerificacion(
            res,
            500,
            'No se pudo verificar',
            'Ocurrió un error al verificar el correo. Inténtalo más tarde.'
        );
    } finally {
        conexionUsuario.release();
    }
});

app.post('/api/auth/login', async (req, res) => {
    const correo = String(req.body?.correo || '').trim().toLowerCase();
    const carnet = String(req.body?.carnet || '').trim().toUpperCase();
    const contrasena = String(req.body?.password || '');

    if (!correo || !carnet || !contrasena) {
        return res.status(400).json({
            mensaje: 'Ingresa correo, carnet y contraseña.'
        });
    }

    try {
        const [usuarios] = await conexion.execute(
            'SELECT id, nombre, apellido, carnet, carrera, correo, ' +
            'contrasena_hash, rol, correo_verificado FROM usuarios ' +
            'WHERE correo = ? AND carnet = ? LIMIT 1',
            [correo, carnet]
        );

        if (
            usuarios.length === 0 ||
            !(await verificarContrasena(
                contrasena,
                usuarios[0] ? usuarios[0].contrasena_hash : ''
            ))
        ) {
            return res.status(401).json({
                mensaje: 'El correo, carnet o contraseña son incorrectos.'
            });
        }

        const usuario = usuarios[0];

        if (!usuario.correo_verificado) {
            return res.status(403).json({
                mensaje: 'Confirma tu correo electrónico antes de iniciar sesión.'
            });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await conexion.execute(
            'INSERT INTO sesiones (usuario_id, token_hash, vence_en) ' +
            'VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))',
            [usuario.id, tokenHash]
        );

        res.json({
            mensaje: 'Inicio de sesión correcto.',
            usuario: usuarioPublico(usuario),
            token
        });
    } catch (error) {
        console.error('Error durante el inicio de sesión:', error.message);
        res.status(500).json({
            mensaje: 'No se pudo iniciar sesión. Revisa el error en PowerShell.'
        });
    }
});

app.post('/api/auth/logout', exigirSesion, async (req, res) => {
    const tokenHash = crypto.createHash('sha256').update(obtenerToken(req)).digest('hex');
    try {
        await conexion.execute('DELETE FROM sesiones WHERE token_hash = ?', [tokenHash]);
        res.json({ mensaje: 'Sesión cerrada.' });
    } catch (error) {
        console.error('Error al cerrar sesión:', error.message);
        res.status(500).json({ mensaje: 'No se pudo cerrar la sesión.' });
    }
});

app.patch('/api/profile', exigirSesion, async (req, res) => {
    const nombre = String(req.body?.nombre || '').trim();
    if (!nombre || nombre.length > 100) {
        return res.status(400).json({ mensaje: 'El nombre debe tener entre 1 y 100 caracteres.' });
    }

    try {
        await conexion.execute(
            'UPDATE usuarios SET nombre = ? WHERE id = ?',
            [nombre, req.usuario.id]
        );
        res.json({ mensaje: 'Nombre actualizado.', usuario: usuarioPublico({ ...req.usuario, nombre }) });
    } catch (error) {
        console.error('Error al actualizar el perfil:', error.message);
        res.status(500).json({ mensaje: 'No se pudo actualizar el nombre.' });
    }
});

app.get('/api/data', exigirSesion, async (req, res) => {
    try {
        const [objetos] = await conexion.execute(
            "SELECT o.*, u.nombre AS nombre_usuario, u.apellido AS apellido_usuario " +
            "FROM objetos o JOIN usuarios u ON u.id = o.usuario_id " +
            "WHERE o.estado = 'publicado' ORDER BY o.creado_en DESC"
        );
        const [solicitudes] = await conexion.execute(
            'SELECT s.*, o.titulo AS objeto_nombre, o.usuario_id AS propietario_id, ' +
            'us.nombre AS nombre_solicitante, us.apellido AS apellido_solicitante, ' +
            'up.nombre AS nombre_propietario, up.apellido AS apellido_propietario ' +
            'FROM solicitudes s JOIN objetos o ON o.id = s.objeto_id ' +
            'JOIN usuarios us ON us.id = s.solicitante_id ' +
            'JOIN usuarios up ON up.id = o.usuario_id ' +
            'WHERE s.solicitante_id = ? OR o.usuario_id = ? ORDER BY s.creado_en DESC',
            [req.usuario.id, req.usuario.id]
        );
        const [conversaciones] = await conexion.execute(
            'SELECT c.id, c.objeto_id, o.titulo AS objeto_nombre, ' +
            'o.usuario_id AS propietario_id, up.nombre AS nombre_propietario, up.apellido AS apellido_propietario, ' +
            's.solicitante_id, us.nombre AS nombre_solicitante, us.apellido AS apellido_solicitante, ' +
            's.id AS solicitud_id, c.creado_en ' +
            'FROM conversaciones c JOIN objetos o ON o.id = c.objeto_id ' +
            'JOIN solicitudes s ON s.id = c.solicitud_id ' +
            'JOIN usuarios up ON up.id = o.usuario_id ' +
            'JOIN usuarios us ON us.id = s.solicitante_id ' +
            'JOIN participantes_conversacion pc ON pc.conversacion_id = c.id ' +
            'WHERE pc.usuario_id = ? ORDER BY c.creado_en DESC',
            [req.usuario.id]
        );

        const listaConversaciones = [];
        for (const fila of conversaciones) {
            const [filasMensajes] = await conexion.execute(
                'SELECT m.*, u.nombre AS nombre_remitente, u.apellido AS apellido_remitente ' +
                'FROM mensajes m JOIN usuarios u ON u.id = m.remitente_id ' +
                'WHERE m.conversacion_id = ? ORDER BY m.enviado_en ASC',
                [fila.id]
            );
            listaConversaciones.push({
                id: fila.id,
                objetoId: fila.objeto_id,
                objetoNombre: fila.objeto_nombre,
                propietarioId: fila.propietario_id,
                propietarioNombre: [fila.nombre_propietario, fila.apellido_propietario].filter(Boolean).join(' '),
                solicitanteId: fila.solicitante_id,
                solicitanteNombre: [fila.nombre_solicitante, fila.apellido_solicitante].filter(Boolean).join(' '),
                participantes: [String(fila.propietario_id), String(fila.solicitante_id)],
                solicitudId: fila.solicitud_id,
                mensajes: filasMensajes.map(normalizarMensaje),
                actualizada: filasMensajes.at(-1)?.enviado_en || fila.creado_en
            });
        }

        const [usuarios] = await conexion.execute(
            "SELECT DISTINCT u.id, u.nombre, u.apellido, " +
            "CASE WHEN u.id = ? THEN u.correo ELSE NULL END AS correo " +
            "FROM usuarios u JOIN objetos o ON o.usuario_id = u.id " +
            "WHERE o.estado = 'publicado' OR u.id = ?",
            [req.usuario.id, req.usuario.id]
        );

        res.json({
            objetos: objetos.map(normalizarObjeto),
            solicitudes: solicitudes.map(normalizarSolicitud),
            conversaciones: listaConversaciones,
            usuarios: usuarios.map(usuarioPublico)
        });
    } catch (error) {
        console.error('Error al cargar los datos de la aplicación:', error.message);
        res.status(500).json({ mensaje: 'No se pudieron cargar los datos de BackToMe.' });
    }
});

app.post('/api/objects', exigirSesion, async (req, res) => {
    const nombre = String(req.body?.nombre || '').trim();
    const categoria = String(req.body?.categoria || '').trim();
    const descripcion = String(req.body?.descripcion || '').trim();
    const ubicacion = String(req.body?.ubicacion || '').trim();
    const fecha = String(req.body?.fecha || '').trim();
    const tipoVisible = String(req.body?.estado || '');
    const foto = String(req.body?.foto || '');

    if (!nombre || !categoria || !descripcion || !ubicacion || !fecha || !['Perdido', 'Encontrado'].includes(tipoVisible)) {
        return res.status(400).json({ mensaje: 'Completa todos los datos del objeto.' });
    }
    if (nombre.length > 150 || categoria.length > 80 || descripcion.length > 5000 || ubicacion.length > 200) {
        return res.status(400).json({ mensaje: 'Uno o más datos superan la longitud permitida.' });
    }
    if (foto && (!/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/]+=*$/i.test(foto) || foto.length > 1800000)) {
        return res.status(400).json({ mensaje: 'La foto no es válida o supera el tamaño permitido.' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({ mensaje: 'Ingresa una fecha válida.' });
    }

    try {
        const [resultado] = await conexion.execute(
            "INSERT INTO objetos (usuario_id, tipo, titulo, descripcion, categoria, foto_url, lugar, fecha_del_suceso, estado) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'publicado')",
            [req.usuario.id, tipoVisible === 'Encontrado' ? 'encontrado' : 'perdido', nombre, descripcion, categoria, foto || null, ubicacion, fecha]
        );
        res.status(201).json({ id: resultado.insertId, mensaje: 'Publicación guardada.' });
    } catch (error) {
        console.error('Error al crear publicación:', error.message);
        res.status(500).json({ mensaje: 'No se pudo guardar la publicación.' });
    }
});

app.patch('/api/objects/:id', exigirSesion, async (req, res) => {
    const titulo = String(req.body?.nombre || '').trim();
    if (!titulo || titulo.length > 150) {
        return res.status(400).json({ mensaje: 'El nombre debe tener entre 1 y 150 caracteres.' });
    }

    try {
        const [resultado] = await conexion.execute(
            "UPDATE objetos SET titulo = ? WHERE id = ? AND usuario_id = ? AND estado = 'publicado'",
            [titulo, req.params.id, req.usuario.id]
        );
        if (!resultado.affectedRows) {
            return res.status(404).json({ mensaje: 'No se encontró una publicación tuya activa.' });
        }
        res.json({ mensaje: 'Nombre de publicación actualizado.' });
    } catch (error) {
        console.error('Error al cambiar nombre de publicación:', error.message);
        res.status(500).json({ mensaje: 'No se pudo actualizar la publicación.' });
    }
});

app.delete('/api/objects/:id', exigirSesion, async (req, res) => {
    try {
        const [resultado] = await conexion.execute(
            "UPDATE objetos SET estado = 'archivado' WHERE id = ? AND usuario_id = ? AND estado = 'publicado'",
            [req.params.id, req.usuario.id]
        );
        if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'No se encontró una publicación tuya activa.' });
        res.json({ mensaje: 'Publicación archivada.' });
    } catch (error) {
        console.error('Error al archivar publicación:', error.message);
        res.status(500).json({ mensaje: 'No se pudo eliminar la publicación.' });
    }
});

app.post('/api/requests', exigirSesion, async (req, res) => {
    const objetoId = Number(req.body?.objetoId);
    const mensaje = String(req.body?.mensaje || '').trim();
    if (!Number.isSafeInteger(objetoId) || objetoId < 1 || mensaje.length > 2000) {
        return res.status(400).json({ mensaje: 'La solicitud no es válida.' });
    }
    const cn = await conexion.getConnection();
    try {
        await cn.beginTransaction();
        const [filasObjeto] = await cn.execute(
            "SELECT id, usuario_id FROM objetos WHERE id = ? AND estado = 'publicado' FOR UPDATE",
            [objetoId]
        );
        if (!filasObjeto.length) {
            await cn.rollback();
            return res.status(404).json({ mensaje: 'La publicación ya no está disponible.' });
        }
        const objeto = filasObjeto[0];
        if (String(objeto.usuario_id) === String(req.usuario.id)) {
            await cn.rollback();
            return res.status(400).json({ mensaje: 'No puedes solicitar tu propio objeto.' });
        }
        const [anteriores] = await cn.execute(
            "SELECT id FROM solicitudes WHERE objeto_id = ? AND solicitante_id = ? AND estado IN ('pendiente', 'aceptada') LIMIT 1",
            [objetoId, req.usuario.id]
        );
        let solicitudId;
        if (anteriores.length) {
            solicitudId = anteriores[0].id;
        } else {
            const [resultado] = await cn.execute(
                "INSERT INTO solicitudes (objeto_id, solicitante_id, mensaje, estado) VALUES (?, ?, ?, 'pendiente')",
                [objetoId, req.usuario.id, mensaje || null]
            );
            solicitudId = resultado.insertId;
        }

        const [filasConversacion] = await cn.execute(
            'SELECT id FROM conversaciones WHERE solicitud_id = ? LIMIT 1', [solicitudId]
        );
        let conversacionId;
        if (filasConversacion.length) {
            conversacionId = filasConversacion[0].id;
        } else {
            const [resultadoConversacion] = await cn.execute(
                'INSERT INTO conversaciones (objeto_id, solicitud_id) VALUES (?, ?)',
                [objetoId, solicitudId]
            );
            conversacionId = resultadoConversacion.insertId;
            await cn.execute(
                'INSERT INTO participantes_conversacion (conversacion_id, usuario_id) VALUES (?, ?), (?, ?)',
                [conversacionId, objeto.usuario_id, conversacionId, req.usuario.id]
            );
        }
        await cn.commit();
        res.status(201).json({ solicitudId, conversacionId, mensaje: 'Solicitud enviada.' });
    } catch (error) {
        await cn.rollback();
        console.error('Error al crear solicitud:', error.message);
        res.status(500).json({ mensaje: 'No se pudo enviar la solicitud.' });
    } finally {
        cn.release();
    }
});

app.patch('/api/requests/:id', exigirSesion, async (req, res) => {
    const estado = String(req.body?.estado || '').toLowerCase();
    if (!['aceptada', 'rechazada'].includes(estado)) {
        return res.status(400).json({ mensaje: 'La respuesta no es válida.' });
    }
    try {
        const [resultado] = await conexion.execute(
            "UPDATE solicitudes s JOIN objetos o ON o.id = s.objeto_id " +
            "SET s.estado = ?, s.actualizado_en = CURRENT_TIMESTAMP " +
            "WHERE s.id = ? AND o.usuario_id = ? AND s.estado = 'pendiente'",
            [estado, req.params.id, req.usuario.id]
        );
        if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'No hay una solicitud pendiente que puedas responder.' });
        res.json({ mensaje: estado === 'aceptada' ? 'Solicitud aceptada.' : 'Solicitud rechazada.' });
    } catch (error) {
        console.error('Error al responder solicitud:', error.message);
        res.status(500).json({ mensaje: 'No se pudo actualizar la solicitud.' });
    }
});

app.post('/api/conversations/:id/messages', exigirSesion, async (req, res) => {
    const texto = String(req.body?.texto || '').trim();
    if (!texto || texto.length > 500) return res.status(400).json({ mensaje: 'Escribe un mensaje de hasta 500 caracteres.' });
    try {
        const [participante] = await conexion.execute(
            'SELECT 1 FROM participantes_conversacion WHERE conversacion_id = ? AND usuario_id = ? LIMIT 1',
            [req.params.id, req.usuario.id]
        );
        if (!participante.length) return res.status(404).json({ mensaje: 'No se encontró la conversación.' });
        const [resultado] = await conexion.execute(
            'INSERT INTO mensajes (conversacion_id, remitente_id, contenido) VALUES (?, ?, ?)',
            [req.params.id, req.usuario.id, texto]
        );
        res.status(201).json({ id: resultado.insertId, mensaje: 'Mensaje enviado.' });
    } catch (error) {
        console.error('Error al enviar mensaje:', error.message);
        res.status(500).json({ mensaje: 'No se pudo enviar el mensaje.' });
    }
});

app.listen(puerto, () => {
    console.log('Servidor activo en ' + direccionAplicacion);
});
