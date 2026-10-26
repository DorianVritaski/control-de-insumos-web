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
 * Obtiene la configuración completa de insumos desactivados por módulo.
 * Estructura: { desactivados_registro: [], desactivados_multipiso: [] }
 * @returns {Promise<{desactivados_registro: string[], desactivados_multipiso: string[]}>}
 */
export async function getInsumosConfig() {
  try {
    const docRef = doc(db, CATALOGOS_COLLECTION, "insumos_config");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return { desactivados_registro: [], desactivados_multipiso: [] };
    const data = snap.data();
    // Migrar campo legacy 'desactivados' si existe
    const legacy = data.desactivados || [];
    return {
      desactivados_registro: data.desactivados_registro || legacy,
      desactivados_multipiso: data.desactivados_multipiso || []
    };
  } catch (error) {
    console.error("Error al obtener config de insumos:", error);
    return { desactivados_registro: [], desactivados_multipiso: [] };
  }
}

/**
 * Obtiene los insumos desactivados para un módulo específico.
 * @param {'registro'|'multipiso'} modulo
 * @returns {Promise<string[]>}
 */
export async function getInsumosDesactivados(modulo = 'registro') {
  const cfg = await getInsumosConfig();
  return modulo === 'multipiso' ? cfg.desactivados_multipiso : cfg.desactivados_registro;
}

/**
 * Activa o desactiva un insumo en un módulo específico.
 * @param {string} nombre - Nombre del insumo.
 * @param {boolean} activo - true = activar, false = desactivar.
 * @param {'registro'|'multipiso'} modulo - Módulo objetivo.
 */
export async function toggleInsumoActivo(nombre, activo, modulo = 'registro') {
  try {
    const cfg = await getInsumosConfig();
    const campo = modulo === 'multipiso' ? 'desactivados_multipiso' : 'desactivados_registro';
    const lista = cfg[campo] || [];
    let nuevaLista;
    if (activo) {
      nuevaLista = lista.filter(d => d !== nombre);
    } else {
      nuevaLista = lista.includes(nombre) ? lista : [...lista, nombre];
    }
    const docRef = doc(db, CATALOGOS_COLLECTION, "insumos_config");
    await setDoc(docRef, { [campo]: nuevaLista }, { merge: true });
    // Retornar la config actualizada
    return { ...cfg, [campo]: nuevaLista };
  } catch (error) {
    console.error("Error al toggle insumo:", error);
    throw error;
  }
}

/**
 * Obtiene todos los catálogos en una sola llamada.
 * @returns {Promise<Object>} Objeto con pabellones, insumos e insumosConfig.
 */
export async function getCatalogosCompletos() {
  try {
    const [pabellones, insumos, insumosConfig] = await Promise.all([
      getPabellones(), getInsumos(), getInsumosConfig()
    ]);
    return { pabellones, insumos, insumosDesactivados: insumosConfig.desactivados_registro, insumosConfig };
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

/**
 * Suma unidades al stock actual de un insumo (al registrar un pedido mensual).
 * @param {string} insumo - Nombre del insumo.
 * @param {number} cantidad - Unidades a sumar.
 */
export async function sumarStock(insumo, cantidad) {
  try {
    const stockActual = await getStock();
    const actual = stockActual[insumo] ?? 0;
    const nuevo = actual + (parseInt(cantidad) || 0);
    const docRef = doc(db, CATALOGOS_COLLECTION, "stock");
    await setDoc(docRef, { [insumo]: nuevo }, { merge: true });
    return { insumo, stockAnterior: actual, stockNuevo: nuevo };
  } catch (error) {
    console.error("Error al sumar stock:", error);
    throw error;
  }
}

/**
 * Registra un pedido mensual de stock Y suma al stock actual.
 * @param {string} insumo - Nombre del insumo.
 * @param {number} cantidad - Unidades del pedido.
 * @param {string} fecha - Fecha del pedido en formato YYYY-MM-DD.
 * @param {string} notas - Notas del pedido.
 * @param {string} registradoPorNombre - Nombre del administrador.
 */
export async function registrarIngresoStock(insumo, cantidad, fecha, notas, registradoPorNombre) {
  try {
    const cantidadNum = parseInt(cantidad) || 0;
    // Derivar mes YYYY-MM desde la fecha completa
    const mes = fecha ? fecha.substring(0, 7) : (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    })();

    const docRef = doc(db, CATALOGOS_COLLECTION, "ingresos_stock");
    const docSnap = await getDoc(docRef);
    const lista = docSnap.exists() ? (docSnap.data().lista || []) : [];

    const ingreso = {
      id: Date.now().toString(),
      insumo,
      cantidad: cantidadNum,
      fecha,        // YYYY-MM-DD (fecha del pedido)
      mes,          // YYYY-MM (para agrupación)
      fecha_registro: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      })(),
      notas: notas || null,
      registrado_por: registradoPorNombre || "Admin"
    };

    lista.push(ingreso);
    await setDoc(docRef, { lista }, { merge: true });

    // Sumar al stock actual
    await sumarStock(insumo, cantidadNum);

    return ingreso;
  } catch (error) {
    console.error("Error al registrar ingreso de stock:", error);
    throw error;
  }
}

