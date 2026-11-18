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
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { restarStock, sumarStock } from "./catalogos.service.js";

const REGISTROS_COLECCION = "registros_entrega";

// BUG 1 FIX: Protección anti-doble-submit global para registrarEntrega
let _registrandoEntrega = false;

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
 * Acepta parámetros posicionales (compatibilidad) O un objeto de parámetros.
 * El objeto admite campos extra para Agua: tipo_registro, area_solicitante, ubicacion_exacta, cantidad_bidones, forzar_estado.
 */
export async function registrarEntrega(insumoOrObj, pabellon, piso, damas, varones, discapacitado, cantidadTotalManual, encargado, encargadoDni, encargadoUid, observaciones = null) {
  // BUG 1 FIX: Protección anti-doble-submit
  if (_registrandoEntrega) {
    throw new Error("Ya hay una entrega en proceso. Espere un momento.");
  }
  _registrandoEntrega = true;
  try {
    // Soporte dual: objeto o parámetros posicionales
    let insumo, pisoVal, damasVal, varonesVal, discapVal, totalManual, encNombre, encDni, encUid, obs;
    let camposExtra = {};

    if (insumoOrObj && typeof insumoOrObj === 'object' && !Array.isArray(insumoOrObj)) {
      const p = insumoOrObj;
      insumo      = p.insumo;        pabellon  = p.pabellon;
      pisoVal     = p.piso;          damasVal  = p.damas ?? 0;
      varonesVal  = p.varones ?? 0; discapVal = p.discapacitado ?? 0;
      totalManual = p.cantidadTotal; encNombre = p.encargado;
      encDni      = p.encargadoDni;  encUid    = p.uid;
      obs         = p.observaciones || null;
      if (p.tipo_registro)    camposExtra.tipo_registro    = p.tipo_registro;
      if (p.area_solicitante) camposExtra.area_solicitante = p.area_solicitante;
      if (p.ubicacion_exacta) camposExtra.ubicacion_exacta = p.ubicacion_exacta;
      if (p.cantidad_bidones) camposExtra.cantidad_bidones = p.cantidad_bidones;
      if (p.forzar_estado)    camposExtra._forzar_estado   = p.forzar_estado;
    } else {
      insumo     = insumoOrObj;       pisoVal    = piso;
      damasVal   = damas;             varonesVal = varones;
      discapVal  = discapacitado;     totalManual = cantidadTotalManual;
      encNombre  = encargado;         encDni     = encargadoDni;
      encUid     = encargadoUid;      obs        = observaciones;
    }

    const d  = parseInt(damasVal)   || 0;
    const v  = parseInt(varonesVal) || 0;
    const dc = parseInt(discapVal)  || 0;
    const sumaDesglose = d + v + dc;
    const totalFinal   = parseInt(totalManual) || sumaDesglose;
    const pisoNum      = pisoVal ? parseInt(pisoVal) : null;

    // Estado: respetar forzar_estado si viene del form Agua
    let estado;
    if (camposExtra._forzar_estado) {
      estado = camposExtra._forzar_estado;
      delete camposExtra._forzar_estado;
    } else {
      const tieneDesglose    = sumaDesglose > 0;
      const desgloseCoincide = tieneDesglose && sumaDesglose === totalFinal;
      estado = desgloseCoincide ? "REGULARIZADO" : "POR_REGULARIZAR";
    }

    const registroData = {
      fecha_registro: fechaLocal(),
      insumo,
      cantidad_total: totalFinal,
      pabellon,
      piso: pisoNum,
      detalle_banos: { damas: d, varones: v, discapacitado: dc },
      estado,
      encargado: { uid: encUid || null, nombre: encNombre, dni: encDni },
      observaciones: obs || null,
      regularizado_por: null,
      fecha_regularizacion: null,
      timestamp: serverTimestamp(),
      ...camposExtra
    };

    const entregasRef = collection(db, REGISTROS_COLECCION);

    // BUG 1 FIX: Restar stock ANTES de guardar la entrega.
    // Si restarStock falla, no se guarda nada (stock inconsistente nunca ocurre).
    const esAgua = registroData.tipo_registro === 'AGUA' || (insumo && insumo.toUpperCase() === 'AGUA');
    if (!esAgua && totalFinal > 0) {
      await restarStock(insumo, totalFinal); // lanza si falla → no se llega al addDoc
    }

    let docRef;
    try {
      docRef = await addDoc(entregasRef, registroData);
    } catch (saveError) {
      // addDoc falló: revertir el descuento de stock ya realizado
      if (!esAgua && totalFinal > 0) {
        try { await sumarStock(insumo, totalFinal); } catch(re) { console.error("Error en rollback de stock:", re); }
      }
      throw saveError;
    }

    return { id: docRef.id, ...registroData };
  } catch (error) {
    console.error("Error al registrar entrega:", error);
    throw error;
  } finally {
    _registrandoEntrega = false;
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

    const datosAnteriores = entregaSnap.data();
    const cantidadAnterior = datosAnteriores.cantidad_total ?? 0;
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

    // BUG 2 FIX: Ajustar stock por la diferencia en cantidad_total (ignorar AGUA)
    const insumo = datosAnteriores.insumo || '';
    const esAgua = datosAnteriores.tipo_registro === 'AGUA' || insumo.toUpperCase() === 'AGUA';
    if (!esAgua) {
      const diferencia = cantidadTotal - cantidadAnterior;
      if (diferencia > 0) {
        // La regularización aumentó la cantidad: descontar diferencia adicional del stock
        try { await restarStock(insumo, diferencia); }
        catch(e) { console.warn('Stock no ajustado en regularización (restar):', e.message); }
      } else if (diferencia < 0) {
        // La regularización redujo la cantidad: devolver diferencia al stock
        try { await sumarStock(insumo, Math.abs(diferencia)); }
        catch(e) { console.warn('Stock no ajustado en regularización (sumar):', e.message); }
      }
    }

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

    // Ajuste de stock si cambia la cantidad total
    if (datos.cantidad_total !== undefined) {
      const snap = await getDoc(entregaRef);
      if (snap.exists()) {
        const actual = snap.data();
        const insumo = actual.insumo || '';
        const esAgua = actual.tipo_registro === 'AGUA' || insumo.toUpperCase() === 'AGUA';
        if (!esAgua) {
          const totalAnterior = actual.cantidad_total ?? 0;
          const totalNuevo    = datos.cantidad_total ?? 0;
          const diferencia    = totalNuevo - totalAnterior; // + = se entregó más, - = se entregó menos
          if (diferencia > 0) {
            // Se registró más entrega: descontar diferencia adicional del stock
            try { await restarStock(insumo, diferencia); }
            catch(e) { console.warn('Stock no ajustado (restar):', e.message); }
          } else if (diferencia < 0) {
            // Se redujo la entrega: devolver la diferencia al stock
            try { await sumarStock(insumo, Math.abs(diferencia)); }
            catch(e) { console.warn('Stock no ajustado (sumar):', e.message); }
          }
        }
      }
    }

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

    // Leer el registro antes de eliminar para devolver stock
    const snap = await getDoc(entregaRef);
    if (snap.exists()) {
      const data   = snap.data();
      const insumo = data.insumo || '';
      const esAgua = data.tipo_registro === 'AGUA' || insumo.toUpperCase() === 'AGUA';
      const cantidadEntregada = data.cantidad_total ?? 0;
      if (!esAgua && cantidadEntregada > 0) {
        // Devolver al stock la cantidad que se había descontado
        try { await sumarStock(insumo, cantidadEntregada); }
        catch(e) { console.warn('Stock no restaurado:', e.message); }
      }
    }

    await deleteDoc(entregaRef);
    return true;
  } catch (error) {
    console.error("Error al eliminar entrega:", error);
    throw error;
  }
}

