document.addEventListener("DOMContentLoaded", function () {

    const usuario = protegerPagina();

    if (!usuario) {
        return;
    }


    const contenedor =
        document.getElementById(
            "contenedorSolicitudes"
        );

    const sinSolicitudes =
        document.getElementById(
            "sinSolicitudes"
        );

    const filtro =
        document.getElementById(
            "filtroSolicitud"
        );

    const pendientes =
        document.getElementById(
            "totalPendientes"
        );

    const aceptadas =
        document.getElementById(
            "totalAceptadas"
        );

    const rechazadas =
        document.getElementById(
            "totalRechazadas"
        );


    // ==========================================
    // LEER SOLICITUDES
    // ==========================================

    function obtenerSolicitudes() {

        try {

            const datos =
                localStorage.getItem(
                    "solicitudes"
                );

            if (!datos) {
                return [];
            }

            const solicitudes =
                JSON.parse(datos);

            return Array.isArray(solicitudes)
                ? solicitudes
                : [];

        } catch (error) {

            console.error(
                "Error al leer solicitudes:",
                error
            );

            return [];
        }
    }


    // ==========================================
    // GUARDAR
    // ==========================================

    function guardarSolicitudes(
        solicitudes
    ) {

        localStorage.setItem(
            "solicitudes",
            JSON.stringify(
                solicitudes
            )
        );

    }


    // ==========================================
    // MOSTRAR
    // ==========================================

    function mostrarSolicitudes() {

        const solicitudes =
            obtenerSolicitudes();


        /*
         * Una solicitud puede aparecer:
         *
         * 1. Al usuario que la realizó.
         * 2. Al propietario del objeto.
         */

        const propias =
            solicitudes.filter(
                function (solicitud) {

                    return (
                        String(
                            solicitud.usuarioId
                        ) === String(usuario.id)

                        ||

                        String(
                            solicitud.propietarioId
                        ) === String(usuario.id)
                    );

                }
            );


        actualizarEstadisticas(
            propias
        );


        const estadoSeleccionado =
            filtro.value;


        const filtradas =
            propias.filter(
                function (solicitud) {

                    return (
                        estadoSeleccionado ===
                        "todas"

                        ||

                        solicitud.estado ===
                        estadoSeleccionado
                    );

                }
            );


        renderizar(
            filtradas
        );

    }


    // ==========================================
    // ESTADÍSTICAS
    // ==========================================

    function actualizarEstadisticas(
        solicitudes
    ) {

        pendientes.textContent =
            solicitudes.filter(
                function (solicitud) {

                    return solicitud.estado ===
                        "Pendiente";

                }
            ).length;


        aceptadas.textContent =
            solicitudes.filter(
                function (solicitud) {

                    return solicitud.estado ===
                        "Aceptada";

                }
            ).length;


        rechazadas.textContent =
            solicitudes.filter(
                function (solicitud) {

                    return solicitud.estado ===
                        "Rechazada";

                }
            ).length;

    }


    // ==========================================
    // RENDERIZAR
    // ==========================================

    function renderizar(
        solicitudes
    ) {

        contenedor.innerHTML = "";


        if (solicitudes.length === 0) {

            sinSolicitudes.classList.remove(
                "d-none"
            );

            return;

        }


        sinSolicitudes.classList.add(
            "d-none"
        );


        solicitudes.forEach(
            function (solicitud) {

                const esPropietario =
                    String(
                        solicitud.propietarioId
                    ) === String(usuario.id);


                const tarjeta =
                    document.createElement(
                        "div"
                    );


                tarjeta.className =
                    "col-12 col-lg-6";


                let claseEstado =
                    "bg-warning text-dark";


                if (
                    solicitud.estado ===
                    "Aceptada"
                ) {

                    claseEstado =
                        "bg-success";

                }


                if (
                    solicitud.estado ===
                    "Rechazada"
                ) {

                    claseEstado =
                        "bg-danger";

                }


                tarjeta.innerHTML = `

                    <div class="card request-card h-100">

                        <div class="card-body">

                            <div class="d-flex justify-content-between align-items-start gap-2 mb-3">

                                <h5 class="mb-0">
                                    ${escaparHTML(
                                        solicitud.objetoNombre
                                    )}
                                </h5>

                                <span class="badge ${claseEstado}">
                                    ${escaparHTML(
                                        solicitud.estado
                                    )}
                                </span>

                            </div>


                            <p class="mb-2">

                                <strong>Solicitante:</strong>

                                ${escaparHTML(
                                    solicitud.usuarioNombre ||
                                    "Usuario"
                                )}

                            </p>


                            <p class="mb-2">

                                <strong>Propietario:</strong>

                                ${escaparHTML(
                                    solicitud.propietarioNombre ||
                                    "Usuario"
                                )}

                            </p>


                            <p class="text-muted small mb-3">

                                Solicitud:
                                ${escaparHTML(
                                    solicitud.fechaSolicitud ||
                                    ""
                                )}

                            </p>


                            ${
                                solicitud.estado ===
                                "Pendiente" &&
                                esPropietario

                                ?

                                `

                                <div class="d-flex gap-2">

                                    <button
                                        class="btn btn-success flex-fill"
                                        onclick="actualizarSolicitud(
                                            ${solicitud.id},
                                            'Aceptada'
                                        )"
                                    >
                                        Aceptar
                                    </button>


                                    <button
                                        class="btn btn-outline-danger flex-fill"
                                        onclick="actualizarSolicitud(
                                            ${solicitud.id},
                                            'Rechazada'
                                        )"
                                    >
                                        Rechazar
                                    </button>

                                </div>

                                `

                                :

                                ""

                            }


                            ${
                                solicitud.estado ===
                                "Aceptada"

                                ?

                                `

                                <div class="alert alert-success mt-3 mb-0">

                                    Solicitud aceptada.
                                    Puedes coordinar la devolución
                                    del objeto.

                                </div>

                                `

                                :

                                ""

                            }


                            ${
                                solicitud.estado ===
                                "Rechazada"

                                ?

                                `

                                <div class="alert alert-secondary mt-3 mb-0">

                                    Esta solicitud fue rechazada.

                                </div>

                                `

                                :

                                ""

                            }

                        </div>

                    </div>

                `;


                contenedor.appendChild(
                    tarjeta
                );

            }
        );

    }


    // ==========================================
    // ACEPTAR / RECHAZAR
    // ==========================================

    window.actualizarSolicitud =
        function (
            id,
            nuevoEstado
        ) {

            const solicitudes =
                obtenerSolicitudes();


            const indice =
                solicitudes.findIndex(
                    function (solicitud) {

                        return String(
                            solicitud.id
                        ) === String(id);

                    }
                );


            if (indice === -1) {

                alert(
                    "No se encontró la solicitud."
                );

                return;
            }


            const solicitud =
                solicitudes[indice];


            if (
                String(
                    solicitud.propietarioId
                ) !== String(usuario.id)
            ) {

                alert(
                    "No tienes permisos para modificar esta solicitud."
                );

                return;
            }


            if (
                solicitud.estado !==
                "Pendiente"
            ) {

                alert(
                    "Esta solicitud ya fue procesada."
                );

                return;
            }


            solicitudes[indice].estado =
                nuevoEstado;


            solicitudes[indice].fechaRespuesta =
                new Date().toLocaleString();


            guardarSolicitudes(
                solicitudes
            );


            mostrarSolicitudes();


            alert(
                nuevoEstado === "Aceptada"
                    ? "Solicitud aceptada correctamente."
                    : "Solicitud rechazada correctamente."
            );

        };


    // ==========================================
    // ESCAPAR HTML
    // ==========================================

    function escaparHTML(
        texto
    ) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            texto ?? "";

        return div.innerHTML;

    }


    // ==========================================
    // FILTRO
    // ==========================================

    filtro.addEventListener(
        "change",
        mostrarSolicitudes
    );


    // ==========================================
    // INICIAR
    // ==========================================

    mostrarSolicitudes();

});