// Vista del Módulo Administrador
// Panel de Control y Configuración
// Según la especificación Spec_Driven_Development.md

import { filtrarEntregas, regularizarEntrega, obtenerTodasLasEntregas } from "../services/entregas.service.js";
import { getCatalogosCompletos, agregarPabellon, agregarInsumo } from "../services/catalogos.service.js";
import { obtenerTodosLosUsuarios, registrarUsuario, cambiarEstadoUsuario } from "../services/users.service.js";
import { exportEntregasMultiple } from "../utils/export.js";
import { isAuthenticated, getCurrentUser } from "../services/auth.service.js";

export function adminView() {
  const container = document.createElement("div");
  container.innerHTML = `
    <div class="card">
      <div class="card-header bg-blue-600 text-white"><h3>Panel de Administrador</h3></div>
      <div class="card-body">
        <ul class="nav nav-tabs">
          <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#regularizacion">Regularizacion</a></li>
          <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#usuarios">Usuarios</a></li>
          <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#catalogos">Catálogos</a></li>
          <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#export">Exportar</a></li>
        </ul>
        
        <div class="tab-content mt-3">
          <!-- TAB REGULARIZACION -->
          <div class="tab-pane fade show active" id="regularizacion">
            <div class="card mb-3">
              <div class="card-header bg-success text-white"><h5>Regularizar Entregas</h5></div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-3"><div class="form-group"><label class="form-label">Fecha Inicio</label><input type="date" id="filtro-fecha-inicio" class="form-input"></div></div>
                  <div class="col-md-3"><div class="form-group"><label class="form-label">Fecha Fin</label><input type="date" id="filtro-fecha-fin" class="form-input"></div></div>
                  <div class="col-md-2"><div class="form-group"><label class="form-label">Insumo</label><select id="filtro-insumo" class="form-input"><option value="">Todos</option><option value="PAPEL_HIGIENICO">Papel Higienico</option><option value="JABON">Jabon</option></select></div></div>
                  <div class="col-md-2"><div class="form-group"><label class="form-label">Pabellon</label><select id="filtro-pabellon" class="form-input"><option value="">Todos</option></select></div></div>
                  <div class="col-md-2"><div class="form-group"><label class="form-label">Estado</label><select id="filtro-estado" class="form-input"><option value="">Todos</option><option value="POR_REGULARIZAR">POR_REGULARIZAR</option><option value="REGULARIZADO">REGULARIZADO</option></select></div></div>
                </div>
                <button id="btn-filtrar" class="btn btn-primary mb-3">Filtrar</button>
                <button id="btn-limpiar-filtros" class="btn btn-secondary mb-3">Limpiar</button>
              </div>
            </div>
            <div class="card">
              <div class="card-header bg-primary text-white"><h5>Lista de Entregas</h5></div>
              <div class="card-body">
                <div id="tabla-regularizacion" class="table-responsive">
                  <table class="table table-striped">
                    <thead><tr><th>ID</th><th>Fecha</th><th>Insumo</th><th>Cantidad</th><th>Pabellon</th><th>Piso</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody id="tbody-regularizacion"><tr><td colspan="8" class="text-center">Cargando...</td></tr></tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB USUARIOS -->
          <div class="tab-pane fade" id="usuarios" style="display: none;">
            <div id="alert-usuarios"></div>
            <div class="card">
              <div class="card-header bg-primary text-white"><h5>Gestion de Usuarios</h5></div>
              <div class="card-body">
                <div class="card mb-3">
                  <div class="card-header bg-secondary text-white"><h6>Nuevo Usuario</h6></div>
                  <div class="card-body">
                    <form id="form-nuevo-usuario">
                      <div class="row">
                        <div class="col-md-6"><div class="form-group"><label class="form-label">Nombre Completo</label><input type="text" id="nuevo-nombre" class="form-input" required></div></div>
                        <div class="col-md-6"><div class="form-group"><label class="form-label">DNI</label><input type="text" id="nuevo-dni" class="form-input" maxlength="8" required></div></div>
                        <div class="col-md-6"><div class="form-group"><label class="form-label">Correo Institucional</label><input type="email" id="nuevo-correo" class="form-input" required></div></div>
                        <div class="col-md-6"><div class="form-group"><label class="form-label">Rol</label><select id="nuevo-rol" class="form-input"><option value="OPERADOR">Operador</option><option value="ADMIN">Administrador</option></select></div></div>
                        <div class="col-md-6"><div class="form-group"><label class="form-label">Estado</label><select id="nuevo-activo" class="form-input"><option value="true">Activo</option><option value="false">Inactivo</option></select></div></div>
                      </div>
                      <button type="submit" id="btn-agregar-usuario" class="btn btn-success mt-3">Agregar Usuario</button>
                    </form>
                  </div>
                </div>
                
                <div class="card">
                  <div class="card-header bg-dark text-white"><h5>Lista de Usuarios</h5></div>
                  <div class="card-body">
                    <div id="tabla-usuarios" class="table-responsive">
                      <table class="table table-striped">
                        <thead><tr><th>Nombre</th><th>DNI</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                        <tbody id="tbody-usuarios"><tr><td colspan="6" class="text-center">Cargando...</td></tr></tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB CATALOGOS -->
          <div class="tab-pane fade" id="catalogos" style="display: none;">
            <div id="alert-catalogos"></div>
            <div class="row">
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header bg-info text-white"><h5>Pabellones</h5></div>
                  <div class="card-body">
                    <ul id="lista-pabellones" class="list-group mb-3"></ul>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header bg-info text-white"><h5>Insumos</h5></div>
                  <div class="card-body">
                    <ul id="lista-insumos" class="list-group mb-3"></ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB EXPORT -->
          <div class="tab-pane fade" id="export" style="display: none;">
            <div id="alert-export"></div>
            <div class="card">
              <div class="card-header bg-warning text-white"><h5>Exportar Datos</h5></div>
              <div class="card-body">
                <div class="alert alert-info"><p>Exportar entregas filtradas o todas las entregas en formato CSV/Excel.</p></div>
                <button id="btn-exportar-csv" class="btn btn-primary">Descargar CSV</button>
              </div>
            </div>
          </div>

        </div> <!-- Fin tab-content -->
      </div>
    </div>
  `;

  setTimeout(() => initAdminView(container), 0);

  return container;
}

