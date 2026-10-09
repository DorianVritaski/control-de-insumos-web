// Vista del Módulo Operador
// Formulario de Registro de Entregas
// Según la especificación Spec_Driven_Development.md - Sección 6.2, RF-02

import { registrarEntrega, obtenerEntregasDelDia } from "../services/entregas.service.js";
import { getPabellones, getInsumos } from "../services/catalogos.service.js";
import { isAuthenticated, getCurrentUser } from "../services/auth.service.js";

export function operadorView() {
  const container = document.createElement("div");

  container.innerHTML = `
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-3xl font-extrabold text-slate-800 logo">Registro de Entregas</h2>
      <p class="text-slate-500 mt-1">Complete el formulario para registrar una nueva entrega de insumos.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Formulario Principal -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100" style="background: linear-gradient(135deg, #0d9488, #0f766e);">
          <h3 class="font-bold text-white text-base flex items-center gap-2">📦 Formulario de Entrega</h3>
        </div>
        <div class="p-6">
          <div id="alert-container"></div>
          <form id="registro-form" class="space-y-5">

            <!-- Insumo -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Tipo de Insumo *</label>
              <select id="insumo" class="form-input" required>
                <option value="">Cargando insumos...</option>
              </select>
            </div>

            <!-- Pabellón y Piso en fila -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Pabellón *</label>
                <select id="pabellon" class="form-input" required>
                  <option value="">Cargando pabellones...</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Piso <span class="normal-case text-slate-400">(opcional)</span></label>
                <input type="number" id="piso" class="form-input" placeholder="Ej: 3" min="1" max="99">
              </div>
            </div>

            <!-- Cantidades -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Distribución de Unidades</label>
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

            <!-- Cantidad Total -->
            <div class="p-4 bg-teal-50 rounded-xl border border-teal-200">
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-xs font-semibold text-teal-600 uppercase tracking-wider">Total de Unidades</label>
                  <p class="text-xs text-teal-500 mt-0.5">Se calcula automáticamente</p>
                </div>
                <div class="text-4xl font-extrabold text-teal-700 font-mono" id="cantidadTotal-display">0</div>
              </div>
              <input type="hidden" id="cantidadTotal" value="0">
            </div>

            <!-- Encargado -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Encargado</label>
                <input type="text" id="encargado" class="form-input bg-slate-50" placeholder="Cargando..." readonly>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">DNI</label>
                <input type="text" id="encargadoDni" class="form-input bg-slate-50" placeholder="Cargando..." readonly>
              </div>
            </div>

            <!-- Observaciones -->
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Observaciones <span class="normal-case text-slate-400">(opcional)</span></label>
              <textarea id="observaciones" class="form-input" rows="2" placeholder="Notas adicionales sobre la entrega..."></textarea>
            </div>

            <!-- Botón Registrar -->
            <button type="submit" id="btn-registrar" class="btn btn-primary w-full" style="padding: 1rem; font-size: 1rem;" disabled>
              ✓ Registrar Entrega
            </button>
          </form>
        </div>
      </div>

      <!-- Panel Lateral -->
      <div class="flex flex-col gap-4">

        <!-- Info del operador -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-700 to-slate-800">
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

        <!-- Acciones rápidas -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <h4 class="font-bold text-slate-700 text-sm">⚡ Acciones Rápidas</h4>
          </div>
          <div class="p-5">
            <button type="button" id="btn-registro-lote" class="w-full text-left p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors">
              <p class="font-semibold text-amber-700 text-sm">📦 Entrega a Almacén (Lote)</p>
              <p class="text-xs text-amber-500 mt-0.5">Marca como POR_REGULARIZAR</p>
            </button>
          </div>
        </div>

        <!-- Historial reciente -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <h4 class="font-bold text-slate-700 text-sm">🕐 Últimas Entregas</h4>
          </div>
          <div id="historial-reciente" class="p-5">
            <p class="text-xs text-slate-400 text-center py-2">Cargando historial...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Inicializar la vista
  async function initView() {
    const insumoSel = container.querySelector("#insumo");
    const pabellon = container.querySelector("#pabellon");
    const piso = container.querySelector("#piso");
    const damas = container.querySelector("#damas");
    const varones = container.querySelector("#varones");
    const discapacitado = container.querySelector("#discapacitado");
    const cantidadTotal = container.querySelector("#cantidadTotal");
    const cantidadTotalDisplay = container.querySelector("#cantidadTotal-display");
    const encargado = container.querySelector("#encargado");
    const encargadoDni = container.querySelector("#encargadoDni");
    const btnRegistrar = container.querySelector("#btn-registrar");
    const btnLote = container.querySelector("#btn-registro-lote");
    const alertContainer = container.querySelector("#alert-container");

    // Cargar pabellones e insumos desde Firestore
    async function cargarCatalogos() {
      try {
        const [pabellones, insumos] = await Promise.all([getPabellones(), getInsumos()]);

        pabellon.innerHTML = '<option value="">Seleccione pabellón...</option>';
        pabellones.forEach((p) => {
          const option = document.createElement("option");
          option.value = p.codigo;
          option.textContent = `${p.nombre} (Máx: ${p.max_pisos} pisos)`;
          pabellon.appendChild(option);
        });

        insumoSel.innerHTML = '<option value="">Seleccione insumo...</option>';
        insumos.forEach((i) => {
          const option = document.createElement("option");
          option.value = i;
          option.textContent = i.replace(/_/g, ' ');
          insumoSel.appendChild(option);
        });
      } catch (e) {
        alertContainer.innerHTML = `<div class="alert alert-error">Error al cargar catálogos: ${e.message}</div>`;
      }
    }

    // Calcular cantidad total automáticamente
    function actualizarCantidadTotal() {
      const d = parseInt(damas.value) || 0;
      const v = parseInt(varones.value) || 0;
      const dc = parseInt(discapacitado.value) || 0;
      const total = d + v + dc;
      cantidadTotal.value = total;
      cantidadTotalDisplay.textContent = total;

      const tieneDatos = insumoSel.value && pabellon.value && encargado.value.trim() && encargadoDni.value.trim();
      btnRegistrar.disabled = !tieneDatos;
    }

    // Renderizar historial reciente
    async function renderHistorial(uid) {
      const histDiv = container.querySelector("#historial-reciente");
      try {
        const entregas = await obtenerEntregasDelDia(uid);
        if (!entregas.length) {
          histDiv.innerHTML = '<p class="text-xs text-slate-400 text-center py-2">Sin entregas hoy.</p>';
          return entregas.length;
        }
        histDiv.innerHTML = entregas.slice(0, 4).map(e => `
          <div class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-teal-700 bg-teal-50 shrink-0">${e.pabellon || '?'}</div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-slate-700 truncate">${(e.insumo || '').replace(/_/g, ' ')}</p>
              <p class="text-xs text-slate-400">${e.piso ? 'Piso ' + e.piso : 'Sin piso'} · ${e.cantidad_total || 0} u.</p>
            </div>
          </div>
        `).join('');
        return entregas.length;
      } catch (e) {
        histDiv.innerHTML = '<p class="text-xs text-red-400 text-center py-2">Error al cargar.</p>';
        return 0;
      }
    }

    // Cargar datos del operador
    async function cargarDatosOperador() {
      if (isAuthenticated()) {
        try {
          const user = await getCurrentUser();
          const nombre = user.nombre_completo || user.nombre || "Operador";
          encargado.value = nombre;
          encargadoDni.value = user.dni || '';
          container.querySelector("#operador-nombre").textContent = nombre.split(' ')[0];
          container.querySelector("#operador-estado").textContent = user.activo ? "✅ Activo" : "❌ Inactivo";

          const fecha = new Date();
          const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
          const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
          container.querySelector("#fecha-actual").textContent = `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;

          const count = await renderHistorial(user.uid);
          container.querySelector("#entregas-contador").textContent = count;
        } catch (e) {
          console.error("Error al cargar usuario:", e);
        }
      }
      await cargarCatalogos();
      actualizarCantidadTotal();
    }

    // Registrar entrega
    container.querySelector("#registro-form").addEventListener("submit", async (e) => {
      e.preventDefault();

      const insumoValor = insumoSel.value;
      const pabellonValor = pabellon.value;
      const pisoValor = piso.value ? parseInt(piso.value) : null;
      const d = parseInt(damas.value) || 0;
      const v = parseInt(varones.value) || 0;
      const dc = parseInt(discapacitado.value) || 0;
      const enc = encargado.value.trim();
      const dn = encargadoDni.value.trim();
      const obs = container.querySelector("#observaciones").value.trim();

      const errores = [];
      if (!insumoValor) errores.push("Debe seleccionar un insumo.");
      if (!pabellonValor) errores.push("Debe seleccionar un pabellón.");
      if (!enc) errores.push("El encargado no está cargado. Recargue la página.");

      if (errores.length > 0) {
        alertContainer.innerHTML = `<div class="alert alert-error">${errores.map(e => "• " + e).join("<br>")}</div>`;
        return;
      }

      try {
        btnRegistrar.disabled = true;
        btnRegistrar.textContent = "Registrando...";
        const uid = isAuthenticated() ? (await getCurrentUser()).uid : null;
        const result = await registrarEntrega(insumoValor, pabellonValor, pisoValor, d, v, dc, enc, dn, uid, obs);

        alertContainer.innerHTML = `<div class="alert alert-success">✅ Entrega registrada exitosamente (ID: ${result.id}).</div>`;
        setTimeout(() => { alertContainer.innerHTML = ''; }, 5000);
        container.querySelector("#registro-form").reset();
        damas.value = '0'; varones.value = '0'; discapacitado.value = '0';
        actualizarCantidadTotal();

        // Refrescar historial y contador
        if (isAuthenticated()) {
          const user = await getCurrentUser();
          const count = await renderHistorial(user.uid);
          container.querySelector("#entregas-contador").textContent = count;
        }
      } catch (error) {
        alertContainer.innerHTML = `<div class="alert alert-error">❌ Error: ${error.message}</div>`;
      } finally {
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = "✓ Registrar Entrega";
        actualizarCantidadTotal();
      }
    });

    // Botón de entrega a almacén (lote)
    btnLote.addEventListener("click", () => {
      piso.value = "";
      damas.value = "0"; varones.value = "0"; discapacitado.value = "0";
      actualizarCantidadTotal();
      alertContainer.innerHTML = `<div class="alert alert-info">📦 Modo Almacén activado. Complete el formulario y la entrega quedará como <strong>POR_REGULARIZAR</strong>.</div>`;
    });

    // Botones de campo con cálculo automático
    [damas, varones, discapacitado, insumoSel, pabellon].forEach((campo) => {
      campo.addEventListener("input", actualizarCantidadTotal);
      campo.addEventListener("change", actualizarCantidadTotal);
    });

    // Inicializar
    await cargarDatosOperador();
  }

  initView();
  return container;
}
