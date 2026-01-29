const siguiente1 = document.querySelector(".botones button:nth-child(2)");

const fechaEmision = document.getElementById("fecha");
const tipoRetencion = document.getElementById("retencion");
const direccionEmisor = document.getElementById("direccion");

siguiente1.addEventListener("click", () => {
  localStorage.setItem("fechaEmision", fechaEmision.value);
  localStorage.setItem("tipoRetencion", tipoRetencion.value);
  localStorage.setItem("direccionEmisor", direccionEmisor.value);

  window.location.href = "../SegundaInterfaz/EstructuraSegundaInterfaz.html";
});
