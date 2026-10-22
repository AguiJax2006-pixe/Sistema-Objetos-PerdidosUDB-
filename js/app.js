document.addEventListener("DOMContentLoaded", () => {
    const usuario = typeof protegerPagina === "function"
        ? protegerPagina()
        : null;
    if (!usuario) return;

    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
    const idUsuario = String(usuario.id);
    let filtroInicio = "Todos";
    let filtroSolicitudes = "recibidas";
    let conversacionActiva = localStorage.getItem("btmConversacionActiva") || "";
    let perfilVistoId = idUsuario;
    let fotoPendiente = "";
    let toastTimer;
    const datosRemotos = {
        objetos: [],
        solicitudes: [],
        conversaciones: [],
        usuarios: []
    };

    function encabezadosApi(json = false) {
        const encabezados = {
            Authorization: "Bearer " + String(usuario.apiToken || "")
        };
        if (json) encabezados["Content-Type"] = "application/json";
        return encabezados;
    }

    async function solicitarApi(ruta, opciones = {}) {
        const respuesta = await fetch("http://localhost:3000" + ruta, {
            ...opciones,
            headers: {
                ...encabezadosApi(Boolean(opciones.body)),
                ...(opciones.headers || {})
            }
        });
        const resultado = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo completar la operación.");
        return resultado;
    }

    async function cargarDatos() {
        const datos = await solicitarApi("/api/data");
        datosRemotos.objetos = datos.objetos || [];
        datosRemotos.solicitudes = datos.solicitudes || [];
        datosRemotos.conversaciones = datos.conversaciones || [];
        datosRemotos.usuarios = datos.usuarios || [];
        const perfilActualizado = datosRemotos.usuarios.find(
            persona => String(persona.id) === idUsuario
        );
        if (perfilActualizado) {
            Object.assign(usuario, perfilActualizado);
            usuario.apiToken = JSON.parse(localStorage.getItem("sesionActual") || "{}").apiToken;
            usuario.origenAutenticacion = "api";
            localStorage.setItem("sesionActual", JSON.stringify(usuario));
        }
    }

    function leerLista(clave) {
        return datosRemotos[clave] || [];
    }

    function escapar(valor) {
        const nodo = document.createElement("span");
        nodo.textContent = String(valor ?? "");
        return nodo.innerHTML;
    }

    function iniciales(nombre) {
        return String(nombre || "Usuario").trim().split(/\s+/).slice(0, 2).map(parte => parte[0] || "").join("").toUpperCase();
    }

    function nombreCompleto(persona) {
        return [persona?.nombre, persona?.apellido].filter(Boolean).join(" ") || persona?.usuarioNombre || "Usuario";
    }

    function mostrarToast(mensaje) {
        const toast = $("#toast");
        if (!toast) return;
        toast.textContent = mensaje;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
    }

    function cambiarVista(vista) {
        const destino = $("#view-" + vista);
        if (!destino) return;
        $$(".screen").forEach(pagina => pagina.classList.toggle("active", pagina === destino));
        $$("[data-view]").forEach(boton => boton.classList.toggle("active", boton.dataset.view === vista));
        history.replaceState(null, "", `#${vista}`);
        if (vista === "buscar") renderBusqueda();
        if (vista === "solicitudes") renderSolicitudes();
        if (vista === "chat") renderChats();
        if (vista === "perfil") renderPerfil();
        if (vista === "inicio") renderInicio();
    }

    function fuenteFoto(objeto) {
        const foto = objeto?.foto || objeto?.imagen || "";
        return /^data:image\/(png|jpeg|webp|gif);base64,/i.test(foto) ? foto : "";
    }

    function bloqueFoto(objeto, clase = "") {
        const foto = fuenteFoto(objeto);
        const fondo = objeto?.estado === "Encontrado" ? "photo-found" : "";
        const contenidoFoto = foto
            ? `<img src="${foto}" alt="Foto de ${escapar(objeto.nombre)}">`
            : `<span class="photo-empty" aria-hidden="true">
                  ${objeto?.estado === "Encontrado" ? "📦" : "🔎"}
              </span>`;

        return `
            <div class="object-photo ${fondo} ${clase}">
                ${contenidoFoto}
                <span class="photo-caption">
                    ${escapar(objeto?.ubicacion || "Campus UDB")}
                </span>
            </div>
        `;
    }

    function tarjetaObjeto(objeto, compacto = false) {
        const esPropio = String(objeto.usuarioId) === idUsuario;
        const dueno = escapar(objeto.usuarioNombre || "Usuario de BackToMe");
        const estado = objeto.estado === "Encontrado" ? "Encontrado" : "Perdido";
        const fecha = escapar(objeto.fechaRegistro || objeto.fecha || "Publicado recientemente");
        const accion = esPropio
            ? `
                <span class="object-meta">Tu publicación</span>
                <button class="text-button" data-delete-object="${escapar(objeto.id)}">
                    Eliminar publicación
                </button>
            `
            : `
                <span class="object-meta">
                    ${escapar(objeto.categoria || "Objeto")}
                </span>
                <button class="button primary" data-contact-object="${escapar(objeto.id)}">
                    ${compacto ? "Consultar" : "Enviar solicitud"}
                </button>
            `;

        return `
            <article class="panel object-card" data-object-card>
                ${bloqueFoto(objeto)}
                <div class="object-body">
                    <div class="object-top">
                        <button
                            class="object-owner profile-link"
                            data-profile-id="${escapar(objeto.usuarioId)}"
                            aria-label="Ver perfil de ${dueno}"
                        >
                            <span class="avatar">${escapar(iniciales(dueno))}</span>
                            <span>
                                <span class="object-owner-name">${dueno}</span>
                                <span class="object-owner-time">${fecha}</span>
                            </span>
                        </button>
                        <span class="object-badge ${estado === "Encontrado" ? "found" : ""}">
                            ${estado}
                        </span>
                    </div>
                    <h2 class="object-title">${escapar(objeto.nombre)}</h2>
                    <div class="object-description">${escapar(objeto.descripcion)}</div>
                    <div class="object-meta">
                        ⌖ ${escapar(objeto.ubicacion || "Campus UDB")} · ${escapar(objeto.fecha || "")}
                    </div>
                    <div class="card-actions">${accion}</div>
                </div>
            </article>
        `;
    }

    function renderInicio() {
        const objetos = leerLista("objetos").slice().reverse().filter(objeto => filtroInicio === "Todos" || objeto.estado === filtroInicio);
        const contenedor = $("#homeFeed");
        contenedor.innerHTML = objetos.length
            ? objetos.map(objeto => tarjetaObjeto(objeto)).join("")
            : `<div class="empty-state"><strong>Aún no hay publicaciones</strong>Cuando alguien publique un objeto, aparecerá aquí.<br><br><button class="button primary" data-view="publicar">Crear la primera publicación</button></div>`;
        const solicitudes = leerLista("solicitudes");
        const recibidas = solicitudes.filter(item => String(item.propietarioId) === idUsuario && item.estado === "Pendiente").length;
        const enviadas = solicitudes.filter(item => String(item.usuarioId) === idUsuario && item.estado === "Pendiente").length;
        const chats = leerLista("conversaciones").filter(item => (item.participantes || []).map(String).includes(idUsuario)).length;
        const badge = $("#pendingBadge");
        badge.hidden = recibidas + enviadas === 0;
        badge.textContent = String(recibidas + enviadas);
        const chatBadge = $("#chatBadge");
        chatBadge.hidden = chats === 0;
        chatBadge.textContent = String(chats);
        const actividad = $("#homeActivity");
        const recientes = solicitudes.filter(item => String(item.propietarioId) === idUsuario || String(item.usuarioId) === idUsuario).slice(-3).reverse();
        actividad.innerHTML = recientes.length ? recientes.map(item => {
            const soyDueno = String(item.propietarioId) === idUsuario;
            const persona = soyDueno ? item.usuarioNombre : item.propietarioNombre;
            const accion = soyDueno ? "solicitó información sobre" : "enviaste una solicitud por";
            return `
                <div class="activity-item">
                    <div class="avatar">${escapar(iniciales(persona))}</div>
                    <div>
                        <strong>${escapar(persona || "Usuario")}</strong>
                        ${accion} ${escapar(item.objetoNombre)}
                        <button
                            class="text-button"
                            data-view="${item.estado === "Pendiente" ? "solicitudes" : "chat"}"
                        >
                            Ver detalle →
                        </button>
                    </div>
                </div>
            `;
        }).join("") : `<div class="activity-item">Tus solicitudes y conversaciones aparecerán aquí.</div>`;
    }

    function renderBusqueda() {
        const texto = $("#searchText").value.trim().toLocaleLowerCase();
        const estado = $("#searchStatus").value;
        const resultados = leerLista("objetos").slice().reverse().filter(objeto => {
            const mezcla = [objeto.nombre, objeto.descripcion, objeto.categoria, objeto.ubicacion].join(" ").toLocaleLowerCase();
            return (!texto || mezcla.includes(texto)) && (!estado || objeto.estado === estado);
        });
        $("#searchCount").textContent = `${resultados.length} ${resultados.length === 1 ? "publicación" : "publicaciones"}`;
        $("#searchResults").innerHTML = resultados.length ? resultados.map(objeto => {
            const dueno = escapar(objeto.usuarioNombre || "Usuario de BackToMe");
            const imagen = fuenteFoto(objeto)
                ? `<img src="${fuenteFoto(objeto)}" alt="">`
                : objeto.estado === "Encontrado" ? "📦" : "🔎";
            const contacto = String(objeto.usuarioId) === idUsuario
                ? `<span class="status">Tu publicación</span>`
                : `
                    <button class="button primary" data-contact-object="${escapar(objeto.id)}">
                        Consultar
                    </button>
                `;

            return `
                <article class="panel result-card">
                    <div class="result-image">${imagen}</div>
                    <div>
                        <div class="result-title">${escapar(objeto.nombre)}</div>
                        <div class="result-meta">
                            ${escapar(objeto.estado)} · ${escapar(objeto.ubicacion)}<br>
                            Publicado por ${dueno}
                        </div>
                    </div>
                    ${contacto}
                </article>
            `;
        }).join("") : `<div class="empty-state"><strong>No encontramos coincidencias</strong>Prueba con otro nombre, lugar o estado.</div>`;
    }

    async function enviarSolicitud(idObjeto) {
        const objetos = leerLista("objetos");
        const objeto = objetos.find(item => String(item.id) === String(idObjeto));
        if (!objeto) return mostrarToast("No se encontró esta publicación.");
        if (String(objeto.usuarioId) === idUsuario) return mostrarToast("Esta es tu propia publicación.");
        try {
            const resultado = await solicitarApi("/api/requests", {
                method: "POST",
                body: JSON.stringify({ objetoId: objeto.id })
            });
            conversacionActiva = String(resultado.conversacionId);
            localStorage.setItem("btmConversacionActiva", conversacionActiva);
            await cargarDatos();
            renderInicio();
            renderChats();
            cambiarVista("chat");
            mostrarToast("Solicitud enviada. Ya puedes coordinar por chat.");
        } catch (error) {
            mostrarToast(error.message);
        }
    }

    function renderSolicitudes() {
        const solicitudes = leerLista("solicitudes");
        const recibidas = solicitudes.filter(item => String(item.propietarioId) === idUsuario).slice().reverse();
        const enviadas = solicitudes.filter(item => String(item.usuarioId) === idUsuario).slice().reverse();
        $("#receivedCount").textContent = String(recibidas.length);
        $("#sentCount").textContent = String(enviadas.length);
        const lista = filtroSolicitudes === "recibidas" ? recibidas : enviadas;
        $("#requestList").innerHTML = lista.length ? lista.map(item => {
            const recibida = filtroSolicitudes === "recibidas";
            const persona = recibida ? item.usuarioNombre : item.propietarioNombre;
            const estado = item.estado || "Pendiente";
            const clase = estado === "Aceptada" ? "accepted" : "";
            const acciones = recibida && estado === "Pendiente"
                ? `
                    <div class="request-actions">
                        <button
                            class="button secondary"
                            data-request-action="Rechazada"
                            data-request-id="${escapar(item.id)}"
                        >
                            Rechazar
                        </button>
                        <button
                            class="button primary"
                            data-request-action="Aceptada"
                            data-request-id="${escapar(item.id)}"
                        >
                            Aceptar
                        </button>
                    </div>
                `
                : `
                    <button class="button secondary" data-open-request-chat="${escapar(item.objetoId)}">
                        ${estado === "Rechazada" ? "Ver solicitud" : "Abrir chat"}
                    </button>
                `;

            return `
                <article class="panel request-card">
                    <div class="avatar">${escapar(iniciales(persona))}</div>
                    <div class="request-copy">
                        <strong>
                            ${escapar(persona || "Usuario")}
                            ${recibida ? "consulta por" : "enviaste solicitud por"}
                            ${escapar(item.objetoNombre)}
                        </strong>
                        <p>
                            ${recibida
                                ? "Solicitud para coordinar la recuperación del objeto."
                                : `Enviada ${escapar(item.fechaSolicitud || "recientemente")}.`}
                        </p>
                        <span class="status ${clase}">${escapar(estado)}</span>
                    </div>
                    ${acciones}
                </article>
            `;
        }).join("") : `<div class="empty-state"><strong>No hay solicitudes ${filtroSolicitudes}</strong>Cuando alguien solicite o responda sobre un objeto, aparecerá aquí.</div>`;
    }

    function conversacionesDelUsuario() {
        return leerLista("conversaciones").filter(item => (item.participantes || []).map(String).includes(idUsuario)).sort((a, b) => String(b.actualizada || "").localeCompare(String(a.actualizada || "")));
    }

    function renderChats() {
        const conversaciones = conversacionesDelUsuario();
        const layout = $("#chatLayout");
        if (!conversaciones.length) {
            layout.innerHTML = `<div class="chat-empty"><strong>Aún no tienes conversaciones</strong><br>Envía una solicitud desde una publicación para iniciar un chat.</div>`;
            return;
        }
        if (!conversaciones.some(item => String(item.id) === conversacionActiva)) conversacionActiva = String(conversaciones[0].id);
        localStorage.setItem("btmConversacionActiva", conversacionActiva);
        const activa = conversaciones.find(item => String(item.id) === conversacionActiva) || conversaciones[0];
        const otroNombre = String(activa.propietarioId) === idUsuario ? activa.solicitanteNombre : activa.propietarioNombre;
        const lista = conversaciones.map(item => {
            const nombre = String(item.propietarioId) === idUsuario ? item.solicitanteNombre : item.propietarioNombre;
            const ultimo = item.mensajes?.[item.mensajes.length - 1]?.texto || "Solicitud enviada. Puedes escribir para coordinar.";
            return `
                <button
                    class="conversation ${String(item.id) === String(activa.id) ? "active" : ""}"
                    data-conversation="${escapar(item.id)}"
                >
                    <span class="avatar">${escapar(iniciales(nombre))}</span>
                    <span>
                        <span class="conversation-name">${escapar(nombre)}</span>
                        <span class="conversation-preview">
                            ${escapar(item.objetoNombre)} · ${escapar(ultimo)}
                        </span>
                    </span>
                </button>
            `;
        }).join("");
        const mensajes = (activa.mensajes || []).map(mensaje => `<div class="message ${String(mensaje.autorId) === idUsuario ? "mine" : ""}">${escapar(mensaje.texto)}<time>${escapar(mensaje.fecha || "")}</time></div>`).join("");
        layout.innerHTML = `
            <div class="chat-list">
                <div class="chat-list-head">Mensajes</div>
                ${lista}
            </div>
            <div class="chat-window">
                <div class="chat-head">
                    <span class="avatar">${escapar(iniciales(otroNombre))}</span>
                    <span>
                        <span class="chat-name">${escapar(otroNombre)}</span>
                        <span class="chat-context">
                            Solicitud por: ${escapar(activa.objetoNombre)}
                        </span>
                    </span>
                </div>
                <div class="chat-messages" id="activeMessages">
                    ${mensajes || `<div class="chat-empty">Inicia la conversación para coordinar la entrega.</div>`}
                </div>
                <form class="chat-form" id="chatForm">
                    <input
                        name="mensaje"
                        maxlength="500"
                        placeholder="Escribe un mensaje..."
                        aria-label="Escribe un mensaje"
                        required
                    >
                    <button type="submit" aria-label="Enviar mensaje">➤</button>
                </form>
            </div>
        `;
        layout.querySelectorAll("[data-conversation]").forEach((boton) => {
            boton.addEventListener("click", () => {
                conversacionActiva = boton.dataset.conversation;
                localStorage.setItem("btmConversacionActiva", conversacionActiva);
                renderChats();
            });
        });
        const chatForm = $("#chatForm", layout);
        chatForm?.addEventListener("submit", async event => {
            event.preventDefault();
            const texto = new FormData(chatForm).get("mensaje").toString().trim();
            if (!texto) return;
            const enviar = chatForm.querySelector("button[type='submit'], button:not([type])");
            if (enviar) enviar.disabled = true;
            try {
                await solicitarApi(`/api/conversations/${encodeURIComponent(activa.id)}/messages`, {
                    method: "POST",
                    body: JSON.stringify({ texto })
                });
                await cargarDatos();
                renderChats();
            } catch (error) {
                mostrarToast(error.message);
            } finally {
                if (enviar) enviar.disabled = false;
            }
        });
        const areaMensajes = $("#activeMessages", layout);
        if (areaMensajes) areaMensajes.scrollTop = areaMensajes.scrollHeight;
    }

    function renderPerfil() {
        const usuarios = leerLista("usuarios");
        const persona = String(perfilVistoId) === idUsuario
            ? usuario
            : usuarios.find(item => String(item.id) === String(perfilVistoId));
        const objetosUsuario = leerLista("objetos").filter(item => String(item.usuarioId) === String(perfilVistoId));
        const datosBase = persona || (objetosUsuario[0] ? {usuarioNombre: objetosUsuario[0].usuarioNombre} : null);
        const objetos = objetosUsuario.slice().reverse();
        const encontrados = objetos.filter(item => item.estado === "Encontrado").length;
        const recuperados = objetos.filter(item => item.estado === "Devuelto" || item.estado === "Recuperado").length;
        const nombre = datosBase ? nombreCompleto(datosBase) : "Perfil de usuario";
        const propio = String(perfilVistoId) === idUsuario;
        $("#profileTitle").textContent = propio ? "Perfil" : "Perfil de la comunidad";
        $("#editProfile").hidden = !propio;
        $("#profileCard").innerHTML = `
            <div class="avatar profile-avatar">${escapar(iniciales(nombre))}</div>
            <div>
                <div class="profile-name">${escapar(nombre)}</div>
                <div class="profile-email">
                    ${escapar(datosBase?.correo || "Correo no disponible")}
                </div>
                <div class="profile-stats">
                    <span><strong>${objetos.length}</strong> publicaciones</span>
                    <span><strong>${encontrados}</strong> encontrados</span>
                    <span><strong>${recuperados}</strong> recuperados</span>
                </div>
            </div>
        `;
        $("#profileObjects").innerHTML = objetos.length
            ? objetos.map((item) => tarjetaObjeto(item, true)).join("")
            : `
                <div class="empty-state">
                    <strong>Aún no tienes publicaciones</strong>
                    Cuando publiques un objeto aparecerá en tu perfil.<br><br>
                    <button class="button primary" data-view="publicar">Publicar objeto</button>
                </div>
            `;
    }

    function renderEditorPublicaciones() {
        const propias = leerLista("objetos").filter(item => String(item.usuarioId) === idUsuario);
        const contenedor = $("#editablePublications");
        contenedor.innerHTML = propias.length
            ? propias.map(item => `
                <article class="editable-publication">
                    <form data-edit-publication="${escapar(item.id)}">
                        <label>
                            Nombre de la publicación
                            <input name="nombre" maxlength="150" required value="${escapar(item.nombre)}">
                        </label>
                        <div class="editable-publication-actions">
                            <button class="button primary" type="submit">Guardar nombre</button>
                            <button class="button danger" type="button" data-delete-profile-post="${escapar(item.id)}">Eliminar</button>
                        </div>
                    </form>
                </article>
            `).join("")
            : `<div class="empty-state"><strong>No tienes publicaciones activas</strong>Cuando publiques un objeto, podrás editarlo aquí.</div>`;
    }

    function abrirEditorPerfil(tabInicial = "perfil") {
        $("#profileNameInput").value = usuario.nombre || "";
        renderEditorPublicaciones();
        $$('[data-editor-tab]').forEach(boton => {
            const activo = boton.dataset.editorTab === tabInicial;
            boton.classList.toggle("active", activo);
            boton.setAttribute("aria-selected", String(activo));
        });
        $("#editorProfileSection").hidden = tabInicial !== "perfil";
        $("#editorPublicationsSection").hidden = tabInicial !== "publicaciones";
        $("#profileEditor").showModal();
    }

    function cerrarEditorPerfil() {
        $("#profileEditor").close();
    }

    async function cambiarEstadoSolicitud(id, nuevoEstado) {
        try {
            await solicitarApi(`/api/requests/${encodeURIComponent(id)}`, {
                method: "PATCH",
                body: JSON.stringify({ estado: nuevoEstado })
            });
            await cargarDatos();
            renderSolicitudes();
            renderInicio();
            mostrarToast(nuevoEstado === "Aceptada" ? "Solicitud aceptada. Ya pueden coordinar por chat." : "Solicitud rechazada.");
        } catch (error) {
            mostrarToast(error.message);
        }
    }

    async function comprimirFoto(archivo) {
        if (!archivo || !archivo.type.startsWith("image/")) throw new Error("Selecciona un archivo de imagen.");
        const original = await new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.onload = () => resolve(lector.result);
            lector.onerror = reject;
            lector.readAsDataURL(archivo);
        });
        const imagen = new Image();
        imagen.src = original;
        await new Promise((resolve, reject) => { imagen.onload = resolve; imagen.onerror = reject; });
        const escala = Math.min(1, 900 / Math.max(imagen.width, imagen.height));
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.max(1, Math.round(imagen.width * escala));
        lienzo.height = Math.max(1, Math.round(imagen.height * escala));
        lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
        return lienzo.toDataURL("image/jpeg", 0.72);
    }

    async function renderizarTodo() {
        const nombre = nombreCompleto(usuario);
        $("#sideName").textContent = nombre;
        $("#sideInitials").textContent = iniciales(nombre);
        $("#topInitials").textContent = iniciales(nombre);
        try {
            await cargarDatos();
        } catch (error) {
            mostrarToast(error.message || "No se pudieron cargar los datos de la aplicación.");
            return;
        }
        renderInicio();
        const inicial = location.hash.replace("#", "");
        cambiarVista(["inicio", "buscar", "publicar", "solicitudes", "chat", "perfil"].includes(inicial) ? inicial : "inicio");
    }

    window.setInterval(async () => {
        if (!$("#view-chat")?.classList.contains("active")) return;
        if (document.activeElement?.matches('#chatForm input[name="mensaje"]')) return;
        try {
            await cargarDatos();
            renderChats();
        } catch (error) {
            console.warn("No se pudieron actualizar los mensajes.", error.message);
        }
    }, 5000);

    document.addEventListener("click", async event => {
        const perfil = event.target.closest("[data-profile-id]");
        if (perfil) {
            perfilVistoId = String(perfil.dataset.profileId);
            cambiarVista("perfil");
            return;
        }
        const botonVista = event.target.closest("[data-view]");
        if (botonVista) {
            if (botonVista.dataset.view === "perfil") perfilVistoId = idUsuario;
            cambiarVista(botonVista.dataset.view);
            return;
        }
        const contacto = event.target.closest("[data-contact-object]");
        if (contacto) { await enviarSolicitud(contacto.dataset.contactObject); return; }
        const eliminar = event.target.closest("[data-delete-object]");
        if (eliminar) {
            const id = eliminar.dataset.deleteObject;
            const item = leerLista("objetos").find(objeto => String(objeto.id) === String(id));
            if (item && String(item.usuarioId) === idUsuario && confirm(`¿Eliminar la publicación “${item.nombre}”?`)) {
                try {
                    await solicitarApi(`/api/objects/${encodeURIComponent(id)}`, { method: "DELETE" });
                    await cargarDatos();
                    renderPerfil(); renderInicio();
                    mostrarToast("Publicación archivada.");
                } catch (error) {
                    mostrarToast(error.message);
                }
            }
            return;
        }
        const accion = event.target.closest("[data-request-action]");
        if (accion) { await cambiarEstadoSolicitud(accion.dataset.requestId, accion.dataset.requestAction); return; }
        const chatSolicitud = event.target.closest("[data-open-request-chat]");
        if (chatSolicitud) {
            const conv = conversacionesDelUsuario().find(item => String(item.objetoId) === String(chatSolicitud.dataset.openRequestChat));
            if (conv) { conversacionActiva = String(conv.id); localStorage.setItem("btmConversacionActiva", conversacionActiva); }
            cambiarVista("chat");
        }
    });

    $$(".filter").forEach(boton => boton.addEventListener("click", () => {
        $$(".filter").forEach(item => item.classList.remove("active"));
        boton.classList.add("active");
        filtroInicio = boton.dataset.filter;
        renderInicio();
    }));

    $$("[data-request-tab]").forEach(boton => boton.addEventListener("click", () => {
        filtroSolicitudes = boton.dataset.requestTab;
        $$("[data-request-tab]").forEach(item => { item.classList.toggle("active", item === boton); item.setAttribute("aria-selected", String(item === boton)); });
        renderSolicitudes();
    }));

    $("#searchText").addEventListener("input", renderBusqueda);
    $("#searchStatus").addEventListener("change", renderBusqueda);

    $("#editProfile").addEventListener("click", () => abrirEditorPerfil("perfil"));
    $("#closeProfileEditor").addEventListener("click", cerrarEditorPerfil);
    $$('[data-close-editor]').forEach(boton => boton.addEventListener("click", cerrarEditorPerfil));
    $$('[data-editor-tab]').forEach(boton => boton.addEventListener("click", () => {
        const tab = boton.dataset.editorTab;
        $$('[data-editor-tab]').forEach(otro => {
            const activo = otro === boton;
            otro.classList.toggle("active", activo);
            otro.setAttribute("aria-selected", String(activo));
        });
        $("#editorProfileSection").hidden = tab !== "perfil";
        $("#editorPublicationsSection").hidden = tab !== "publicaciones";
    }));
    $("#profileEditor").addEventListener("click", event => {
        if (event.target === $("#profileEditor")) cerrarEditorPerfil();
    });

    $("#profileNameForm").addEventListener("submit", async event => {
        event.preventDefault();
        const formulario = event.currentTarget;
        const nombre = $("#profileNameInput").value.trim();
        const guardar = formulario.querySelector("button[type='submit']");
        if (!nombre || nombre.length > 100) return mostrarToast("El nombre debe tener entre 1 y 100 caracteres.");
        if (guardar) guardar.disabled = true;
        try {
            const resultado = await solicitarApi("/api/profile", {
                method: "PATCH",
                body: JSON.stringify({ nombre })
            });
            usuario.nombre = resultado.usuario.nombre;
            localStorage.setItem("sesionActual", JSON.stringify(usuario));
            await cargarDatos();
            const nombreActualizado = nombreCompleto(usuario);
            $("#sideName").textContent = nombreActualizado;
            $("#sideInitials").textContent = iniciales(nombreActualizado);
            $("#topInitials").textContent = iniciales(nombreActualizado);
            renderPerfil();
            renderInicio();
            renderBusqueda();
            cerrarEditorPerfil();
            mostrarToast("Tu nombre se actualizó correctamente.");
        } catch (error) {
            mostrarToast(error.message);
        } finally {
            if (guardar) guardar.disabled = false;
        }
    });

    $("#editablePublications").addEventListener("submit", async event => {
        const formulario = event.target.closest("form[data-edit-publication]");
        if (!formulario) return;
        event.preventDefault();
        const id = formulario.dataset.editPublication;
        const nombre = new FormData(formulario).get("nombre").toString().trim();
        const guardar = formulario.querySelector("button[type='submit']");
        if (!nombre || nombre.length > 150) return mostrarToast("El nombre debe tener entre 1 y 150 caracteres.");
        if (guardar) guardar.disabled = true;
        try {
            await solicitarApi(`/api/objects/${encodeURIComponent(id)}`, {
                method: "PATCH",
                body: JSON.stringify({ nombre })
            });
            await cargarDatos();
            renderPerfil();
            renderInicio();
            renderBusqueda();
            renderEditorPublicaciones();
            mostrarToast("Nombre de publicación actualizado.");
        } catch (error) {
            mostrarToast(error.message);
        } finally {
            if (guardar) guardar.disabled = false;
        }
    });

    $("#editablePublications").addEventListener("click", async event => {
        const boton = event.target.closest("[data-delete-profile-post]");
        if (!boton) return;
        const id = boton.dataset.deleteProfilePost;
        const objeto = leerLista("objetos").find(item => String(item.id) === String(id));
        if (!objeto || !confirm(`¿Eliminar la publicación “${objeto.nombre}”?`)) return;
        boton.disabled = true;
        try {
            await solicitarApi(`/api/objects/${encodeURIComponent(id)}`, { method: "DELETE" });
            await cargarDatos();
            renderPerfil();
            renderInicio();
            renderBusqueda();
            renderEditorPublicaciones();
            mostrarToast("Publicación eliminada de la lista activa.");
        } catch (error) {
            mostrarToast(error.message);
            boton.disabled = false;
        }
    });

    $$(".kind-option input").forEach(radio => radio.addEventListener("change", () => {
        $$(".kind-option").forEach(label => label.classList.toggle("selected", $("input", label).checked));
    }));

    $("#objectPhoto").addEventListener("change", async event => {
        const archivo = event.target.files?.[0];
        if (!archivo) return;
        try {
            fotoPendiente = await comprimirFoto(archivo);
            const preview = $("#photoPreview");
            preview.src = fotoPendiente;
            preview.style.display = "block";
            $("#uploadPrompt").hidden = true;
        } catch (error) { mostrarToast(error.message || "No se pudo cargar la foto."); }
    });

    $("#publishForm").addEventListener("submit", async event => {
        event.preventDefault();
        const formulario = event.currentTarget;
        const form = new FormData(formulario);
        const objeto = {
            nombre: String(form.get("nombre")).trim(), categoria: String(form.get("categoria")),
            descripcion: String(form.get("descripcion")).trim(), ubicacion: String(form.get("ubicacion")),
            fecha: String(form.get("fecha")), estado: String(form.get("estado")), foto: fotoPendiente
        };
        const boton = formulario.querySelector("button[type='submit']");
        if (boton) boton.disabled = true;
        try {
            await solicitarApi("/api/objects", {
                method: "POST",
                body: JSON.stringify(objeto)
            });
            await cargarDatos();
            formulario.reset();
            fotoPendiente = "";
            $("#photoPreview").removeAttribute("src");
            $("#photoPreview").style.display = "none";
            $("#uploadPrompt").hidden = false;
            $("#publishMessage").textContent = "Publicación guardada en BackToMe.";
            renderInicio(); renderPerfil();
            mostrarToast("Tu publicación ya está en el inicio.");
            cambiarVista("inicio");
        } catch (error) {
            $("#publishMessage").textContent = error.message;
            mostrarToast(error.message);
        } finally {
            if (boton) boton.disabled = false;
        }
    });

    renderizarTodo();
});
