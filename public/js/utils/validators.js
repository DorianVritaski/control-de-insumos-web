// Validaciones de formularios
// Según la especificación Spec_Driven_Development.md - Sección 2.1, RF-04

/**
 * Valida que la suma de los baños sea igual a la cantidad total.
 * @param {Object} formData - Datos del formulario.
 * @returns {Object} Resultado de la validación.
 */
export function validateCantidadTotal(formData) {
  const errors = [];
  const { damas, varones, discapacitado, cantidadTotal } = formData;

  // Verificar que los campos numéricos sean válidos
  const damasNum = Number(damas) || 0;
  const varonesNum = Number(varones) || 0;
  const discapacitadoNum = Number(discapacitado) || 0;
  const totalCalculado = damasNum + varonesNum + discapacitadoNum;

  // Si no se ingresan baños, se permite cantidadTotal manual
  if (damasNum === 0 && varonesNum === 0 && discapacitadoNum === 0) {
    if (!cantidadTotal || isNaN(Number(cantidadTotal))) {
      errors.push("La cantidad total es requerida cuando no se especifican baños.");
    }
    return { valid: errors.length === 0, errors };
  }

  // Validar que la cantidad total coincida con la suma de los baños
  if (cantidadTotal !== undefined && cantidadTotal !== totalCalculado) {
    errors.push(
      `La cantidad total (${cantidadTotal}) no coincide con la suma de los baños (${totalCalculado}).`
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida un campo de texto (no vacío, longitud máxima).
 * @param {string} value - Valor del campo.
 * @param {number} maxLength - Longitud máxima permitida.
 * @param {string} fieldName - Nombre del campo (para mensajes de error).
 * @returns {Object} Resultado de la validación.
 */
export function validateText(value, maxLength = 100, fieldName = "Campo") {
  const errors = [];
  if (value === null || value === undefined || value.trim() === "") {
    errors.push(`${fieldName} es requerido.`);
  } else if (value.length > maxLength) {
    errors.push(`${fieldName} excede la longitud máxima de ${maxLength} caracteres.`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Valida un número entero positivo.
 * @param {string|number} value - Valor a validar.
 * @param {string} fieldName - Nombre del campo.
 * @param {boolean} allowZero - Permitir cero.
 * @returns {Object} Resultado de la validación.
 */
export function validateInteger(value, fieldName = "Campo", allowZero = true) {
  const errors = [];
  const num = Number(value);
  if (value === null || value === undefined || value === "") {
    errors.push(`${fieldName} es requerido.`);
    return { valid: errors.length === 0, errors };
  }
  if (isNaN(num) || !Number.isInteger(num)) {
    errors.push(`${fieldName} debe ser un número entero.`);
  } else if (num < 0) {
    errors.push(`${fieldName} no puede ser negativo.`);
  } else if (!allowZero && num === 0) {
    errors.push(`${fieldName} no puede ser cero.`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Valida un DNI (10 dígitos numéricos).
 * @param {string} dni - Valor del DNI.
 * @returns {Object} Resultado de la validación.
 */
export function validateDNI(dni) {
  const errors = [];
  if (dni === null || dni === undefined || dni.trim() === "") {
    errors.push("El DNI es requerido.");
  } else if (!/^\d{8}$/.test(dni.trim())) {
    errors.push("El DNI debe tener exactamente 8 caracteres numéricos.");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Valida un correo electrónico institucional.
 * @param {string} email - Valor del correo.
 * @returns {Object} Resultado de la validación.
 */
export function validateEmail(email) {
  const errors = [];
  if (email === null || email === undefined || email.trim() === "") {
    errors.push("El correo es requerido.");
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
    errors.push("El correo no tiene un formato válido.");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Valida una contraseña (mínimo 8 caracteres).
 * @param {string} password - Valor de la contraseña.
 * @returns {Object} Resultado de la validación.
 */
export function validatePassword(password) {
  const errors = [];
  if (password === null || password === undefined || password === "") {
    errors.push("La contraseña es requerida.");
  } else if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres.");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Valida un rango de fechas (fecha inicio y fecha fin).
 * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD).
 * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD).
 * @returns {Object} Resultado de la validación.
 */
export function validateDateRange(fechaInicio, fechaFin) {
  const errors = [];
  if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
    errors.push("La fecha de inicio no puede ser posterior a la fecha de fin.");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Valida un estado de entrega.
 * @param {string} estado - Estado del registro.
 * @returns {Object} Resultado de la validación.
 */
export function validateEstado(estado) {
  const allowedStates = ["REGULARIZADO", "POR_REGULARIZAR"];
  const errors = [];
  if (!allowedStates.includes(estado)) {
    errors.push(`Estado inválido. Debe ser uno de: ${allowedStates.join(", ")}.`);
  }
  return { valid: errors.length === 0, errors };
}
