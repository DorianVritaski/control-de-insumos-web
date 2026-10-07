// Vista del Módulo Administrador
// Panel de Control y Configuración
// Según la especificación Spec_Driven_Development.md

import { filtrarEntregas, regularizarEntrega } from "../services/entregas.service.js";
import { getCatalogosCompletos } from "../services/catalogos.service.js";
import { obtenerTodosLosUsuarios } from "../services/users.service.js";
import { exportEntregasMultiple } from "../utils/export.js";
import { isAuthenticated } from "../services/auth.service.js";

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
                <button id="btn-filtar" class="btn btn-primary mb-3">Filtrar</button>
                <button id="btn-limpiar-filtros" class="btn btn-secondary mb-3">Limpiar</button>
                <button id="btn-exportar" class="btn btn-info mb-3">Exportar a CSV</button>
              </div>
            </div>
            <div class="card">
              <div class="card-header bg-primary text-white"><h5>Entregas Pendientes de Regularizacion</h5></div>
              <div class="card-body">
                <div id="tabla-regularizacion" class="table-responsive">
                  <table class="table table-striped">
                    <thead><tr><th>ID</th><th>Fecha</th><th>Insumo</th><th>Cantidad</th><th>Pabellon</th><th>Piso</th><th>Acciones</th></tr></thead>
                    <tbody id="tbody-regularizacion"><tr><td colspan="7" class="text-center">Cargando...</td></tr></tbody>
                  </table>
                </div>

          <div class="tab-pane fade" id="usuarios">
            <div id="alert-usuarios"></div>
            <div class="card">
              <div class="card-header bg-primary text-white"><h5>Gestion de Usuarios</h5></div>
              <div class="card-body">
                <div class="card">
                  <div class="card-header bg-secondary text-white"><h6>Nuevo Usuario</h6></div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6"><div class="form-group"><label class="form-label">Nombre Completo</label><input type="text" id="nuevo-nombre" class="form-input"></div></div>
                      <div class="col-md-6"><div class="form-group"><label class="form-label">DNI</label><input type="text" id="nuevo-dni" class="form-input" maxlength="8"></div></div>
                      <div class="col-md-6"><div class="form-group"><label class="form-label">Correo Institucional</label><input type="email" id="nuevo-correo" class="form-input"></div></div>
                      <div class="col-md-6"><div class="form-group"><label class="form-label">Rol</label><select id="nuevo-rol" class="form-input"><option value="OPERADOR">Operador</option><option value="ADMIN">Administrador</option></select></div></div>
                      <div class="col-md-6"><div class="form-group"><label class="form-label">Contrasena Inicial</label><input type="password" id="nueva-contrasena" class="form-input" minlength="8"><small class="text-muted">Minimo 8 caracteres</small></div></div>
                      <div class="col-md-6"><div class="form-group"><label class="form-label">Estado</label><select id="nuevo-activo" class="form-input"><option value="true">Activo</option><option value="false">Inactivo</option></select></div></div>
                    </div>
                    <button id="btn-agregar-usuario" class="btn btn-success mt-3">Agregar Usuario</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="card mt-3">
              <div class="card-header bg-dark text-white"><h5>Lista de Usuarios</h5></div>
              <div class="card-body">
                <div id="tabla-usuarios" class="table-responsive">
                  <table class="table table-striped">
                    <thead><tr><th>ID</th><th>Nombre</th><th>DNI</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody id="tbody-usuarios"><tr><td colspan="7" class="text-center">Cargando...</td></tr></tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="tab-pane fade" id="catalogos">
            <div id="alert-catalogos"></div>
            <div class="card">
              <div class="card-header bg-info text-white"><h5>Configuracion de Catálogos</h5></div>
              <div class="card-body"><p>Subir nuevos pabellones e insumos habilitados en el sistema.</p></div>
            </div>
          </div>

          <div class="tab-pane fade" id="export">
            <div id="alert-export"></div>
            <div class="card">
              <div class="card-header bg-warning text-white"><h5>Exportar Datos</h5></div>
              <div class="card-body"><div class="alert alert-info"><p>Exportar entregas filtradas o todas las entregas en formato CSV/Excel.</p></div></div>
            </div>
          </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  return container;
}
