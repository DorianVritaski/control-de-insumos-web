// Servicio de Entregas
// CRUD de entregas y regularización
// Según la especificación Spec_Driven_Development.md - Sección 5.3, RF-02, RF-03, RF-05, RNF-05

import { db } from "../firebase-config.js";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { restarStock } from "./catalogos.service.js";

const REGISTROS_COLECCION = "registros_entrega";

/**
 * Devuelve la fecha local del dispositivo en formato YYYY-MM-DD.
 * Evita el bug de UTC donde las 23:xx hora local es el día siguiente en UTC.
 */
function fechaLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

/**
 * Registra una nueva entrega (módulo Operador).
 */
export async function registrarEntrega(insumo, pabellon, piso, damas, varones, discapacitado, cantidadTotalManual, encargado, encargadoDni, encargadoUid, observaciones = null) {
  try {
    const d = parseInt(damas) || 0;
    const v = parseInt(varones) || 0;
    const dc = parseInt(discapacitado) || 0;
    const sumaDesglose = d + v + dc;
    const totalFinal = parseInt(cantidadTotalManual) || sumaDesglose;
    const pisoNum = piso ? parseInt(piso) : null;

    // REGULARIZADO solo si el desglose existe y coincide con el total
    const tieneDesglose = sumaDesglose > 0;
    const desgloseCoincide = tieneDesglose && sumaDesglose === totalFinal;
    const estado = desgloseCoincide ? "REGULARIZADO" : "POR_REGULARIZAR";

    const registroData = {
      fecha_registro: fechaLocal(),
      insumo,
      cantidad_total: totalFinal,
      pabellon,
      piso: pisoNum,
      detalle_banos: { damas: d, varones: v, discapacitado: dc },
      estado,
      encargado: { uid: encargadoUid || null, nombre: encargado, dni: encargadoDni },
      observaciones: observaciones || null,
      regularizado_por: null,
      fecha_regularizacion: null,
      timestamp: serverTimestamp()
    };

    const entregasRef = collection(db, REGISTROS_COLECCION);
    const docRef = await addDoc(entregasRef, registroData);

    // Descontar del stock dinámicamente
    if (totalFinal > 0) {
      try { await restarStock(insumo, totalFinal); } catch(e) { console.warn("No se pudo actualizar el stock:", e.message); }
    }

    return { id: docRef.id, ...registroData };
  } catch (error) {
    console.error("Error al registrar entrega:", error);
    throw error;
  }
}



/**
 * Obtiene todas las entregas del día del usuario logueado (Operador).
 * @param {string} uid - UID del operador.
 * @returns {Promise<Array>} Lista de entregas.
 */
export async function obtenerEntregasDelDia(uid) {
  try {
    const entregasRef = collection(db, REGISTROS_COLECCION);
    const fechaHoy = fechaLocal();
    const q = query(
      entregasRef,
      where("encargado.uid", "==", uid),
      where("fecha_registro", "==", fechaHoy)
    );
    const snapshot = await getDocs(q);
    const entregas = [];
    snapshot.forEach((doc) => {
      entregas.push({ id: doc.id, ...doc.data() });
    });
    
    entregas.sort((a, b) => {
      const tA = a.timestamp ? a.timestamp.toMillis() : 0;
      const tB = b.timestamp ? b.timestamp.toMillis() : 0;
      return tB - tA;
    });

    return entregas;
  } catch (error) {
    console.error("Error al obtener entregas del día:", error);
    throw error;
  }
}

/**
 * Obtiene TODOS los registros de un operador (histórico completo).
 * @param {string} uid - UID del operador.
 * @returns {Promise<Array>} Lista de entregas del operador.
 */
export async function obtenerEntregasDelOperador(uid) {
  try {
    const entregasRef = collection(db, REGISTROS_COLECCION);
    const q = query(entregasRef, where("encargado.uid", "==", uid));
    const snapshot = await getDocs(q);
    const entregas = [];
    snapshot.forEach((d) => {
      entregas.push({ id: d.id, ...d.data() });
    });
    // Ordenar por fecha desc en JS
    entregas.sort((a, b) => {
      const tA = a.timestamp ? a.timestamp.toMillis() : 0;
      const tB = b.timestamp ? b.timestamp.toMillis() : 0;
      return tB - tA;
    });
    return entregas;
  } catch (error) {
    console.error("Error al obtener entregas del operador:", error);
    throw error;
  }
}


