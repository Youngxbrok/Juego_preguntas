// Seleccionamos el formulario y campos
const loginForm = document.getElementById("login-form");
const inputUsuario = document.getElementById("usuario");
const inputEmail = document.getElementById("email");

// Redirige automáticamente si ya hay usuario guardado
window.addEventListener("DOMContentLoaded", () => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
        window.location.href = "game.html";
    }
});

// Evento submit del formulario
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const usuario = inputUsuario.value.trim();
    const email = inputEmail.value.trim();

    if (usuario === "" || email === "") {
        alert("Por favor completa todos los campos");
        return;
    }

    // Guardar en localStorage
    localStorage.setItem("usuario", usuario);
    localStorage.setItem("email", email);

    // Redirigir al juego
    window.location.href = "game.html";
});
