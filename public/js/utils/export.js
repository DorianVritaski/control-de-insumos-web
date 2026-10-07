// Utilidades de Exportación a Excel/CSV
// Según la especificación Spec_Driven_Development.md - Sección 2.1, RF-08

/**
 * Convierte un array de objetos a una cadena CSV.
 * @param {Array} data - Array de objetos a convertir.
 * @param {Array} fields - Array de campos a incluir.
 * @returns {string} Cadena CSV.
 */
export function convertToCSV(data, fields = null) {
  if (!data || data.length === 0) {
    return "";
  }

  // Si no se especifican campos, obtenerlos de la primera fila
  if (!fields) {
    fields = Object.keys(data[0]);
  }

  // Crear el encabezado
  const headers = fields.join(",");
  const rows = data.map((row) => {
    return fields.map((field) => {
      const value = row[field];
      // Escapar valores que contienen comas, comillas o saltos de línea
      if (value === null || value === undefined) {
        return "";
      }
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",");
  });

  return [headers, ...rows].join("\n");
}

/**
 * Descarga los datos como archivo CSV.
 * @param {Array} data - Array de objetos a descargar.
 * @param {string} filename - Nombre del archivo.
 * @param {Array} fields - Array de campos a incluir (opcional).
 */
export function downloadCSV(data, filename = "reporte", fields = null) {
  const csv = convertToCSV(data, fields);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Convierte un array de objetos a una cadena de JSON.
 * @param {Array} data - Array de objetos a convertir.
 * @returns {string} Cadena JSON.
 */
export function convertToJSON(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Descarga los datos como archivo JSON.
 * @param {Array} data - Array de objetos a descargar.
 * @param {string} filename - Nombre del archivo.
 */
export function downloadJSON(data, filename = "reporte") {
  const json = convertToJSON(data);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `${filename}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Exporta los datos a Excel/XLSX (requiere SheetJS).
 * @param {Array} data - Array de objetos a exportar.
 * @param {string} filename - Nombre del archivo.
 * @param {Array} fields - Array de campos a incluir (opcional).
 */
export function downloadXLSX(data, filename = "reporte", fields = null) {
  try {
    // Solo funciona si SheetJS está disponible globalmente
    if (typeof XLSX === "undefined") {
      console.warn("SheetJS no está disponible. Usando CSV como fallback.");
      downloadCSV(data, filename, fields);
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data, { header: fields });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    // Fallback a CSV
    downloadCSV(data, filename, fields);
  }
}

/**
 * Genera un reporte de entregas en múltiples formatos.
 * @param {Array} data - Datos de entregas.
 * @param {string} prefix - Prefijo del nombre del archivo.
 */
export function exportEntregasMultiple(data, prefix = "reporte") {
  downloadCSV(data, prefix, ["fecha_registro", "insumo", "cantidad_total", "pabellon", "piso", "estado"]);
  // Descomentar para exportar también a Excel
  // downloadXLSX(data, prefix, ["fecha_registro", "insumo", "cantidad_total", "pabellon", "piso", "estado"]);
}
