const API_AUTH_URL = 'http://localhost:3000/api/auth';

document.getElementById('formRegistro').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formulario = event.currentTarget;
    const boton = formulario.querySelector('button[type="submit"]');
    const mensaje = document.getElementById('mensaje');

    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        carnet: document.getElementById('carnet').value.trim(),
        carrera: document.getElementById('carrera').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        password: document.getElementById('password').value
    };

    const confirmar = document.getElementById('confirmarPassword').value;

    mostrarMensaje('', false);

    if (
        !datos.nombre ||
        !datos.apellido ||
        !datos.carnet ||
        !datos.carrera ||
        !datos.correo ||
        !datos.password ||
        !confirmar
    ) {
        return mostrarMensaje('Todos los campos son obligatorios.', false);
    }

    if (!validarCorreo(datos.correo)) {
        return mostrarMensaje('Ingresa un correo electrónico válido.', false);
    }

    if (!validarPassword(datos.password)) {
        return mostrarMensaje(
            'La contraseña debe tener al menos 8 caracteres.',
            false
        );
    }

    if (datos.password !== confirmar) {
        return mostrarMensaje('Las contraseñas no coinciden.', false);
    }

    boton.disabled = true;
    boton.textContent = 'Creando cuenta…';

    try {
        const respuesta = await fetch(API_AUTH_URL + '/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarMensaje(resultado.mensaje || 'No se pudo crear la cuenta.', false);
            return;
        }

        formulario.reset();
        mostrarMensaje(resultado.mensaje, true);
    } catch (error) {
        mostrarMensaje(
            'No se pudo conectar con BackToMe. Confirma que el servidor esté activo.',
            false
        );
    } finally {
        boton.disabled = false;
        boton.textContent = 'Crear cuenta  →';
    }
});

function mostrarMensaje(texto, correcto) {
    const mensaje = document.getElementById('mensaje');
    mensaje.textContent = texto;

    if (!texto) {
        mensaje.className = 'alert';
        return;
    }

    mensaje.className = correcto
        ? 'alert alert-success show'
        : 'alert alert-error show';
}
