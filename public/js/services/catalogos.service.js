// Servicio de Catálogos
// CRUD de pabellones e insumos habilitados en el sistema
// Según la especificación Spec_Driven_Development.md - Sección 5.2, RF-07

import { db } from "../firebase-config.js";
import {
  collection, getDocs, updateDoc, doc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const CATALOGOS_COLLECTION = "catalogos";

/**
 * Obtiene la lista de pabellones del catálogo.
 * @returns {Promise<Array>} Lista de pabellones.
 */
export async function getPabellones() {
  try {
    const q = query(collection(db, CATALOGOS_COLLECTION, "pabellones"), orderBy("nombre", "asc"));
    const snapshot = await getDocs(q);
    const pabellones = [];
    snapshot.forEach((doc) => { pabellones.push(...doc.data().lista); });
    return pabellones;
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
    const snapshot = await getDocs(collection(db, CATALOGOS_COLLECTION, "insumos"));
    const insumos = [];
    snapshot.forEach((doc) => { insumos.push(...doc.data().lista); });
    return insumos;
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
 * @param {string} codigo - Código del pabellón (ej. "N", "H", "IC").
 * @param {string} nombre - Nombre del pabellón.
 * @param {number} max_pisos - Número máximo de pisos.
 */
export async function agregarPabellon(codigo, nombre, max_pisos) {
  try {
    const pabellonesRef = collection(db, CATALOGOS_COLLECTION, "pabellones");
    const pabellonesData = await getDocs(pabellonesRef);
    let lista = [];
    pabellonesData.forEach((doc) => { lista = doc.data().lista; });

    if (lista.some((p) => p.codigo === codigo)) {
      throw new Error(`El código "${codigo}" ya está en uso.`);
    }

    lista.push({ codigo, nombre, max_pisos });
    await updateDoc(doc(db, CATALOGOS_COLLECTION, "pabellones"), { lista });
    return { codigo, nombre, max_pisos };
  } catch (error) {
    console.error("Error al agregar pabellón:", error);
    throw error;
  }
}

/**
 * Actualiza un pabellón existente.
 * @param {string} codigo - Código del pabellón a actualizar.
 * @param {string} nuevoNombre - Nuevo nombre.
 * @param {number} nuevoMaxPisos - Nuevo máximo de pisos.
 */
export async function actualizarPabellon(codigo, nuevoNombre, nuevoMaxPisos) {
  try {
    const pabellonesRef = collection(db, CATALOGOS_COLLECTION, "pabellones");
    const pabellonesData = await getDocs(pabellonesRef);
    let lista = [];
    pabellonesData.forEach((doc) => { lista = doc.data().lista; });

    const index = lista.findIndex((p) => p.codigo === codigo);
    if (index === -1) {
      throw new Error(`Pabellón con código "${codigo}" no encontrado.`);
    }

    lista[index] = { ...lista[index], nombre: nuevoNombre, max_pisos: nuevoMaxPisos };
    await updateDoc(doc(db, CATALOGOS_COLLECTION, "pabellones"), { lista });
    return lista[index];
  } catch (error) {
    console.error("Error al actualizar pabellón:", error);
    throw error;
  }
}

/**
 * Elimina un pabellón del catálogo (solo Admin).
 * @param {string} codigo - Código del pabellón a eliminar.
 */
export async function eliminarPabellon(codigo) {
  try {
    const pabellonesRef = collection(db, CATALOGOS_COLLECTION, "pabellones");
    const pabellonesData = await getDocs(pabellonesRef);
    let lista = [];
    pabellonesData.forEach((doc) => { lista = doc.data().lista; });

    const index = lista.findIndex((p) => p.codigo === codigo);
    if (index === -1) {
      throw new Error(`Pabellón con código "${codigo}" no encontrado.`);
    }

    lista.splice(index, 1);
    await updateDoc(doc(db, CATALOGOS_COLLECTION, "pabellones"), { lista });
    return true;
  } catch (error) {
    console.error("Error al eliminar pabellón:", error);
    throw error;
  }
}

/**
 * Agrega un nuevo insumo al catálogo (solo Admin).
 * @param {string} nombre - Nombre del insumo (ej. "PAPEL_HIGIENICO", "JABON").
 */
export async function agregarInsumo(nombre) {
  try {
    const insumosRef = collection(db, CATALOGOS_COLLECTION, "insumos");
    const insumosData = await getDocs(insumosRef);
    let lista = [];
    insumosData.forEach((doc) => { lista = doc.data().lista; });

    if (lista.some((i) => i === nombre)) {
      throw new Error(`El insumo "${nombre}" ya está en uso.`);
    }

    lista.push(nombre);
    await updateDoc(doc(db, CATALOGOS_COLLECTION, "insumos"), { lista });
    return nombre;
  } catch (error) {
    console.error("Error al agregar insumo:", error);
    throw error;
  }
}

/**
 * Elimina un insumo del catálogo (solo Admin).
 * @param {string} nombre - Nombre del insumo a eliminar.
 */
export async function eliminarInsumo(nombre) {
  try {
    const insumosRef = collection(db, CATALOGOS_COLLECTION, "insumos");
    const insumosData = await getDocs(insumosRef);
    let lista = [];
    insumosData.forEach((doc) => { lista = doc.data().lista; });

    const index = lista.findIndex((i) => i === nombre);
    if (index === -1) {
      throw new Error(`Insumo "${nombre}" no encontrado.`);
    }

    lista.splice(index, 1);
    await updateDoc(doc(db, CATALOGOS_COLLECTION, "insumos"), { lista });
    return true;
  } catch (error) {
    console.error("Error al eliminar insumo:", error);
    throw error;
  }
}