/**
 * Registra entregas de múltiples pisos de un pabellon en una sola operación atómica (Batch Write).
 * Aplica la misma lógica RF-03: si desglose coincide con total → REGULARIZADO, si no → POR_REGULARIZAR.
 *
 * @param {Object} params
 * @param {string} params.fecha       - Fecha de registro YYYY-MM-DD
 * @param {string} params.insumo      - Nombre del insumo
 * @param {string} params.pabellon    - Código del pabellón
 * @param {Object} params.encargado   - { uid, nombre, dni }
 * @param {Array}  params.registrosPisos - [{ pisoNumero, damas, varones, discapacitado, totalPiso }]
 * @returns {Promise<{guardados: number, ids: string[]}>}
 */
export async function registrarEntregaMultipiso({ fecha, insumo, pabellon, encargado, registrosPisos }) {
  try {
    const pisosValidos = registrosPisos.filter(p => (parseInt(p.totalPiso) || 0) > 0);

    if (pisosValidos.length === 0) {
      throw new Error("Debe ingresar al menos una cantidad en algún piso.");
    }

    const batch = writeBatch(db);
    const entregasRef = collection(db, REGISTROS_COLECCION);
    const ids = [];
    let totalGlobal = 0;

    pisosValidos.forEach(pisoData => {
      const d   = parseInt(pisoData.damas)          || 0;
      const v   = parseInt(pisoData.varones)        || 0;
      const dc  = parseInt(pisoData.discapacitado)  || 0;
      const sumaDesglose = d + v + dc;
      const totalPiso    = parseInt(pisoData.totalPiso) || sumaDesglose;

      // RF-03: REGULARIZADO solo si desglose > 0 y coincide con total
      const tieneDesglose   = sumaDesglose > 0;
      const desgloseCoincide = tieneDesglose && sumaDesglose === totalPiso;
      const estado = desgloseCoincide ? "REGULARIZADO" : "POR_REGULARIZAR";

      const newDocRef = doc(entregasRef);
      ids.push(newDocRef.id);
      totalGlobal += totalPiso;

      batch.set(newDocRef, {
        fecha_registro: fecha,
        insumo,
        pabellon,
        piso: parseInt(pisoData.pisoNumero),
        detalle_banos: { damas: d, varones: v, discapacitado: dc },
        cantidad_total: totalPiso,
        estado,
        encargado: {
          uid:    encargado.uid    || null,
          nombre: encargado.nombre || encargado.nombre_completo || "",
          dni:    encargado.dni    || ""
        },
        observaciones: pisoData.observaciones || null,
        regularizado_por:    null,
        fecha_regularizacion: null,
        timestamp: serverTimestamp()
      });
    });

    // BUG 3 FIX: Restar stock ANTES del batch.commit().
    // Si restarStock falla, no se ejecuta el batch → no quedan registros sin descuento de stock.
    if (totalGlobal > 0) {
      await restarStock(insumo, totalGlobal); // lanza si falla → batch no se ejecuta
    }

    try {
      await batch.commit();
    } catch (batchError) {
      // batch.commit() falló: revertir el stock ya descontado
      if (totalGlobal > 0) {
        try { await sumarStock(insumo, totalGlobal); } catch(re) { console.error("Error en rollback de stock multipiso:", re); }
      }
      throw batchError;
    }

    return { guardados: pisosValidos.length, ids };
  } catch (error) {
    console.error("Error al registrar entrega multipiso:", error);
    throw error;
  }
}
