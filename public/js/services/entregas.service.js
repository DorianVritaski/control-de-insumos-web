// Servicio de Entregas
// CRUD de entregas y regularización
// Según la especificación Spec_Driven_Development.md - Sección 5.3, RF-02, RF-03, RF-05, RNF-05

import { db } from "../firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const REGISTROS_COLECCION = "registros_entrega";

/**
 * Registra una nueva entrega (módulo Operador).
 * @param {string} insumo - Tipo de insumo.
 * @param {string} pabellon - Código del pabellón.
 * @param {number|null} piso - Número de piso (null si es lote/almacén).
 * @param {number} damas - Cantidad para damas.
 * @param {number} varones - Cantidad para varones.
 * @param {number} discapacitado - Cantidad para discapacitados.
 * @param {string} encargado - Nombre del encargado.
 * @param {string} encargadoDni - DNI del encargado.
 * @param {string} encargadoUid - UID del operador.
 * @param {string|null} observaciones - Observaciones opcionales.
 * @returns {Promise<Object>} Registro creado.
 */
export async function registrarEntrega(insumo, pabellon, piso, damas, varones, discapacitado, encargado, encargadoDni, encargadoUid, observaciones = null) {
  try {
    const cantidadTotal = damas + varones + discapacitado;
    const esLote = (piso === null || piso === 0) && damas === 0 && varones === 0 && discapacitado === 0;

    const registroData = {
      fecha_registro: new Date().toISOString().split("T")[0],
      insumo,
      cantidad_total: esLote ? undefined : cantidadTotal,
      pabellon,
      piso: esLote ? null : piso,
      detalle_banos: esLote ? null : { damas, varones, discapacitado },
      estado: esLote ? "POR_REGULARIZAR" : "REGULARIZADO",
      encargado: { uid: encargadoUid, nombre: encargado, dni: encargadoDni },
      observaciones: observaciones || null,
      regularizado_por: null,
      fecha_regularizacion: null,
      timestamp: serverTimestamp()
    };

    const entregasRef = collection(db, REGISTROS_COLECCION);
    const docRef = await addDoc(entregasRef, registroData);

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
    const fechaInicio = new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split("T")[0];
    const q = query(
      entregasRef,
      where("encargado.uid", "==", uid),
      where("fecha_registro", "==", fechaInicio)
    );
    const snapshot = await getDocs(q);
    const entregas = [];
    snapshot.forEach((doc) => {
      entregas.push({ id: doc.id, ...doc.data() });
    });
    
    // Ordenar descendente por timestamp en JS para evitar índice compuesto
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
    const entregasRef = collection(db, REGISTROS_COLECCION);
    let q = query(entregasRef, orderBy("timestamp", "desc"));

    if (fechaInicio) {
      q = query(q, where("fecha_registro", ">=", fechaInicio));
    }
    if (fechaFin) {
      q = query(q, where("fecha_registro", "<=", fechaFin));
    }
    if (insumo) {
      q = query(q, where("insumo", "==", insumo));
    }
    if (pabellon) {
      q = query(q, where("pabellon", "==", pabellon));
    }
    if (estado) {
      q = query(q, where("estado", "==", estado));
    }

    const snapshot = await getDocs(q);
    const entregas = [];
    snapshot.forEach((doc) => {
      entregas.push({ id: doc.id, ...doc.data() });
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
      fecha_regularizacion: new Date().toISOString().split("T")[0]
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
