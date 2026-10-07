// Vista de Inicio de Sesión
// Según la especificación Spec_Driven_Development.md - Sección 6.1, RF-01

import { login, isAuthenticated, getCurrentUser } from "../services/auth.service.js";
import { navigateTo } from "../app.js";

/**
 * Renderiza la vista de inicio de sesión.
 * @returns {HTMLElement} Elemento del DOM con la vista de login.
 */
export function loginView() {
  const container = document.createElement("div");
  container.className = "card";
  container.innerHTML = `
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Iniciar Sesión</h2>
      <p class="text-gray-600 mt-1">Ingrese sus credenciales para continuar</p>
    </div>

    <div id="alert-container"></div>

    <form id="login-form" class="space-y-4">
      <div class="form-group">
        <label class="form-label" for="correo">Correo Institucional</label>
        <input
          type="email"
          id="correo"
          class="form-input"
          placeholder="usuario@universidad.edu.pe"
          required
        >
      </div>

      <div class="form-group">
        <label class="form-label" for="contrasena">Contraseña</label>
        <input
          type="password"
          id="contrasena"
          class="form-input"
          placeholder="Contraseña o DNI (para operadores)"
          required
        >
      </div>

      <div class="form-group">
        <button
          type="submit"
          id="btn-login"
          class="btn btn-primary w-full"
          disabled
        >
          Ingresar
        </button>
      </div>
    </form>

    <p class="text-sm text-gray-500 mt-4 text-center">
      ¿No tienes cuenta? <a href="#" id="register-link">Contacta al administrador</a>
    </p>
  `;

  // Manejar el envío del formulario
  const form = container.querySelector("#login-form");
  const btnSubmit = container.querySelector("#btn-login");

  // Deshabilitar el botón mientras se valida
  form.addEventListener("input", () => {
    const email = container.querySelector("#correo").value.trim();
    const password = container.querySelector("#contrasena").value;
    btnSubmit.disabled = email === "" || password === "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = container.querySelector("#correo").value.trim();
    const password = container.querySelector("#contrasena").value;

    // Limpiar alertas previas
    const alertContainer = container.querySelector("#alert-container");
    alertContainer.innerHTML = "";

    try {
      // Mostrar estado de carga
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Ingresando...";

      const result = await login(email, password);

      // Verificar si la cuenta está activa
      if (!result.activo) {
        throw new Error("Cuenta desactivada. Contacta al administrador.");
      }

      // Redirigir según el rol
      if (result.rol === "ADMIN") {
        navigateTo("/admin");
      } else if (result.rol === "OPERADOR") {
        navigateTo("/registro");
      }

    } catch (error) {
      const alert = document.createElement("div");
      alert.className = "alert alert-error";
      alert.textContent = error.message || "Error al iniciar sesión.";
      alertContainer.appendChild(alert);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Ingresar";
    }
  });

  // Enlace de registro
  const registerLink = container.querySelector("#register-link");
  if (registerLink) {
    registerLink.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Para crear una cuenta, contacta al administrador del sistema.");
    });
  }

  return container;
}
