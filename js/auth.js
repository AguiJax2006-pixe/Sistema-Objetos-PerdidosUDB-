function obtenerSesion() {
    try {
        const sesion = JSON.parse(
            localStorage.getItem('sesionActual')
        );

        return (
            sesion &&
            typeof sesion === 'object' &&
            sesion.origenAutenticacion === 'api' &&
            typeof sesion.apiToken === 'string' &&
            sesion.apiToken.length === 64
        )
            ? sesion
            : null;
    } catch (error) {
        return null;
    }
}

function cerrarSesion() {
    const usuario = obtenerSesion();
    if (usuario?.apiToken) {
        fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + usuario.apiToken
            },
            keepalive: true
        }).catch(() => {});
    }
    localStorage.removeItem('sesionActual');
    window.location.href = 'login.html';
}

function protegerPagina() {
    const usuario = obtenerSesion();

    if (!usuario) {
        window.location.href = 'login.html';
        return null;
    }

    return usuario;
}

function protegerAdmin() {
    const usuario = obtenerSesion();

    if (!usuario) {
        window.location.href = 'login.html';
        return null;
    }

    if (usuario.rol !== 'admin') {
        alert('No tienes permisos para acceder a esta página.');
        window.location.href = 'dashboard.html';
        return null;
    }

    return usuario;
}
