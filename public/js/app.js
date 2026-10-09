// Enrutador principal y manejo de sesión
// Según la especificación Spec_Driven_Development.md - Sección 3

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { logout, getCurrentUser } from "./services/auth.service.js";
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
          showPage("/admin");
        } else if (userData && userData.rol === "OPERADOR") {
          showPage("/registro");
        } else {
          await logout();
          showPage("/login");
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        await logout();
        showPage("/login");
      }
    } else {
      showPage("/login");
    }
  });

  // Manejar cambios de ruta
  window.addEventListener("popstate", () => {
    handleRoute(window.location.pathname);
  });
}

export function navigateTo(path) {
  window.history.pushState(null, "", path);
  handleRoute(path);
}

function handleRoute(path) {
  if (path === "/login") {
    showPage("/login");
  } else if (path === "/registro") {
    showPage("/registro");
  } else if (path === "/admin") {
    showPage("/admin");
  } else {
    navigateTo("/login");
  }
}

/**
 * Muestra una página en el contenedor de la SPA.
 */
function showPage(page) {
  const app = document.getElementById("app");
  if (!app) return;

  // Login: pantalla completa sin nav
  if (page === "/login") {
    app.innerHTML = "";
    app.appendChild(loginView());
    return;
  }

  // Dashboard con nav + footer
  app.innerHTML = `
    <div class="flex flex-col min-h-screen w-full bg-slate-50">
      <nav class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style="background: linear-gradient(135deg, #0d9488, #0f766e);">
                P
              </div>
              <h1 class="text-xl font-extrabold text-slate-800 tracking-tight" style="font-family: 'Outfit', sans-serif;">
                PAB-IN <span class="text-slate-400 font-medium text-sm ml-1 hidden sm:inline-block">Control de Insumos</span>
              </h1>
            </div>
            <div class="flex items-center gap-3">
              <span id="nav-user" class="text-sm text-slate-500 font-medium hidden sm:block"></span>
              <button id="btn-logout" class="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div id="page-content" class="w-full"></div>
      </main>

      <footer class="bg-white border-t border-slate-200 mt-auto">
        <div class="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
          <p class="text-center text-sm text-slate-500">© 2026 Continental. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  `;

  // Logout
  document.getElementById("btn-logout")?.addEventListener("click", async () => {
    await logout();
    showPage("/login");
  });

  // Nombre en nav
  getCurrentUser().then(u => {
    const navUser = document.getElementById("nav-user");
    if (navUser && u) navUser.textContent = u.nombre_completo || u.correo || "";
  }).catch(() => {});

  // Insertar vista
  const pageContent = document.getElementById("page-content");
  if (page === "/registro") {
    pageContent.appendChild(operadorView());
  } else if (page === "/admin") {
    pageContent.appendChild(adminView());
  }
}
