// Vista del Módulo Administrador
// Panel de Control y Configuración
// Según la especificación Spec_Driven_Development.md

import { filtrarEntregas, regularizarEntrega, actualizarEntrega } from "../services/entregas.service.js";
import {
  getCatalogosCompletos,
  agregarPabellon, actualizarPabellon, eliminarPabellon,
  agregarInsumo, eliminarInsumo,
  getStock, actualizarStock
} from "../services/catalogos.service.js";
import { obtenerTodosLosUsuarios, registrarUsuario, cambiarEstadoUsuario } from "../services/users.service.js";
import { getCurrentUser } from "../services/auth.service.js";

export function adminView() {
  const container = document.createElement("div");
  container.innerHTML = `
    <div class="mb-8">
      <h2 class="text-3xl font-extrabold text-slate-800" style="font-family:'Outfit',sans-serif;">Panel de Administrador</h2>
      <p class="text-slate-500 mt-1">Gestión de entregas, usuarios, catálogos y stock del sistema.</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <!-- TABS -->
      <div class="border-b border-slate-200 px-6 pt-4 overflow-x-auto">
        <nav class="flex gap-1 -mb-px min-w-max" id="admin-tabs">
          <button data-tab="regularizacion" class="tab-btn active px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-teal-600 text-teal-700 bg-teal-50 transition-all whitespace-nowrap">📋 Regularización</button>
          <button data-tab="usuarios"       class="tab-btn px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all whitespace-nowrap">👥 Usuarios</button>
          <button data-tab="catalogos"      class="tab-btn px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all whitespace-nowrap">📦 Catálogos &amp; Stock</button>
          <button data-tab="export"         class="tab-btn px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all whitespace-nowrap">📤 Exportar</button>
        </nav>
      </div>

      <!-- ===== TAB REGULARIZACIÓN ===== -->
      <div class="tab-panel p-6" id="tab-regularizacion">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Fecha Inicio</label>
            <input type="date" id="filtro-fecha-inicio" class="form-input text-sm"></div>
          <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Fecha Fin</label>
            <input type="date" id="filtro-fecha-fin" class="form-input text-sm"></div>
          <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Insumo</label>
            <select id="filtro-insumo" class="form-input text-sm"><option value="">Todos</option></select></div>
          <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Pabellón</label>
            <select id="filtro-pabellon" class="form-input text-sm"><option value="">Todos</option></select></div>
          <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Estado</label>
            <select id="filtro-estado" class="form-input text-sm">
              <option value="">Todos</option>
              <option value="POR_REGULARIZAR">Por Regularizar</option>
              <option value="REGULARIZADO">Regularizado</option>
            </select></div>
        </div>
        <div class="flex gap-3 mb-4">
          <button id="btn-filtrar" class="btn btn-primary text-sm">🔍 Filtrar</button>
          <button id="btn-limpiar-filtros" class="btn btn-secondary text-sm">✕ Limpiar</button>
        </div>
        <div class="table-responsive">
          <table>
            <thead><tr><th>Fecha</th><th>Insumo</th><th>Pabellón</th><th>Piso</th><th>Damas</th><th>Varones</th><th>Discap.</th><th>Total</th><th>Encargado</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody id="tbody-regularizacion"><tr><td colspan="11" class="text-center text-slate-400 py-8">Cargando...</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- ===== TAB USUARIOS ===== -->
      <div class="tab-panel p-6 hidden" id="tab-usuarios">
        <div id="alert-usuarios"></div>
        <div class="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-6">
          <h3 class="text-base font-bold text-slate-700 mb-4">➕ Nuevo Usuario</h3>
          <form id="form-nuevo-usuario">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Nombre Completo</label>
                <input type="text" id="nuevo-nombre" class="form-input" placeholder="Ej: Juan García" required></div>
              <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">DNI</label>
                <input type="text" id="nuevo-dni" class="form-input" maxlength="8" placeholder="Ej: 72947488" required></div>
              <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Correo Institucional</label>
                <input type="email" id="nuevo-correo" class="form-input" placeholder="usuario@continental.edu.pe" required></div>
              <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Rol</label>
                <select id="nuevo-rol" class="form-input"><option value="OPERADOR">Operador</option><option value="ADMIN">Administrador</option></select></div>
              <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Estado</label>
                <select id="nuevo-activo" class="form-input"><option value="true">Activo</option><option value="false">Inactivo</option></select></div>
            </div>
            <div class="mt-4"><button type="submit" id="btn-agregar-usuario" class="btn btn-primary text-sm">✓ Registrar Usuario</button></div>
          </form>
        </div>
        <div class="table-responsive">
          <table>
            <thead><tr><th>Nombre</th><th>DNI</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody id="tbody-usuarios"><tr><td colspan="6" class="text-center text-slate-400 py-8">Cargando...</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- ===== TAB CATÁLOGOS & STOCK ===== -->
      <div class="tab-panel p-6 hidden" id="tab-catalogos">
        <div id="alert-catalogos"></div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Pabellones -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-cyan-50 flex items-center gap-2">
              <span class="text-xl">🏛️</span><h3 class="font-bold text-slate-800 text-base">Pabellones</h3>
            </div>
            <div class="p-5">
              <form id="form-add-pabellon" class="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p class="text-xs font-semibold text-slate-500 uppercase mb-3">Agregar Pabellón</p>
                <div class="grid grid-cols-3 gap-2 mb-3">
                  <input type="text" id="pabellon-codigo" class="form-input text-sm" placeholder="Código (ej: N)" maxlength="4" required>
                  <input type="text" id="pabellon-nombre" class="form-input text-sm col-span-2" placeholder="Nombre (ej: Pabellón Norte)" required>
                </div>
                <div class="flex gap-2 items-center">
                  <input type="number" id="pabellon-pisos" class="form-input text-sm" placeholder="Max. pisos" min="1" max="20" required style="max-width:120px;">
                  <button type="submit" class="btn btn-primary text-sm" style="padding:0.6rem 1rem;">+ Agregar</button>
                </div>
              </form>
              <div id="lista-pabellones" class="space-y-2 max-h-96 overflow-y-auto pr-1">
                <div class="text-center text-slate-400 py-6 text-sm">Cargando...</div>
              </div>
            </div>
          </div>

          <!-- Insumos -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50 flex items-center gap-2">
              <span class="text-xl">🧴</span><h3 class="font-bold text-slate-800 text-base">Insumos</h3>
            </div>
            <div class="p-5">
              <form id="form-add-insumo" class="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p class="text-xs font-semibold text-slate-500 uppercase mb-3">Agregar Insumo</p>
                <div class="flex gap-2">
                  <input type="text" id="insumo-nombre" class="form-input text-sm" placeholder="Ej: PAPEL_HIGIENICO" required>
                  <button type="submit" class="btn btn-primary text-sm" style="padding:0.6rem 1rem;white-space:nowrap;">+ Agregar</button>
                </div>
                <p class="text-xs text-slate-400 mt-2">Use mayúsculas y guiones bajos</p>
              </form>
              <div id="lista-insumos" class="space-y-2 max-h-96 overflow-y-auto pr-1">
                <div class="text-center text-slate-400 py-6 text-sm">Cargando...</div>
              </div>
            </div>
          </div>

          <!-- Stock -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center gap-2">
              <span class="text-xl">📊</span><h3 class="font-bold text-slate-800 text-base">Stock de Insumos</h3>
            </div>
            <div class="p-5">
              <p class="text-xs text-slate-500 mb-4">Ingresa o ajusta el stock disponible. Se descuenta automáticamente al registrar entregas.</p>
              <div id="lista-stock" class="space-y-3">
                <div class="text-center text-slate-400 py-6 text-sm">Cargando...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== TAB EXPORTAR ===== -->
      <div class="tab-panel p-6 hidden" id="tab-export">
        <div id="alert-export"></div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Fecha Inicio</label>
            <input type="date" id="exp-fecha-inicio" class="form-input text-sm"></div>
          <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Fecha Fin</label>
            <input type="date" id="exp-fecha-fin" class="form-input text-sm"></div>
          <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Insumo</label>
            <select id="exp-insumo" class="form-input text-sm"><option value="">Todos</option></select></div>
          <div><label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Pabellón</label>
            <select id="exp-pabellon" class="form-input text-sm"><option value="">Todos</option></select></div>
        </div>
        <div class="flex gap-3 mb-6">
          <button id="btn-exp-filtrar" class="btn btn-primary text-sm">🔍 Buscar</button>
          <button id="btn-exp-excel" class="btn text-sm text-white font-semibold" style="background:#217346;">📥 Exportar Excel</button>
          <button id="btn-exp-pdf"   class="btn text-sm text-white font-semibold" style="background:#c0392b;">📄 Exportar PDF</button>
        </div>
        <div class="table-responsive" id="export-table-wrapper">
          <table id="tabla-export">
            <thead>
              <tr><th>Fecha</th><th>Insumo</th><th>Pabellón</th><th>Piso</th><th>Damas</th><th>Varones</th><th>Discap.</th><th>Total</th><th>Estado</th><th>Encargado</th></tr>
            </thead>
            <tbody id="tbody-export">
              <tr><td colspan="10" class="text-center text-slate-400 py-10">Aplica los filtros y presiona "Buscar" para ver los registros.</td></tr>
            </tbody>
          </table>
        </div>
        <p id="exp-count" class="text-xs text-slate-400 mt-3"></p>
      </div>
    </div>

    <!-- Modal Editar Pabellón -->
    <div id="modal-edit-pabellon" class="fixed inset-0 z-50 hidden items-center justify-center" style="background:rgba(15,23,42,0.55);">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-4">✏️ Editar Pabellón</h3>
        <div id="alert-modal-pabellon"></div>
        <input type="hidden" id="edit-pabellon-codigo-orig">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Código</label>
            <input type="text" id="edit-pabellon-codigo" class="form-input bg-slate-100 cursor-not-allowed" readonly>
            <p class="text-xs text-slate-400 mt-1">El código no se puede cambiar.</p>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Nombre</label>
            <input type="text" id="edit-pabellon-nombre" class="form-input" required>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Máx. Pisos</label>
            <input type="number" id="edit-pabellon-pisos" class="form-input" min="1" max="30" required style="max-width:120px;">
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="btn-confirmar-edit-pabellon" class="btn btn-primary flex-1">✓ Guardar</button>
          <button id="btn-cancelar-edit-pabellon"  class="btn btn-secondary flex-1">✕ Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Editar Insumo -->
    <div id="modal-edit-insumo" class="fixed inset-0 z-50 hidden items-center justify-center" style="background:rgba(15,23,42,0.55);">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-4">✏️ Editar Insumo</h3>
        <div id="alert-modal-insumo"></div>
        <input type="hidden" id="edit-insumo-orig">
        <div>
          <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Nombre del Insumo</label>
          <input type="text" id="edit-insumo-nombre" class="form-input" required>
          <p class="text-xs text-slate-400 mt-1">Use mayúsculas y guiones bajos (ej: PAPEL_HIGIENICO)</p>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="btn-confirmar-edit-insumo" class="btn btn-primary flex-1">✓ Guardar</button>
          <button id="btn-cancelar-edit-insumo"  class="btn btn-secondary flex-1">✕ Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Regularización -->
    <div id="modal-regularizar" class="fixed inset-0 z-50 hidden items-center justify-center" style="background:rgba(15,23,42,0.5);">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-4">⚙️ Regularizar Entrega</h3>
        <p class="text-sm text-slate-500 mb-4">Completa los datos que faltaron al momento del registro.</p>
        <div id="alert-modal-reg"></div>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Piso</label>
            <input type="number" id="reg-piso" class="form-input" placeholder="Ej: 3" min="1" style="max-width:120px;">
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div><label class="block text-xs text-slate-400 mb-1">👩 Damas</label><input type="number" id="reg-damas" class="form-input text-center" value="0" min="0"></div>
            <div><label class="block text-xs text-slate-400 mb-1">👨 Varones</label><input type="number" id="reg-varones" class="form-input text-center" value="0" min="0"></div>
            <div><label class="block text-xs text-slate-400 mb-1">♿ Discap.</label><input type="number" id="reg-discapacitado" class="form-input text-center" value="0" min="0"></div>
          </div>
          <div class="p-3 bg-teal-50 rounded-lg border border-teal-200 flex justify-between items-center">
            <span class="text-sm text-teal-600 font-semibold">Total calculado:</span>
            <span id="reg-total" class="text-2xl font-extrabold text-teal-700">0</span>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="btn-confirmar-reg" class="btn btn-primary flex-1">✓ Confirmar</button>
          <button id="btn-cancelar-reg"  class="btn btn-secondary flex-1">✕ Cancelar</button>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => initAdminView(container), 0);
  return container;
}

async function initAdminView(container) {
  // ====== TABS ======
  const tabBtns = container.querySelectorAll('.tab-btn');
  const tabPanels = container.querySelectorAll('.tab-panel');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => { b.classList.remove('active','border-teal-600','text-teal-700','bg-teal-50'); b.classList.add('border-transparent','text-slate-500'); });
      tabPanels.forEach(p => p.classList.add('hidden'));
      btn.classList.add('active','border-teal-600','text-teal-700','bg-teal-50');
      btn.classList.remove('border-transparent','text-slate-500');
      container.querySelector('#tab-' + btn.dataset.tab)?.classList.remove('hidden');
    });
  });

  let catalogos = { pabellones: [], insumos: [] };
  let stockData = {};
  let entregasExport = [];

  function showAlert(id, msg, type = 'success') {
    const div = container.querySelector(id);
    if (!div) return;
    div.innerHTML = `<div class="alert alert-${type} mb-4">${msg}</div>`;
    setTimeout(() => { div.innerHTML = ''; }, 5000);
  }

  function sincFiltros() {
    ['#filtro-pabellon','#exp-pabellon'].forEach(sel => {
      const s = container.querySelector(sel); if (!s) return;
      const v = s.value; s.innerHTML = '<option value="">Todos</option>';
      catalogos.pabellones.forEach(p => { const o = document.createElement('option'); o.value = p.codigo; o.textContent = p.nombre; s.appendChild(o); });
      s.value = v;
    });
    ['#filtro-insumo','#exp-insumo'].forEach(sel => {
      const s = container.querySelector(sel); if (!s) return;
      const v = s.value; s.innerHTML = '<option value="">Todos</option>';
      catalogos.insumos.forEach(i => { const o = document.createElement('option'); o.value = i; o.textContent = i.replace(/_/g,' '); s.appendChild(o); });
      s.value = v;
    });
  }

  // ====== HELPERS DE MODAL ======
  function abrirModal(id) { const m = container.querySelector(id); m.classList.remove('hidden'); m.style.display = 'flex'; }
  function cerrarModal(id) { const m = container.querySelector(id); m.classList.add('hidden'); m.style.display = ''; }

  // ====== PABELLONES ======
  function renderPabellones() {
    const ul = container.querySelector('#lista-pabellones');
    if (!catalogos.pabellones.length) { ul.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">Sin pabellones.</p>'; return; }
    ul.innerHTML = catalogos.pabellones.map(p => `
      <div class="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:border-teal-300 hover:bg-teal-50 transition-all">
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-8 h-8 shrink-0 rounded-lg text-xs font-bold text-white flex items-center justify-center" style="background:linear-gradient(135deg,#0d9488,#0f766e)">${p.codigo}</span>
          <div class="min-w-0">
            <p class="font-semibold text-slate-800 text-sm truncate">${p.nombre}</p>
            <p class="text-xs text-slate-400">Máx. ${p.max_pisos} pisos</p>
          </div>
        </div>
        <div class="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
          <button class="btn-edit-pab p-1.5 rounded-lg text-teal-600 hover:bg-teal-100 transition-colors" data-codigo="${p.codigo}" data-nombre="${p.nombre}" data-pisos="${p.max_pisos}" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button class="btn-del-pab p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" data-codigo="${p.codigo}" title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>`).join('');

    // Editar pabellón
    container.querySelectorAll('.btn-edit-pab').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelector('#edit-pabellon-codigo-orig').value = btn.dataset.codigo;
        container.querySelector('#edit-pabellon-codigo').value = btn.dataset.codigo;
        container.querySelector('#edit-pabellon-nombre').value = btn.dataset.nombre;
        container.querySelector('#edit-pabellon-pisos').value = btn.dataset.pisos;
        container.querySelector('#alert-modal-pabellon').innerHTML = '';
        abrirModal('#modal-edit-pabellon');
      });
    });

    // Eliminar pabellón
    container.querySelectorAll('.btn-del-pab').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`¿Eliminar pabellón "${btn.dataset.codigo}"?`)) return;
        try { await eliminarPabellon(btn.dataset.codigo); catalogos.pabellones = catalogos.pabellones.filter(p => p.codigo !== btn.dataset.codigo); renderPabellones(); sincFiltros(); showAlert('#alert-catalogos','✅ Pabellón eliminado.'); }
        catch(e) { showAlert('#alert-catalogos','❌ ' + e.message,'error'); }
      });
    });
  }

  // Confirmar edición pabellón
  container.querySelector('#btn-confirmar-edit-pabellon').addEventListener('click', async () => {
    const codigoOrig = container.querySelector('#edit-pabellon-codigo-orig').value;
    const nombre = container.querySelector('#edit-pabellon-nombre').value.trim();
    const pisos  = parseInt(container.querySelector('#edit-pabellon-pisos').value);
    if (!nombre || !pisos) { showAlert('#alert-modal-pabellon','⚠️ Completa todos los campos.','error'); return; }
    const btn = container.querySelector('#btn-confirmar-edit-pabellon');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      await actualizarPabellon(codigoOrig, nombre, pisos);
      const idx = catalogos.pabellones.findIndex(p => p.codigo === codigoOrig);
      if (idx !== -1) catalogos.pabellones[idx] = { codigo: codigoOrig, nombre, max_pisos: pisos };
      catalogos.pabellones.sort((a,b) => a.nombre.localeCompare(b.nombre));
      renderPabellones(); sincFiltros();
      cerrarModal('#modal-edit-pabellon');
      showAlert('#alert-catalogos',`✅ Pabellón "${nombre}" actualizado.`);
    } catch(e) { container.querySelector('#alert-modal-pabellon').innerHTML = `<div class="alert alert-error mb-3">❌ ${e.message}</div>`; }
    finally { btn.disabled = false; btn.textContent = '✓ Guardar'; }
  });
  container.querySelector('#btn-cancelar-edit-pabellon').addEventListener('click', () => cerrarModal('#modal-edit-pabellon'));

  // ====== INSUMOS ======
  function renderInsumos() {
    const ul = container.querySelector('#lista-insumos');
    if (!catalogos.insumos.length) { ul.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">Sin insumos.</p>'; return; }
    ul.innerHTML = catalogos.insumos.map(i => `
      <div class="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:border-violet-300 hover:bg-violet-50 transition-all">
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-8 h-8 shrink-0 rounded-lg text-xs font-bold text-white flex items-center justify-center" style="background:linear-gradient(135deg,#7c3aed,#6d28d9)">🧴</span>
          <p class="font-semibold text-slate-800 text-sm truncate" title="${i}">${i.replace(/_/g,' ')}</p>
        </div>
        <div class="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
          <button class="btn-edit-ins p-1.5 rounded-lg text-violet-600 hover:bg-violet-100 transition-colors" data-nombre="${i}" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button class="btn-del-ins p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" data-nombre="${i}" title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>`).join('');

    // Editar insumo
    container.querySelectorAll('.btn-edit-ins').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelector('#edit-insumo-orig').value = btn.dataset.nombre;
        container.querySelector('#edit-insumo-nombre').value = btn.dataset.nombre;
        container.querySelector('#alert-modal-insumo').innerHTML = '';
        abrirModal('#modal-edit-insumo');
      });
    });

    // Eliminar insumo
    container.querySelectorAll('.btn-del-ins').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`¿Eliminar insumo "${btn.dataset.nombre}"?`)) return;
        try { await eliminarInsumo(btn.dataset.nombre); catalogos.insumos = catalogos.insumos.filter(i => i !== btn.dataset.nombre); renderInsumos(); renderStock(); sincFiltros(); showAlert('#alert-catalogos','✅ Insumo eliminado.'); }
        catch(e) { showAlert('#alert-catalogos','❌ ' + e.message,'error'); }
      });
    });
  }

  // Confirmar edición insumo (rename: actualizar lista + stock key)
  container.querySelector('#btn-confirmar-edit-insumo').addEventListener('click', async () => {
    const orig = container.querySelector('#edit-insumo-orig').value;
    const nuevo = container.querySelector('#edit-insumo-nombre').value.trim().toUpperCase().replace(/ /g,'_');
    if (!nuevo) { container.querySelector('#alert-modal-insumo').innerHTML = `<div class="alert alert-error mb-3">⚠️ Ingresa un nombre.</div>`; return; }
    if (nuevo !== orig && catalogos.insumos.includes(nuevo)) { container.querySelector('#alert-modal-insumo').innerHTML = `<div class="alert alert-error mb-3">❌ Ya existe un insumo con ese nombre.</div>`; return; }
    const btn = container.querySelector('#btn-confirmar-edit-insumo');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      // Eliminar el original y agregar el nuevo
      await eliminarInsumo(orig);
      await agregarInsumo(nuevo);
      // Transferir el stock si había
      if (stockData[orig] !== undefined) {
        await actualizarStock(nuevo, stockData[orig]);
        await actualizarStock(orig, 0); // limpiar el viejo
        stockData[nuevo] = stockData[orig];
        delete stockData[orig];
      }
      const idx = catalogos.insumos.indexOf(orig);
      if (idx !== -1) catalogos.insumos[idx] = nuevo;
      else catalogos.insumos.push(nuevo);
      catalogos.insumos.sort();
      renderInsumos(); renderStock(); sincFiltros();
      cerrarModal('#modal-edit-insumo');
      showAlert('#alert-catalogos',`✅ Insumo renombrado a "${nuevo}".`);
    } catch(e) { container.querySelector('#alert-modal-insumo').innerHTML = `<div class="alert alert-error mb-3">❌ ${e.message}</div>`; }
    finally { btn.disabled = false; btn.textContent = '✓ Guardar'; }
  });
  container.querySelector('#btn-cancelar-edit-insumo').addEventListener('click', () => cerrarModal('#modal-edit-insumo'));

  // ====== STOCK ======
  function renderStock() {
    const div = container.querySelector('#lista-stock');
    if (!catalogos.insumos.length) { div.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">Agrega insumos primero.</p>'; return; }
    div.innerHTML = catalogos.insumos.map(i => {
      const cantidad = stockData[i] ?? 0;
      const bajo = cantidad <= 10;
      return `
      <div class="flex items-center gap-3 p-3 rounded-lg border transition-colors ${bajo ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-700 truncate">${i.replace(/_/g,' ')}</p>
          ${bajo ? '<p class="text-xs text-red-500 font-medium">⚠️ Stock bajo</p>' : ''}
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <input type="number" id="stock-${i}" class="form-input text-center w-24 text-sm font-bold" min="0" value="${cantidad}">
          <button class="btn-save-stock text-xs px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors" data-insumo="${i}">💾</button>
        </div>
      </div>`;
    }).join('');

    div.querySelectorAll('.btn-save-stock').forEach(btn => {
      btn.addEventListener('click', async () => {
        const insumo = btn.dataset.insumo;
        const cantidad = parseInt(container.querySelector(`#stock-${insumo}`).value) || 0;
        btn.disabled = true; btn.textContent = '...';
        try { await actualizarStock(insumo, cantidad); stockData[insumo] = cantidad; renderStock(); showAlert('#alert-catalogos',`✅ Stock de "${insumo.replace(/_/g,' ')}" ajustado a ${cantidad} unidades.`); }
        catch(e) { showAlert('#alert-catalogos','❌ ' + e.message,'error'); }
        finally { btn.disabled = false; btn.textContent = '💾'; }
      });
    });
  }

  // ====== CARGAR DATOS INICIALES ======
  try {
    [catalogos, stockData] = await Promise.all([getCatalogosCompletos(), getStock()]);
    sincFiltros(); renderPabellones(); renderInsumos(); renderStock();
  } catch(err) { console.error("Error cargando catálogos:", err); }

  // Agregar pabellón
  container.querySelector('#form-add-pabellon').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const codigo = container.querySelector('#pabellon-codigo').value.trim().toUpperCase();
    const nombre = container.querySelector('#pabellon-nombre').value.trim();
    const max_pisos = parseInt(container.querySelector('#pabellon-pisos').value);
    btn.disabled = true; btn.textContent = '...';
    try { const n = await agregarPabellon(codigo, nombre, max_pisos); catalogos.pabellones.push(n); catalogos.pabellones.sort((a,b)=>a.nombre.localeCompare(b.nombre)); renderPabellones(); sincFiltros(); e.target.reset(); showAlert('#alert-catalogos',`✅ Pabellón "${nombre}" agregado.`); }
    catch(e) { showAlert('#alert-catalogos','❌ ' + e.message,'error'); }
    finally { btn.disabled = false; btn.textContent = '+ Agregar'; }
  });

  // Agregar insumo
  container.querySelector('#form-add-insumo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const nombre = container.querySelector('#insumo-nombre').value.trim().toUpperCase().replace(/ /g,'_');
    btn.disabled = true; btn.textContent = '...';
    try { await agregarInsumo(nombre); catalogos.insumos.push(nombre); catalogos.insumos.sort(); renderInsumos(); renderStock(); sincFiltros(); e.target.reset(); showAlert('#alert-catalogos',`✅ Insumo "${nombre}" agregado.`); }
    catch(e) { showAlert('#alert-catalogos','❌ ' + e.message,'error'); }
    finally { btn.disabled = false; btn.textContent = '+ Agregar'; }
  });

  // ====== REGULARIZACIÓN ======
  const tbodyReg = container.querySelector('#tbody-regularizacion');
  let entregaIdPendiente = null;
  const regDamas = container.querySelector('#reg-damas');
  const regVarones = container.querySelector('#reg-varones');
  const regDisc = container.querySelector('#reg-discapacitado');
  const regTotal = container.querySelector('#reg-total');

  function actualizarTotalModal() { regTotal.textContent = (parseInt(regDamas.value)||0)+(parseInt(regVarones.value)||0)+(parseInt(regDisc.value)||0); }
  [regDamas,regVarones,regDisc].forEach(i => i.addEventListener('input', actualizarTotalModal));

  function abrirModalReg(id) { entregaIdPendiente = id; container.querySelector('#modal-regularizar').style.display='flex'; container.querySelector('#modal-regularizar').classList.remove('hidden'); container.querySelector('#reg-piso').value=''; regDamas.value=0; regVarones.value=0; regDisc.value=0; actualizarTotalModal(); container.querySelector('#alert-modal-reg').innerHTML=''; }
  function cerrarModalReg() { container.querySelector('#modal-regularizar').style.display=''; container.querySelector('#modal-regularizar').classList.add('hidden'); entregaIdPendiente=null; }

  container.querySelector('#btn-cancelar-reg').addEventListener('click', cerrarModalReg);
  container.querySelector('#btn-confirmar-reg').addEventListener('click', async () => {
    if (!entregaIdPendiente) return;
    const piso = parseInt(container.querySelector('#reg-piso').value)||null;
    const d=parseInt(regDamas.value)||0, v=parseInt(regVarones.value)||0, dc=parseInt(regDisc.value)||0;
    const btn = container.querySelector('#btn-confirmar-reg');
    btn.disabled=true; btn.textContent='Guardando...';
    try {
      const user = await getCurrentUser();
      await regularizarEntrega(entregaIdPendiente, piso, d, v, dc, user.uid);
      cerrarModalReg(); cargarEntregas(getFiltros());
    } catch(err) { container.querySelector('#alert-modal-reg').innerHTML=`<div class="alert alert-error mb-3">❌ ${err.message}</div>`; }
    finally { btn.disabled=false; btn.textContent='✓ Confirmar'; }
  });

  async function cargarEntregas(filtros={}) {
    tbodyReg.innerHTML='<tr><td colspan="11" class="text-center text-slate-400 py-8">Cargando...</td></tr>';
    try {
      const entregas = await filtrarEntregas(filtros.fechaInicio, filtros.fechaFin, filtros.insumo, filtros.pabellon, filtros.estado);
      tbodyReg.innerHTML='';
      if (!entregas.length) { tbodyReg.innerHTML='<tr><td colspan="11" class="text-center text-slate-400 py-8">No hay entregas.</td></tr>'; return; }
      entregas.forEach(e => {
        const esReg=e.estado==='REGULARIZADO'; const det=e.detalle_banos||{};
        const tr=document.createElement('tr');
        tr.innerHTML=`
          <td class="text-sm">${e.fecha_registro}</td>
          <td class="text-sm font-medium">${(e.insumo||'').replace(/_/g,' ')}</td>
          <td class="text-sm">${e.pabellon||'-'}</td>
          <td class="text-sm text-center">${e.piso??'-'}</td>
          <td class="text-sm text-center">${det.damas??'-'}</td>
          <td class="text-sm text-center">${det.varones??'-'}</td>
          <td class="text-sm text-center">${det.discapacitado??'-'}</td>
          <td class="text-sm text-center font-bold">${e.cantidad_total??'-'}</td>
          <td class="text-sm">${e.encargado?.nombre||'-'}</td>
          <td><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${esReg?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}">${esReg?'✓ Reg.':'⏳ Pend.'}</span></td>
          <td>${!esReg?`<button class="btn-reg text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold" data-id="${e.id}">Regularizar</button>`:'<span class="text-slate-300 text-xs">—</span>'}</td>`;
        tbodyReg.appendChild(tr);
      });
      container.querySelectorAll('.btn-reg').forEach(btn => btn.addEventListener('click', () => abrirModalReg(btn.dataset.id)));
    } catch(err) { tbodyReg.innerHTML='<tr><td colspan="11" class="text-center text-red-400 py-8">Error al cargar.</td></tr>'; }
  }

  function getFiltros() {
    return {
      fechaInicio: container.querySelector('#filtro-fecha-inicio').value||null,
      fechaFin:    container.querySelector('#filtro-fecha-fin').value||null,
      insumo:      container.querySelector('#filtro-insumo').value||null,
      pabellon:    container.querySelector('#filtro-pabellon').value||null,
      estado:      container.querySelector('#filtro-estado').value||null
    };
  }
  container.querySelector('#btn-filtrar').addEventListener('click', () => cargarEntregas(getFiltros()));
  container.querySelector('#btn-limpiar-filtros').addEventListener('click', () => {
    ['#filtro-fecha-inicio','#filtro-fecha-fin','#filtro-insumo','#filtro-pabellon','#filtro-estado'].forEach(s => { container.querySelector(s).value=''; });
    cargarEntregas();
  });
  cargarEntregas();

  // ====== USUARIOS ======
  const tbodyUsers = container.querySelector('#tbody-usuarios');
  async function cargarUsuarios() {
    tbodyUsers.innerHTML='<tr><td colspan="6" class="text-center text-slate-400 py-8">Cargando...</td></tr>';
    try {
      const usuarios = await obtenerTodosLosUsuarios();
      tbodyUsers.innerHTML='';
      usuarios.forEach(u => {
        const tr=document.createElement('tr');
        tr.innerHTML=`
          <td class="font-medium text-slate-800">${u.nombre_completo}</td>
          <td class="font-mono text-sm">${u.dni}</td>
          <td class="text-sm text-slate-500">${u.correo}</td>
          <td><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${u.rol==='ADMIN'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}">${u.rol}</span></td>
          <td><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${u.activo?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}">${u.activo?'● Activo':'○ Inactivo'}</span></td>
          <td><button class="btn-toggle text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${u.activo?'bg-red-50 text-red-600 hover:bg-red-100':'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}" data-id="${u.id}" data-activo="${!u.activo}">${u.activo?'Desactivar':'Activar'}</button></td>`;
        tbodyUsers.appendChild(tr);
      });
      container.querySelectorAll('.btn-toggle').forEach(btn => {
        btn.addEventListener('click', async () => {
          try { await cambiarEstadoUsuario(btn.dataset.id, btn.dataset.activo==='true'); cargarUsuarios(); }
          catch(err) { showAlert('#alert-usuarios','❌ '+err.message,'error'); }
        });
      });
    } catch(e) { tbodyUsers.innerHTML='<tr><td colspan="6" class="text-center text-red-400 py-8">Error.</td></tr>'; }
  }
  container.querySelector('#form-nuevo-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn=container.querySelector('#btn-agregar-usuario');
    btn.disabled=true; btn.textContent='Registrando...';
    try {
      await registrarUsuario(container.querySelector('#nuevo-correo').value, container.querySelector('#nuevo-dni').value, container.querySelector('#nuevo-nombre').value, container.querySelector('#nuevo-rol').value, container.querySelector('#nuevo-activo').value==='true');
      showAlert('#alert-usuarios','✅ Usuario registrado.'); e.target.reset(); cargarUsuarios();
    } catch(err) { showAlert('#alert-usuarios','❌ '+err.message,'error'); }
    finally { btn.disabled=false; btn.textContent='✓ Registrar Usuario'; }
  });
  cargarUsuarios();

  // ====== EXPORTAR ======
  async function cargarExport() {
    const tbody=container.querySelector('#tbody-export');
    tbody.innerHTML='<tr><td colspan="10" class="text-center text-slate-400 py-8">Cargando...</td></tr>';
    const filtros={ fechaInicio:container.querySelector('#exp-fecha-inicio').value||null, fechaFin:container.querySelector('#exp-fecha-fin').value||null, insumo:container.querySelector('#exp-insumo').value||null, pabellon:container.querySelector('#exp-pabellon').value||null };
    try {
      entregasExport=await filtrarEntregas(filtros.fechaInicio,filtros.fechaFin,filtros.insumo,filtros.pabellon);
      tbody.innerHTML='';
      if (!entregasExport.length) { tbody.innerHTML='<tr><td colspan="10" class="text-center text-slate-400 py-8">Sin resultados.</td></tr>'; container.querySelector('#exp-count').textContent=''; return; }
      entregasExport.forEach(e => {
        const det=e.detalle_banos||{};
        const tr=document.createElement('tr');
        tr.innerHTML=`<td class="text-sm">${e.fecha_registro}</td><td class="text-sm font-medium">${(e.insumo||'').replace(/_/g,' ')}</td><td class="text-sm">${e.pabellon||'-'}</td><td class="text-sm text-center">${e.piso??'-'}</td><td class="text-sm text-center">${det.damas??0}</td><td class="text-sm text-center">${det.varones??0}</td><td class="text-sm text-center">${det.discapacitado??0}</td><td class="text-sm text-center font-bold">${e.cantidad_total??0}</td><td><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${e.estado==='REGULARIZADO'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}">${e.estado}</span></td><td class="text-sm">${e.encargado?.nombre||'-'}</td>`;
        tbody.appendChild(tr);
      });
      container.querySelector('#exp-count').textContent=`${entregasExport.length} registro(s) encontrado(s).`;
    } catch(err) { tbody.innerHTML='<tr><td colspan="10" class="text-center text-red-400 py-8">Error al cargar.</td></tr>'; }
  }
  container.querySelector('#btn-exp-filtrar').addEventListener('click', cargarExport);

  container.querySelector('#btn-exp-excel').addEventListener('click', () => {
    if (!entregasExport.length) return alert('Primero realiza una búsqueda.');
    const header=['FECHA','INSUMO','PABELLON','PISO','DAMAS','VARONES','DISCAPACITADO','TOTAL','ESTADO','ENCARGADO'];
    const rows=entregasExport.map(e => { const det=e.detalle_banos||{}; return [e.fecha_registro,e.insumo,e.pabellon,e.piso??'',det.damas??0,det.varones??0,det.discapacitado??0,e.cantidad_total??0,e.estado,e.encargado?.nombre||'']; });
    const csv='\uFEFF'+[header,...rows].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`entregas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  });

  container.querySelector('#btn-exp-pdf').addEventListener('click', () => {
    if (!entregasExport.length) return alert('Primero realiza una búsqueda.');
    const filas=entregasExport.map(e => { const det=e.detalle_banos||{}; return `<tr><td>${e.fecha_registro}</td><td>${(e.insumo||'').replace(/_/g,' ')}</td><td>${e.pabellon||'-'}</td><td>${e.piso??'-'}</td><td>${det.damas??0}</td><td>${det.varones??0}</td><td>${det.discapacitado??0}</td><td><b>${e.cantidad_total??0}</b></td><td>${e.estado}</td><td>${e.encargado?.nombre||'-'}</td></tr>`; }).join('');
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte de Entregas</title><style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px}h2{color:#0d9488}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:5px 8px;text-align:center}th{background:#0d9488;color:#fff}tr:nth-child(even){background:#f8fafc}</style></head><body><h2>Reporte de Entregas — PAB-IN</h2><p>Generado el ${new Date().toLocaleString('es-PE')}</p><table><thead><tr><th>FECHA</th><th>INSUMO</th><th>PABELLÓN</th><th>PISO</th><th>DAMAS</th><th>VARONES</th><th>DISCAP.</th><th>TOTAL</th><th>ESTADO</th><th>ENCARGADO</th></tr></thead><tbody>${filas}</tbody></table></body></html>`;
    const w=window.open('','_blank','width=1100,height=700'); w.document.write(html); w.document.close(); setTimeout(()=>{ w.focus(); w.print(); },500);
  });
}
