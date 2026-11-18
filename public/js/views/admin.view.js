// Vista del Módulo Administrador
// Panel de Control y Configuración
// Según la especificación Spec_Driven_Development.md

import { filtrarEntregas, obtenerTodasLasEntregas, regularizarEntrega, actualizarEntrega, eliminarEntrega } from "../services/entregas.service.js";
import {
  getCatalogosCompletos,
  agregarPabellon, actualizarPabellon, eliminarPabellon,
  agregarInsumo, eliminarInsumo,
  getStock, actualizarStock,
  registrarIngresoStock, obtenerIngresosStock, eliminarIngresoStock,
  getConfigAgua, actualizarMaxBidones, agregarAreaSolicitante, eliminarAreaSolicitante,
  toggleInsumoActivo, getInsumosConfig
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
          <button data-tab="dashboard"      class="tab-btn px-5 py-3 text-sm font-semibold rounded-t-lg border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all whitespace-nowrap">📊 Dashboard</button>
        </nav>
      </div>

      <!-- ===== TAB REGULARIZACIÓN ===== -->
      <div class="tab-panel p-6" id="tab-regularizacion">
        <div id="alert-regularizacion"></div>
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

        <!-- Tabla Agua en Regularización -->
        <div class="mt-8 border-t border-slate-200 pt-6">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xl">💧</span>
            <h4 class="font-bold text-slate-700 text-base">Entregas de Agua</h4>
            <span id="reg-agua-count" class="ml-2 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"></span>
          </div>
          <div class="table-responsive">
            <table>
              <thead>
                <tr style="background:linear-gradient(135deg,#0ea5e9,#0284c7);">
                  <th>Fecha</th><th>Área Solicitante</th><th>Pabellón</th><th>Piso</th><th>Ubicación Exacta</th><th>Bidones</th><th>Encargado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody id="tbody-reg-agua">
                <tr><td colspan="8" class="text-center text-slate-400 py-6">Cargando...</td></tr>
              </tbody>
            </table>
          </div>
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

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

          <!-- Config Agua (span 2 cols) -->
          <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);">
              <div class="flex items-center gap-2">
                <span class="text-xl">💧</span>
                <h3 class="font-bold text-slate-800 text-base">Configuración Insumo Agua</h3>
              </div>
            </div>
            <div class="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">

              <!-- Max Bidones -->
              <div>
                <p class="text-xs font-bold text-slate-500 uppercase mb-3">🧔 Máximo de Bidones por Entrega</p>
                <div class="flex items-center gap-3">
                  <input type="number" id="agua-max-bidones" class="form-input w-28 text-center font-bold text-lg" min="1" max="50" value="10">
                  <button id="btn-guardar-max-bidones" class="btn btn-primary text-sm">💾 Guardar</button>
                </div>
                <p class="text-xs text-slate-400 mt-2">Define cuántos bidones como máximo se podrán seleccionar en el formulario de entrega de Agua.</p>
              </div>

              <!-- Áreas Solicitantes -->
              <div>
                <p class="text-xs font-bold text-slate-500 uppercase mb-3">🏢 Áreas Solicitantes</p>
                <form id="form-add-area" class="flex gap-2 mb-3">
                  <input type="text" id="area-nombre" class="form-input flex-1 text-sm" placeholder="Ej: ENFERMERÍA" required>
                  <button type="submit" class="btn btn-primary text-sm whitespace-nowrap">+ Agregar</button>
                </form>
                <div id="lista-areas" class="space-y-2 max-h-52 overflow-y-auto">
                  <p class="text-xs text-slate-400 text-center py-3">Cargando...</p>
                </div>
              </div>

            </div>
          </div>


          <!-- Stock + Ingresos -->
          <div class="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">📊</span>
                <h3 class="font-bold text-slate-800 text-base">Stock &amp; Ingresos Mensuales</h3>
              </div>
              <div class="flex gap-2">
                <button id="btn-show-stock" class="stock-view-btn text-xs px-3 py-1.5 rounded-lg font-semibold bg-amber-500 text-white transition-all">📊 Stock Actual</button>
                <button id="btn-show-ingresos" class="stock-view-btn text-xs px-3 py-1.5 rounded-lg font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">📥 Ingresos</button>
              </div>
            </div>

            <!-- Vista: Stock Actual -->
            <div id="panel-stock-actual" class="p-5">
              <p class="text-xs text-slate-500 mb-4">Ajusta el stock disponible manualmente. Se descuenta automáticamente con cada entrega registrada.</p>
              <div id="lista-stock" class="space-y-3">
                <div class="text-center text-slate-400 py-6 text-sm">Cargando...</div>
              </div>
            </div>

            <!-- Vista: Ingresos Mensuales -->
            <div id="panel-ingresos" class="p-5 hidden">

              <!-- Formulario nuevo ingreso -->
              <div class="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-5">
                <p class="text-xs font-bold text-amber-700 uppercase mb-3">📥 Registrar Pedido Mensual</p>
                <form id="form-ingreso-stock">
                  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    <div>
                      <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Insumo *</label>
                      <select id="ing-insumo" class="form-input text-sm" required><option value="">Seleccione...</option></select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Cantidad *</label>
                      <input type="number" id="ing-cantidad" class="form-input text-sm" min="1" placeholder="Ej: 500" required>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Fecha del Pedido *</label>
                      <input type="date" id="ing-fecha" class="form-input text-sm" required>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Notas</label>
                      <input type="text" id="ing-notas" class="form-input text-sm" placeholder="Ej: Pedido regular">
                    </div>
                  </div>
                  <button type="submit" id="btn-registrar-ingreso" class="btn btn-primary text-sm">✓ Registrar Ingreso</button>
                </form>
              </div>

              <!-- Filtros historial -->
              <div class="flex flex-wrap items-end gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Filtrar por Mes</label>
                  <input type="month" id="ing-filtro-mes" class="form-input text-sm">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Insumo</label>
                  <select id="ing-filtro-insumo" class="form-input text-sm"><option value="">Todos</option></select>
                </div>
                <button id="btn-ing-filtrar" class="btn btn-secondary text-sm">🔍 Filtrar</button>
                <button id="btn-ing-todos" class="btn btn-secondary text-sm">Ver todos</button>
                <button id="btn-ing-excel" class="btn text-sm text-white font-semibold" style="background:#217346;">📥 Excel</button>
              </div>

              <!-- Resumen por mes (cards) -->
              <div id="ing-resumen-mes" class="mb-4"></div>

              <!-- Tabla historial -->
              <div class="table-responsive">
                <table>
                  <thead><tr><th>Mes</th><th>Fecha Pedido</th><th>Insumo</th><th>Cantidad</th><th>Registrado por</th><th>Notas</th><th>Acciones</th></tr></thead>
                  <tbody id="tbody-ingresos"><tr><td colspan="7" class="text-center text-slate-400 py-6">Cargando...</td></tr></tbody>
                </table>
              </div>
              <p id="ing-count" class="text-xs text-slate-400 mt-2"></p>
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

        <!-- Tabla especial Agua -->
        <div class="mt-8 border-t border-slate-200 pt-6">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">💧</span>
              <h4 class="font-bold text-slate-700 text-base">Entregas de Agua</h4>
              <span id="exp-agua-count" class="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"></span>
            </div>
            <div class="flex gap-2">
              <button id="btn-exp-agua-excel" class="btn text-sm text-white font-semibold" style="background:#217346;">📥 Excel Agua</button>
              <button id="btn-exp-agua-pdf"   class="btn text-sm text-white font-semibold" style="background:#c0392b;">📄 PDF Agua</button>
            </div>
          </div>
          <div class="table-responsive">
            <table id="tabla-export-agua">
              <thead>
                <tr style="background:linear-gradient(135deg,#0ea5e9,#0284c7);">
                  <th>Fecha</th><th>Insumo</th><th>Bidones</th><th>Área Solicitante</th><th>Pabellón</th><th>Piso</th><th>Ubicación Exacta</th><th>Encargado</th>
                </tr>
              </thead>
              <tbody id="tbody-export-agua">
                <tr><td colspan="8" class="text-center text-slate-400 py-8">Aplica los filtros y presiona "Buscar".</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

      <!-- ===== TAB DASHBOARD ===== -->
      <div class="tab-panel p-6 hidden" id="tab-dashboard">

        <!-- Selector de período -->
        <div class="flex flex-wrap items-center gap-3 mb-6">
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-slate-500 uppercase">Mes</label>
            <select id="dash-mes" class="form-input text-sm" style="width:140px;"></select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-slate-500 uppercase">Año</label>
            <select id="dash-anio" class="form-input text-sm" style="width:100px;"></select>
          </div>
          <button id="btn-dash-cargar" class="btn btn-primary text-sm">🔄 Actualizar</button>
          <span id="dash-loading" class="text-xs text-slate-400 hidden">Cargando datos...</span>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entregas hoy</p>
            <p id="kpi-entregas-hoy" class="text-3xl font-extrabold text-teal-700">—</p>
            <p class="text-xs text-slate-400">registros del día</p>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unidades hoy</p>
            <p id="kpi-unidades-hoy" class="text-3xl font-extrabold text-emerald-700">—</p>
            <p class="text-xs text-slate-400">unidades entregadas</p>
          </div>
          <div class="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 flex flex-col gap-1" style="border-color:#fbbf24;">
            <p class="text-xs font-semibold text-amber-500 uppercase tracking-wider">Por regularizar</p>
            <p id="kpi-por-regularizar" class="text-3xl font-extrabold text-amber-600">—</p>
            <p class="text-xs text-slate-400">registros pendientes</p>
          </div>
          <div class="bg-white rounded-2xl border border-blue-200 shadow-sm p-4 flex flex-col gap-1">
            <p class="text-xs font-semibold text-blue-400 uppercase tracking-wider">Bidones hoy</p>
            <p id="kpi-bidones-hoy" class="text-3xl font-extrabold text-blue-700">—</p>
            <p class="text-xs text-slate-400">💧 agua entregada</p>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Insumo top</p>
            <p id="kpi-insumo-top" class="text-lg font-extrabold text-slate-800 leading-tight">—</p>
            <p class="text-xs text-slate-400">más entregado del mes</p>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pabellón top</p>
            <p id="kpi-pabellon-top" class="text-lg font-extrabold text-slate-800 leading-tight">—</p>
            <p class="text-xs text-slate-400">más entregas del mes</p>
          </div>
        </div>

        <!-- Gráficos fila 1: Línea 30 días + Dona insumos -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h4 class="font-bold text-slate-700 text-sm mb-4">📈 Entregas por día — últimos 30 días</h4>
            <div style="position:relative;height:220px;"><canvas id="chart-linea-dias"></canvas></div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h4 class="font-bold text-slate-700 text-sm mb-4">🍩 Distribución por Insumo (mes)</h4>
            <div style="position:relative;height:220px;"><canvas id="chart-dona-insumos"></canvas></div>
          </div>
        </div>

        <!-- Gráfico fila 2: Barras por pabellón -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <h4 class="font-bold text-slate-700 text-sm mb-4">🏢 Entregas por Pabellón (mes)</h4>
          <div style="position:relative;height:200px;"><canvas id="chart-barras-pabellon"></canvas></div>
        </div>

        <!-- Gráficos fila 3: Stock actual + Operadores -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h4 class="font-bold text-slate-700 text-sm mb-4">📦 Stock actual por Insumo</h4>
            <div style="position:relative;height:220px;"><canvas id="chart-stock"></canvas></div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h4 class="font-bold text-slate-700 text-sm mb-4">👷 Entregas por Operador (mes)</h4>
            <div style="position:relative;height:220px;"><canvas id="chart-operadores"></canvas></div>
          </div>
        </div>

        <!-- Gráfico fila 4: Agua por área -->
        <div class="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 mb-2" style="border-color:#bae6fd;">
          <h4 class="font-bold text-blue-700 text-sm mb-4">💧 Bidones de Agua por Área Solicitante (mes)</h4>
          <div style="position:relative;height:200px;"><canvas id="chart-agua-areas"></canvas></div>
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

    <!-- Modal Editar Registro (Regularización) -->
    <div id="modal-edit-registro" class="fixed inset-0 z-50 hidden items-center justify-center" style="background:rgba(15,23,42,0.5);">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-screen overflow-y-auto">
        <h3 class="text-lg font-bold text-slate-800 mb-1">✏️ Editar Registro</h3>
        <p class="text-xs text-slate-400 mb-4">Modifica los datos del registro seleccionado.</p>
        <div id="alert-modal-edit-reg"></div>
        <input type="hidden" id="edit-reg-id">
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Fecha</label>
              <input type="date" id="edit-reg-fecha" class="form-input text-sm">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">Piso</label>
              <input type="number" id="edit-reg-piso" class="form-input text-sm" min="1" style="max-width:100px;">
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div><label class="block text-xs text-slate-400 mb-1">👩 Damas</label><input type="number" id="edit-reg-damas" class="form-input text-center text-sm" min="0" value="0"></div>
            <div><label class="block text-xs text-slate-400 mb-1">👨 Varones</label><input type="number" id="edit-reg-varones" class="form-input text-center text-sm" min="0" value="0"></div>
            <div><label class="block text-xs text-slate-400 mb-1">♿ Discap.</label><input type="number" id="edit-reg-discap" class="form-input text-center text-sm" min="0" value="0"></div>
          </div>
          <div class="p-3 bg-violet-50 rounded-lg border border-violet-200 flex justify-between items-center">
            <span class="text-sm text-violet-600 font-semibold">Total calculado:</span>
            <span id="edit-reg-total" class="text-2xl font-extrabold text-violet-700">0</span>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="btn-confirmar-edit-reg" class="btn btn-primary flex-1">💾 Guardar Cambios</button>
          <button id="btn-cancelar-edit-reg"  class="btn btn-secondary flex-1">✕ Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Eliminación -->
    <div id="modal-confirm-delete" class="fixed inset-0 z-50 hidden items-center justify-center" style="background:rgba(15,23,42,0.6);">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
        <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </div>
        <h3 class="text-lg font-bold text-slate-800 mb-2">¿Eliminar registro?</h3>
        <p class="text-sm text-slate-500 mb-6" id="delete-confirm-msg">Esta acción no se puede deshacer.</p>
        <input type="hidden" id="delete-reg-id">
        <div class="flex gap-3">
          <button id="btn-confirmar-delete" class="btn flex-1 text-white font-semibold" style="background:#dc2626;">🗑️ Eliminar</button>
          <button id="btn-cancelar-delete"  class="btn btn-secondary flex-1">✕ Cancelar</button>
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
      tabBtns.forEach(b => { b.classList.remove('active', 'border-teal-600', 'text-teal-700', 'bg-teal-50'); b.classList.add('border-transparent', 'text-slate-500'); });
      tabPanels.forEach(p => p.classList.add('hidden'));
      btn.classList.add('active', 'border-teal-600', 'text-teal-700', 'bg-teal-50');
      btn.classList.remove('border-transparent', 'text-slate-500');
      container.querySelector('#tab-' + btn.dataset.tab)?.classList.remove('hidden');
    });
  });

  let catalogos = { pabellones: [], insumos: [], insumosDesactivados: [], insumosConfig: { desactivados_registro: [], desactivados_multipiso: [] } };
  let stockData = {};
  let entregasExport = [];

  function showAlert(id, msg, type = 'success') {
    const div = container.querySelector(id);
    if (!div) return;
    div.innerHTML = `<div class="alert alert-${type} mb-4">${msg}</div>`;
    setTimeout(() => { div.innerHTML = ''; }, 5000);
  }

  function sincFiltros() {
    ['#filtro-pabellon', '#exp-pabellon'].forEach(sel => {
      const s = container.querySelector(sel); if (!s) return;
      const v = s.value; s.innerHTML = '<option value="">Todos</option>';
      catalogos.pabellones.forEach(p => { const o = document.createElement('option'); o.value = p.codigo; o.textContent = p.nombre; s.appendChild(o); });
      s.value = v;
    });
    ['#filtro-insumo', '#exp-insumo'].forEach(sel => {
      const s = container.querySelector(sel); if (!s) return;
      const v = s.value; s.innerHTML = '<option value="">Todos</option>';
      catalogos.insumos.forEach(i => { const o = document.createElement('option'); o.value = i; o.textContent = i.replace(/_/g, ' '); s.appendChild(o); });
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
        try { await eliminarPabellon(btn.dataset.codigo); catalogos.pabellones = catalogos.pabellones.filter(p => p.codigo !== btn.dataset.codigo); renderPabellones(); sincFiltros(); showAlert('#alert-catalogos', '✅ Pabellón eliminado.'); }
        catch (e) { showAlert('#alert-catalogos', '❌ ' + e.message, 'error'); }
      });
    });
  }

  // Confirmar edición pabellón
  container.querySelector('#btn-confirmar-edit-pabellon').addEventListener('click', async () => {
    const codigoOrig = container.querySelector('#edit-pabellon-codigo-orig').value;
    const nombre = container.querySelector('#edit-pabellon-nombre').value.trim();
    const pisos = parseInt(container.querySelector('#edit-pabellon-pisos').value);
    if (!nombre || !pisos) { showAlert('#alert-modal-pabellon', '⚠️ Completa todos los campos.', 'error'); return; }
    const btn = container.querySelector('#btn-confirmar-edit-pabellon');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      await actualizarPabellon(codigoOrig, nombre, pisos);
      const idx = catalogos.pabellones.findIndex(p => p.codigo === codigoOrig);
      if (idx !== -1) catalogos.pabellones[idx] = { codigo: codigoOrig, nombre, max_pisos: pisos };
      catalogos.pabellones.sort((a, b) => a.nombre.localeCompare(b.nombre));
      renderPabellones(); sincFiltros();
      cerrarModal('#modal-edit-pabellon');
      showAlert('#alert-catalogos', `✅ Pabellón "${nombre}" actualizado.`);
    } catch (e) { container.querySelector('#alert-modal-pabellon').innerHTML = `<div class="alert alert-error mb-3">❌ ${e.message}</div>`; }
    finally { btn.disabled = false; btn.textContent = '✓ Guardar'; }
  });
  container.querySelector('#btn-cancelar-edit-pabellon').addEventListener('click', () => cerrarModal('#modal-edit-pabellon'));

  // ====== INSUMOS ======
  function renderInsumos() {
    const ul = container.querySelector('#lista-insumos');
    if (!catalogos.insumos.length) { ul.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">Sin insumos.</p>'; return; }
    const cfg = catalogos.insumosConfig || { desactivados_registro: [], desactivados_multipiso: [] };
    ul.innerHTML = catalogos.insumos.map(i => {
      const enReg   = !cfg.desactivados_registro.includes(i);
      const enMulti = !cfg.desactivados_multipiso.includes(i);
      return `
      <div class="flex items-center justify-between gap-2 p-3 rounded-lg border group transition-all ${(!enReg && !enMulti) ? 'bg-slate-100 border-slate-300 opacity-60' : 'bg-slate-50 border-slate-200 hover:border-violet-300 hover:bg-violet-50'}">
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-8 h-8 shrink-0 rounded-lg text-xs font-bold text-white flex items-center justify-center" style="background:${(enReg || enMulti) ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#94a3b8'}">🧴</span>
          <div class="min-w-0">
            <p class="font-semibold text-slate-800 text-sm truncate" title="${i}">${i.replace(/_/g, ' ')}</p>
            <div class="flex gap-2 mt-0.5">
              <span class="inline-flex items-center text-xs font-semibold ${enReg ? 'text-emerald-600' : 'text-slate-400'}" title="Registrar Entrega">${enReg ? '● Reg.' : '○ Reg.'}</span>
              <span class="text-slate-300 text-xs">|</span>
              <span class="inline-flex items-center text-xs font-semibold ${enMulti ? 'text-blue-600' : 'text-slate-400'}" title="Multipiso">${enMulti ? '● Multi.' : '○ Multi.'}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all items-center">
          <button class="btn-toggle-ins text-xs px-2 py-1 rounded-lg font-semibold transition-colors border ${enReg ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}" data-nombre="${i}" data-activo="${enReg}" data-modulo="registro" title="${enReg ? 'Desactivar en Registro' : 'Activar en Registro'}">
            ${enReg ? '⏸ Reg.' : '▶ Reg.'}
          </button>
          <button class="btn-toggle-ins text-xs px-2 py-1 rounded-lg font-semibold transition-colors border ${enMulti ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}" data-nombre="${i}" data-activo="${enMulti}" data-modulo="multipiso" title="${enMulti ? 'Desactivar en Multipiso' : 'Activar en Multipiso'}">
            ${enMulti ? '⏸ Multi.' : '▶ Multi.'}
          </button>
          <button class="btn-edit-ins p-1.5 rounded-lg text-violet-600 hover:bg-violet-100 transition-colors" data-nombre="${i}" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button class="btn-del-ins p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" data-nombre="${i}" title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>`;
    }).join('');

    // Toggle activo/inactivo por módulo
    container.querySelectorAll('.btn-toggle-ins').forEach(btn => {
      btn.addEventListener('click', async () => {
        const nombre   = btn.dataset.nombre;
        const modulo   = btn.dataset.modulo; // 'registro' | 'multipiso'
        const nuevaActivo = btn.dataset.activo !== 'true';
        btn.disabled = true; btn.textContent = '...';
        try {
          const nuevaCfg = await toggleInsumoActivo(nombre, nuevaActivo, modulo);
          catalogos.insumosConfig = nuevaCfg;
          catalogos.insumosDesactivados = nuevaCfg.desactivados_registro;
          renderInsumos();
          const moduloLabel = modulo === 'multipiso' ? 'Registro Multipiso' : 'Registrar Entrega';
          showAlert('#alert-catalogos', `✅ "${nombre.replace(/_/g, ' ')}" ${nuevaActivo ? 'activado' : 'desactivado'} en ${moduloLabel}.`);
        } catch (e) { showAlert('#alert-catalogos', '❌ ' + e.message, 'error'); }
        finally { btn.disabled = false; }
      });
    });

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
        try { await eliminarInsumo(btn.dataset.nombre); catalogos.insumos = catalogos.insumos.filter(i => i !== btn.dataset.nombre); renderInsumos(); renderStock(); sincFiltros(); showAlert('#alert-catalogos', '✅ Insumo eliminado.'); }
        catch (e) { showAlert('#alert-catalogos', '❌ ' + e.message, 'error'); }
      });
    });
  }

  // Confirmar edición insumo (rename: actualizar lista + stock key)
  container.querySelector('#btn-confirmar-edit-insumo').addEventListener('click', async () => {
    const orig = container.querySelector('#edit-insumo-orig').value;
    const nuevo = container.querySelector('#edit-insumo-nombre').value.trim().toUpperCase().replace(/ /g, '_');
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
      showAlert('#alert-catalogos', `✅ Insumo renombrado a "${nuevo}".`);
    } catch (e) { container.querySelector('#alert-modal-insumo').innerHTML = `<div class="alert alert-error mb-3">❌ ${e.message}</div>`; }
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
          <p class="text-sm font-semibold text-slate-700 truncate">${i.replace(/_/g, ' ')}</p>
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
        try { await actualizarStock(insumo, cantidad); stockData[insumo] = cantidad; renderStock(); showAlert('#alert-catalogos', `✅ Stock de "${insumo.replace(/_/g, ' ')}" ajustado a ${cantidad} unidades.`); }
        catch (e) { showAlert('#alert-catalogos', '❌ ' + e.message, 'error'); }
        finally { btn.disabled = false; btn.textContent = '💾'; }
      });
    });
  }

  // ====== CARGAR DATOS INICIALES ======
  try {
    [catalogos, stockData] = await Promise.all([getCatalogosCompletos(), getStock()]);
    sincFiltros(); renderPabellones(); renderInsumos(); renderStock();
  } catch (err) { console.error("Error cargando catálogos:", err); }

  // ====== SWITCH VISTAS STOCK / INGRESOS ======
  function sincIngFiltroInsumo() {
    const sel = container.querySelector('#ing-filtro-insumo');
    const selForm = container.querySelector('#ing-insumo');
    if (!sel || !selForm) return;
    const v = sel.value;
    sel.innerHTML = '<option value="">Todos</option>';
    selForm.innerHTML = '<option value="">Seleccione...</option>';
    catalogos.insumos.forEach(i => {
      const o1 = document.createElement('option'); o1.value = i; o1.textContent = i.replace(/_/g, ' '); sel.appendChild(o1);
      const o2 = document.createElement('option'); o2.value = i; o2.textContent = i.replace(/_/g, ' '); selForm.appendChild(o2);
    });
    sel.value = v;
  }
  sincIngFiltroInsumo();

  container.querySelector('#btn-show-stock').addEventListener('click', () => {
    container.querySelector('#panel-stock-actual').classList.remove('hidden');
    container.querySelector('#panel-ingresos').classList.add('hidden');
    container.querySelector('#btn-show-stock').className = 'stock-view-btn text-xs px-3 py-1.5 rounded-lg font-semibold bg-amber-500 text-white transition-all';
    container.querySelector('#btn-show-ingresos').className = 'stock-view-btn text-xs px-3 py-1.5 rounded-lg font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all';
  });
  container.querySelector('#btn-show-ingresos').addEventListener('click', () => {
    container.querySelector('#panel-stock-actual').classList.add('hidden');
    container.querySelector('#panel-ingresos').classList.remove('hidden');
    container.querySelector('#btn-show-ingresos').className = 'stock-view-btn text-xs px-3 py-1.5 rounded-lg font-semibold bg-amber-500 text-white transition-all';
    container.querySelector('#btn-show-stock').className = 'stock-view-btn text-xs px-3 py-1.5 rounded-lg font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all';
    cargarHistorialIngresos();
  });

  // ====== HISTORIAL DE INGRESOS ======
  let ingresosCache = [];

  function renderResumenMes(ingresos) {
    const resumenDiv = container.querySelector('#ing-resumen-mes');
    if (!resumenDiv || !ingresos.length) { if (resumenDiv) resumenDiv.innerHTML = ''; return; }
    // Agrupar por mes
    const porMes = {};
    ingresos.forEach(ing => {
      if (!porMes[ing.mes]) porMes[ing.mes] = {};
      porMes[ing.mes][ing.insumo] = (porMes[ing.mes][ing.insumo] || 0) + ing.cantidad;
    });
    const meses = Object.keys(porMes).sort((a, b) => b.localeCompare(a)).slice(0, 3); // últimos 3 meses
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    resumenDiv.innerHTML = `
      <p class="text-xs font-bold text-slate-500 uppercase mb-2">📅 Resumen por Mes (últimos ${meses.length})</p>
      <div class="grid grid-cols-1 sm:grid-cols-${Math.min(meses.length, 3)} gap-3 mb-4">
        ${meses.map(mes => {
      const [y, m] = mes.split('-');
      const nombreMes = `${mesesNombres[parseInt(m) - 1]} ${y}`;
      const insumos = porMes[mes];
      const totalUnidades = Object.values(insumos).reduce((a, b) => a + b, 0);
      return `
            <div class="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <p class="font-bold text-amber-800 text-sm mb-2">${nombreMes}</p>
              <p class="text-2xl font-extrabold text-amber-700 mb-2">${totalUnidades.toLocaleString()} u.</p>
              <div class="space-y-1">
                ${Object.entries(insumos).map(([ins, qty]) =>
        `<div class="flex justify-between text-xs"><span class="text-slate-600 truncate">${ins.replace(/_/g, ' ')}</span><span class="font-bold text-amber-700 ml-2">${qty}</span></div>`
      ).join('')}
              </div>
            </div>`;
    }).join('')}
      </div>`;
  }

  function renderTablaIngresos(ingresos) {
    const tbody = container.querySelector('#tbody-ingresos');
    const count = container.querySelector('#ing-count');
    if (!ingresos.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-slate-400 py-8">Sin ingresos registrados.</td></tr>';
      if (count) count.textContent = '';
      return;
    }
    const mesesNombres = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    tbody.innerHTML = '';
    ingresos.forEach(ing => {
      const [y, m] = (ing.mes || '').split('-');
      const mesesNombres2 = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const mesLabel = m ? `${mesesNombres2[parseInt(m)]} ${y}` : (ing.mes || '-');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="font-semibold text-amber-700 text-sm">${mesLabel}</td>
        <td class="text-sm text-slate-600">${ing.fecha || ing.fecha_registro || '-'}</td>
        <td class="text-sm font-medium">${(ing.insumo || '').replace(/_/g, ' ')}</td>
        <td class="text-sm text-center font-bold text-slate-800">${(ing.cantidad || 0).toLocaleString()}</td>
        <td class="text-sm">${ing.registrado_por || '-'}</td>
        <td class="text-sm text-slate-500 max-w-xs truncate" title="${ing.notas || ''}">${ing.notas || '—'}</td>
        <td><button class="btn-del-ing text-xs px-2 py-1 rounded text-red-500 hover:bg-red-50 transition-colors" data-id="${ing.id}">🗑️</button></td>`;
      tbody.appendChild(tr);
    });
    container.querySelectorAll('.btn-del-ing').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este registro de ingreso?')) return;
        try {
          await eliminarIngresoStock(btn.dataset.id);
          ingresosCache = ingresosCache.filter(i => i.id !== btn.dataset.id);
          renderResumenMes(ingresosCache);
          renderTablaIngresos(ingresosCache);
          showAlert('#alert-catalogos', '✅ Ingreso eliminado.');
        } catch (e) { showAlert('#alert-catalogos', '❌ ' + e.message, 'error'); }
      });
    });
    if (count) count.textContent = `${ingresos.length} ingreso(s) encontrado(s).`;
  }

  async function cargarHistorialIngresos() {
    const tbody = container.querySelector('#tbody-ingresos');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-slate-400 py-6">Cargando...</td></tr>';
    try {
      ingresosCache = await obtenerIngresosStock();
      renderResumenMes(ingresosCache);
      renderTablaIngresos(ingresosCache);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-red-400 py-6">Error al cargar.</td></tr>';
    }
  }

  function filtrarIngresos() {
    const mes = container.querySelector('#ing-filtro-mes').value; // YYYY-MM
    const insumo = container.querySelector('#ing-filtro-insumo').value;
    let result = [...ingresosCache];
    if (mes) result = result.filter(i => i.mes === mes);
    if (insumo) result = result.filter(i => i.insumo === insumo);
    renderResumenMes(result);
    renderTablaIngresos(result);
  }

  container.querySelector('#btn-ing-filtrar').addEventListener('click', filtrarIngresos);
  container.querySelector('#btn-ing-todos').addEventListener('click', () => {
    container.querySelector('#ing-filtro-mes').value = '';
    container.querySelector('#ing-filtro-insumo').value = '';
    renderResumenMes(ingresosCache);
    renderTablaIngresos(ingresosCache);
  });

  // Exportar Excel de ingresos
  container.querySelector('#btn-ing-excel').addEventListener('click', () => {
    const mes = container.querySelector('#ing-filtro-mes').value;
    const insumo = container.querySelector('#ing-filtro-insumo').value;
    let datos = [...ingresosCache];
    if (mes) datos = datos.filter(i => i.mes === mes);
    if (insumo) datos = datos.filter(i => i.insumo === insumo);
    if (!datos.length) return alert('No hay datos para exportar.');
    const header = ['MES', 'FECHA PEDIDO', 'INSUMO', 'CANTIDAD', 'REGISTRADO POR', 'NOTAS'];
    const rows = datos.map(i => [i.mes, i.fecha || i.fecha_registro, i.insumo, i.cantidad, i.registrado_por, i.notas || '']);
    const csv = '\uFEFF' + [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `ingresos_stock_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  });

  // Registrar nuevo ingreso
  container.querySelector('#form-ingreso-stock').addEventListener('submit', async (e) => {
    e.preventDefault();
    const insumo = container.querySelector('#ing-insumo').value;
    const cantidad = parseInt(container.querySelector('#ing-cantidad').value) || 0;
    const fecha = container.querySelector('#ing-fecha').value;   // YYYY-MM-DD
    const notas = container.querySelector('#ing-notas').value.trim();
    if (!insumo || !cantidad || !fecha) { showAlert('#alert-catalogos', '⚠️ Completa Insumo, Cantidad y Fecha.', 'error'); return; }
    const btn = container.querySelector('#btn-registrar-ingreso');
    btn.disabled = true; btn.textContent = 'Registrando...';
    try {
      const user = await getCurrentUser().catch(() => null);
      const nombreAdmin = user?.nombre_completo || 'Admin';
      const ingreso = await registrarIngresoStock(insumo, cantidad, fecha, notas, nombreAdmin);
      ingresosCache.unshift(ingreso);
      sincIngFiltroInsumo();
      renderResumenMes(ingresosCache);
      renderTablaIngresos(ingresosCache);
      // Refrescar panel de stock actual
      stockData = await getStock();
      renderStock();
      e.target.reset();
      const mes = ingreso.mes;
      showAlert('#alert-catalogos', `✅ Ingreso de ${cantidad} unidades de "${insumo.replace(/_/g, ' ')}" registrado para ${fecha}. Stock actual actualizado.`);
    } catch (err) { showAlert('#alert-catalogos', '❌ ' + err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = '✓ Registrar Ingreso'; }
  });

  // ====== CONFIG AGUA ======
  let configAgua = { max_bidones: 10, areas_solicitantes: [] };

  function renderAreasSolicitantes() {
    const div = container.querySelector('#lista-areas');
    if (!div) return;
    if (!configAgua.areas_solicitantes.length) {
      div.innerHTML = '<p class="text-xs text-slate-400 text-center py-3">Sin áreas registradas.</p>';
      return;
    }
    div.innerHTML = configAgua.areas_solicitantes.map(area => `
      <div class="flex items-center justify-between gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100 group hover:border-blue-300 transition-all">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-blue-500 text-white text-xs flex items-center justify-center font-bold">🏢</span>
          <span class="text-sm font-medium text-slate-700">${area}</span>
        </div>
        <button class="btn-del-area text-xs px-2 py-1 rounded text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all" data-area="${area}">🗑️</button>
      </div>`).join('');

    div.querySelectorAll('.btn-del-area').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`¿Eliminar el área "${btn.dataset.area}"?`)) return;
        try {
          configAgua.areas_solicitantes = await eliminarAreaSolicitante(btn.dataset.area);
          renderAreasSolicitantes();
          showAlert('#alert-catalogos', `✅ Área "${btn.dataset.area}" eliminada.`);
        } catch (e) { showAlert('#alert-catalogos', '❌ ' + e.message, 'error'); }
      });
    });
  }

  async function cargarConfigAgua() {
    try {
      configAgua = await getConfigAgua();
      const inp = container.querySelector('#agua-max-bidones');
      if (inp) inp.value = configAgua.max_bidones;
      renderAreasSolicitantes();
    } catch (e) { console.error('Error al cargar config agua:', e); }
  }
  cargarConfigAgua();

  container.querySelector('#btn-guardar-max-bidones')?.addEventListener('click', async () => {
    const val = parseInt(container.querySelector('#agua-max-bidones').value);
    if (!val || val < 1) { showAlert('#alert-catalogos', '⚠️ Ingresa un número válido mayor a 0.', 'error'); return; }
    const btn = container.querySelector('#btn-guardar-max-bidones');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      await actualizarMaxBidones(val);
      configAgua.max_bidones = val;
      showAlert('#alert-catalogos', `✅ Máximo de bidones actualizado a ${val}.`);
    } catch (e) { showAlert('#alert-catalogos', '❌ ' + e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = '💾 Guardar'; }
  });

  container.querySelector('#form-add-area')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = container.querySelector('#area-nombre').value.trim();
    if (!nombre) return;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = '...';
    try {
      configAgua.areas_solicitantes = await agregarAreaSolicitante(nombre);
      renderAreasSolicitantes();
      e.target.reset();
      showAlert('#alert-catalogos', `✅ Área "${nombre.toUpperCase()}" agregada.`);
    } catch (e) { showAlert('#alert-catalogos', '❌ ' + e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = '+ Agregar'; }
  });

  // Agregar pabellón
  container.querySelector('#form-add-pabellon').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const codigo = container.querySelector('#pabellon-codigo').value.trim().toUpperCase();
    const nombre = container.querySelector('#pabellon-nombre').value.trim();
    const max_pisos = parseInt(container.querySelector('#pabellon-pisos').value);
    btn.disabled = true; btn.textContent = '...';
    try { const n = await agregarPabellon(codigo, nombre, max_pisos); catalogos.pabellones.push(n); catalogos.pabellones.sort((a, b) => a.nombre.localeCompare(b.nombre)); renderPabellones(); sincFiltros(); e.target.reset(); showAlert('#alert-catalogos', `✅ Pabellón "${nombre}" agregado.`); }
    catch (e) { showAlert('#alert-catalogos', '❌ ' + e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = '+ Agregar'; }
  });

  // Agregar insumo
  container.querySelector('#form-add-insumo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const nombre = container.querySelector('#insumo-nombre').value.trim().toUpperCase().replace(/ /g, '_');
    btn.disabled = true; btn.textContent = '...';
    try { await agregarInsumo(nombre); catalogos.insumos.push(nombre); catalogos.insumos.sort(); renderInsumos(); renderStock(); sincFiltros(); e.target.reset(); showAlert('#alert-catalogos', `✅ Insumo "${nombre}" agregado.`); }
    catch (e) { showAlert('#alert-catalogos', '❌ ' + e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = '+ Agregar'; }
  });

  // ====== REGULARIZACIÓN ======
  const tbodyReg = container.querySelector('#tbody-regularizacion');
  const tbodyRegAgua = container.querySelector('#tbody-reg-agua');
  let entregaIdPendiente = null;
  const regDamas = container.querySelector('#reg-damas');
  const regVarones = container.querySelector('#reg-varones');
  const regDisc = container.querySelector('#reg-discapacitado');
  const regTotal = container.querySelector('#reg-total');

  function actualizarTotalModal() { regTotal.textContent = (parseInt(regDamas.value) || 0) + (parseInt(regVarones.value) || 0) + (parseInt(regDisc.value) || 0); }
  [regDamas, regVarones, regDisc].forEach(i => i.addEventListener('input', actualizarTotalModal));

  function abrirModalReg(id) { entregaIdPendiente = id; container.querySelector('#modal-regularizar').style.display = 'flex'; container.querySelector('#modal-regularizar').classList.remove('hidden'); container.querySelector('#reg-piso').value = ''; regDamas.value = 0; regVarones.value = 0; regDisc.value = 0; actualizarTotalModal(); container.querySelector('#alert-modal-reg').innerHTML = ''; }
  function cerrarModalReg() { container.querySelector('#modal-regularizar').style.display = ''; container.querySelector('#modal-regularizar').classList.add('hidden'); entregaIdPendiente = null; }

  container.querySelector('#btn-cancelar-reg').addEventListener('click', cerrarModalReg);
  container.querySelector('#btn-confirmar-reg').addEventListener('click', async () => {
    if (!entregaIdPendiente) return;
    const piso = parseInt(container.querySelector('#reg-piso').value) || null;
    const d = parseInt(regDamas.value) || 0, v = parseInt(regVarones.value) || 0, dc = parseInt(regDisc.value) || 0;
    const btn = container.querySelector('#btn-confirmar-reg');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      const user = await getCurrentUser();
      await regularizarEntrega(entregaIdPendiente, piso, d, v, dc, user.uid);
      cerrarModalReg(); cargarEntregas(getFiltros());
    } catch (err) { container.querySelector('#alert-modal-reg').innerHTML = `<div class="alert alert-error mb-3">❌ ${err.message}</div>`; }
    finally { btn.disabled = false; btn.textContent = '✓ Confirmar'; }
  });

  // -- Modal Editar Registro --
  const editRegDamas   = container.querySelector('#edit-reg-damas');
  const editRegVarones = container.querySelector('#edit-reg-varones');
  const editRegDiscap  = container.querySelector('#edit-reg-discap');
  const editRegTotal   = container.querySelector('#edit-reg-total');
  function actualizarTotalEditReg() { editRegTotal.textContent = (parseInt(editRegDamas.value)||0) + (parseInt(editRegVarones.value)||0) + (parseInt(editRegDiscap.value)||0); }
  [editRegDamas, editRegVarones, editRegDiscap].forEach(i => i.addEventListener('input', actualizarTotalEditReg));

  function abrirModalEditReg(entrega) {
    const det = entrega.detalle_banos || {};
    container.querySelector('#edit-reg-id').value       = entrega.id;
    container.querySelector('#edit-reg-fecha').value    = entrega.fecha_registro || '';
    container.querySelector('#edit-reg-piso').value     = entrega.piso ?? '';
    editRegDamas.value   = det.damas ?? 0;
    editRegVarones.value = det.varones ?? 0;
    editRegDiscap.value  = det.discapacitado ?? 0;
    actualizarTotalEditReg();
    container.querySelector('#alert-modal-edit-reg').innerHTML = '';
    container.querySelector('#modal-edit-registro').style.display = 'flex';
    container.querySelector('#modal-edit-registro').classList.remove('hidden');
  }
  function cerrarModalEditReg() {
    container.querySelector('#modal-edit-registro').style.display = '';
    container.querySelector('#modal-edit-registro').classList.add('hidden');
  }
  container.querySelector('#btn-cancelar-edit-reg').addEventListener('click', cerrarModalEditReg);
  container.querySelector('#btn-confirmar-edit-reg').addEventListener('click', async () => {
    const id    = container.querySelector('#edit-reg-id').value;
    const fecha = container.querySelector('#edit-reg-fecha').value;
    const piso  = parseInt(container.querySelector('#edit-reg-piso').value) || null;
    const d = parseInt(editRegDamas.value)||0, v = parseInt(editRegVarones.value)||0, dc = parseInt(editRegDiscap.value)||0;
    const btn = container.querySelector('#btn-confirmar-edit-reg');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      await actualizarEntrega(id, {
        fecha_registro: fecha,
        piso,
        detalle_banos: { damas: d, varones: v, discapacitado: dc },
        cantidad_total: d + v + dc
      });
      cerrarModalEditReg(); cargarEntregas(getFiltros());
      showAlert('#alert-regularizacion', '✅ Registro actualizado.');
    } catch (err) {
      container.querySelector('#alert-modal-edit-reg').innerHTML = `<div class="alert alert-error mb-3">❌ ${err.message}</div>`;
    } finally { btn.disabled = false; btn.textContent = '💾 Guardar Cambios'; }
  });

  // -- Modal Eliminar Registro --
  function abrirModalDelete(id, descripcion = '') {
    container.querySelector('#delete-reg-id').value = id;
    container.querySelector('#delete-confirm-msg').textContent = `Se eliminará: ${descripcion}. Esta acción no se puede deshacer.`;
    container.querySelector('#modal-confirm-delete').style.display = 'flex';
    container.querySelector('#modal-confirm-delete').classList.remove('hidden');
  }
  function cerrarModalDelete() {
    container.querySelector('#modal-confirm-delete').style.display = '';
    container.querySelector('#modal-confirm-delete').classList.add('hidden');
  }
  container.querySelector('#btn-cancelar-delete').addEventListener('click', cerrarModalDelete);
  container.querySelector('#btn-confirmar-delete').addEventListener('click', async () => {
    const id  = container.querySelector('#delete-reg-id').value;
    const btn = container.querySelector('#btn-confirmar-delete');
    btn.disabled = true; btn.textContent = 'Eliminando...';
    try {
      await eliminarEntrega(id);
      cerrarModalDelete(); cargarEntregas(getFiltros());
      showAlert('#alert-regularizacion', '✅ Registro eliminado.');
    } catch (err) { alert('❌ Error: ' + err.message); }
    finally { btn.disabled = false; btn.textContent = '🗑️ Eliminar'; }
  });

  async function cargarEntregas(filtros = {}) {
    tbodyReg.innerHTML     = '<tr><td colspan="11" class="text-center text-slate-400 py-8">Cargando...</td></tr>';
    tbodyRegAgua.innerHTML = '<tr><td colspan="8" class="text-center text-slate-400 py-6">Cargando...</td></tr>';
    try {
      const todasEntregas = await filtrarEntregas(filtros.fechaInicio, filtros.fechaFin, filtros.insumo, filtros.pabellon, filtros.estado);
      const entregasAgua    = todasEntregas.filter(e => e.tipo_registro === 'AGUA' || (e.insumo || '').toUpperCase() === 'AGUA');
      const entregas        = todasEntregas.filter(e => e.tipo_registro !== 'AGUA' && (e.insumo || '').toUpperCase() !== 'AGUA');

      // ---- Tabla normal ----
      tbodyReg.innerHTML = '';
      if (!entregas.length) {
        tbodyReg.innerHTML = '<tr><td colspan="11" class="text-center text-slate-400 py-8">No hay entregas.</td></tr>';
      } else {
        entregas.forEach(e => {
          const esReg = e.estado === 'REGULARIZADO'; const det = e.detalle_banos || {};
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="text-sm">${e.fecha_registro}</td>
            <td class="text-sm font-medium">${(e.insumo || '').replace(/_/g, ' ')}</td>
            <td class="text-sm">${e.pabellon || '-'}</td>
            <td class="text-sm text-center">${e.piso ?? '-'}</td>
            <td class="text-sm text-center">${det.damas ?? '-'}</td>
            <td class="text-sm text-center">${det.varones ?? '-'}</td>
            <td class="text-sm text-center">${det.discapacitado ?? '-'}</td>
            <td class="text-sm text-center font-bold">${e.cantidad_total ?? '-'}</td>
            <td class="text-sm">${e.encargado?.nombre || '-'}</td>
            <td><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${esReg ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">${esReg ? '✓ Reg.' : '⏳ Pend.'}</span></td>
            <td class="whitespace-nowrap">
              <div class="flex gap-1 items-center">
                ${!esReg ? `<button class="btn-reg text-xs px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold" data-id="${e.id}">⚙️ Reg.</button>` : ''}
                <button class="btn-edit-reg text-xs px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold" data-id="${e.id}">✏️</button>
                <button class="btn-del-reg text-xs px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold" data-id="${e.id}" data-desc="${e.fecha_registro} | ${(e.insumo||'').replace(/_/g,' ')} | ${e.pabellon||'-'}">🗑️</button>
              </div>
            </td>`;
          tbodyReg.appendChild(tr);
        });
        container.querySelectorAll('.btn-reg').forEach(btn => btn.addEventListener('click', () => abrirModalReg(btn.dataset.id)));
        container.querySelectorAll('.btn-edit-reg').forEach(btn => btn.addEventListener('click', () => {
          const entrega = entregas.find(x => x.id === btn.dataset.id);
          if (entrega) abrirModalEditReg(entrega);
        }));
        container.querySelectorAll('.btn-del-reg').forEach(btn => btn.addEventListener('click', () => abrirModalDelete(btn.dataset.id, btn.dataset.desc)));
      }

      // ---- Tabla Agua ----
      const countEl = container.querySelector('#reg-agua-count');
      if (countEl) countEl.textContent = entregasAgua.length ? `${entregasAgua.length} registro(s)` : '';
      tbodyRegAgua.innerHTML = '';
      if (!entregasAgua.length) {
        tbodyRegAgua.innerHTML = '<tr><td colspan="8" class="text-center text-slate-400 py-6">Sin entregas de Agua.</td></tr>';
      } else {
        entregasAgua.forEach(e => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="text-sm">${e.fecha_registro}</td>
            <td class="text-sm font-medium text-blue-700">${e.area_solicitante || '-'}</td>
            <td class="text-sm">${e.pabellon || '-'}</td>
            <td class="text-sm text-center">${e.piso ?? '-'}</td>
            <td class="text-sm">${e.ubicacion_exacta || '-'}</td>
            <td class="text-sm text-center font-bold text-blue-700">${e.cantidad_bidones ?? e.cantidad_total ?? '-'} 🫙</td>
            <td class="text-sm">${e.encargado?.nombre || '-'}</td>
            <td>
              <button class="btn-del-agua text-xs px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold" data-id="${e.id}" data-desc="${e.fecha_registro} | Agua | ${e.pabellon||'-'}">🗑️</button>
            </td>`;
          tbodyRegAgua.appendChild(tr);
        });
        container.querySelectorAll('.btn-del-agua').forEach(btn => btn.addEventListener('click', () => abrirModalDelete(btn.dataset.id, btn.dataset.desc)));
      }
    } catch (err) {
      tbodyReg.innerHTML     = '<tr><td colspan="11" class="text-center text-red-400 py-8">Error al cargar.</td></tr>';
      tbodyRegAgua.innerHTML = '<tr><td colspan="8" class="text-center text-red-400 py-6">Error al cargar.</td></tr>';
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
    ['#filtro-fecha-inicio', '#filtro-fecha-fin', '#filtro-insumo', '#filtro-pabellon', '#filtro-estado'].forEach(s => { container.querySelector(s).value = ''; });
    cargarEntregas();
  });
  cargarEntregas();

  // ====== USUARIOS ======
  const tbodyUsers = container.querySelector('#tbody-usuarios');
  async function cargarUsuarios() {
    tbodyUsers.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-8">Cargando...</td></tr>';
    try {
      const usuarios = await obtenerTodosLosUsuarios();
      tbodyUsers.innerHTML = '';
      usuarios.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="font-medium text-slate-800">${u.nombre_completo}</td>
          <td class="font-mono text-sm">${u.dni}</td>
          <td class="text-sm text-slate-500">${u.correo}</td>
          <td><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">${u.rol}</span></td>
          <td><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${u.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${u.activo ? '● Activo' : '○ Inactivo'}</span></td>
          <td><button class="btn-toggle text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${u.activo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}" data-id="${u.id}" data-activo="${!u.activo}">${u.activo ? 'Desactivar' : 'Activar'}</button></td>`;
        tbodyUsers.appendChild(tr);
      });
      container.querySelectorAll('.btn-toggle').forEach(btn => {
        btn.addEventListener('click', async () => {
          try { await cambiarEstadoUsuario(btn.dataset.id, btn.dataset.activo === 'true'); cargarUsuarios(); }
          catch (err) { showAlert('#alert-usuarios', '❌ ' + err.message, 'error'); }
        });
      });
    } catch (e) { tbodyUsers.innerHTML = '<tr><td colspan="6" class="text-center text-red-400 py-8">Error.</td></tr>'; }
  }
  container.querySelector('#form-nuevo-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = container.querySelector('#btn-agregar-usuario');
    btn.disabled = true; btn.textContent = 'Registrando...';
    try {
      await registrarUsuario(container.querySelector('#nuevo-correo').value, container.querySelector('#nuevo-dni').value, container.querySelector('#nuevo-nombre').value, container.querySelector('#nuevo-rol').value, container.querySelector('#nuevo-activo').value === 'true');
      showAlert('#alert-usuarios', '✅ Usuario registrado.'); e.target.reset(); cargarUsuarios();
    } catch (err) { showAlert('#alert-usuarios', '❌ ' + err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = '✓ Registrar Usuario'; }
  });
  cargarUsuarios();

  // ====== EXPORTAR ======
  let entregasExportAgua = [];

  async function cargarExport() {
    const tbody     = container.querySelector('#tbody-export');
    const tbodyAgua = container.querySelector('#tbody-export-agua');
    const countAgua = container.querySelector('#exp-agua-count');
    tbody.innerHTML     = '<tr><td colspan="10" class="text-center text-slate-400 py-8">Cargando...</td></tr>';
    tbodyAgua.innerHTML = '<tr><td colspan="8" class="text-center text-slate-400 py-8">Cargando...</td></tr>';
    const filtros = {
      fechaInicio: container.querySelector('#exp-fecha-inicio').value || null,
      fechaFin:    container.querySelector('#exp-fecha-fin').value    || null,
      insumo:      container.querySelector('#exp-insumo').value       || null,
      pabellon:    container.querySelector('#exp-pabellon').value     || null
    };
    try {
      const todas = await filtrarEntregas(filtros.fechaInicio, filtros.fechaFin, filtros.insumo, filtros.pabellon);

      // Separar Agua del resto
      entregasExportAgua = todas.filter(e => e.tipo_registro === 'AGUA' || (e.insumo || '').toUpperCase() === 'AGUA');
      entregasExport     = todas.filter(e => e.tipo_registro !== 'AGUA' && (e.insumo || '').toUpperCase() !== 'AGUA');

      // ---- Tabla normal ----
      tbody.innerHTML = '';
      if (!entregasExport.length) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-slate-400 py-8">Sin resultados.</td></tr>';
        container.querySelector('#exp-count').textContent = '';
      } else {
        entregasExport.forEach(e => {
          const det = e.detalle_banos || {};
          const tr = document.createElement('tr');
          tr.innerHTML = `<td class="text-sm">${e.fecha_registro}</td><td class="text-sm font-medium">${(e.insumo || '').replace(/_/g, ' ')}</td><td class="text-sm">${e.pabellon || '-'}</td><td class="text-sm text-center">${e.piso ?? '-'}</td><td class="text-sm text-center">${det.damas ?? 0}</td><td class="text-sm text-center">${det.varones ?? 0}</td><td class="text-sm text-center">${det.discapacitado ?? 0}</td><td class="text-sm text-center font-bold">${e.cantidad_total ?? 0}</td><td><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${e.estado === 'REGULARIZADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">${e.estado}</span></td><td class="text-sm">${e.encargado?.nombre || '-'}</td>`;
          tbody.appendChild(tr);
        });
        container.querySelector('#exp-count').textContent = `${entregasExport.length} registro(s) encontrado(s).`;
      }

      // ---- Tabla Agua ----
      tbodyAgua.innerHTML = '';
      if (countAgua) countAgua.textContent = entregasExportAgua.length ? `${entregasExportAgua.length} registro(s)` : '';
      if (!entregasExportAgua.length) {
        tbodyAgua.innerHTML = '<tr><td colspan="8" class="text-center text-slate-400 py-8">Sin entregas de Agua.</td></tr>';
      } else {
        entregasExportAgua.forEach(e => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="text-sm">${e.fecha_registro}</td>
            <td class="text-sm font-medium">${(e.insumo || '').replace(/_/g, ' ')}</td>
            <td class="text-sm text-center font-bold text-blue-700">${e.cantidad_bidones ?? e.cantidad_total ?? '-'}</td>
            <td class="text-sm font-medium">${e.area_solicitante || '-'}</td>
            <td class="text-sm">${e.pabellon || '-'}</td>
            <td class="text-sm text-center">${e.piso ?? '-'}</td>
            <td class="text-sm">${e.ubicacion_exacta || '-'}</td>
            <td class="text-sm">${e.encargado?.nombre || '-'}</td>`;
          tbodyAgua.appendChild(tr);
        });
      }
    } catch (err) {
      tbody.innerHTML     = '<tr><td colspan="10" class="text-center text-red-400 py-8">Error al cargar.</td></tr>';
      tbodyAgua.innerHTML = '<tr><td colspan="8" class="text-center text-red-400 py-8">Error al cargar.</td></tr>';
    }
  }
  container.querySelector('#btn-exp-filtrar').addEventListener('click', cargarExport);

  // Exportar Excel normal
  container.querySelector('#btn-exp-excel').addEventListener('click', () => {
    if (!entregasExport.length) return alert('Primero realiza una búsqueda.');
    const header = ['FECHA', 'INSUMO', 'PABELLON', 'PISO', 'DAMAS', 'VARONES', 'DISCAPACITADO', 'TOTAL', 'ESTADO', 'ENCARGADO'];
    const rows = entregasExport.map(e => { const det = e.detalle_banos || {}; return [e.fecha_registro, e.insumo, e.pabellon, e.piso ?? '', det.damas ?? 0, det.varones ?? 0, det.discapacitado ?? 0, e.cantidad_total ?? 0, e.estado, e.encargado?.nombre || '']; });
    const csv = '\uFEFF' + [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `entregas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  });

  // Exportar PDF normal
  container.querySelector('#btn-exp-pdf').addEventListener('click', () => {
    if (!entregasExport.length) return alert('Primero realiza una búsqueda.');
    const filas = entregasExport.map(e => { const det = e.detalle_banos || {}; return `<tr><td>${e.fecha_registro}</td><td>${(e.insumo || '').replace(/_/g, ' ')}</td><td>${e.pabellon || '-'}</td><td>${e.piso ?? '-'}</td><td>${det.damas ?? 0}</td><td>${det.varones ?? 0}</td><td>${det.discapacitado ?? 0}</td><td><b>${e.cantidad_total ?? 0}</b></td><td>${e.estado}</td><td>${e.encargado?.nombre || '-'}</td></tr>`; }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte de Entregas</title><style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px}h2{color:#0d9488}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:5px 8px;text-align:center}th{background:#0d9488;color:#fff}tr:nth-child(even){background:#f8fafc}</style></head><body><h2>Reporte de Entregas — PAB-IN</h2><p>Generado el ${new Date().toLocaleString('es-PE')}</p><table><thead><tr><th>FECHA</th><th>INSUMO</th><th>PABELLÓN</th><th>PISO</th><th>DAMAS</th><th>VARONES</th><th>DISCAP.</th><th>TOTAL</th><th>ESTADO</th><th>ENCARGADO</th></tr></thead><tbody>${filas}</tbody></table></body></html>`;
    const w = window.open('', '_blank', 'width=1100,height=700'); w.document.write(html); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 500);
  });

  // Exportar Excel Agua
  container.querySelector('#btn-exp-agua-excel').addEventListener('click', () => {
    if (!entregasExportAgua.length) return alert('No hay registros de Agua para exportar.');
    const header = ['FECHA', 'INSUMO', 'CANTIDAD BIDONES', 'AREA SOLICITANTE', 'PABELLON', 'PISO', 'UBICACION EXACTA', 'ENCARGADO'];
    const rows = entregasExportAgua.map(e => [e.fecha_registro, e.insumo, e.cantidad_bidones ?? e.cantidad_total ?? '', e.area_solicitante || '', e.pabellon || '', e.piso ?? '', e.ubicacion_exacta || '', e.encargado?.nombre || '']);
    const csv = '\uFEFF' + [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `entregas_agua_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  });

  // Exportar PDF Agua
  container.querySelector('#btn-exp-agua-pdf').addEventListener('click', () => {
    if (!entregasExportAgua.length) return alert('No hay registros de Agua para exportar.');
    const filas = entregasExportAgua.map(e => `<tr><td>${e.fecha_registro}</td><td>${(e.insumo||'').replace(/_/g,' ')}</td><td><b>${e.cantidad_bidones ?? e.cantidad_total ?? '-'}</b></td><td>${e.area_solicitante||'-'}</td><td>${e.pabellon||'-'}</td><td>${e.piso??'-'}</td><td>${e.ubicacion_exacta||'-'}</td><td>${e.encargado?.nombre||'-'}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte Agua</title><style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px}h2{color:#0284c7}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:5px 8px;text-align:center}th{background:#0284c7;color:#fff}tr:nth-child(even){background:#f0f9ff}</style></head><body><h2>💧 Reporte de Entregas de Agua — PAB-IN</h2><p>Generado el ${new Date().toLocaleString('es-PE')}</p><table><thead><tr><th>FECHA</th><th>INSUMO</th><th>BIDONES</th><th>ÁREA SOLICITANTE</th><th>PABELLÓN</th><th>PISO</th><th>UBICACIÓN EXACTA</th><th>ENCARGADO</th></tr></thead><tbody>${filas}</tbody></table></body></html>`;
    const w = window.open('', '_blank', 'width=1100,height=700'); w.document.write(html); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 500);
  });

  // =====================================================================
  // ===== TAB DASHBOARD =================================================
  // =====================================================================
  (function initDashboard() {
    // --- helpers de fecha ---
    const hoyStr = () => new Date().toISOString().split('T')[0];
    const hoy    = new Date();

    // Poblar selectores mes/año
    const selMes  = container.querySelector('#dash-mes');
    const selAnio = container.querySelector('#dash-anio');
    const meses   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    meses.forEach((m, i) => {
      const o = document.createElement('option');
      o.value = i + 1; o.textContent = m;
      if (i === hoy.getMonth()) o.selected = true;
      selMes.appendChild(o);
    });
    for (let y = hoy.getFullYear(); y >= hoy.getFullYear() - 3; y--) {
      const o = document.createElement('option'); o.value = y; o.textContent = y;
      if (y === hoy.getFullYear()) o.selected = true;
      selAnio.appendChild(o);
    }

    // Referencias a instancias de Chart.js (para destruir y recrear)
    let chartLinea, chartDona, chartPabellon, chartStock, chartOps, chartAgua;

    function destroyCharts() {
      [chartLinea, chartDona, chartPabellon, chartStock, chartOps, chartAgua].forEach(c => { if (c) c.destroy(); });
    }

    // Cargar Chart.js dinámicamente (solo una vez)
    function loadChartJs() {
      return new Promise((resolve) => {
        if (window.Chart) return resolve();
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
        s.onload = resolve;
        document.head.appendChild(s);
      });
    }

    // Paleta de colores
    const PALETTE = ['#0d9488','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#10b981','#ef4444','#06b6d4','#84cc16','#f97316'];

    async function cargarDashboard() {
      const mes  = parseInt(selMes.value);
      const anio = parseInt(selAnio.value);
      const loading = container.querySelector('#dash-loading');
      loading.classList.remove('hidden');

      await loadChartJs();

      try {
        // Traer todos los registros usando funciones ya importadas en el módulo
        const todasEntregas = await obtenerTodasLasEntregas();
        const stockData     = await getStock();

        const hoyStr2 = hoyStr();

        // Separar agua de normales
        const esAgua = e => (e.tipo_registro === 'AGUA' || (e.insumo||'').toUpperCase() === 'AGUA');

        // ---- KPI 1 & 2: Entregas y unidades de hoy ----
        const entregasHoy = todasEntregas.filter(e => e.fecha_registro === hoyStr2 && !esAgua(e));
        container.querySelector('#kpi-entregas-hoy').textContent  = entregasHoy.length;
        container.querySelector('#kpi-unidades-hoy').textContent  = entregasHoy.reduce((s,e) => s + (e.cantidad_total||0), 0);

        // ---- KPI 3: Por regularizar (global, sin agua) ----
        container.querySelector('#kpi-por-regularizar').textContent =
          todasEntregas.filter(e => !esAgua(e) && e.estado === 'POR_REGULARIZAR').length;

        // ---- KPI 4: Bidones de agua hoy ----
        const aguaHoy = todasEntregas.filter(e => esAgua(e) && e.fecha_registro === hoyStr2);
        container.querySelector('#kpi-bidones-hoy').textContent = aguaHoy.reduce((s,e) => s + (e.cantidad_bidones ?? e.cantidad_total ?? 0), 0);

        // Filtrar por mes/año seleccionado (solo registros normales para KPIs 5 y 6)
        const mesStr  = String(mes).padStart(2,'0');
        const prefijo = `${anio}-${mesStr}`;
        const delMes  = todasEntregas.filter(e => !esAgua(e) && (e.fecha_registro||'').startsWith(prefijo));

        // ---- KPI 5: Insumo top del mes ----
        const porInsumo = {};
        delMes.forEach(e => { porInsumo[e.insumo||'?'] = (porInsumo[e.insumo||'?'] || 0) + (e.cantidad_total||0); });
        const insumoTop = Object.entries(porInsumo).sort((a,b)=>b[1]-a[1])[0];
        container.querySelector('#kpi-insumo-top').textContent = insumoTop ? (insumoTop[0].replace(/_/g,' ')) : '—';

        // ---- KPI 6: Pabellón top del mes ----
        const porPabellon = {};
        delMes.forEach(e => { porPabellon[e.pabellon||'?'] = (porPabellon[e.pabellon||'?'] || 0) + 1; });
        const pabTop = Object.entries(porPabellon).sort((a,b)=>b[1]-a[1])[0];
        container.querySelector('#kpi-pabellon-top').textContent = pabTop ? pabTop[0] : '—';

        destroyCharts();

        // ---- GRÁFICO 1: Línea últimos 30 días ----
        const dias30 = [];
        const contsDias = {};
        for (let d = 29; d >= 0; d--) {
          const f = new Date(); f.setDate(f.getDate() - d);
          const fStr = f.toISOString().split('T')[0];
          dias30.push(fStr.slice(5)); // MM-DD
          contsDias[fStr] = 0;
        }
        todasEntregas.filter(e => !esAgua(e)).forEach(e => {
          if (contsDias[e.fecha_registro] !== undefined) contsDias[e.fecha_registro]++;
        });
        chartLinea = new window.Chart(container.querySelector('#chart-linea-dias'), {
          type: 'line',
          data: {
            labels: dias30,
            datasets: [{
              label: 'Entregas',
              data: Object.values(contsDias),
              borderColor: '#0d9488', backgroundColor: 'rgba(13,148,136,0.1)',
              tension: 0.4, fill: true, pointRadius: 3, pointBackgroundColor: '#0d9488'
            }]
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true, ticks:{stepSize:1} } } }
        });

        // ---- GRÁFICO 2: Dona por insumo (mes) ----
        const insumosLabels = Object.keys(porInsumo);
        const insumosData   = insumosLabels.map(k => porInsumo[k]);
        chartDona = new window.Chart(container.querySelector('#chart-dona-insumos'), {
          type: 'doughnut',
          data: {
            labels: insumosLabels.map(l => l.replace(/_/g,' ')),
            datasets: [{ data: insumosData, backgroundColor: PALETTE.slice(0, insumosLabels.length), borderWidth: 2 }]
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ font:{size:11} } } } }
        });

        // ---- GRÁFICO 3: Barras por pabellón (mes) ----
        const pabLabels = Object.keys(porPabellon).sort((a,b) => porPabellon[b]-porPabellon[a]);
        const pabData   = pabLabels.map(k => porPabellon[k]);
        chartPabellon = new window.Chart(container.querySelector('#chart-barras-pabellon'), {
          type: 'bar',
          data: {
            labels: pabLabels,
            datasets: [{ label: 'Entregas', data: pabData, backgroundColor: PALETTE[0], borderRadius: 6 }]
          },
          options: { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ x:{ beginAtZero:true, ticks:{stepSize:1} } } }
        });

        // ---- GRÁFICO 4: Stock actual ----
        const stockEntries = Object.entries(stockData || {}).filter(([k]) => k.toUpperCase() !== 'AGUA');
        chartStock = new window.Chart(container.querySelector('#chart-stock'), {
          type: 'bar',
          data: {
            labels: stockEntries.map(([k]) => k.replace(/_/g,' ')),
            datasets: [{
              label: 'Stock',
              data: stockEntries.map(([,v]) => v),
              backgroundColor: stockEntries.map(([,v]) => v > 50 ? '#10b981' : v > 20 ? '#f59e0b' : '#ef4444'),
              borderRadius: 6
            }]
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true } } }
        });

        // ---- GRÁFICO 5: Entregas por operador (mes) ----
        const porOp = {};
        delMes.forEach(e => {
          const nombre = e.encargado?.nombre || e.encargado || 'Desconocido';
          porOp[nombre] = (porOp[nombre]||0) + 1;
        });
        const opLabels = Object.keys(porOp).sort((a,b)=>porOp[b]-porOp[a]);
        chartOps = new window.Chart(container.querySelector('#chart-operadores'), {
          type: 'bar',
          data: {
            labels: opLabels,
            datasets: [{ label: 'Entregas', data: opLabels.map(k=>porOp[k]), backgroundColor: PALETTE[1], borderRadius: 6 }]
          },
          options: { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ x:{ beginAtZero:true, ticks:{stepSize:1} } } }
        });

        // ---- GRÁFICO 6: Agua por área solicitante (mes) ----
        const aguaMes = todasEntregas.filter(e => esAgua(e) && (e.fecha_registro||'').startsWith(prefijo));
        const porArea = {};
        aguaMes.forEach(e => {
          const area = e.area_solicitante || 'Sin área';
          porArea[area] = (porArea[area]||0) + (e.cantidad_bidones ?? e.cantidad_total ?? 0);
        });
        const areaLabels = Object.keys(porArea).sort((a,b)=>porArea[b]-porArea[a]);
        chartAgua = new window.Chart(container.querySelector('#chart-agua-areas'), {
          type: 'bar',
          data: {
            labels: areaLabels,
            datasets: [{ label: 'Bidones', data: areaLabels.map(k=>porArea[k]), backgroundColor: '#3b82f6', borderRadius: 6 }]
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true, ticks:{stepSize:1} } } }
        });

      } catch(err) {
        console.error('Error al cargar dashboard:', err);
      } finally {
        loading.classList.add('hidden');
      }
    }

    container.querySelector('#btn-dash-cargar').addEventListener('click', cargarDashboard);

    // Cargar automáticamente cuando se activa el tab Dashboard
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        if (m.target.id === 'tab-dashboard' && !m.target.classList.contains('hidden')) {
          cargarDashboard();
          observer.disconnect();
        }
      });
    });
    const tabDash = container.querySelector('#tab-dashboard');
    if (tabDash) observer.observe(tabDash, { attributes: true, attributeFilter: ['class'] });
  })();

}
