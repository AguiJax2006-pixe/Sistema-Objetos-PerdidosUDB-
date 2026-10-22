
// VALIDACIONES


function validarCorreo(correo) {

    const expresion =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expresion.test(correo);
}


function validarPassword(password) {

    return password.length >= 8;
}


function validarCampo(campo) {

    return campo.trim() !== "";
}


function mostrarError(elemento, mensaje) {

    elemento.textContent = mensaje;

    elemento.classList.remove("d-none");
}


function ocultarError(elemento) {

    elemento.textContent = "";

    elemento.classList.add("d-none");
}
