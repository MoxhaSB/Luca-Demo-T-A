const botones4 = document.querySelectorAll(".botones button");

// ======================
// Navegación
// ======================
botones4[0].addEventListener("click", () => {
  window.location.href = "../TerceraInterfaz/EstructuraTerceraInterfaz.html";
});

botones4[1].addEventListener("click", () => {
  alert("Boleta emitida correctamente!");
  // Aquí luego enviarás el JSON al backend
});

// ======================
// Render Resumen
// ======================
function renderResumenBoleta() {
  const tbody = document.querySelector("#tablaResumen tbody");
  tbody.innerHTML = "";

  const addRow = (titulo, valor) => {
    const tr = document.createElement("tr");

    const tdTitulo = document.createElement("td");
    tdTitulo.textContent = titulo;

    const tdValor = document.createElement("td");
    tdValor.textContent = valor;

    tr.appendChild(tdTitulo);
    tr.appendChild(tdValor);
    tbody.appendChild(tr);
  };

  // ======================
  // Datos Generales
  // ======================
  addRow("Fecha de Emisión", localStorage.getItem("fechaEmision"));
  addRow("Tipo de Retención", localStorage.getItem("tipoRetencion"));
  addRow("Tasa Retención (%)", "10.75");
  addRow("Dirección Emisor", localStorage.getItem("direccionEmisor"));

  // ======================
  // Receptor
  // ======================
  addRow("RUT Receptor", localStorage.getItem("receptorRut"));
  addRow("Nombre Receptor", localStorage.getItem("receptorNombre"));
  addRow("Dirección Receptor", localStorage.getItem("receptorDireccion"));
  addRow("Región", localStorage.getItem("receptorRegion"));
  addRow("Comuna", localStorage.getItem("receptorComuna"));

  // ======================
  // Servicios
  // ======================
  const servicios = JSON.parse(localStorage.getItem("servicios")) || [];

  servicios.forEach((servicio, index) => {
    addRow(
      `Servicio ${index + 1}`,
      `${servicio.descripcion} — $${servicio.valor}`
    );
  });

  // ======================
  // Total
  // ======================
  const total = servicios.reduce((acc, s) => acc + s.valor, 0);
  addRow("Total Líquido", `$${total}`);
}

window.addEventListener("DOMContentLoaded", renderResumenBoleta);
