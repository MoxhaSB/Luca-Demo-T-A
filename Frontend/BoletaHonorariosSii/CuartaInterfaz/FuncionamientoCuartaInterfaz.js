const botones4 = document.querySelectorAll(".botones button");

// ======================
// Navegación
// ======================
botones4[0].addEventListener("click", () => {
  window.location.href = "../TerceraInterfaz/EstructuraTerceraInterfaz.html";
});

botones4[1].addEventListener("click", async () => {
  const boletaJSON = construirJSONBoleta();

  console.log("JSON a enviar:", boletaJSON);

  try {
    const response = await fetch("http://localhost:8000/boleta/emitir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(boletaJSON)
    });

    if (!response.ok) {
      throw new Error("Error al emitir la boleta");
    }

    const resultado = await response.json();
    console.log("Respuesta backend:", resultado);

    alert("Boleta emitida correctamente ✅");

    // Opcional: limpiar localStorage al finalizar
    limpiarLocalStorage();

    // Opcional: redirigir
    // window.location.href = "../PrimeraInterfaz/EstructuraPrimeraInterfaz.html";

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

  return {
    BOLETA: {
      fechaEmision: localStorage.getItem("fechaEmision"),
      tipoRetencion: localStorage.getItem("tipoRetencion"),
      tasaRetencionPct: 10.75,
      emisor: {
        direccion: localStorage.getItem("direccionEmisor")
      },
      receptor: {
        rut: localStorage.getItem("receptorRut"),
        nombreCompleto: localStorage.getItem("receptorNombre"),
        direccion: localStorage.getItem("receptorDireccion"),
        region: localStorage.getItem("receptorRegion"),
        comuna: localStorage.getItem("receptorComuna")
      },
      servicios: servicios
    }
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
