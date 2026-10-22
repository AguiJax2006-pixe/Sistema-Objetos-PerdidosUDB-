document.addEventListener("DOMContentLoaded", function () {

    const usuario = protegerPagina();

    if (!usuario) {
        return;
    }


    // ==========================================
    // ELEMENTOS
    // ==========================================

    const buscar =
        document.getElementById("buscar");

    const filtroCategoria =
        document.getElementById("filtroCategoria");

    const filtroEstado =
        document.getElementById("filtroEstado");

    const filtroUbicacion =
        document.getElementById("filtroUbicacion");

    const filtroFecha =
        document.getElementById("filtroFecha");

    const btnLimpiar =
        document.getElementById("btnLimpiar");

    const contenedorObjetos =
        document.getElementById("contenedorObjetos");

    const sinResultados =
        document.getElementById("sinResultados");

    const contadorResultados =
        document.getElementById("contadorResultados");

    const alertaCoincidencias =
        document.getElementById("alertaCoincidencias");

    const formEditar =
        document.getElementById("formEditar");


    // ==========================================
    // LEER OBJETOS
    // ==========================================

    function obtenerObjetos() {

        try {

            const datos =
                localStorage.getItem("objetos");

            if (!datos) {
                return [];
            }

            const objetos =
                JSON.parse(datos);

            return Array.isArray(objetos)
                ? objetos
                : [];

        } catch (error) {

            console.error(
                "Error leyendo objetos:",
                error
            );

            return [];
        }
    }


    // ==========================================
    // GUARDAR OBJETOS
    // ==========================================

    function guardarObjetos(objetos) {

        localStorage.setItem(
            "objetos",
            JSON.stringify(objetos)
        );

    }


    // ==========================================
    // MOSTRAR OBJETOS
    // ==========================================

    function mostrarObjetos() {

        const objetos =
            obtenerObjetos();


        const texto =
            buscar.value
                .trim()
                .toLowerCase();


        const categoria =
            filtroCategoria.value;


        const estado =
            filtroEstado.value;


        const ubicacion =
            filtroUbicacion.value
                .trim()
                .toLowerCase();


        const fecha =
            filtroFecha.value;


        const resultados =
            objetos.filter(function (objeto) {


                const nombre =
                    String(objeto.nombre || "")
                        .toLowerCase();


                const descripcion =
                    String(objeto.descripcion || "")
                        .toLowerCase();


                const ubicacionObjeto =
                    String(objeto.ubicacion || "")
                        .toLowerCase();


                const coincideTexto =
                    !texto ||
                    nombre.includes(texto) ||
                    descripcion.includes(texto);


                const coincideCategoria =
                    !categoria ||
                    objeto.categoria === categoria;


                const coincideEstado =
                    !estado ||
                    objeto.estado === estado;


                const coincideUbicacion =
                    !ubicacion ||
                    ubicacionObjeto.includes(ubicacion);


                const coincideFecha =
                    !fecha ||
                    objeto.fecha === fecha;


                return (
                    coincideTexto &&
                    coincideCategoria &&
                    coincideEstado &&
                    coincideUbicacion &&
                    coincideFecha
                );

            });


        renderizarObjetos(resultados);

        detectarCoincidencias(objetos);

    }


    // ==========================================
    // MOSTRAR TARJETAS
    // ==========================================

    function renderizarObjetos(objetos) {

        contenedorObjetos.innerHTML = "";


        contadorResultados.textContent =
            `${objetos.length} ${
                objetos.length === 1
                    ? "resultado"
                    : "resultados"
            }`;


        if (objetos.length === 0) {

            sinResultados.classList.remove(
                "d-none"
            );

            return;
        }


        sinResultados.classList.add(
            "d-none"
        );


        objetos.forEach(function (objeto) {

            const esMio =
                String(objeto.usuarioId) ===
                String(usuario.id);


            const claseEstado =
                objeto.estado === "Perdido"
                    ? "bg-danger"
                    : "bg-success";


            const tarjeta =
                document.createElement("div");

            tarjeta.className =
                "col-12 col-md-6 col-lg-4";


            tarjeta.innerHTML = `

                <div class="card object-card h-100">

                    <div class="card-body d-flex flex-column">

                        <div class="d-flex justify-content-between align-items-start gap-2 mb-3">

                            <h5 class="card-title mb-0">
                                ${escaparHTML(objeto.nombre)}
                            </h5>

                            <span class="badge ${claseEstado}">
                                ${escaparHTML(objeto.estado)}
                            </span>

                        </div>


                        <p class="mb-2">
                            <strong>Categoría:</strong>
                            ${escaparHTML(objeto.categoria)}
                        </p>


                        <p class="mb-2">
                            <strong>Descripción:</strong>
                            ${escaparHTML(objeto.descripcion)}
                        </p>


                        <p class="mb-2">
                            <strong>Ubicación:</strong>
                            ${escaparHTML(objeto.ubicacion)}
                        </p>


                        <p class="mb-2">
                            <strong>Fecha:</strong>
                            ${escaparHTML(objeto.fecha)}
                        </p>


                        <p class="text-muted small">
                            Publicado por:
                            ${escaparHTML(
                                objeto.usuarioNombre ||
                                "Usuario"
                            )}
                        </p>


                        <div class="mt-auto pt-2">

                            ${
                                esMio

                                ?

                                `

                                <div class="d-flex gap-2">

                                    <button
                                        class="btn btn-outline-primary btn-sm flex-fill"
                                        onclick="editarObjeto(${objeto.id})"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        class="btn btn-outline-danger btn-sm flex-fill"
                                        onclick="eliminarObjeto(${objeto.id})"
                                    >
                                        Eliminar
                                    </button>

                                </div>

                                `

                                :

                                `

                                <button
                                    class="btn btn-primary w-100"
                                    onclick="solicitarObjeto(${objeto.id})"
                                >
                                    Solicitar información
                                </button>

                                `
                            }

                        </div>

                    </div>

                </div>

            `;


            contenedorObjetos.appendChild(
                tarjeta
            );

        });

    }


    // ==========================================
    // EDITAR
    // ==========================================

    window.editarObjeto = function (id) {

        const objetos =
            obtenerObjetos();


        const objeto =
            objetos.find(function (item) {

                return String(item.id) ===
                    String(id);

            });


        if (!objeto) {

            alert(
                "No se encontró el objeto."
            );

            return;
        }


        if (
            String(objeto.usuarioId) !==
            String(usuario.id)
        ) {

            alert(
                "Solo puedes editar tus propios objetos."
            );

            return;
        }


        document.getElementById(
            "editarId"
        ).value = objeto.id;


        document.getElementById(
            "editarNombre"
        ).value = objeto.nombre;


        document.getElementById(
            "editarCategoria"
        ).value = objeto.categoria;


        document.getElementById(
            "editarDescripcion"
        ).value = objeto.descripcion;


        document.getElementById(
            "editarUbicacion"
        ).value = objeto.ubicacion;


        document.getElementById(
            "editarFecha"
        ).value = objeto.fecha;


        document.getElementById(
            "editarEstado"
        ).value = objeto.estado;


        const modal =
            new bootstrap.Modal(
                document.getElementById(
                    "modalEditar"
                )
            );


        modal.show();

    };


    // ==========================================
    // GUARDAR EDICIÓN
    // ==========================================

    formEditar.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const id =
                document.getElementById(
                    "editarId"
                ).value;


            const nombre =
                document.getElementById(
                    "editarNombre"
                ).value.trim();


            const categoria =
                document.getElementById(
                    "editarCategoria"
                ).value;


            const descripcion =
                document.getElementById(
                    "editarDescripcion"
                ).value.trim();


            const ubicacion =
                document.getElementById(
                    "editarUbicacion"
                ).value.trim();


            const fecha =
                document.getElementById(
                    "editarFecha"
                ).value;


            const estado =
                document.getElementById(
                    "editarEstado"
                ).value;


            if (
                !nombre ||
                !categoria ||
                !descripcion ||
                !ubicacion ||
                !fecha ||
                !estado
            ) {

                document.getElementById(
                    "mensajeEditar"
                ).innerHTML = `

                    <div class="alert alert-danger">
                        Todos los campos son obligatorios.
                    </div>

                `;

                return;
            }


            const objetos =
                obtenerObjetos();


            const indice =
                objetos.findIndex(function (item) {

                    return String(item.id) ===
                        String(id);

                });


            if (indice === -1) {

                alert(
                    "No se encontró el objeto."
                );

                return;
            }


            if (
                String(
                    objetos[indice].usuarioId
                ) !== String(usuario.id)
            ) {

                alert(
                    "No tienes permiso para editar este objeto."
                );

                return;
            }


            objetos[indice].nombre =
                nombre;

            objetos[indice].categoria =
                categoria;

            objetos[indice].descripcion =
                descripcion;

            objetos[indice].ubicacion =
                ubicacion;

            objetos[indice].fecha =
                fecha;

            objetos[indice].estado =
                estado;


            guardarObjetos(objetos);


            mostrarObjetos();


            const modalElement =
                document.getElementById(
                    "modalEditar"
                );


            const modal =
                bootstrap.Modal.getInstance(
                    modalElement
                );


            if (modal) {
                modal.hide();
            }


            alert(
                "Objeto actualizado correctamente."
            );

        }
    );


    // ==========================================
    // ELIMINAR
    // ==========================================

    window.eliminarObjeto = function (id) {

        const objetos =
            obtenerObjetos();


        const objeto =
            objetos.find(function (item) {

                return String(item.id) ===
                    String(id);

            });


        if (!objeto) {

            alert(
                "No se encontró el objeto."
            );

            return;
        }


        if (
            String(objeto.usuarioId) !==
            String(usuario.id)
        ) {

            alert(
                "Solo puedes eliminar tus propios objetos."
            );

            return;
        }


        const confirmar =
            confirm(
                `¿Deseas eliminar "${objeto.nombre}"?`
            );


        if (!confirmar) {
            return;
        }


        const nuevosObjetos =
            objetos.filter(function (item) {

                return String(item.id) !==
                    String(id);

            });


        guardarObjetos(
            nuevosObjetos
        );


        mostrarObjetos();


        alert(
            "Objeto eliminado correctamente."
        );

    };


    // ==========================================
    // SOLICITUD
    // ==========================================

    window.solicitarObjeto = function (id) {

        const objetos =
            obtenerObjetos();


        const objeto =
            objetos.find(function (item) {

                return String(item.id) ===
                    String(id);

            });


        if (!objeto) {
            return;
        }


        if (
            String(objeto.usuarioId) ===
            String(usuario.id)
        ) {

            alert(
                "No puedes solicitar tu propio objeto."
            );

            return;
        }


        let solicitudes = [];


        try {

            const datos =
                localStorage.getItem(
                    "solicitudes"
                );

            if (datos) {
                solicitudes =
                    JSON.parse(datos);
            }

            if (!Array.isArray(solicitudes)) {
                solicitudes = [];
            }

        } catch (error) {

            solicitudes = [];

        }


        const existe =
            solicitudes.some(function (solicitud) {

                return (
                    String(
                        solicitud.objetoId
                    ) === String(objeto.id)

                    &&

                    String(
                        solicitud.usuarioId
                    ) === String(usuario.id)

                    &&

                    solicitud.estado ===
                    "Pendiente"
                );

            });


        if (existe) {

            alert(
                "Ya tienes una solicitud pendiente para este objeto."
            );

            return;
        }


        solicitudes.push({

            id: Date.now(),

            objetoId: objeto.id,

            objetoNombre:
                objeto.nombre,

            usuarioId:
                usuario.id,

            usuarioNombre:
                usuario.nombre +
                " " +
                usuario.apellido,

            propietarioId:
                objeto.usuarioId,

            propietarioNombre:
                objeto.usuarioNombre,

            estado:
                "Pendiente",

            fechaSolicitud:
                new Date().toLocaleString()

        });


        localStorage.setItem(
            "solicitudes",
            JSON.stringify(
                solicitudes
            )
        );


        alert(
            "Solicitud enviada correctamente."
        );

    };


    // ==========================================
    // COINCIDENCIAS
    // ==========================================

    function detectarCoincidencias(objetos) {

        const perdidos =
            objetos.filter(function (objeto) {

                return objeto.estado ===
                    "Perdido";

            });


        const encontrados =
            objetos.filter(function (objeto) {

                return objeto.estado ===
                    "Encontrado";

            });


        let cantidad = 0;


        perdidos.forEach(function (perdido) {

            encontrados.forEach(
                function (encontrado) {

                    const nombrePerdido =
                        String(
                            perdido.nombre || ""
                        ).toLowerCase();


                    const nombreEncontrado =
                        String(
                            encontrado.nombre || ""
                        ).toLowerCase();


                    const mismaCategoria =
                        perdido.categoria ===
                        encontrado.categoria;


                    const nombreRelacionado =
                        nombrePerdido.includes(
                            nombreEncontrado
                        ) ||
                        nombreEncontrado.includes(
                            nombrePerdido
                        );


                    if (
                        mismaCategoria &&
                        nombreRelacionado
                    ) {

                        cantidad++;

                    }

                }
            );

        });


        if (cantidad > 0) {

            alertaCoincidencias.classList.remove(
                "d-none"
            );


            alertaCoincidencias.innerHTML = `

                <strong>
                    🔎 Posibles coincidencias:
                </strong>

                Se encontraron
                ${cantidad}
                posible(s) coincidencia(s)
                entre objetos perdidos y encontrados.

            `;

        } else {

            alertaCoincidencias.classList.add(
                "d-none"
            );

        }

    }


    // ==========================================
    // SEGURIDAD HTML
    // ==========================================

    function escaparHTML(texto) {

        const div =
            document.createElement("div");

        div.textContent =
            texto ?? "";

        return div.innerHTML;

    }


    // ==========================================
    // EVENTOS
    // ==========================================

    buscar.addEventListener(
        "input",
        mostrarObjetos
    );


    filtroCategoria.addEventListener(
        "change",
        mostrarObjetos
    );


    filtroEstado.addEventListener(
        "change",
        mostrarObjetos
    );


    filtroUbicacion.addEventListener(
        "input",
        mostrarObjetos
    );


    filtroFecha.addEventListener(
        "change",
        mostrarObjetos
    );


    btnLimpiar.addEventListener(
        "click",
        function () {

            buscar.value = "";

            filtroCategoria.value = "";

            filtroEstado.value = "";

            filtroUbicacion.value = "";

            filtroFecha.value = "";

            mostrarObjetos();

        }
    );


    // ==========================================
    // INICIAR
    // ==========================================

    mostrarObjetos();

});