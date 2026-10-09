// Enrutador principal y manejo de sesión
// Según la especificación Spec_Driven_Development.md - Sección 3

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { login, logout, isAuthenticated, getCurrentUser } from "./services/auth.service.js";
import { obtenerEntregasDelDia, obtenerTodasLasEntregas } from "./services/entregas.service.js";
import { getCatalogosCompletos } from "./services/catalogos.service.js";
import { obtenerTodosLosUsuarios } from "./services/users.service.js";
import { loginView } from "./views/login.view.js";
import { operadorView } from "./views/operador.view.js";
import { adminView } from "./views/admin.view.js";

// Configurar rutas y manejo de sesión
export function initApp() {
  console.log("🔧 Inicializando Control de Insumos Web (PAB-IN)...");

  // Redirigir según el estado de autenticación
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userData = await getCurrentUser();

        if (userData && userData.rol === "ADMIN") {
          // Redirigir a /admin para administradores
          showPage("/admin");

        } else if (userData && userData.rol === "OPERADOR") {
          // Redirigir a /registro para operadores
          showPage("/registro");

        } else {
          // Usuario sin rol definido, forzar logout
          logout();
          showPage("/login");
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        logout();
        showPage("/login");
      }
    } else {
      // No hay usuario autenticado, redirigir a login
      showPage("/login");
    }
  });

  // Manejar cambios de ruta manualmente (SPA)
  window.addEventListener("popstate", () => {
    const path = window.location.pathname;
    handleRoute(path);
  });
}

/**
 * Redirige a una página específica.
 * @param {string} path - Ruta a redirigir (ej. "/admin").
 */
export function navigateTo(path) {
  window.history.pushState(null, "", path);
  handleRoute(path);
}

/**
 * Maneja la lógica de enrutamiento según la ruta actual.
 * @param {string} path - Ruta actual.
 */
function handleRoute(path) {
  if (path === "/login") {
    showPage("/login");
  } else if (path === "/registro") {
    showPage("/registro");
    // El botón de logout en el header llamará a navigateTo("/login")
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", async () => {
        await logout();
        showPage("/login");
      });
    }
  } else if (path === "/admin") {
    showPage("/admin");

  } else {
    // Ruta por defecto
    navigateTo("/login");
  }
}

/**
 * Muestra una página en el contenedor de la SPA.
 * @param {string} page - Nombre de la página a mostrar.
 */
function showPage(page) {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="flex flex-col min-h-screen w-full bg-slate-50">
      <nav class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-sm text-white font-bold text-xl" style="background: linear-gradient(135deg, #0d9488, #0f766e);">
                P
              </div>
              <h1 class="text-xl font-extrabold text-slate-800 tracking-tight logo">PAB-IN <span class="text-slate-400 font-medium text-sm ml-2 hidden sm:inline-block">Control de Insumos</span></h1>
            </div>
            <div class="flex items-center gap-4" id="nav-actions">
              <!-- Acciones de usuario dinámicas -->
            </div>
          </div>
        </div>
      </nav>
      
      <main class="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div id="page-content" class="w-full">
          <!-- Contenido dinámico -->
        </div>
      </main>
      
      <footer class="bg-white border-t border-slate-200 mt-auto">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p class="text-center text-sm text-slate-500 font-medium">© 2026 Continental. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  `;

  // Cargar la vista correspondiente
  const pageContent = document.getElementById("page-content");
  if (page === "/login") {
    pageContent.appendChild(loginView());
  } else if (page === "/registro") {
    pageContent.appendChild(operadorView());
  } else if (page === "/admin") {
    pageContent.appendChild(adminView());
  }
}

/**
 * Carga el dashboard del operador.
 * @param {string} nombre - Nombre del operador.
 */
export async function loadOperadorDashboard(nombre) {
  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  const entregas = await obtenerEntregasDelDia(auth.currentUser.uid);
  const catalogos = await getCatalogosCompletos();

  // Renderizar vista del operador con datos
  const operadorViewContent = operadorView();
  pageContent.innerHTML = operadorViewContent.outerHTML;

  // Aquí se podrían actualizar los datos dinámicamente
  console.log("📦 Operador:", nombre);
  console.log("📊 Entregas del día:", entregas.length);
}

/**
 * Carga el dashboard del administrador.
 */
export async function loadAdminDashboard() {
  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  const entregas = await obtenerTodasLasEntregas();
  const catalogos = await getCatalogosCompletos();
  const usuarios = await obtenerTodosLosUsuarios();

  // Renderizar vista admin
  const adminViewContent = adminView();
  pageContent.innerHTML = adminViewContent.outerHTML;

  // Aquí se podrían actualizar los datos dinámicamente
  console.log("👥 Usuarios:", usuarios.length);
  console.log("📊 Entregas totales:", entregas.length);
}
