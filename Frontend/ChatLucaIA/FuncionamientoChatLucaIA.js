document.addEventListener("DOMContentLoaded", () => {
  const sideMenu = document.querySelector(".side-menu");
  const menuToggle = document.querySelector(".menu-toggle");
  const facturaBtn = document.querySelector(".factura-btn");
  const facturaOptions = document.querySelector(".submenu-options");
  const chatTitle = document.querySelector(".chat-title");
  const boletaBtn = document.querySelector(".boleta-btn");

  // Expandir / Comprimir sidebar
  menuToggle.addEventListener("click", () => {
    sideMenu.classList.toggle("expanded");
    menuToggle.textContent = sideMenu.classList.contains("expanded") ? "<<" : ">>";

    
  });

  boletaBtn.addEventListener("click", () => {
  window.location.href ="../BoletaHonorariosSii/PrimeraInterfaz/EstructuraPrimeraInterfaz.html";
});

  // Submenú factura
  facturaBtn.addEventListener("click", () => {
    facturaOptions.classList.toggle("active");
  });
});
