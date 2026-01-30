// FuncionamientoIniciarSesion.js
document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.querySelector("button");

  btnLogin.addEventListener("click", async () => {
    const usuario = document.getElementById("usuario")?.value?.trim() || "";
    const contrasena = document.getElementById("contrasena")?.value?.trim() || "";

    if (!usuario || !contrasena) {
      alert("Completa usuario y contraseña");
      return;
    }

    const body = {
      login: usuario,
      password: contrasena
    };

    const ENDPOINT = "http://localhost:8000/usuario/login";

    try {
      const resp = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const raw = await resp.text();
      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        console.error("Respuesta NO-JSON:", raw);
        alert("Respuesta inválida del servidor");
        return;
      }

      if (!resp.ok) {
        alert(data?.error || `Error ${resp.status}`);
        return;
      }

      const token = data?.token || data?.data?.token;

      if (!token) {
        alert("Login correcto, pero no llegó el token");
        console.log("Respuesta login:", data);
        return;
      }

      // ✅ Guardar token
      localStorage.setItem("token", token);

      // ✅ Redirigir al chat IA
      window.location.href = "../ChatLucaIA/EstructuraChatLucaIA.html";

    } catch (error) {
      console.error(error);
      alert("No se pudo conectar con el servidor");
    }
  });
});
