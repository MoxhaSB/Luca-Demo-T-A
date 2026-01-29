document.addEventListener("DOMContentLoaded", () => {
  const sideMenu = document.querySelector(".side-menu");
  const menuToggle = document.querySelector(".menu-toggle");
  const facturaBtn = document.querySelector(".factura-btn");
  const facturaOptions = document.querySelector(".submenu-options");
  const chatTitle = document.querySelector(".chat-title");

  // Expandir / Comprimir sidebar
  menuToggle.addEventListener("click", () => {
    sideMenu.classList.toggle("expanded");
    menuToggle.textContent = sideMenu.classList.contains("expanded") ? "<<" : ">>";

    
  });

  // Submenú factura
  facturaBtn.addEventListener("click", () => {
    facturaOptions.classList.toggle("active");
  });
});
