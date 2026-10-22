
// DASHBOARD


document.addEventListener("DOMContentLoaded", function () {


    
    // COMPROBAR SESIÓN
   

    const usuario = protegerPagina();


    if (!usuario) {

        return;

    }


    
    // MOSTRAR NOMBRE
 

    const nombreUsuario =
        document.getElementById("nombreUsuario");


    nombreUsuario.textContent =
        usuario.nombre;



    
    // OBTENER OBJETOS
    

    const objetos =
        JSON.parse(localStorage.getItem("objetos")) || [];



   
    // CONTAR PERDIDOS
    

    const perdidos =
        objetos.filter(
            objeto => objeto.estado === "Perdido"
        ).length;


    document.getElementById(
        "totalPerdidos"
    ).textContent = perdidos;



    
    // CONTAR ENCONTRADOS
   
    const encontrados =
        objetos.filter(
            objeto => objeto.estado === "Encontrado"
        ).length;


    document.getElementById(
        "totalEncontrados"
    ).textContent = encontrados;



    
    // MIS PUBLICACIONES
    

    const misObjetos =
        objetos.filter(
            objeto => objeto.usuarioId === usuario.id
        ).length;


    document.getElementById(
        "misPublicaciones"
    ).textContent = misObjetos;



    
    // SOLICITUDES
    

    const solicitudes =
        JSON.parse(
            localStorage.getItem("solicitudes")
        ) || [];


    const misSolicitudes =
        solicitudes.filter(
            solicitud =>
                solicitud.usuarioId === usuario.id &&
                solicitud.estado === "Pendiente"
        ).length;


    document.getElementById(
        "totalSolicitudes"
    ).textContent = misSolicitudes;



    
    // OBJETOS RECIENTES
    
    mostrarObjetosRecientes(objetos);

});




// MOSTRAR OBJETOS RECIENTES


function mostrarObjetosRecientes(objetos) {


    const contenedor =
        document.getElementById("objetosRecientes");


    if (objetos.length === 0) {

        contenedor.innerHTML = `

            <div class="col-12">

                <div class="alert alert-info">

                    Todavía no hay objetos registrados.

                </div>

            </div>

        `;

        return;

    }


    // Tomar los últimos 6

    const recientes =
        objetos.slice(-6).reverse();


    contenedor.innerHTML = "";


    recientes.forEach(function (objeto) {


        let claseEstado = "bg-secondary";


        if (objeto.estado === "Perdido") {

            claseEstado = "bg-danger";

        }


        if (objeto.estado === "Encontrado") {

            claseEstado = "bg-success";

        }


        const tarjeta = document.createElement("div");

        tarjeta.className =
            "col-md-6 col-lg-4";


        tarjeta.innerHTML = `

            <div class="card shadow-sm h-100">

                <div class="card-body">

                    <div class="d-flex
                                justify-content-between
                                align-items-start
                                mb-2">

                        <h5 class="card-title">

                            ${objeto.nombre}

                        </h5>

                        <span class="badge ${claseEstado}">

                            ${objeto.estado}

                        </span>

                    </div>


                    <p class="text-muted mb-2">

                        📂 ${objeto.categoria}

                    </p>


                    <p class="card-text">

                        ${objeto.descripcion}

                    </p>


                    <p class="small text-muted">

                        📍 ${objeto.ubicacion}

                    </p>


                    <p class="small text-muted">

                        📅 ${objeto.fecha}

                    </p>

                </div>

            </div>

        `;


        contenedor.appendChild(tarjeta);

    });

}