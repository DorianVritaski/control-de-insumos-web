// Vista del Módulo Administrador
// Panel de Control y Configuración
// Según la especificación Spec_Driven_Development.md

import { filtrarEntregas, regularizarEntrega } from "../services/entregas.service.js";
import {
  getCatalogosCompletos,
  agregarPabellon, actualizarPabellon, eliminarPabellon,
  agregarInsumo, eliminarInsumo
} from "../services/catalogos.service.js";
import { obtenerTodosLosUsuarios, registrarUsuario, cambiarEstadoUsuario } from "../services/users.service.js";
import { isAuthenticated, getCurrentUser } from "../services/auth.service.js";

export function adminView() {
  const container = document.createElement("div");
  container.innerHTML = `
    <!-- Header del Panel -->
    <div class="mb-8">
      <h2 class="text-3xl font-extrabold text-slate-800 logo">Panel de Administrador</h2>
      <p class="text-slate-500 mt-1">Gestión de entregas, usuarios y catálogos del sistema.</p>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="border-b border-slate-200 px-6 pt-4">
        <nav class="flex gap-1 -mb-px" id="admin-tabs">
          <button data-tab="regularizacion" class="tab-btn active px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-teal-600 text-teal-700 bg-teal-50 transition-all">
            📋 Regularización
          </button>
          <button data-tab="usuarios" class="tab-btn px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all">
            👥 Usuarios
          </button>
          <button data-tab="catalogos" class="tab-btn px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all">
            📦 Catálogos
          </button>
          <button data-tab="export" class="tab-btn px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all">
            📤 Exportar
          </button>
        </nav>
      </div>

      <!-- TAB REGULARIZACION -->
      <div class="tab-panel p-6" id="tab-regularizacion">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Fecha Inicio</label>
            <input type="date" id="filtro-fecha-inicio" class="form-input text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Fecha Fin</label>
            <input type="date" id="filtro-fecha-fin" class="form-input text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Insumo</label>
            <select id="filtro-insumo" class="form-input text-sm">
              <option value="">Todos</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Pabellón</label>
            <select id="filtro-pabellon" class="form-input text-sm">
              <option value="">Todos</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Estado</label>
            <select id="filtro-estado" class="form-input text-sm">
              <option value="">Todos</option>
              <option value="POR_REGULARIZAR">Por Regularizar</option>
              <option value="REGULARIZADO">Regularizado</option>
            </select>
          </div>
        </div>
        <div class="flex gap-3 mb-6">
          <button id="btn-filtrar" class="btn btn-primary text-sm">🔍 Filtrar</button>
          <button id="btn-limpiar-filtros" class="btn btn-secondary text-sm">✕ Limpiar</button>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Fecha</th><th>Insumo</th><th>Cantidad</th>
                <th>Pabellón</th><th>Piso</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tbody-regularizacion">
              <tr><td colspan="8" class="text-center text-slate-400 py-8">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB USUARIOS -->
      <div class="tab-panel p-6 hidden" id="tab-usuarios">
        <div id="alert-usuarios"></div>
        
        <!-- Formulario nuevo usuario -->
        <div class="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-6">
          <h3 class="text-base font-bold text-slate-700 mb-4">➕ Nuevo Usuario</h3>
          <form id="form-nuevo-usuario">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Nombre Completo</label>
                <input type="text" id="nuevo-nombre" class="form-input" placeholder="Ej: Juan García" required>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">DNI</label>
                <input type="text" id="nuevo-dni" class="form-input" maxlength="8" placeholder="Ej: 72947488" required>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Correo Institucional</label>
                <input type="email" id="nuevo-correo" class="form-input" placeholder="usuario@continental.edu.pe" required>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Rol</label>
                <select id="nuevo-rol" class="form-input">
                  <option value="OPERADOR">Operador</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Estado</label>
                <select id="nuevo-activo" class="form-input">
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
            <div class="mt-4">
              <button type="submit" id="btn-agregar-usuario" class="btn btn-primary text-sm">✓ Registrar Usuario</button>
            </div>
          </form>
        </div>

        <!-- Lista de usuarios -->
        <div class="table-responsive">
          <table>
            <thead>
              <tr><th>Nombre</th><th>DNI</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody id="tbody-usuarios">
              <tr><td colspan="6" class="text-center text-slate-400 py-8">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB CATALOGOS -->
      <div class="tab-panel p-6 hidden" id="tab-catalogos">
        <div id="alert-catalogos"></div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Pabellones -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-cyan-50 flex items-center gap-2">
              <span class="text-xl">🏛️</span>
              <h3 class="font-bold text-slate-800 text-base">Pabellones</h3>
            </div>
            <div class="p-5">
              <!-- Formulario agregar pabellón -->
              <form id="form-add-pabellon" class="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p class="text-xs font-semibold text-slate-500 uppercase mb-3">Agregar Pabellón</p>
                <div class="grid grid-cols-3 gap-2 mb-3">
                  <input type="text" id="pabellon-codigo" class="form-input text-sm" placeholder="Código (ej: N)" maxlength="4" required>
                  <input type="text" id="pabellon-nombre" class="form-input text-sm col-span-2" placeholder="Nombre (ej: Pabellón Norte)" required>
                </div>
                <div class="flex gap-2 items-center">
                  <input type="number" id="pabellon-pisos" class="form-input text-sm" placeholder="Max. pisos" min="1" max="20" required style="max-width: 120px;">
                  <button type="submit" class="btn btn-primary text-sm" style="padding: 0.6rem 1rem;">+ Agregar</button>
                </div>
              </form>

              <!-- Lista pabellones -->
              <div id="lista-pabellones" class="space-y-2 max-h-80 overflow-y-auto pr-1">
                <div class="text-center text-slate-400 py-6 text-sm">Cargando pabellones...</div>
              </div>
            </div>
          </div>

          <!-- Insumos -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50 flex items-center gap-2">
              <span class="text-xl">🧴</span>
              <h3 class="font-bold text-slate-800 text-base">Insumos</h3>
            </div>
            <div class="p-5">
              <!-- Formulario agregar insumo -->
              <form id="form-add-insumo" class="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p class="text-xs font-semibold text-slate-500 uppercase mb-3">Agregar Insumo</p>
                <div class="flex gap-2">
                  <input type="text" id="insumo-nombre" class="form-input text-sm" placeholder="Nombre del insumo (ej: JABON)" required>
                  <button type="submit" class="btn btn-primary text-sm" style="padding: 0.6rem 1rem; white-space: nowrap;">+ Agregar</button>
                </div>
                <p class="text-xs text-slate-400 mt-2">Use mayúsculas y guiones bajos (ej: PAPEL_HIGIENICO)</p>
              </form>

              <!-- Lista insumos -->
              <div id="lista-insumos" class="space-y-2 max-h-80 overflow-y-auto pr-1">
                <div class="text-center text-slate-400 py-6 text-sm">Cargando insumos...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB EXPORT -->
      <div class="tab-panel p-6 hidden" id="tab-export">
        <div id="alert-export"></div>
        <div class="max-w-lg">
          <h3 class="text-base font-bold text-slate-700 mb-2">Exportar Registros de Entregas</h3>
          <p class="text-sm text-slate-500 mb-6">Descarga un archivo CSV con todos los registros de entregas del sistema para su análisis.</p>
          <button id="btn-exportar-csv" class="btn btn-primary">📥 Descargar CSV</button>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => initAdminView(container), 0);
  return container;
}

async function initAdminView(container) {
  // ===================== TABS =====================
  const tabBtns = container.querySelectorAll('.tab-btn');
  const tabPanels = container.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active', 'border-teal-600', 'text-teal-700', 'bg-teal-50');
        b.classList.add('border-transparent', 'text-slate-500');
      });
      tabPanels.forEach(p => p.classList.add('hidden'));

      btn.classList.add('active', 'border-teal-600', 'text-teal-700', 'bg-teal-50');
      btn.classList.remove('border-transparent', 'text-slate-500');
      const panelId = 'tab-' + btn.dataset.tab;
      container.querySelector('#' + panelId)?.classList.remove('hidden');
    });
  });

  // ===================== CATÁLOGOS (cargar primero para filtros) =====================
  let catalogos = { pabellones: [], insumos: [] };
  const filtroPabellon = container.querySelector('#filtro-pabellon');
  const filtroInsumo = container.querySelector('#filtro-insumo');

  function alertCatalogos(msg, type = 'success') {
    const div = container.querySelector('#alert-catalogos');
    div.innerHTML = `<div class="alert alert-${type} mb-4">${msg}</div>`;
    setTimeout(() => { div.innerHTML = ''; }, 4000);
  }

  function renderPabellones() {
    const ul = container.querySelector('#lista-pabellones');
    if (!catalogos.pabellones.length) {
      ul.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">No hay pabellones registrados.</p>';
      return;
    }
    ul.innerHTML = catalogos.pabellones.map(p => `
      <div class="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:border-teal-300 hover:bg-teal-50 transition-all">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold text-white" style="background: linear-gradient(135deg, #0d9488, #0f766e);">${p.codigo}</span>
          <div>
            <p class="font-semibold text-slate-800 text-sm">${p.nombre}</p>
            <p class="text-xs text-slate-400">Máx. ${p.max_pisos} pisos</p>
          </div>
        </div>
        <button class="btn-del-pabellon opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50 rounded-lg p-1.5" data-codigo="${p.codigo}" title="Eliminar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `).join('');

    ul.querySelectorAll('.btn-del-pabellon').forEach(btn => {
      btn.addEventListener('click', async () => {
        const codigo = btn.dataset.codigo;
        if (!confirm(`¿Eliminar el pabellón "${codigo}"?`)) return;
        try {
          await eliminarPabellon(codigo);
          catalogos.pabellones = catalogos.pabellones.filter(p => p.codigo !== codigo);
          renderPabellones();
          sincronizarSelectFiltros();
          alertCatalogos(`Pabellón "${codigo}" eliminado correctamente.`);
        } catch (e) {
          alertCatalogos('Error al eliminar: ' + e.message, 'error');
        }
      });
    });
  }

  function renderInsumos() {
    const ul = container.querySelector('#lista-insumos');
    if (!catalogos.insumos.length) {
      ul.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">No hay insumos registrados.</p>';
      return;
    }
    ul.innerHTML = catalogos.insumos.map(i => `
      <div class="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:border-violet-300 hover:bg-violet-50 transition-all">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold text-white" style="background: linear-gradient(135deg, #7c3aed, #6d28d9);">🧴</span>
          <p class="font-semibold text-slate-800 text-sm">${i}</p>
        </div>
        <button class="btn-del-insumo opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50 rounded-lg p-1.5" data-nombre="${i}" title="Eliminar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `).join('');

    ul.querySelectorAll('.btn-del-insumo').forEach(btn => {
      btn.addEventListener('click', async () => {
        const nombre = btn.dataset.nombre;
        if (!confirm(`¿Eliminar el insumo "${nombre}"?`)) return;
        try {
          await eliminarInsumo(nombre);
          catalogos.insumos = catalogos.insumos.filter(i => i !== nombre);
          renderInsumos();
          sincronizarSelectFiltros();
          alertCatalogos(`Insumo "${nombre}" eliminado correctamente.`);
        } catch (e) {
          alertCatalogos('Error al eliminar: ' + e.message, 'error');
        }
      });
    });
  }

  function sincronizarSelectFiltros() {
    // Actualizar select de filtro de pabellón
    const pabValActual = filtroPabellon.value;
    filtroPabellon.innerHTML = '<option value="">Todos</option>';
    catalogos.pabellones.forEach(p => {
      const o = document.createElement('option');
      o.value = p.codigo;
      o.textContent = p.nombre;
      filtroPabellon.appendChild(o);
    });
    filtroPabellon.value = pabValActual;

    // Actualizar select de filtro de insumo
    const insumoValActual = filtroInsumo.value;
    filtroInsumo.innerHTML = '<option value="">Todos</option>';
    catalogos.insumos.forEach(i => {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = i.replace(/_/g, ' ');
      filtroInsumo.appendChild(o);
    });
    filtroInsumo.value = insumoValActual;
  }

  // Cargar catálogos
  try {
    catalogos = await getCatalogosCompletos();
    sincronizarSelectFiltros();
    renderPabellones();
    renderInsumos();
  } catch (err) {
    console.error("Error cargando catálogos:", err);
  }

  // Formulario agregar pabellón
  container.querySelector('#form-add-pabellon').addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = container.querySelector('#pabellon-codigo').value.trim().toUpperCase();
    const nombre = container.querySelector('#pabellon-nombre').value.trim();
    const max_pisos = parseInt(container.querySelector('#pabellon-pisos').value);
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    try {
      const nuevo = await agregarPabellon(codigo, nombre, max_pisos);
      catalogos.pabellones.push(nuevo);
      catalogos.pabellones.sort((a, b) => a.nombre.localeCompare(b.nombre));
      renderPabellones();
      sincronizarSelectFiltros();
      e.target.reset();
      alertCatalogos(`✅ Pabellón "${nombre}" agregado correctamente.`);
    } catch (err) {
      alertCatalogos('❌ Error: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '+ Agregar';
    }
  });

  // Formulario agregar insumo
  container.querySelector('#form-add-insumo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = container.querySelector('#insumo-nombre').value.trim().toUpperCase().replace(/ /g, '_');
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    try {
      await agregarInsumo(nombre);
      catalogos.insumos.push(nombre);
      catalogos.insumos.sort();
      renderInsumos();
      sincronizarSelectFiltros();
      e.target.reset();
      alertCatalogos(`✅ Insumo "${nombre}" agregado correctamente.`);
    } catch (err) {
      alertCatalogos('❌ Error: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '+ Agregar';
    }
  });

  // ===================== REGULARIZACIÓN =====================
  const tbodyRegularizacion = container.querySelector('#tbody-regularizacion');

  async function cargarEntregas(filtros = {}) {
    tbodyRegularizacion.innerHTML = '<tr><td colspan="8" class="text-center text-slate-400 py-8">Cargando...</td></tr>';
    try {
      const entregas = await filtrarEntregas(filtros.fechaInicio, filtros.fechaFin, filtros.insumo, filtros.pabellon, filtros.estado);
      tbodyRegularizacion.innerHTML = '';
      if (!entregas.length) {
        tbodyRegularizacion.innerHTML = '<tr><td colspan="8" class="text-center text-slate-400 py-8">No hay entregas para mostrar.</td></tr>';
        return;
      }
      entregas.forEach(e => {
        const tr = document.createElement('tr');
        const esReg = e.estado === 'REGULARIZADO';
        tr.innerHTML = `
          <td class="font-mono text-xs text-slate-400">${e.id.substring(0, 6)}…</td>
          <td class="text-sm">${e.fecha_registro}</td>
          <td class="text-sm font-medium">${e.insumo?.replace(/_/g, ' ') || '-'}</td>
          <td class="text-sm text-center">${e.cantidad_total || 'Lote'}</td>
          <td class="text-sm">${e.pabellon || '-'}</td>
          <td class="text-sm text-center">${e.piso || '-'}</td>
          <td>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${esReg ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
              ${esReg ? '✓ Regularizado' : '⏳ Por Regularizar'}
            </span>
          </td>
          <td>
            ${!esReg ? `<button class="btn-regularizar text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors" data-id="${e.id}">Regularizar</button>` : '<span class="text-slate-300 text-xs">—</span>'}
          </td>
        `;
        tbodyRegularizacion.appendChild(tr);
      });

      container.querySelectorAll('.btn-regularizar').forEach(btn => {
        btn.addEventListener('click', async (ev) => {
          const id = ev.currentTarget.dataset.id;
          const piso = prompt("Ingrese el piso (número):");
          if (!piso || isNaN(parseInt(piso))) return;
          const user = await getCurrentUser();
          try {
            await regularizarEntrega(id, parseInt(piso), 0, 0, 0, user.uid);
            cargarEntregas(getFiltros());
          } catch (err) {
            alert("Error: " + err.message);
          }
        });
      });
    } catch (err) {
      tbodyRegularizacion.innerHTML = '<tr><td colspan="8" class="text-center text-red-400 py-8">Error al cargar entregas.</td></tr>';
    }
  }

  function getFiltros() {
    return {
      fechaInicio: container.querySelector('#filtro-fecha-inicio').value || null,
      fechaFin: container.querySelector('#filtro-fecha-fin').value || null,
      insumo: container.querySelector('#filtro-insumo').value || null,
      pabellon: container.querySelector('#filtro-pabellon').value || null,
      estado: container.querySelector('#filtro-estado').value || null
    };
  }

  container.querySelector('#btn-filtrar').addEventListener('click', () => cargarEntregas(getFiltros()));
  container.querySelector('#btn-limpiar-filtros').addEventListener('click', () => {
    ['#filtro-fecha-inicio', '#filtro-fecha-fin', '#filtro-insumo', '#filtro-pabellon', '#filtro-estado'].forEach(s => {
      container.querySelector(s).value = '';
    });
    cargarEntregas();
  });
  cargarEntregas();

  // ===================== USUARIOS =====================
  const tbodyUsuarios = container.querySelector('#tbody-usuarios');
  const alertUsuariosDiv = container.querySelector('#alert-usuarios');

  function alertUsuarios(msg, type = 'success') {
    alertUsuariosDiv.innerHTML = `<div class="alert alert-${type} mb-4">${msg}</div>`;
    setTimeout(() => { alertUsuariosDiv.innerHTML = ''; }, 4000);
  }

  async function cargarUsuarios() {
    tbodyUsuarios.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-8">Cargando...</td></tr>';
    try {
      const usuarios = await obtenerTodosLosUsuarios();
      tbodyUsuarios.innerHTML = '';
      usuarios.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="font-medium text-slate-800">${u.nombre_completo}</td>
          <td class="font-mono text-sm">${u.dni}</td>
          <td class="text-sm text-slate-500">${u.correo}</td>
          <td>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
              ${u.rol}
            </span>
          </td>
          <td>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${u.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
              ${u.activo ? '● Activo' : '○ Inactivo'}
            </span>
          </td>
          <td>
            <button class="btn-toggle-activo text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${u.activo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}" data-id="${u.id}" data-activo="${!u.activo}">
              ${u.activo ? 'Desactivar' : 'Activar'}
            </button>
          </td>
        `;
        tbodyUsuarios.appendChild(tr);
      });

      container.querySelectorAll('.btn-toggle-activo').forEach(btn => {
        btn.addEventListener('click', async (ev) => {
          const id = ev.currentTarget.dataset.id;
          const activo = ev.currentTarget.dataset.activo === 'true';
          try {
            await cambiarEstadoUsuario(id, activo);
            cargarUsuarios();
          } catch (err) {
            alertUsuarios('Error: ' + err.message, 'error');
          }
        });
      });
    } catch (err) {
      tbodyUsuarios.innerHTML = '<tr><td colspan="6" class="text-center text-red-400 py-8">Error al cargar usuarios.</td></tr>';
    }
  }

  container.querySelector('#form-nuevo-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = container.querySelector('#btn-agregar-usuario');
    btn.disabled = true;
    btn.textContent = 'Registrando...';
    try {
      await registrarUsuario(
        container.querySelector('#nuevo-correo').value,
        container.querySelector('#nuevo-dni').value,
        container.querySelector('#nuevo-nombre').value,
        container.querySelector('#nuevo-rol').value,
        container.querySelector('#nuevo-activo').value === 'true'
      );
      alertUsuarios('✅ Usuario registrado correctamente.');
      e.target.reset();
      cargarUsuarios();
    } catch (err) {
      alertUsuarios('❌ Error: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '✓ Registrar Usuario';
    }
  });

  cargarUsuarios();

  // ===================== EXPORTAR CSV =====================
  container.querySelector('#btn-exportar-csv').addEventListener('click', async () => {
    const btn = container.querySelector('#btn-exportar-csv');
    btn.disabled = true;
    btn.textContent = 'Exportando...';
    try {
      const entregas = await filtrarEntregas();
      if (!entregas.length) {
        alert("No hay entregas para exportar.");
        return;
      }
      const header = ["ID", "Fecha", "Insumo", "Pabellón", "Piso", "Cantidad", "Estado", "Encargado"];
      const rows = entregas.map(e => [
        e.id, e.fecha_registro, e.insumo, e.pabellon, e.piso || '', e.cantidad_total || '', e.estado, e.encargado?.nombre || ''
      ]);
      const csv = "data:text/csv;charset=utf-8," + header.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csv));
      link.setAttribute("download", `entregas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Error al exportar: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '📥 Descargar CSV';
    }
  });
}
