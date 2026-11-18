/**
 * recalcular-stock.js
 * =====================================================================
 * Script standalone de auditoría y recálculo de stock — PAB-IN
 *
 * USO DESDE CONSOLA DEL NAVEGADOR:
 *   1. Abrir la app en el navegador (admin logueado).
 *   2. En la consola DevTools importar el módulo dinámicamente:
 *        const m = await import('/js/utils/recalcular-stock.js');
 *   3. Ejecutar el análisis:
 *        await m.recalcularStock();
 *      (o simplemente):
 *        await recalcularStock();   // expuesto en window automáticamente
 *   4. Revisar el reporte detallado en consola.
 *   5. Si los valores son correctos, aplicar:
 *        await window.aplicarStockRecalculado();
 *
 * IMPORTANTE: aplicarStockRecalculado() SOBREESCRIBE el stock en BD.
 *             Ejecutar sólo después de revisar el reporte.
 * =====================================================================
 */

import { db } from "../firebase-config.js";
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const CATALOGOS = "catalogos";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

function esAgua(registro) {
  const tipoAgua = (registro.tipo_registro || "").toUpperCase() === "AGUA";
  const insumoAgua = (registro.insumo || "").toUpperCase() === "AGUA";
  return tipoAgua || insumoAgua;
}

function fmt(n) {
  return String(n).padStart(6, " ");
}

function separador(char = "─", len = 72) {
  return char.repeat(len);
}

// ─────────────────────────────────────────────────────────────────────────────
// Lectura de datos desde Firestore
// ─────────────────────────────────────────────────────────────────────────────

async function leerIngresosStock() {
  const docRef = doc(db, CATALOGOS, "ingresos_stock");
  const snap = await getDoc(docRef);
  if (!snap.exists()) return [];
  return snap.data().lista || [];
}

async function leerRegistrosEntrega() {
  const colRef = collection(db, "registros_entrega");
  const snap = await getDocs(colRef);
  const registros = [];
  snap.forEach((d) => registros.push({ id: d.id, ...d.data() }));
  return registros;
}

