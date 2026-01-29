const botones3 = document.querySelectorAll(".botones button");

// Anterior
botones3[0].addEventListener("click", () => {
  window.location.href = "../SegundaInterfaz/EstructuraSegundaInterfaz.html";
});

// Siguiente
botones3[1].addEventListener("click", () => {
  const servicios = [];

  document.querySelectorAll(".servicio").forEach(servicio => {
    const descripcion = servicio.querySelector("input[type='text']").value;
    const valor = Number(servicio.querySelector(".valor").value);

    servicios.push({
      descripcion,
      valor
    });
  });

  localStorage.setItem("servicios", JSON.stringify(servicios));

  window.location.href = "../CuartaInterfaz/EstructuraCuartaInterfaz.html";
});
