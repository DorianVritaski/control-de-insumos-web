// Vista del Módulo Operador
// Formulario de Registro de Entregas + Historial + Edición
// Según la especificación Spec_Driven_Development.md - Sección 6.2, RF-02

import { registrarEntrega, obtenerEntregasDelDia, obtenerEntregasDelOperador, actualizarEntrega } from "../services/entregas.service.js";
import { getPabellones, getInsumos } from "../services/catalogos.service.js";
import { isAuthenticated, getCurrentUser } from "../services/auth.service.js";

export function operadorView() {
  const container = document.createElement("div");

  container.innerHTML = `
    <!-- Header con tabs -->
    <div class="mb-6">
      <h2 class="text-3xl font-extrabold text-slate-800" style="font-family:'Outfit',sans-serif;">Portal Operador</h2>
      <p class="text-slate-500 mt-1">Registra y gestiona tus entregas de insumos.</p>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="border-b border-slate-200 px-6 pt-4">
        <nav class="flex gap-1 -mb-px">
          <button data-tab="registro" class="op-tab-btn active px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-teal-600 text-teal-700 bg-teal-50 transition-all whitespace-nowrap">📦 Registrar Entrega</button>
          <button data-tab="historial" class="op-tab-btn px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all whitespace-nowrap">📋 Mis Registros</button>
        </nav>
      </div>

      <!-- ===== TAB REGISTRO ===== -->
      <div class="op-tab-panel p-6" id="op-tab-registro">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Formulario Principal -->
          <div class="lg:col-span-2 space-y-5">
            <div id="alert-container"></div>
            <form id="registro-form" class="space-y-5">

              <!-- Insumo + Pabellón -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Tipo de Insumo *</label>
                  <select id="insumo" class="form-input" required>
                    <option value="">Cargando...</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Pabellón *</label>
                  <select id="pabellon" class="form-input" required>
                    <option value="">Cargando...</option>
                  </select>
                </div>
              </div>

              <!-- Piso -->
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Piso <span class="normal-case text-slate-400">(opcional)</span></label>
                <input type="number" id="piso" class="form-input" placeholder="Ej: 3" min="1" max="99" style="max-width:180px;">
              </div>

              <!-- Distribución -->
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Distribución por baños</label>
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">👩 Damas</label>
                    <input type="number" id="damas" class="form-input text-center" placeholder="0" min="0" value="0">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">👨 Varones</label>
                    <input type="number" id="varones" class="form-input text-center" placeholder="0" min="0" value="0">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1">♿ Discapacitado</label>
                    <input type="number" id="discapacitado" class="form-input text-center" placeholder="0" min="0" value="0">
                  </div>
                </div>
              </div>

              <!-- Total (editable manualmente) -->
              <div class="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex-1">
                    <label class="block text-xs font-semibold text-teal-600 uppercase tracking-wider" for="cantidadTotal">Total de Unidades *</label>
                    <p id="hint-total" class="text-xs text-teal-500 mt-0.5">Se calcula automáticamente o ingrésalo tú</p>
                  </div>
                  <input type="number" id="cantidadTotal" class="form-input text-center font-extrabold text-teal-700 font-mono" style="font-size:1.6rem;width:110px;padding:0.4rem 0.5rem;border:2px solid #0d9488;background:#f0fdfa;" min="0" value="0" placeholder="0" required>
                </div>
                <p id="alerta-desglose" class="text-xs mt-2 hidden"></p>
              </div>

              <!-- Encargado -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Encargado</label>
                  <input type="text" id="encargado" class="form-input bg-slate-50" readonly>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">DNI</label>
                  <input type="text" id="encargadoDni" class="form-input bg-slate-50" readonly>
                </div>
              </div>

              <!-- Observaciones -->
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Observaciones <span class="normal-case text-slate-400">(opcional)</span></label>
                <textarea id="observaciones" class="form-input" rows="2" placeholder="Notas adicionales..."></textarea>
              </div>

              <button type="submit" id="btn-registrar" class="btn btn-primary w-full" style="padding:1rem;font-size:1rem;" disabled>
                ✓ Registrar Entrega
              </button>
            </form>
          </div>

          <!-- Panel lateral -->
          <div class="flex flex-col gap-4">
            <!-- Info operador -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="px-5 py-4 border-b border-slate-100" style="background:linear-gradient(135deg,#334155,#1e293b);">
                <h4 class="font-bold text-white text-sm">👤 Resumen del Día</h4>
              </div>
              <div class="p-5 space-y-4">
                <div>
                  <p class="text-xs text-slate-400 uppercase font-semibold">Operador</p>
                  <p class="text-lg font-bold text-slate-800 mt-0.5">Hola, <span id="operador-nombre" class="text-teal-700">...</span>!</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400 uppercase font-semibold">Fecha</p>
                  <p class="text-sm text-slate-600 mt-0.5" id="fecha-actual">...</p>
                </div>
                <div class="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
                  <div class="p-3 bg-teal-50 rounded-xl text-center">
                    <p class="text-2xl font-extrabold text-teal-700" id="entregas-contador">0</p>
                    <p class="text-xs text-teal-600 font-medium mt-0.5">Entregas hoy</p>
                  </div>
                  <div class="p-3 bg-emerald-50 rounded-xl text-center">
                    <p class="text-sm font-bold text-emerald-700 mt-1" id="operador-estado">...</p>
                    <p class="text-xs text-emerald-600 font-medium mt-0.5">Estado</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Historial rápido del día -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="px-5 py-4 border-b border-slate-100">
                <h4 class="font-bold text-slate-700 text-sm">🕐 Últimas de Hoy</h4>
              </div>
              <div id="historial-reciente" class="p-5">
                <p class="text-xs text-slate-400 text-center py-2">Cargando...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== TAB MIS REGISTROS ===== -->
      <div class="op-tab-panel p-6 hidden" id="op-tab-historial">
        <div id="alert-historial"></div>

        <!-- Filtros rápidos -->
        <div class="flex flex-wrap gap-3 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Fecha</label>
            <input type="date" id="hist-fecha" class="form-input text-sm">
          </div>
          <div class="flex items-end">
            <button id="btn-hist-filtrar" class="btn btn-primary text-sm">🔍 Filtrar</button>
          </div>
          <div class="flex items-end">
            <button id="btn-hist-todos" class="btn btn-secondary text-sm">Ver todos</button>
          </div>
        </div>

        <!-- Tabla de registros -->
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Insumo</th><th>Pabellón</th><th>Piso</th>
                <th>Damas</th><th>Varones</th><th>Discap.</th><th>Total</th>
                <th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tbody-historial">
              <tr><td colspan="10" class="text-center text-slate-400 py-8">Cargando registros...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Edición -->
    <div id="modal-editar" class="fixed inset-0 z-50 hidden items-center justify-center" style="background:rgba(15,23,42,0.5);">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-screen overflow-y-auto">
        <h3 class="text-lg font-bold text-slate-800 mb-1">✏️ Editar Registro</h3>
        <p class="text-xs text-slate-400 mb-4">Solo puedes editar registros del día actual.</p>
        <div id="alert-modal-edit"></div>
        <div class="space-y-4">
          <input type="hidden" id="edit-id">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Insumo</label>
              <select id="edit-insumo" class="form-input text-sm"></select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Pabellón</label>
              <select id="edit-pabellon" class="form-input text-sm"></select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Piso</label>
            <input type="number" id="edit-piso" class="form-input" min="1" style="max-width:120px;">
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div><label class="block text-xs text-slate-400 mb-1">👩 Damas</label><input type="number" id="edit-damas" class="form-input text-center" min="0" value="0"></div>
            <div><label class="block text-xs text-slate-400 mb-1">👨 Varones</label><input type="number" id="edit-varones" class="form-input text-center" min="0" value="0"></div>
            <div><label class="block text-xs text-slate-400 mb-1">♿ Discap.</label><input type="number" id="edit-discapacitado" class="form-input text-center" min="0" value="0"></div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Observaciones</label>
            <textarea id="edit-observaciones" class="form-input" rows="2"></textarea>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="btn-confirmar-edit" class="btn btn-primary flex-1">✓ Guardar Cambios</button>
          <button id="btn-cancelar-edit"  class="btn btn-secondary flex-1">✕ Cancelar</button>
        </div>
      </div>
    </div>
  `;

  async function initView() {
    // ====== TABS ======
    const tabBtns = container.querySelectorAll('.op-tab-btn');
    const tabPanels = container.querySelectorAll('.op-tab-panel');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => { b.classList.remove('active','border-teal-600','text-teal-700','bg-teal-50'); b.classList.add('border-transparent','text-slate-500'); });
        tabPanels.forEach(p => p.classList.add('hidden'));
        btn.classList.add('active','border-teal-600','text-teal-700','bg-teal-50');
        btn.classList.remove('border-transparent','text-slate-500');
        container.querySelector('#op-tab-' + btn.dataset.tab)?.classList.remove('hidden');
        if (btn.dataset.tab === 'historial') cargarHistorial();
      });
    });

    // ====== ELEMENTOS DEL FORMULARIO ======
    const insumoSel    = container.querySelector("#insumo");
    const pabellonSel  = container.querySelector("#pabellon");
    const piso         = container.querySelector("#piso");
    const damas        = container.querySelector("#damas");
    const varones      = container.querySelector("#varones");
    const discapacitado= container.querySelector("#discapacitado");
    const encargado    = container.querySelector("#encargado");
    const encargadoDni = container.querySelector("#encargadoDni");
    const btnRegistrar = container.querySelector("#btn-registrar");
    const alertContainer= container.querySelector("#alert-container");

    let currentUser = null;
    let pabellanesData = [];
    let insumosData = [];

    // ====== CARGAR CATÁLOGOS ======
    async function cargarCatalogos() {
      try {
        [pabellanesData, insumosData] = await Promise.all([getPabellones(), getInsumos()]);
        pabellonSel.innerHTML = '<option value="">Seleccione pabellón...</option>';
        pabellanesData.forEach(p => {
          const o = document.createElement("option"); o.value = p.codigo; o.textContent = `${p.nombre} (Máx: ${p.max_pisos} pisos)`; pabellonSel.appendChild(o);
        });
        insumoSel.innerHTML = '<option value="">Seleccione insumo...</option>';
        insumosData.forEach(i => {
          const o = document.createElement("option"); o.value = i; o.textContent = i.replace(/_/g,' '); insumoSel.appendChild(o);
        });
        // Rellenar modal de edición
        const editInsumo = container.querySelector('#edit-insumo');
        const editPabellon = container.querySelector('#edit-pabellon');
        editInsumo.innerHTML = insumosData.map(i => `<option value="${i}">${i.replace(/_/g,' ')}</option>`).join('');
        editPabellon.innerHTML = pabellanesData.map(p => `<option value="${p.codigo}">${p.nombre}</option>`).join('');
      } catch (e) {
        alertContainer.innerHTML = `<div class="alert alert-error">Error al cargar catálogos: ${e.message}</div>`;
      }
    }

    // ====== CÁlCULO / VALIDACIÓN TOTAL ======
    const cantTotalInput = container.querySelector("#cantidadTotal");
    const alertaDesglose = container.querySelector("#alerta-desglose");
    let totalEditadoManualmente = false; // flag para saber si el usuario tocó el total

    function validarDesglose() {
      const d = parseInt(damas.value)||0, v = parseInt(varones.value)||0, dc = parseInt(discapacitado.value)||0;
      const suma = d + v + dc;
      const totalIngresado = parseInt(cantTotalInput.value)||0;

      if (suma > 0 && suma !== totalIngresado) {
        alertaDesglose.className = 'text-xs mt-2 text-amber-600 font-medium';
        alertaDesglose.textContent = `⚠️ La suma del desglose (${suma}) no coincide con el total (${totalIngresado}). Se guardará como POR_REGULARIZAR.`;
      } else if (suma > 0 && suma === totalIngresado) {
        alertaDesglose.className = 'text-xs mt-2 text-emerald-600 font-medium';
        alertaDesglose.textContent = `✓ El desglose coincide con el total. Se guardará como REGULARIZADO.`;
      } else {
        alertaDesglose.className = 'text-xs mt-2 hidden';
        alertaDesglose.textContent = '';
      }
    }

    function actualizarTotal() {
      const d = parseInt(damas.value)||0, v = parseInt(varones.value)||0, dc = parseInt(discapacitado.value)||0;
      const suma = d + v + dc;
      // Auto-rellenar el total solo si el usuario NO lo ha editado manualmente
      if (!totalEditadoManualmente && suma > 0) cantTotalInput.value = suma;
      validarDesglose();
      const totalOk = (parseInt(cantTotalInput.value)||0) > 0;
      btnRegistrar.disabled = !(insumoSel.value && pabellonSel.value && encargado.value.trim() && totalOk);
    }

    // El usuario edita el total manualmente → marcar flag
    cantTotalInput.addEventListener('input', () => {
      totalEditadoManualmente = true;
      validarDesglose();
      const totalOk = (parseInt(cantTotalInput.value)||0) > 0;
      btnRegistrar.disabled = !(insumoSel.value && pabellonSel.value && encargado.value.trim() && totalOk);
    });

    [damas, varones, discapacitado, insumoSel, pabellonSel].forEach(el => { el.addEventListener('input', actualizarTotal); el.addEventListener('change', actualizarTotal); });

    // ====== CARGAR DATOS OPERADOR ======
    async function renderHistorialRapido(uid) {
      const div = container.querySelector("#historial-reciente");
      try {
        const entregas = await obtenerEntregasDelDia(uid);
        container.querySelector("#entregas-contador").textContent = entregas.length;
        if (!entregas.length) { div.innerHTML = '<p class="text-xs text-slate-400 text-center py-2">Sin entregas hoy.</p>'; return; }
        div.innerHTML = entregas.slice(0,4).map(e => `
          <div class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-teal-700 bg-teal-50 shrink-0">${e.pabellon||'?'}</div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-slate-700 truncate">${(e.insumo||'').replace(/_/g,' ')}</p>
              <p class="text-xs text-slate-400">${e.piso?'Piso '+e.piso:'Sin piso'} · ${e.cantidad_total??0} u.</p>
            </div>
          </div>`).join('');
      } catch(e) { div.innerHTML = '<p class="text-xs text-red-400 text-center py-2">Error.</p>'; }
    }

    if (isAuthenticated()) {
      try {
        currentUser = await getCurrentUser();
        encargado.value = currentUser.nombre_completo || "Operador";
        encargadoDni.value = currentUser.dni || '';
        container.querySelector("#operador-nombre").textContent = (currentUser.nombre_completo||'').split(' ')[0];
        container.querySelector("#operador-estado").textContent = currentUser.activo ? "✅ Activo" : "❌ Inactivo";
        const fecha = new Date();
        const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
        const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
        container.querySelector("#fecha-actual").textContent = `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
        await renderHistorialRapido(currentUser.uid);
      } catch(e) { console.error("Error al cargar usuario:", e); }
    }

    await cargarCatalogos();
    actualizarTotal();

    // ====== REGISTRAR ENTREGA ======
    container.querySelector("#registro-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = parseInt(damas.value)||0, v = parseInt(varones.value)||0, dc = parseInt(discapacitado.value)||0;
      const totalManual = parseInt(cantTotalInput.value)||0;

      const errores = [];
      if (!insumoSel.value)   errores.push("Seleccione un tipo de insumo.");
      if (!pabellonSel.value) errores.push("Seleccione un pabellón.");
      if (!piso.value)        errores.push("Ingrese el piso.");
      if (totalManual <= 0)   errores.push("El total de unidades debe ser mayor a 0.");
      if (errores.length) { alertContainer.innerHTML = `<div class="alert alert-error">${errores.map(x=>'• '+x).join('<br>')}</div>`; return; }

      btnRegistrar.disabled = true; btnRegistrar.textContent = "Registrando...";
      try {
        const uid = currentUser?.uid || null;
        // Nueva firma: (..., cantidadTotalManual, encargado, dni, uid, obs)
        const result = await registrarEntrega(
          insumoSel.value, pabellonSel.value, piso.value,
          d, v, dc, totalManual,
          encargado.value, encargadoDni.value, uid,
          container.querySelector("#observaciones").value.trim()||null
        );
        const esRegularizado = result.estado === 'REGULARIZADO';
        alertContainer.innerHTML = `<div class="alert alert-${esRegularizado?'success':'info'}">
          ${esRegularizado ? '✅' : '📋'} Entrega registrada como <strong>${result.estado}</strong> (ID: ${result.id}).
        </div>`;
        setTimeout(() => { alertContainer.innerHTML = ''; }, 6000);
        container.querySelector("#registro-form").reset();
        damas.value='0'; varones.value='0'; discapacitado.value='0'; cantTotalInput.value='0';
        totalEditadoManualmente = false;
        alertaDesglose.className = 'text-xs mt-2 hidden'; alertaDesglose.textContent = '';
        actualizarTotal();
        if (currentUser) await renderHistorialRapido(currentUser.uid);
      } catch(error) {
        alertContainer.innerHTML = `<div class="alert alert-error">❌ Error: ${error.message}</div>`;
      } finally { btnRegistrar.disabled = false; btnRegistrar.textContent = "✓ Registrar Entrega"; actualizarTotal(); }
    });

    // ====== HISTORIAL COMPLETO ======
    const hoy = new Date().toISOString().split('T')[0];

    async function cargarHistorial(fechaFiltro = null) {
      const tbody = container.querySelector('#tbody-historial');
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-slate-400 py-8">Cargando...</td></tr>';
      try {
        if (!currentUser) return;
        let entregas = await obtenerEntregasDelOperador(currentUser.uid);
        if (fechaFiltro) entregas = entregas.filter(e => e.fecha_registro === fechaFiltro);
        tbody.innerHTML = '';
        if (!entregas.length) { tbody.innerHTML = '<tr><td colspan="10" class="text-center text-slate-400 py-8">Sin registros.</td></tr>'; return; }
        entregas.forEach(e => {
          const det = e.detalle_banos || {};
          const esHoy = e.fecha_registro === hoy;
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="text-sm">${e.fecha_registro}</td>
            <td class="text-sm font-medium">${(e.insumo||'').replace(/_/g,' ')}</td>
            <td class="text-sm">${e.pabellon||'-'}</td>
            <td class="text-sm text-center">${e.piso??'-'}</td>
            <td class="text-sm text-center">${det.damas??0}</td>
            <td class="text-sm text-center">${det.varones??0}</td>
            <td class="text-sm text-center">${det.discapacitado??0}</td>
            <td class="text-sm text-center font-bold">${e.cantidad_total??0}</td>
            <td><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${e.estado==='REGULARIZADO'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}">${e.estado==='REGULARIZADO'?'✓ Regular.':'⏳ Pend.'}</span></td>
            <td>${esHoy ? `<button class="btn-editar text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold" data-id="${e.id}">✏️ Editar</button>` : '<span class="text-slate-300 text-xs">—</span>'}</td>`;
          tbody.appendChild(tr);
        });
        container.querySelectorAll('.btn-editar').forEach(btn => {
          btn.addEventListener('click', () => {
            const entrega = entregas.find(x => x.id === btn.dataset.id);
            if (entrega) abrirModalEditar(entrega);
          });
        });
      } catch(err) { tbody.innerHTML = '<tr><td colspan="10" class="text-center text-red-400 py-8">Error al cargar.</td></tr>'; }
    }

    container.querySelector('#btn-hist-filtrar').addEventListener('click', () => {
      const fecha = container.querySelector('#hist-fecha').value;
      cargarHistorial(fecha || null);
    });
    container.querySelector('#btn-hist-todos').addEventListener('click', () => {
      container.querySelector('#hist-fecha').value = '';
      cargarHistorial(null);
    });

    // ====== MODAL EDICIÓN ======
    function abrirModalEditar(entrega) {
      container.querySelector('#edit-id').value = entrega.id;
      container.querySelector('#edit-insumo').value = entrega.insumo || '';
      container.querySelector('#edit-pabellon').value = entrega.pabellon || '';
      container.querySelector('#edit-piso').value = entrega.piso || '';
      const det = entrega.detalle_banos || {};
      container.querySelector('#edit-damas').value = det.damas || 0;
      container.querySelector('#edit-varones').value = det.varones || 0;
      container.querySelector('#edit-discapacitado').value = det.discapacitado || 0;
      container.querySelector('#edit-observaciones').value = entrega.observaciones || '';
      container.querySelector('#alert-modal-edit').innerHTML = '';
      const modal = container.querySelector('#modal-editar');
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }

    function cerrarModalEditar() {
      const modal = container.querySelector('#modal-editar');
      modal.classList.add('hidden');
      modal.style.display = '';
    }

    container.querySelector('#btn-cancelar-edit').addEventListener('click', cerrarModalEditar);

    container.querySelector('#btn-confirmar-edit').addEventListener('click', async () => {
      const id = container.querySelector('#edit-id').value;
      const d  = parseInt(container.querySelector('#edit-damas').value)||0;
      const v  = parseInt(container.querySelector('#edit-varones').value)||0;
      const dc = parseInt(container.querySelector('#edit-discapacitado').value)||0;
      const sumaDesglose = d + v + dc;
      // En el modal, el total = desglose (ya tiene datos concretos al editar)
      // El estado: REGULARIZADO si desglose > 0; POR_REGULARIZAR si no hay desglose
      const nuevoTotal = sumaDesglose > 0 ? sumaDesglose : parseInt(container.querySelector('#edit-piso').value) ? 0 : 0;
      const estado = sumaDesglose > 0 ? 'REGULARIZADO' : 'POR_REGULARIZAR';

      const btn = container.querySelector('#btn-confirmar-edit');
      btn.disabled = true; btn.textContent = 'Guardando...';
      try {
        await actualizarEntrega(id, {
          insumo:        container.querySelector('#edit-insumo').value,
          pabellon:      container.querySelector('#edit-pabellon').value,
          piso:          parseInt(container.querySelector('#edit-piso').value) || null,
          detalle_banos: { damas: d, varones: v, discapacitado: dc },
          cantidad_total: sumaDesglose,
          observaciones: container.querySelector('#edit-observaciones').value || null,
          estado
        });
        cerrarModalEditar();
        cargarHistorial();
        if (currentUser) await renderHistorialRapido(currentUser.uid);
        container.querySelector('#alert-historial').innerHTML = `<div class="alert alert-success mb-4">✅ Registro actualizado como <strong>${estado}</strong>.</div>`;
        setTimeout(() => { container.querySelector('#alert-historial').innerHTML = ''; }, 4000);
      } catch(err) {
        container.querySelector('#alert-modal-edit').innerHTML = `<div class="alert alert-error mb-3">❌ ${err.message}</div>`;
      } finally { btn.disabled = false; btn.textContent = '✓ Guardar Cambios'; }
    });

  }

  initView();
  return container;
}
