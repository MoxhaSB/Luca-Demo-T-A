const botones2 = document.querySelectorAll(".botones button");

const rut = document.getElementById("rut");
const nombre = document.getElementById("nombre");
const direccion = document.getElementById("direccion");
const region = document.getElementById("region");
const comuna = document.getElementById("comuna");

// Anterior
botones2[0].addEventListener("click", () => {
  window.location.href = "../PrimeraInterfaz/EstructuraPrimeraInterfaz.html";
});

// Siguiente
botones2[1].addEventListener("click", () => {
  localStorage.setItem("receptorRut", rut.value);
  localStorage.setItem("receptorNombre", nombre.value);
  localStorage.setItem("receptorDireccion", direccion.value);
  localStorage.setItem("receptorRegion", region.value);
  localStorage.setItem("receptorComuna", comuna.value);

  window.location.href = "../TerceraInterfaz/EstructuraTerceraInterfaz.html";
});