/**
 * Obtiene todas las entregas (sin filtros).
 * @returns {Promise<Array>} Lista de todas las entregas.
 */
export async function obtenerTodasLasEntregas() {
  try {
    const entregasRef = collection(db, REGISTROS_COLECCION);
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

/**
 * Obtiene entregas filtrando por fechas, insumo, pabellón y estado (para Admin).
 * @param {string|null} fechaInicio - Fecha de inicio (YYYY-MM-DD).
 * @param {string|null} fechaFin - Fecha de fin (YYYY-MM-DD).
 * @param {string|null} insumo - Código del insumo.
 * @param {string|null} pabellon - Código del pabellón.
 * @param {string|null} estado - Estado de la entrega.
 * @returns {Promise<Array>} Lista de entregas filtradas.
 */
export async function filtrarEntregas(fechaInicio = null, fechaFin = null, insumo = null, pabellon = null, estado = null) {
  try {
    // Traer todo y filtrar en JS para evitar errores de índices compuestos
    const entregasRef = collection(db, REGISTROS_COLECCION);
    const snapshot = await getDocs(entregasRef);
    let entregas = [];
    snapshot.forEach((d) => { entregas.push({ id: d.id, ...d.data() }); });

    if (fechaInicio) entregas = entregas.filter(e => e.fecha_registro >= fechaInicio);
    if (fechaFin)    entregas = entregas.filter(e => e.fecha_registro <= fechaFin);
    if (insumo)      entregas = entregas.filter(e => e.insumo === insumo);
    if (pabellon)    entregas = entregas.filter(e => e.pabellon === pabellon);
    if (estado)      entregas = entregas.filter(e => e.estado === estado);

    entregas.sort((a, b) => {
      const tA = a.timestamp ? a.timestamp.toMillis() : 0;
      const tB = b.timestamp ? b.timestamp.toMillis() : 0;
      return tB - tA;
    });

    return entregas;
  } catch (error) {
    console.error("Error al filtrar entregas:", error);
    throw error;
  }
}


/**
 * Regulariza una entrega en estado POR_REGULARIZAR (módulo Admin).
 * @param {string} entregaId - ID de la entrega a regularizar.
 * @param {number|null} piso - Piso asignado.
 * @param {number} damas - Cantidad para damas.
 * @param {number} varones - Cantidad para varones.
 * @param {number} discapacitado - Cantidad para discapacitados.
 * @param {string} regularizadoPor - UID del administrador que regulariza.
 * @returns {Promise<Object>} Registro actualizado.
 */
export async function regularizarEntrega(entregaId, piso, damas, varones, discapacitado, regularizadoPor) {
  try {
    const entregaRef = doc(db, REGISTROS_COLECCION, entregaId);
    const entregaSnap = await getDoc(entregaRef);

    if (!entregaSnap.exists()) {
      throw new Error(`Entrega con ID "${entregaId}" no encontrada.`);
    }

    const cantidadTotal = damas + varones + discapacitado;

    const actualizacion = {
      piso,
      detalle_banos: {
        damas,
        varones,
        discapacitado
      },
      cantidad_total: cantidadTotal,
      estado: "REGULARIZADO",
      regularizado_por: regularizadoPor,
      fecha_regularizacion: fechaLocal()

    };

    await updateDoc(entregaRef, actualizacion);

    return {
      id: entregaId,
      ...actualizacion
    };
  } catch (error) {
    console.error("Error al regularizar entrega:", error);
    throw error;
  }
}

/**
 * Actualiza una entrega (Solo Administrador - edición).
 * @param {string} entregaId - ID de la entrega.
 * @param {Object} datos - Datos a actualizar.
 */
export async function actualizarEntrega(entregaId, datos) {
  try {
    const entregaRef = doc(db, REGISTROS_COLECCION, entregaId);
    await updateDoc(entregaRef, datos);
    return { id: entregaId, ...datos };
  } catch (error) {
    console.error("Error al actualizar entrega:", error);
    throw error;
  }
}

/**
 * Elimina una entrega (Solo Administrador).
 * @param {string} entregaId - ID de la entrega a eliminar.
 */
export async function eliminarEntrega(entregaId) {
  try {
    const entregaRef = doc(db, REGISTROS_COLECCION, entregaId);
    await deleteDoc(entregaRef);
    return true;
  } catch (error) {
    console.error("Error al eliminar entrega:", error);
    throw error;
  }
}
