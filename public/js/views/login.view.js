// Vista de Inicio de Sesión
// Según la especificación Spec_Driven_Development.md - Sección 6.1, RF-01

import { login, isAuthenticated, getCurrentUser } from "../services/auth.service.js";
import { navigateTo } from "../app.js";

/**
 * Renderiza la vista de inicio de sesión.
 * @returns {HTMLElement} Elemento del DOM con la vista de login.
 */
export function loginView() {
  const wrapper = document.createElement("div");
  wrapper.className = "login-wrapper fade-in";
  wrapper.innerHTML = `
    <div class="login-card">
      <div class="text-center mb-6">
        <h2 class="text-3xl font-extrabold text-slate-800" style="font-family: 'Outfit', sans-serif;">PAB-IN</h2>
        <p class="text-slate-500 mt-2 font-medium">Control de Insumos Web</p>
      </div>

      <div id="alert-container"></div>

      <form id="login-form" class="space-y-5">
        <div class="form-group">
          <label class="form-label" for="correo">Correo Institucional</label>
          <input
            type="email"
            id="correo"
            class="form-input"
            placeholder="usuario@continental.edu.pe"
            required
          >
        </div>

        <div class="form-group">
          <label class="form-label" for="contrasena">Contraseña</label>
          <input
            type="password"
            id="contrasena"
            class="form-input"
            placeholder="Contraseña o DNI"
            required
          >
        </div>

        <div class="form-group mt-6">
          <button
            type="submit"
            id="btn-login"
            class="btn btn-primary w-full"
            style="padding: 1rem; font-size: 1.1rem; border-radius: 0.75rem;"
            disabled
          >
            Ingresar al Sistema
          </button>
        </div>
      </form>

      <p class="text-sm text-slate-500 mt-6 text-center">
        ¿Problemas para ingresar? <a href="#" id="register-link" class="text-teal-600 font-semibold hover:underline">Contacta a soporte</a>
      </p>
    </div>
  `;

  // Manejar el envío del formulario
  const form = wrapper.querySelector("#login-form");
  const btnSubmit = wrapper.querySelector("#btn-login");

  // Deshabilitar el botón mientras se valida
  form.addEventListener("input", () => {
    const email = wrapper.querySelector("#correo").value.trim();
    const password = wrapper.querySelector("#contrasena").value;
    btnSubmit.disabled = email === "" || password === "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = wrapper.querySelector("#correo").value.trim();
    const password = wrapper.querySelector("#contrasena").value;

    // Limpiar alertas previas
    const alertContainer = wrapper.querySelector("#alert-container");
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
  const registerLink = wrapper.querySelector("#register-link");
  if (registerLink) {
    registerLink.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Para crear una cuenta, contacta al administrador del sistema.");
    });
  }

  return wrapper;
}