async function leerStockActual() {
  const docRef = doc(db, CATALOGOS, "stock");
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Función principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * recalcularStock()
 *
 * Lee ingresos y entregas desde Firestore, calcula el stock teórico correcto
 * por insumo y lo compara contra el stock actual en BD.
 *
 * @returns {Promise<Object>} resultado — { stockCalculado, discrepancias, entregasPorInsumo }
 */
export async function recalcularStock() {
  console.log(separador("═"));
  console.log("  🔍  PAB-IN — AUDITORÍA DE STOCK");
  console.log("  Iniciando análisis…");
  console.log(separador("═"));

  // ── 1. Leer datos ──────────────────────────────────────────────────────────
  console.log("\n📥 Leyendo datos de Firestore…");
  const [ingresos, registros, stockActual] = await Promise.all([
    leerIngresosStock(),
    leerRegistrosEntrega(),
    leerStockActual()
  ]);
  console.log(`   · Ingresos de stock  : ${ingresos.length} registros`);
  console.log(`   · Entregas           : ${registros.length} registros`);
  console.log(`   · Insumos en stock BD: ${Object.keys(stockActual).length}`);

  // ── 2. Sumar ingresos por insumo ──────────────────────────────────────────
  const totalIngresos = {}; // { insumo: total }
  for (const ing of ingresos) {
    const key = (ing.insumo || "").trim();
    if (!key) continue;
    totalIngresos[key] = (totalIngresos[key] || 0) + (parseInt(ing.cantidad) || 0);
  }

  // ── 3. Sumar entregas por insumo (excluir AGUA) ───────────────────────────
  const totalEntregado = {}; // { insumo: total }
  const entregasPorInsumo = {}; // { insumo: [detalle, …] }

  for (const reg of registros) {
    if (esAgua(reg)) continue; // excluir AGUA
    const key = (reg.insumo || "").trim();
    if (!key) continue;

    const cant = parseInt(reg.cantidad_total) || 0;
    totalEntregado[key] = (totalEntregado[key] || 0) + cant;

    if (!entregasPorInsumo[key]) entregasPorInsumo[key] = [];
    entregasPorInsumo[key].push({
      id:          reg.id,
      fecha:       reg.fecha_registro || "?",
      pabellon:    reg.pabellon || "?",
      piso:        reg.piso ?? "?",
      cantidad:    cant,
      encargado:   (reg.encargado && reg.encargado.nombre) ? reg.encargado.nombre : "?",
      encargadoDni:(reg.encargado && reg.encargado.dni)    ? reg.encargado.dni    : "",
      estado:      reg.estado || "?"
    });
  }

  // ── 4. Calcular stock teórico correcto ────────────────────────────────────
  const todosInsumos = new Set([
    ...Object.keys(totalIngresos),
    ...Object.keys(totalEntregado),
    ...Object.keys(stockActual)
  ]);

  const stockCalculado = {};
  for (const insumo of todosInsumos) {
    const ing  = totalIngresos[insumo]  || 0;
    const sal  = totalEntregado[insumo] || 0;
    stockCalculado[insumo] = Math.max(0, ing - sal);
  }

  // ── 5. Detectar discrepancias ─────────────────────────────────────────────
  const discrepancias = {};
  for (const insumo of todosInsumos) {
    const calculado = stockCalculado[insumo] ?? 0;
    const actual    = stockActual[insumo]    ?? 0;
    const diff      = actual - calculado;
    if (diff !== 0) {
      discrepancias[insumo] = { calculado, actual, diferencia: diff };
    }
  }

  // ── 6. Reporte en consola ─────────────────────────────────────────────────
  console.log("\n" + separador("─"));
  console.log("  📊  REPORTE POR INSUMO");
  console.log(separador("─"));
  console.log(
    "  Insumo".padEnd(28) +
    "  Ingresos".padStart(10) +
    "  Entregado".padStart(12) +
    "  Stock✓Calc".padStart(13) +
    "  Stock BD".padStart(11) +
    "  Diferencia".padStart(13)
  );
  console.log(separador("─"));

  for (const insumo of [...todosInsumos].sort()) {
    const ing   = totalIngresos[insumo]  || 0;
    const sal   = totalEntregado[insumo] || 0;
    const calc  = stockCalculado[insumo] ?? 0;
    const bd    = stockActual[insumo]    ?? 0;
    const diff  = bd - calc;
    const marca = diff !== 0 ? " ⚠️" : "  ✅";

    console.log(
      `${marca} ${insumo.padEnd(26)}` +
      fmt(ing)   +
      fmt(sal).padStart(12) +
      fmt(calc).padStart(13) +
      fmt(bd).padStart(11) +
      (diff !== 0
        ? `  %c${String(diff > 0 ? "+" + diff : diff).padStart(10)}%c`
        : fmt(0).padStart(13)),
      diff !== 0 ? "color: red; font-weight: bold" : "",
      ""
    );
  }

  // ── 7. Detalle de discrepancias ───────────────────────────────────────────
  if (Object.keys(discrepancias).length === 0) {
    console.log("\n✅ No se encontraron discrepancias. El stock está en orden.");
  } else {
    console.log("\n" + separador("═"));
    console.log("  ⚠️   DISCREPANCIAS DETECTADAS — DETALLE DE ENTREGAS");
    console.log(separador("═"));

    for (const [insumo, info] of Object.entries(discrepancias)) {
      console.log(`\n%c🔴 INSUMO: ${insumo}`, "font-size:14px; font-weight:bold; color:#cc0000");
      console.log(`   Stock calculado (correcto): ${info.calculado}`);
      console.log(`   Stock en BD (actual)       : ${info.actual}`);
      console.log(
        `   Diferencia (BD - Calc)     : %c${info.diferencia > 0 ? "+" : ""}${info.diferencia}  ` +
        (info.diferencia > 0
          ? "(BD tiene MÁS de lo que debería → posible rollback no ejecutado o ingreso duplicado)"
          : "(BD tiene MENOS de lo que debería → entrega no descontó o descuento doble)"),
        "font-weight:bold; color:#cc0000"
      );

      const entregas = entregasPorInsumo[insumo] || [];
      if (entregas.length > 0) {
        console.log(`\n   📋 Todas las entregas de "${insumo}" (${entregas.length}):`);
        console.table(
          entregas.map((e) => ({
            Fecha:      e.fecha,
            Pabellón:   e.pabellon,
            Piso:       e.piso,
            Cantidad:   e.cantidad,
            Encargado:  e.encargado,
            DNI:        e.encargadoDni,
            Estado:     e.estado,
            DocID:      e.id
          }))
        );

        // Resumen por pabellón
        const porPabellon = {};
        for (const e of entregas) {
          porPabellon[e.pabellon] = (porPabellon[e.pabellon] || 0) + e.cantidad;
        }
        console.log(`\n   📍 Resumen por pabellón:`);
        for (const [pab, total] of Object.entries(porPabellon).sort()) {
          console.log(`      ${pab.padEnd(20)} : ${total}`);
        }

        // Resumen por encargado
        const porEncargado = {};
        for (const e of entregas) {
          porEncargado[e.encargado] = (porEncargado[e.encargado] || 0) + e.cantidad;
        }
        console.log(`\n   👷 Resumen por encargado:`);
        for (const [enc, total] of Object.entries(porEncargado).sort()) {
          console.log(`      ${enc.padEnd(30)} : ${total}`);
        }
      } else {
        console.log(`   (Sin entregas registradas para este insumo.)`);
      }
    }
  }

  // ── 8. Resumen ejecutivo ──────────────────────────────────────────────────
  console.log("\n" + separador("═"));
  console.log("  📌  RESUMEN EJECUTIVO");
  console.log(separador("─"));
  console.log(`  Total insumos analizados   : ${todosInsumos.size}`);
  console.log(`  Insumos SIN discrepancia   : ${todosInsumos.size - Object.keys(discrepancias).length}`);
  console.log(`  Insumos CON discrepancia   : ${Object.keys(discrepancias).length}`);

  if (Object.keys(discrepancias).length > 0) {
    console.log("\n  Acciones disponibles:");
    console.log("  %c  await window.aplicarStockRecalculado();", "font-family:monospace; background:#222; color:#0f0; padding:2px 6px");
    console.log("    → Aplica el stock calculado en BD (SOBREESCRIBE los valores actuales).");
    console.log("    → ⚠️  Acción irreversible. Revisar el reporte antes de ejecutar.");
  }
  console.log(separador("═"));

  // ── 9. Preparar función de aplicación y exponerla en window ──────────────
  const resultado = { stockCalculado, discrepancias, entregasPorInsumo };

  /**
   * aplicarStockRecalculado()
   * Escribe los valores calculados directamente en catalogos/stock.
   * Sólo actualiza los insumos CON discrepancia.
   */
  window.aplicarStockRecalculado = async function () {
    const insumosConDiff = Object.keys(discrepancias);
    if (insumosConDiff.length === 0) {
      console.log("✅ No hay discrepancias. No se realizaron cambios.");
      return;
    }

    console.log(`\n⚙️  Aplicando correcciones para ${insumosConDiff.length} insumo(s)…`);
    const docRef = doc(db, CATALOGOS, "stock");
    const parche = {};
    for (const insumo of insumosConDiff) {
      parche[insumo] = discrepancias[insumo].calculado;
      console.log(
        `   ${insumo.padEnd(28)} : ${discrepancias[insumo].actual} → ${discrepancias[insumo].calculado}`
      );
    }

    try {
      await setDoc(docRef, parche, { merge: true });
      console.log("\n✅ Stock actualizado correctamente en Firestore.");
      console.log("   Recargue la página para ver los valores actualizados en la app.");
    } catch (err) {
      console.error("❌ Error al aplicar stock:", err);
      throw err;
    }
  };

  // Exponer también recalcularStock en window para facilidad de uso
  window.recalcularStock = recalcularStock;

  return resultado;
}

// Auto-expose en window al importar el módulo
window.recalcularStock = recalcularStock;

export default recalcularStock;
