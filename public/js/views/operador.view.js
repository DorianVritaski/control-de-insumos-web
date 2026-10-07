// Vista del Módulo Operador
// Formulario de Registro de Entregas
// Según la especificación Spec_Driven_Development.md - Sección 6.2, RF-02

import { registrarEntrega } from "../services/entregas.service.js";
import { getPabellones } from "../services/catalogos.service.js";
import { isAuthenticated, getCurrentUser } from "../services/auth.service.js";

export function operadorView() {
  const container = document.createElement("div");

  container.innerHTML = `
    <div class="row">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header bg-blue-600 text-white"><h3>Registro de Entrega</h3></div>
          <div class="card-body">
            <div id="alert-container"></div>
            <form id="registro-form">
              <div class="form-group">
                <label class="form-label" for="insumo">Tipo de Insumo</label>
                <select id="insumo" class="form-input" required>
                  <option value="">Seleccione...</option>
                  <option value="PAPEL_HIGIENICO">Papel Higiénico</option>
                  <option value="JABON">Jabón</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="pabellon">Pabellón</label>
                <select id="pabellon" class="form-input" required><option value="">Cargando...</option></select>
              </div>
              <div class="form-group">
                <label class="form-label" for="piso">Piso <span class="text-muted">(opcional)</span></label>
                <input type="number" id="piso" class="form-input" placeholder="Ej. 3" min="1" max="99">
              </div>
              <div class="form-row">
                <div class="form-group col-md-4"><label class="form-label" for="damas">Damas</label><input type="number" id="damas" class="form-input" placeholder="Cantidad" min="0" value="0"></div>
                <div class="form-group col-md-4"><label class="form-label" for="varones">Varones</label><input type="number" id="varones" class="form-input" placeholder="Cantidad" min="0" value="0"></div>
                <div class="form-group col-md-4"><label class="form-label" for="discapacitado">Discapacitado</label><input type="number" id="discapacitado" class="form-input" placeholder="Cantidad" min="0" value="0"></div>
              </div>
              <div class="form-group">
                <label class="form-label" for="cantidadTotal">Cantidad Total</label>
                <input type="number" id="cantidadTotal" class="form-input" placeholder="Autocompletado" min="0" readonly>
                <small class="text-muted">Calcula automáticamente: Damas + Varones + Discapacitado</small>
              </div>
              <div class="form-group">
                <label class="form-label" for="encargado">Nombre del Encargado</label>
                <input type="text" id="encargado" class="form-input" placeholder="Nombre completo" readonly>
              </div>
              <div class="form-group">
                <label class="form-label" for="encargadoDni">DNI del Encargado</label>
                <input type="text" id="encargadoDni" class="form-input" placeholder="DNI" readonly>
              </div>
              <div class="form-group">
                <label class="form-label" for="observaciones">Observaciones <span class="text-muted">(opcional)</span></label>
                <textarea id="observaciones" class="form-input" rows="3" placeholder="Notas sobre la entrega..."></textarea>
              </div>
              <div class="form-group">
                <button type="submit" id="btn-registrar" class="btn btn-success w-full" disabled>Registrar Entrega</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card">
          <div class="card-header bg-secondary text-white"><h4 class="mb-0">Resumen del Día</h4></div>
          <div class="card-body">
            <h5 class="text-primary">Hola, <span id="operador-nombre"></span>!</h5>
            <p class="text-muted">Fecha: <span id="fecha-actual"></span></p>
            <hr>
            <ul class="list-group list-group-flush">
              <li class="list-group-item"><span class="badge badge-secondary">Operador</span><span id="operador-role"></span></li>
              <li class="list-group-item"><span class="badge badge-info">Entregas del día:</span><span id="entregas-contador">0</span></li>
              <li class="list-group-item"><span class="badge badge-warning">Estado:</span><span id="operador-estado">Activo</span></li>
            </ul>
          </div>
        </div>
        <div class="card mt-3">
          <div class="card-header bg-dark text-white"><h5 class="mb-0">Acciones Rápidas</h5></div>
          <div class="card-body">
            <button type="button" id="btn-registro-lote" class="btn btn-warning w-100"><i class="fas fa-box"></i> Entrega a Almacén (Lote)</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Inicializar la vista
  async function initView() {
    const insumo = container.querySelector("#insumo");
    const pabellon = container.querySelector("#pabellon");
    const piso = container.querySelector("#piso");
    const damas = container.querySelector("#damas");
    const varones = container.querySelector("#varones");
    const discapacitado = container.querySelector("#discapacitado");
    const cantidadTotal = container.querySelector("#cantidadTotal");
    const encargado = container.querySelector("#encargado");
    const encargadoDni = container.querySelector("#encargadoDni");
    const btnRegistrar = container.querySelector("#btn-registrar");
    const btnLote = container.querySelector("#btn-registro-lote");
    const alertContainer = container.querySelector("#alert-container");

    // Cargar pabellones
    async function cargarPabellones() {
      try {
        const pabellones = await getPabellones();
        pabellon.innerHTML = '<option value="">Seleccione...</option>';
        pabellones.forEach((p) => {
          const option = document.createElement("option");
          option.value = p.codigo;
          option.textContent = `${p.nombre} (Máx: ${p.max_pisos} pisos)`;
          pabellon.appendChild(option);
        });
      } catch (e) {
        alertContainer.innerHTML = `<div class="alert alert-error">Error al cargar pabellones: ${e.message}</div>`;
      }
    }

    // Calcular cantidad total automáticamente
    function actualizarCantidadTotal() {
      const d = parseInt(damas.value) || 0;
      const v = parseInt(varones.value) || 0;
      const dc = parseInt(discapacitado.value) || 0;
      const total = d + v + dc;
      cantidadTotal.value = total;

      const tieneDatos = insumo.value && pabellon.value && encargado.value.trim() && encargadoDni.value.trim();
      btnRegistrar.disabled = !tieneDatos;
    }

    // Cargar datos del operador
    async function cargarDatosOperador() {
      if (isAuthenticated()) {
        try {
          const user = await getCurrentUser();
          const nombre = user.nombre_completo || user.nombre || "Operador";
          container.querySelector("#operador-nombre").textContent = nombre;
          container.querySelector("#operador-role").textContent = user.rol;
          container.querySelector("#operador-estado").textContent = user.activo ? "Activo" : "Inactivo";

          const fecha = new Date();
          const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
          const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
          const fechaStr = `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]} del ${fecha.getFullYear()}`;
          container.querySelector("#fecha-actual").textContent = fechaStr;
        } catch (e) {
          console.error("Error al cargar usuario:", e);
        }
      }
      await cargarPabellones();
    }

    // Registrar entrega
    container.querySelector("#registro-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const uid = isAuthenticated() ? localStorage.getItem("currentUid") : null;

      const insumoValor = insumo.value;
      const pabellonValor = pabellon.value;
      const pisoValor = piso.value ? parseInt(piso.value) : null;
      const d = parseInt(damas.value) || 0;
      const v = parseInt(varones.value) || 0;
      const dc = parseInt(discapacitado.value) || 0;
      const enc = encargado.value.trim();
      const dn = encargadoDni.value.trim();
      const obs = encargado.value.trim();

      const errores = [];
      if (!insumoValor) errores.push("Debe seleccionar un insumo.");
      if (!pabellonValor) errores.push("Debe seleccionar un pabellón.");
      if (!enc) errores.push("Debe ingresar el nombre del encargado.");
      if (!dn) errores.push("Debe ingresar el DNI del encargado.");

      if (errores.length > 0) {
        alertContainer.innerHTML = `<div class="alert alert-error">${errores.map(e => "• " + e).join("<br>")}</div>`;
        return;
      }

      try {
        btnRegistrar.disabled = true;
        btnRegistrar.textContent = "Registrando...";

        const result = await registrarEntrega(insumoValor, pabellonValor, pisoValor, d, v, dc, enc, dn, uid, obs);

        alertContainer.innerHTML = `<div class="alert alert-success">✅ Entrega registrada exitosamente (ID: ${result.id}).</div>`;
        container.querySelector("#registro-form").reset();
        actualizarCantidadTotal();
      } catch (error) {
        alertContainer.innerHTML = `<div class="alert alert-error">❌ Error: ${error.message}</div>`;
      } finally {
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = "Registrar Entrega";
      }
    });

    // Botón de entrega a almacén (lote)
    btnLote.addEventListener("click", () => {
      piso.value = "";
      damas.value = "0";
      varones.value = "0";
      discapacitado.value = "0";
      cantidadTotal.value = "";
      actualizarCantidadTotal();
      alert("Modo almacén activado. Ingrese cantidad total y será marcado como POR_REGULARIZAR.");
    });

    // Botones de campo con cálculo automático
    [damas, varones, discapacitado].forEach((campo) => {
      campo.addEventListener("input", actualizarCantidadTotal);
    });

    // Inicializar
    await cargarDatosOperador();
  }

  initView();
}
