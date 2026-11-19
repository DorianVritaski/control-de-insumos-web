// Configuración del SDK de Firebase (v10.8.0)
// Según la especificación Spec_Driven_Development.md - Sección 7.3

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAoyHJTW6h3SjXmJY-ARC7e2Tq1RTPuCRA",
  authDomain: "control-de-insumos-web-6489f.firebaseapp.com",
  projectId: "control-de-insumos-web-6489f",
  storageBucket: "control-de-insumos-web-6489f.firebasestorage.app",
  messagingSenderId: "392046046071",
  appId: "1:392046046071:web:881df337095632882bcf72"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
