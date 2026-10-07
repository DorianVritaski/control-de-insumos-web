// Enrutador principal y manejo de sesión
// Según la especificación Spec_Driven_Development.md - Sección 3

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { login, logout, isAuthenticated, getCurrentUser } from "./services/auth.service.js";
import { obtenerEntregasDelDia } from "./services/entregas.service.js";
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
          loadAdminDashboard();
        } else if (userData && userData.rol === "OPERADOR") {
          // Redirigir a /registro para operadores
          showPage("/registro");
          loadOperadorDashboard(userData.nombre);
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
    loadLogin();
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
    loadAdminDashboard();
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
    <div class="container">
      <header>
        <h1 class="logo">Control de Insumos Web</h1>
        <p class="subtitle">PAB-IN</p>
      </header>
      <main>
        <div id="page-content">
          <!-- Contenido dinámico -->
        </div>
      </main>
      <footer>
        <p class="footer-text">© 2026 Control de Insumos Web</p>
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

/**
 * Obtiene todas las entregas (sin filtros).
 * @returns {Promise<Array>} Lista de todas las entregas.
 */
async function obtenerTodasLasEntregas() {
  try {
    const entregasRef = collection(db, "registros_entrega");
    const q = query(entregasRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const entregas = [];
    snapshot.forEach((doc) => {
      entregas.push({ id: doc.id, ...doc.data() });
    });
    return entregas;
  } catch (error) {
    console.error("Error al obtener todas las entregas:", error);
    throw error;
  }
}
