const API_AUTH_URL = 'http://localhost:3000/api/auth';

document.getElementById('formLogin').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formulario = event.currentTarget;
    const boton = formulario.querySelector('button[type="submit"]');
    const mensaje = document.getElementById('mensajeError');
    const correo = document.getElementById('correo').value.trim();
    const carnet = document.getElementById('carnet').value.trim();
    const password = document.getElementById('password').value;

    mostrarMensaje('');

    if (!validarCampo(correo)) {
        return mostrarMensaje('Por favor ingresa tu correo.');
    }

    if (!validarCorreo(correo)) {
        return mostrarMensaje('Ingresa un correo electrónico válido.');
    }

    if (!validarCampo(carnet)) {
        return mostrarMensaje('Por favor ingresa tu carnet estudiantil.');
    }

    if (!validarCampo(password)) {
        return mostrarMensaje('Por favor ingresa tu contraseña.');
    }

    boton.disabled = true;
    boton.textContent = 'Iniciando sesión…';

    try {
        const respuesta = await fetch(API_AUTH_URL + '/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correo, carnet, password })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            return mostrarMensaje(
                resultado.mensaje || 'No se pudo iniciar sesión.'
            );
        }

        guardarSesionLocal(resultado.usuario, resultado.token);
        window.location.href = 'dashboard.html';
    } catch (error) {
        mostrarMensaje(
            'No se pudo conectar con BackToMe. Confirma que el servidor esté activo.'
        );
    } finally {
        boton.disabled = false;
        boton.textContent = 'Iniciar sesión  →';
    }

    function mostrarMensaje(texto) {
        mensaje.textContent = texto;
        mensaje.className = texto
            ? 'alert alert-error show'
            : 'alert alert-error';
    }
});

function guardarSesionLocal(usuario, token) {
    const sesion = {
        ...usuario,
        apiToken: token,
        origenAutenticacion: 'api'
    };

    localStorage.setItem('sesionActual', JSON.stringify(sesion));

    let usuarios = [];

    try {
        const guardados = JSON.parse(localStorage.getItem('usuarios') || '[]');
        usuarios = Array.isArray(guardados)
            ? guardados
                .filter((item) => item && typeof item === 'object')
                .map(({ password, ...perfil }) => perfil)
            : [];
    } catch (error) {
        usuarios = [];
    }

    usuarios = usuarios.filter(
        (item) => String(item.id) !== String(usuario.id)
    );
    usuarios.push(usuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
}
