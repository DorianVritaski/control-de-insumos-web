// Servicio de Catálogos
// CRUD de pabellones e insumos habilitados en el sistema
// Según la especificación Spec_Driven_Development.md - Sección 5.2, RF-07

import { db } from "../firebase-config.js";
import {
  collection, getDocs, getDoc, updateDoc, setDoc, doc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const CATALOGOS_COLLECTION = "catalogos";

/**
 * Obtiene la lista de pabellones del catálogo.
 * @returns {Promise<Array>} Lista de pabellones.
 */
export async function getPabellones() {
  try {
    const docRef = doc(db, CATALOGOS_COLLECTION, "pabellones");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data().lista || [];
      // Ordenar alfabéticamente
      return data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    return [];
  } catch (error) {
    console.error("Error al obtener pabellones:", error);
    throw error;
  }
}

/**
 * Obtiene la lista de insumos habilitados.
 * @returns {Promise<Array>} Lista de insumos.
 */
export async function getInsumos() {
  try {
    const docRef = doc(db, CATALOGOS_COLLECTION, "insumos");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().lista || [];
    }
    return [];
  } catch (error) {
    console.error("Error al obtener insumos:", error);
    throw error;
  }
}

/**
 * Obtiene todos los catálogos en una sola llamada.
 * @returns {Promise<Object>} Objeto con pabellones e insumos.
 */
export async function getCatalogosCompletos() {
  try {
    const [pabellones, insumos] = await Promise.all([getPabellones(), getInsumos()]);
    return { pabellones, insumos };
  } catch (error) {
    console.error("Error al obtener catálogos completos:", error);
    throw error;
  }
}

/**
 * Agrega un nuevo pabellón al catálogo (solo Admin).
 */
export async function agregarPabellon(codigo, nombre, max_pisos) {
  try {
    const lista = await getPabellones();
    if (lista.some((p) => p.codigo === codigo)) {
      throw new Error(`El código "${codigo}" ya está en uso.`);
    }
    lista.push({ codigo, nombre, max_pisos });
    await setDoc(doc(db, CATALOGOS_COLLECTION, "pabellones"), { lista }, { merge: true });
    return { codigo, nombre, max_pisos };
  } catch (error) {
    console.error("Error al agregar pabellón:", error);
    throw error;
  }
}

/**
 * Actualiza un pabellón existente.
 */
export async function actualizarPabellon(codigo, nuevoNombre, nuevoMaxPisos) {
  try {
    const lista = await getPabellones();
    const index = lista.findIndex((p) => p.codigo === codigo);
    if (index === -1) {
      throw new Error(`Pabellón con código "${codigo}" no encontrado.`);
    }
    lista[index] = { ...lista[index], nombre: nuevoNombre, max_pisos: nuevoMaxPisos };
    await setDoc(doc(db, CATALOGOS_COLLECTION, "pabellones"), { lista }, { merge: true });
    return lista[index];
  } catch (error) {
    console.error("Error al actualizar pabellón:", error);
    throw error;
  }
}

/**
 * Elimina un pabellón del catálogo (solo Admin).
 */
export async function eliminarPabellon(codigo) {
  try {
    const lista = await getPabellones();
    const index = lista.findIndex((p) => p.codigo === codigo);
    if (index === -1) {
      throw new Error(`Pabellón con código "${codigo}" no encontrado.`);
    }
    lista.splice(index, 1);
    await setDoc(doc(db, CATALOGOS_COLLECTION, "pabellones"), { lista }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error al eliminar pabellón:", error);
    throw error;
  }
}

/**
 * Agrega un nuevo insumo al catálogo (solo Admin).
 */
export async function agregarInsumo(nombre) {
  try {
    const lista = await getInsumos();
    if (lista.some((i) => i === nombre)) {
      throw new Error(`El insumo "${nombre}" ya está en uso.`);
    }
    lista.push(nombre);
    await setDoc(doc(db, CATALOGOS_COLLECTION, "insumos"), { lista }, { merge: true });
    return nombre;
  } catch (error) {
    console.error("Error al agregar insumo:", error);
    throw error;
  }
}

/**
 * Elimina un insumo del catálogo (solo Admin).
 */
export async function eliminarInsumo(nombre) {
  try {
    const lista = await getInsumos();
    const index = lista.findIndex((i) => i === nombre);
    if (index === -1) {
      throw new Error(`Insumo "${nombre}" no encontrado.`);
    }
    lista.splice(index, 1);
    await setDoc(doc(db, CATALOGOS_COLLECTION, "insumos"), { lista }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error al eliminar insumo:", error);
    throw error;
  }
}

/**
 * Obtiene el stock de todos los insumos.
 * @returns {Promise<Object>} Objeto { INSUMO: cantidad, ... }
 */
export async function getStock() {
  try {
    const docRef = doc(db, CATALOGOS_COLLECTION, "stock");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {};
  } catch (error) {
    console.error("Error al obtener stock:", error);
    throw error;
  }
}

/**
 * Actualiza el stock de un insumo específico (Admin).
 * @param {string} insumo - Nombre del insumo.
 * @param {number} cantidad - Nueva cantidad total en stock.
 */
export async function actualizarStock(insumo, cantidad) {
  try {
    const docRef = doc(db, CATALOGOS_COLLECTION, "stock");
    await setDoc(docRef, { [insumo]: cantidad }, { merge: true });
    return { insumo, cantidad };
  } catch (error) {
    console.error("Error al actualizar stock:", error);
    throw error;
  }
}

/**
 * Resta unidades del stock de un insumo al registrar una entrega.
 * Si el stock resultante sería negativo, lo deja en 0.
 * @param {string} insumo - Nombre del insumo.
 * @param {number} cantidad - Unidades a restar.
 */
export async function restarStock(insumo, cantidad) {
  try {
    const stockActual = await getStock();
    const actual = stockActual[insumo] ?? 0;
    const nuevo = Math.max(0, actual - cantidad);
    const docRef = doc(db, CATALOGOS_COLLECTION, "stock");
    await setDoc(docRef, { [insumo]: nuevo }, { merge: true });
    return { insumo, stockAnterior: actual, stockNuevo: nuevo };
  } catch (error) {
    console.error("Error al restar stock:", error);
    throw error;
  }
}
