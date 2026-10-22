document.addEventListener("DOMContentLoaded", function () {

    const usuario = obtenerSesion();

    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    const formulario = document.getElementById("formPublicar");

    if (!formulario) {
        console.error("No se encontró el formulario formPublicar.");
        return;
    }

    formulario.addEventListener("submit", function (event) {

        event.preventDefault();

        const nombre = document
            .getElementById("nombreObjeto")
            .value
            .trim();

        const categoria = document
            .getElementById("categoria")
            .value;

        const descripcion = document
            .getElementById("descripcion")
            .value
            .trim();

        const ubicacion = document
            .getElementById("ubicacion")
            .value
            .trim();

        const fecha = document
            .getElementById("fecha")
            .value;

        const estado = document
            .getElementById("estado")
            .value;

        const mensaje =
            document.getElementById("mensaje");


        // VALIDACIÓN
        if (
            !nombre ||
            !categoria ||
            !descripcion ||
            !ubicacion ||
            !fecha ||
            !estado
        ) {

            mensaje.className =
                "alert alert-danger";

            mensaje.textContent =
                "Todos los campos son obligatorios.";

            return;
        }


        // OBTENER OBJETOS EXISTENTES
        let objetos = [];

        try {

            const datos =
                localStorage.getItem("objetos");

            if (datos) {
                objetos = JSON.parse(datos);
            }

            if (!Array.isArray(objetos)) {
                objetos = [];
            }

        } catch (error) {

            console.error(
                "Error al leer objetos:",
                error
            );

            objetos = [];
        }


        // CREAR OBJETO
        const nuevoObjeto = {

            id: Date.now(),

            nombre: nombre,

            categoria: categoria,

            descripcion: descripcion,

            ubicacion: ubicacion,

            fecha: fecha,

            estado: estado,

            usuarioId: usuario.id,

            usuarioNombre:
                usuario.nombre +
                " " +
                usuario.apellido,

            fechaRegistro:
                new Date().toLocaleString()

        };


        // AGREGAR OBJETO
        objetos.push(nuevoObjeto);


        // GUARDAR
        localStorage.setItem(
            "objetos",
            JSON.stringify(objetos)
        );


        // COMPROBAR GUARDADO
        console.log(
            "Objeto guardado:",
            nuevoObjeto
        );

        console.log(
            "Todos los objetos:",
            objetos
        );


        mensaje.className =
            "alert alert-success";

        mensaje.textContent =
            "¡Objeto registrado correctamente!";


        formulario.reset();

    });

});