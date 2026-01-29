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


    // ✅ Tu service espera { login, password }
    const body = {
      login: usuario,
      password: contrasena,
    };


    const ENDPOINT = "http://localhost:8000/usuario/login"; // <-- tu ruta


    try {
      const resp = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });


      const raw = await resp.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("Respuesta NO-JSON:", raw);
        alert("Backend respondió algo no-JSON (revisa consola).");
        return;
      }


      if (!resp.ok) {
        alert(data?.error || `Error ${resp.status}`);
        return;
      }


      // OJO: tu service loginUsuario devuelve data: { id, usuario, roles... }
      // El token lo debe crear el controller (usando signToken) y devolverlo.
      const token = data?.token || data?.data?.token;


      if (token) {
        localStorage.setItem("token", token);
        alert("Login OK ✅");
      } else {
        alert("Login OK, pero no llegó token. Revisa el controller /usuario/login.");
        console.log("Respuesta login:", data);
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo conectar con el servidor");
    }
  });
});