async function initAdminView(container) {
  // Manejo de tabs (Vanilla JS para evitar dependencia fuerte de Bootstrap JS)
  const tabs = container.querySelectorAll('.nav-link');
  const panes = container.querySelectorAll('.tab-pane');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.style.display = 'none');
      tab.classList.add('active');
      const target = container.querySelector(tab.getAttribute('href'));
      if(target) target.style.display = 'block';
    });
  });

  // Regularizacion
  const tbodyRegularizacion = container.querySelector('#tbody-regularizacion');
  const btnFiltrar = container.querySelector('#btn-filtrar');
  const btnLimpiar = container.querySelector('#btn-limpiar-filtros');
  const filtroPabellon = container.querySelector('#filtro-pabellon');

  // Cargar catalogos para los filtros
  let catalogos = { pabellones: [], insumos: [] };
  try {
    catalogos = await getCatalogosCompletos();
    catalogos.pabellones.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.codigo;
      opt.textContent = p.nombre;
      filtroPabellon.appendChild(opt);
    });
  } catch (error) {
    console.error("Error cargando catálogos", error);
  }

  async function cargarEntregas(filtros = {}) {
    tbodyRegularizacion.innerHTML = '<tr><td colspan="8" class="text-center">Cargando...</td></tr>';
    try {
      const entregas = await filtrarEntregas(filtros.fechaInicio, filtros.fechaFin, filtros.insumo, filtros.pabellon, filtros.estado);
      tbodyRegularizacion.innerHTML = '';
      if(entregas.length === 0) {
        tbodyRegularizacion.innerHTML = '<tr><td colspan="8" class="text-center">No hay entregas registradas.</td></tr>';
        return;
      }
      
      entregas.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${e.id.substring(0,6)}...</td>
          <td>${e.fecha_registro}</td>
          <td>${e.insumo}</td>
          <td>${e.cantidad_total || 'Lote'}</td>
          <td>${e.pabellon}</td>
          <td>${e.piso || '-'}</td>
          <td><span class="badge ${e.estado === 'POR_REGULARIZAR' ? 'bg-danger text-white px-2 py-1 rounded' : 'bg-success text-white px-2 py-1 rounded'}">${e.estado}</span></td>
          <td>
            ${e.estado === 'POR_REGULARIZAR' ? `<button class="btn btn-sm btn-warning btn-regularizar" data-id="${e.id}">Regularizar</button>` : '-'}
          </td>
        `;
        tbodyRegularizacion.appendChild(tr);
      });

      // Bind regularizar buttons
      container.querySelectorAll('.btn-regularizar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          const piso = prompt("Ingrese el piso (número):");
          if (!piso) return;
          const user = await getCurrentUser();
          try {
            await regularizarEntrega(id, parseInt(piso), 0, 0, 0, user.uid);
            alert("Entrega regularizada con éxito!");
            cargarEntregas(getFiltros());
          } catch(err) {
            alert("Error: " + err.message);
          }
        });
      });

    } catch (error) {
      tbodyRegularizacion.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar entregas.</td></tr>';
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

  btnFiltrar.addEventListener('click', () => cargarEntregas(getFiltros()));
  btnLimpiar.addEventListener('click', () => {
    container.querySelector('#filtro-fecha-inicio').value = '';
    container.querySelector('#filtro-fecha-fin').value = '';
    container.querySelector('#filtro-insumo').value = '';
    container.querySelector('#filtro-pabellon').value = '';
    container.querySelector('#filtro-estado').value = '';
    cargarEntregas();
  });

  cargarEntregas();

  // Usuarios
  const tbodyUsuarios = container.querySelector('#tbody-usuarios');
  async function cargarUsuarios() {
    tbodyUsuarios.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
    try {
      const usuarios = await obtenerTodosLosUsuarios();
      tbodyUsuarios.innerHTML = '';
      usuarios.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${u.nombre_completo}</td>
          <td>${u.dni}</td>
          <td>${u.correo}</td>
          <td>${u.rol}</td>
          <td><span class="badge ${u.activo ? 'bg-success text-white px-2 py-1 rounded' : 'bg-danger text-white px-2 py-1 rounded'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
          <td>
            <button class="btn btn-sm btn-toggle-activo ${u.activo ? 'btn-danger' : 'btn-success'}" data-id="${u.id}" data-activo="${!u.activo}">
              ${u.activo ? 'Desactivar' : 'Activar'}
            </button>
          </td>
        `;
        tbodyUsuarios.appendChild(tr);
      });

      container.querySelectorAll('.btn-toggle-activo').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          const activo = e.target.getAttribute('data-activo') === 'true';
          await cambiarEstadoUsuario(id, activo);
          cargarUsuarios();
        });
      });
    } catch (e) {
      tbodyUsuarios.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error.</td></tr>';
    }
  }

  container.querySelector('#form-nuevo-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = container.querySelector('#btn-agregar-usuario');
    btnSubmit.disabled = true;
    try {
      await registrarUsuario(
        container.querySelector('#nuevo-correo').value,
        container.querySelector('#nuevo-dni').value,
        container.querySelector('#nuevo-nombre').value,
        container.querySelector('#nuevo-rol').value,
        container.querySelector('#nuevo-activo').value === 'true'
      );
      alert("Usuario registrado.");
      e.target.reset();
      cargarUsuarios();
    } catch(err) {
      alert("Error: " + err.message);
    } finally {
      btnSubmit.disabled = false;
    }
  });

  cargarUsuarios();

  // Catalogos
  const ulPabellones = container.querySelector('#lista-pabellones');
  const ulInsumos = container.querySelector('#lista-insumos');
  
  function renderCatalogos() {
    ulPabellones.innerHTML = '';
    catalogos.pabellones.forEach(p => {
      ulPabellones.innerHTML += `<li class="list-group-item bg-gray-50 border p-2 mb-1 rounded">${p.nombre} (Máx. ${p.max_pisos} pisos) - [${p.codigo}]</li>`;
    });
    ulInsumos.innerHTML = '';
    catalogos.insumos.forEach(i => {
      ulInsumos.innerHTML += `<li class="list-group-item bg-gray-50 border p-2 mb-1 rounded">${i}</li>`;
    });
  }
  renderCatalogos();

  // Export
  container.querySelector('#btn-exportar-csv').addEventListener('click', async () => {
    try {
      const entregas = await filtrarEntregas();
      if(entregas.length === 0) return alert("No hay entregas para exportar.");
      
      const header = ["ID", "Fecha", "Insumo", "Pabellon", "Piso", "Cantidad", "Estado", "Encargado"];
      const rows = entregas.map(e => [
        e.id, e.fecha_registro, e.insumo, e.pabellon, e.piso || '', e.cantidad_total || '', e.estado, e.encargado?.nombre || ''
      ]);
      
      let csvContent = "data:text/csv;charset=utf-8," + header.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "entregas.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch(e) {
      alert("Error al exportar: " + e.message);
    }
  });
}
