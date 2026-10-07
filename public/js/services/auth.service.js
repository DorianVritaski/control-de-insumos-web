// Servicio de Autenticación
// Capa de interacción directa con Firebase Authentication y Firestore
// Según la especificación Spec_Driven_Development.md - Sección 6.1 y 4.1

import { auth, db } from "../firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Inicia sesión con correo institucional y contraseña.
 * @param {string} email - Correo institucional del usuario.
 * @param {string} password - Contraseña (para Admin: contraseña normal;
 *                            para Operador: DNI como contraseña).
 * @returns {Promise<any>} Resultado de la autenticación.
 */
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Consultar el documento del usuario en Firestore para verificar el rol
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await signOut(auth);
      throw new Error("Usuario no encontrado en Firestore.");
    }

    const userData = userSnap.data();
    const isAdmin = userData.rol === "ADMIN";
    const isOperator = userData.rol === "OPERADOR";

    if (!userData.activo) {
      await signOut(auth);
      throw new Error("Cuenta desactivada. Contacta al administrador.");
    }

    return {
      ...userCredential,
      uid,
      nombre: userData.nombre_completo,
      correo: userData.correo,
      dni: userData.dni,
      rol: userData.rol,
      activo: userData.activo,
      esAdmin: isAdmin,
      esOperador: isOperator
    };
  } catch (error) {
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      throw new Error("Correo o contraseña incorrectos.");
    }
    if (error.code === "auth/invalid-email") {
      throw new Error("El correo proporcionado no es válido.");
    }
    throw error;
  }
}

/**
 * Cierra la sesión actual.
 */
export function logout() {
  return signOut(auth);
}

/**
 * Observador de cambios de estado de autenticación.
 * @param {function} callback - Función llamada cuando cambia el estado de auth.
 * @returns {function} Unificación del observador (para usar con unsubscribe).
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Verifica si el usuario actual está autenticado.
 * @returns {boolean} True si hay usuario autenticado.
 */
export function isAuthenticated() {
  return auth.currentUser !== null;
}

/**
 * Obtiene los datos del usuario actual.
 * @returns {Promise<Object|null>} Datos del usuario o null.
 */
export async function getCurrentUser() {
  if (!isAuthenticated()) return null;

  const uid = auth.currentUser.uid;
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { uid, ...userSnap.data() };
  }
  return null;
}
