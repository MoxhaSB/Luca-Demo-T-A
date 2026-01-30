const botones4 = document.querySelectorAll(".botones button");

// ======================
// Navegación
// ======================
botones4[0].addEventListener("click", () => {
  window.location.href = "../TerceraInterfaz/EstructuraTerceraInterfaz.html";
});

// ======================
// Emitir Boleta
// ======================
botones4[1].addEventListener("click", async () => {
  const boletaJSON = construirJSONBoleta();
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Sesión expirada. Inicia sesión nuevamente.");
    window.location.href = "../Login/login.html";
    return;
  }

  console.log("JSON a enviar:", boletaJSON);

  try {
    const response = await fetch("http://localhost:8000/boleta/emitir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(boletaJSON)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    const resultado = await response.json();
    console.log("Respuesta backend:", resultado);

    alert("Boleta emitida correctamente ✅");

    limpiarLocalStorage();

  } catch (error) {
    console.error(error);
    alert("Ocurrió un error al emitir la boleta ❌");
  }
});

// ======================
// Construcción del JSON
// ======================
function construirJSONBoleta() {
  const servicios = JSON.parse(localStorage.getItem("servicios")) || [];
  const tipoRetencion = localStorage.getItem("tipoRetencion");
  const tasaRetencionPct = tipoRetencion === "CON_RETENCION" ? 10.75 : 0;


  return {
    fechaEmision: localStorage.getItem("fechaEmision"),
    tipoRetencion,
    tasaRetencionPct,
    emisor: {
      direccion: localStorage.getItem("direccionEmisor"),
    },
    receptor: {
      rut: localStorage.getItem("receptorRut"),
      nombreCompleto: localStorage.getItem("receptorNombre"),
      direccion: localStorage.getItem("receptorDireccion"),
      region: localStorage.getItem("receptorRegion"),
      comuna: localStorage.getItem("receptorComuna"),
    },
    servicios, // [{ descripcion, valor }, ...]
  };
}


// ======================
// Limpieza de datos
// ======================
function limpiarLocalStorage() {
  localStorage.removeItem("fechaEmision");
  localStorage.removeItem("tipoRetencion");
  localStorage.removeItem("direccionEmisor");

  localStorage.removeItem("receptorRut");
  localStorage.removeItem("receptorNombre");
  localStorage.removeItem("receptorDireccion");
  localStorage.removeItem("receptorRegion");
  localStorage.removeItem("receptorComuna");

  localStorage.removeItem("servicios");
}
