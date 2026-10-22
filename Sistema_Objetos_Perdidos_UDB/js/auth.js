function leerUsuarios() {
    try {
        const datos = JSON.parse(
            localStorage.getItem("usuarios")
        );

        return Array.isArray(datos)
            ? datos
            : [];

    } catch (error) {

        console.error(
            "No se pudieron leer los usuarios:",
            error
        );

        return [];
    }
}


function inicializarUsuarios() {

    const usuarios = leerUsuarios();


    const existeAdmin =
        usuarios.some(function (usuario) {

            return String(
                usuario.carnet || ""
            )
            .toUpperCase() === "ADMIN001";

        });


    if (!existeAdmin) {

        usuarios.push({

            id: Date.now(),

            nombre: "Administrador",

            apellido: "UDB",

            carnet: "ADMIN001",

            carrera: "Administración del Sistema",

            correo: "admin@udb.edu.sv",

            password: "Admin123",

            rol: "admin"

        });


        localStorage.setItem(
            "usuarios",
            JSON.stringify(usuarios)
        );

    }
}


function registrarUsuario(
    nombre,
    apellido,
    carnet,
    carrera,
    correo,
    password
) {

    const usuarios =
        leerUsuarios();


    const carnetNormalizado =
        carnet.trim().toLowerCase();


    const correoNormalizado =
        correo.trim().toLowerCase();


    if (
        usuarios.some(function (usuario) {

            return String(
                usuario.carnet || ""
            )
            .trim()
            .toLowerCase() ===
            carnetNormalizado;

        })
    ) {

        return {

            correcto: false,

            mensaje:
                "Este carnet estudiantil ya está registrado."

        };
    }


    if (
        usuarios.some(function (usuario) {

            return String(
                usuario.correo || ""
            )
            .trim()
            .toLowerCase() ===
            correoNormalizado;

        })
    ) {

        return {

            correcto: false,

            mensaje:
                "Este correo ya está registrado."

        };
    }


    usuarios.push({

        id: Date.now(),

        nombre: nombre.trim(),

        apellido: apellido.trim(),

        carnet: carnet.trim(),

        carrera: carrera.trim(),

        correo: correoNormalizado,

        password: password,

        rol: "usuario"

    });


    localStorage.setItem(
        "usuarios",
        JSON.stringify(usuarios)
    );


    return {

        correcto: true,

        mensaje:
            "Usuario registrado correctamente."

    };
}


function iniciarSesion(
    carnet,
    correo,
    password
) {

    const usuarios =
        leerUsuarios();


    const carnetNormalizado =
        carnet.trim().toLowerCase();


    const correoNormalizado =
        correo.trim().toLowerCase();


    const usuario =
        usuarios.find(function (item) {

            return (

                String(
                    item.carnet || ""
                )
                .trim()
                .toLowerCase() ===
                carnetNormalizado

                &&

                String(
                    item.correo || ""
                )
                .trim()
                .toLowerCase() ===
                correoNormalizado

                &&

                item.password ===
                password

            );

        });


    if (!usuario) {

        return {

            correcto: false,

            mensaje:
                "El correo, carnet o contraseña son incorrectos."

        };
    }


    localStorage.setItem(
        "sesionActual",
        JSON.stringify(usuario)
    );


    return {

        correcto: true,

        usuario: usuario

    };
}


function obtenerSesion() {

    try {

        const sesion =
            JSON.parse(
                localStorage.getItem(
                    "sesionActual"
                )
            );


        return (
            sesion &&
            typeof sesion === "object"
        )
            ? sesion
            : null;

    } catch (error) {

        return null;
    }
}


function cerrarSesion() {

    localStorage.removeItem(
        "sesionActual"
    );


    window.location.href =
        "login.html";
}


function protegerPagina() {

    const usuario =
        obtenerSesion();


    if (!usuario) {

        window.location.href =
            "login.html";

        return null;
    }


    return usuario;
}


function protegerAdmin() {

    const usuario =
        obtenerSesion();


    if (!usuario) {

        window.location.href =
            "login.html";

        return null;
    }


    if (usuario.rol !== "admin") {

        alert(
            "No tienes permisos para acceder a esta página."
        );


        window.location.href =
            "dashboard.html";


        return null;
    }


    return usuario;
}


inicializarUsuarios();