/**
 * Obtiene el historial completo de ingresos de stock.
 * @returns {Promise<Array>} Lista de ingresos ordenada por fecha desc.
 */
export async function obtenerIngresosStock() {
  try {
    const docRef = doc(db, CATALOGOS_COLLECTION, "ingresos_stock");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return [];
    const lista = docSnap.data().lista || [];
    // Ordenar por fecha_registro descendente
    return lista.sort((a, b) => b.fecha_registro.localeCompare(a.fecha_registro));
  } catch (error) {
    console.error("Error al obtener historial de ingresos:", error);
    throw error;
  }
}

/**
 * Elimina un ingreso del historial por su ID.
 * @param {string} id - ID del ingreso a eliminar.
 */
export async function eliminarIngresoStock(id) {
  try {
    const docRef = doc(db, CATALOGOS_COLLECTION, "ingresos_stock");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    const lista = (docSnap.data().lista || []).filter(i => i.id !== id);
    await setDoc(docRef, { lista }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error al eliminar ingreso:", error);
    throw error;
  }
}

// ============================================================
// CONFIGURACIÓN INSUMO AGUA
// catalogos/config_agua → { max_bidones: N, areas_solicitantes: [] }
// ============================================================

/**
 * Obtiene la configuración del insumo Agua.
 * @returns {Promise<{max_bidones: number, areas_solicitantes: string[]}>}
 */
export async function getConfigAgua() {
  try {
    const docRef = doc(db, CATALOGOS_COLLECTION, "config_agua");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return { max_bidones: 10, areas_solicitantes: [] };
    return { max_bidones: 10, areas_solicitantes: [], ...snap.data() };
  } catch (error) {
    console.error("Error al obtener config agua:", error);
    throw error;
  }
}

/**
 * Actualiza la cantidad máxima de bidones por entrega.
 * @param {number} maxBidones
 */
export async function actualizarMaxBidones(maxBidones) {
  try {
    const docRef = doc(db, CATALOGOS_COLLECTION, "config_agua");
    await setDoc(docRef, { max_bidones: parseInt(maxBidones) || 10 }, { merge: true });
  } catch (error) {
    console.error("Error al actualizar max bidones:", error);
    throw error;
  }
}

/**
 * Obtiene la lista de áreas solicitantes.
 * @returns {Promise<string[]>}
 */
export async function getAreasSolicitantes() {
  try {
    const cfg = await getConfigAgua();
    return cfg.areas_solicitantes || [];
  } catch (error) {
    console.error("Error al obtener áreas solicitantes:", error);
    throw error;
  }
}

/**
 * Agrega un área solicitante nueva.
 * @param {string} nombre
 */
export async function agregarAreaSolicitante(nombre) {
  try {
    const cfg = await getConfigAgua();
    const lista = cfg.areas_solicitantes || [];
    const nombreUpper = nombre.trim().toUpperCase();
    if (lista.includes(nombreUpper)) throw new Error(`El área "${nombreUpper}" ya existe.`);
    lista.push(nombreUpper);
    lista.sort();
    const docRef = doc(db, CATALOGOS_COLLECTION, "config_agua");
    await setDoc(docRef, { areas_solicitantes: lista }, { merge: true });
    return lista;
  } catch (error) {
    console.error("Error al agregar área solicitante:", error);
    throw error;
  }
}

/**
 * Elimina un área solicitante.
 * @param {string} nombre
 */
export async function eliminarAreaSolicitante(nombre) {
  try {
    const cfg = await getConfigAgua();
    const lista = (cfg.areas_solicitantes || []).filter(a => a !== nombre);
    const docRef = doc(db, CATALOGOS_COLLECTION, "config_agua");
    await setDoc(docRef, { areas_solicitantes: lista }, { merge: true });
    return lista;
  } catch (error) {
    console.error("Error al eliminar área solicitante:", error);
    throw error;
  }
}
