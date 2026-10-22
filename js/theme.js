(function () {
  const CLAVE_TEMA = "btmTema";
  const temaGuardado = localStorage.getItem(CLAVE_TEMA);
  const temaInicial = temaGuardado === "dark" ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", temaInicial);

  function actualizarBoton(boton, tema) {
    const oscuro = tema === "dark";
    const etiqueta = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

    boton.textContent = oscuro ? "☀" : "☾";
    boton.setAttribute("aria-label", etiqueta);
    boton.setAttribute("aria-pressed", String(oscuro));
    boton.title = etiqueta;
  }

  function configurarSelectorTema() {
    const botonesTema = document.querySelectorAll("[data-theme-toggle]");

    botonesTema.forEach((boton) => {
      actualizarBoton(boton, temaInicial);

      boton.addEventListener("click", () => {
        const temaActual = document.documentElement.getAttribute("data-theme");
        const nuevoTema = temaActual === "dark" ? "light" : "dark";

        document.documentElement.setAttribute("data-theme", nuevoTema);
        localStorage.setItem(CLAVE_TEMA, nuevoTema);

        botonesTema.forEach((otroBoton) => {
          actualizarBoton(otroBoton, nuevoTema);
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", configurarSelectorTema);
  } else {
    configurarSelectorTema();
  }
})();
