// Configuración del SDK de Firebase (v10.8.0)
// Según la especificación Spec_Driven_Development.md - Sección 7.3

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyARQrX_95ep1n6QbktF0FjhV51qtLdSxes",
  authDomain: "control-de-insumos-web.firebaseapp.com",
  projectId: "control-de-insumos-web",
  storageBucket: "control-de-insumos-web.firebasestorage.app",
  messagingSenderId: "333088496966",
  appId: "1:333088496966:web:9d44ce0f2619f3132c1947"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
