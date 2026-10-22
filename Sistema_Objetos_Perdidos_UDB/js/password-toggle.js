
document.querySelectorAll("[data-toggle-password]").forEach((boton) => {
  boton.addEventListener("click", () => {
    const idCampo = boton.dataset.target;
    const campo = document.getElementById(idCampo);

    if (!campo) return;

    const mostrar = campo.type === "password";

    campo.type = mostrar ? "text" : "password";
    boton.setAttribute("aria-pressed", String(mostrar));
    boton.setAttribute(
      "aria-label",
      mostrar ? "Ocultar contraseña" : "Mostrar contraseña"
    );
  });
});
