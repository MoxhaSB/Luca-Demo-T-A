document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.querySelector("button");

  btnLogin.addEventListener("click", async () => {
    // 2️⃣ Crear JSON con los datos del formulario
    const loginData = {
      usuario: document.getElementById("usuario").value.trim(),
      contrasena: document.getElementById("contrasena").value.trim()
    };

    try {
      // 3️⃣ Enviar JSON al backend
      const response = await fetch("http://192.168.1.157:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      // 4️⃣ Manejar la respuesta
      if (response.ok) {
        console.log("Login exitoso:", data);
        
        // Guardar token en localStorage
        if (data.token) {
          localStorage.setItem("token", data.token);
          alert("Inicio de sesión correcto");
          // Redirigir a otra página si quieres
          // window.location.href = "dashboard.html";
        } else {
          alert("Login correcto, pero no se recibió token");
        }
      } else {
        // Manejo básico de errores según el código HTTP
        switch (response.status) {
          case 400:
            alert("Solicitud incorrecta");
            break;
          case 401:
            alert("Usuario o contraseña incorrectos");
            break;
          case 500:
            alert("Error del servidor, intenta más tarde");
            break;
          default:
            alert(`Error desconocido: ${response.status}`);
        }
      }

    } catch (error) {
      console.error("Error de conexión:", error);
      alert("No se pudo conectar con el servidor");
    }
  });
});
