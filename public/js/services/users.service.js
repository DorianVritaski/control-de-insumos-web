// Servicio de Usuarios
// CRUD de operadores y administradores
// Según la especificación Spec_Driven_Development.md - Sección 5.1, RF-06

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
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const USERS_COLLECTION = "users";

/**
 * Registra un nuevo usuario (Admin).
 * @param {string} correo - Correo institucional.
 * @param {string} dni - DNI del usuario.
 * @param {string} nombreCompleto - Nombre completo.
 * @param {string} rol - Rol del usuario ("OPERADOR" o "ADMIN").
 * @param {boolean} activo - Estado de acceso.
 * @param {string} uid - UID de Firebase Auth.
 * @returns {Promise<Object>} Usuario creado.
 */
export async function registrarUsuario(correo, dni, nombreCompleto, rol, activo = true, uid = null) {
  try {
    const usuariosRef = collection(db, USERS_COLLECTION);

    // Verificar que el correo no exista
    const q = query(usuariosRef, where("correo", "==", correo));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error(`El correo "${correo}" ya está registrado.`);
    }

    const usuarioData = {
      uid: uid || "pending", // UID será asignado por Firebase Auth
      correo,
      dni,
      nombre_completo: nombreCompleto,
      rol: rol.toUpperCase() === "ADMIN" ? "ADMIN" : "OPERADOR",
      activo,
      created_at: serverTimestamp()
    };

    const docRef = await addDoc(usuariosRef, usuarioData);

    return {
      id: docRef.id,
      ...usuarioData
    };
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    throw error;
  }
}

/**
 * Obtiene todos los usuarios (Admin).
 * @returns {Promise<Array>} Lista de usuarios.
 */
export async function obtenerTodosLosUsuarios() {
  try {
    const usuariosRef = collection(db, USERS_COLLECTION);
    const q = query(usuariosRef, orderBy("nombre_completo", "asc"));
    const snapshot = await getDocs(q);
    const usuarios = [];

    snapshot.forEach((doc) => {
      usuarios.push({ id: doc.id, ...doc.data() });
    });

    return usuarios;
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    throw error;
  }
}

/**
 * Obtiene un usuario por UID.
 * @param {string} uid - UID del usuario.
 * @returns {Promise<Object|null>} Datos del usuario o null.
 */
export async function obtenerUsuarioPorUid(uid) {
  try {
    const usuariosRef = collection(db, USERS_COLLECTION);
    const q = query(usuariosRef, where("uid", "==", uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    throw error;
  }
}

/**
 * Actualiza un usuario (Admin).
 * @param {string} userId - ID del documento del usuario.
 * @param {Object} datos - Datos a actualizar.
 */
export async function actualizarUsuario(userId, datos) {
  try {
    const usuarioRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(usuarioRef, datos);
    return { id: userId, ...datos };
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    throw error;
  }
}

/**
 * Desactiva/Activa un usuario (Admin).
 * @param {string} userId - ID del documento del usuario.
 * @param {boolean} activo - Nuevo estado de acceso.
 */
export async function cambiarEstadoUsuario(userId, activo) {
  try {
    const usuarioRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(usuarioRef, {
      activo,
      updated_at: new Date().toISOString()
    });
    return { id: userId, activo };
  } catch (error) {
    console.error("Error al cambiar estado de usuario:", error);
    throw error;
  }
}

/**
 * Obtiene un usuario por DNI.
 * @param {string} dni - DNI del usuario.
 * @returns {Promise<Object|null>} Datos del usuario o null.
 */
export async function obtenerUsuarioPorDni(dni) {
  try {
    const usuariosRef = collection(db, USERS_COLLECTION);
    const q = query(usuariosRef, where("dni", "==", dni));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error al obtener usuario por DNI:", error);
    throw error;
  }
}
