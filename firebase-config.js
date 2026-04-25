// IMPORTACIONES DIVINAS DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"; 

// TUS CREDENCIALES EXACTAS
const firebaseConfig = {
  apiKey: "AIzaSyAbJ1-jkRdYSoM3ERcycbfO3nQvb_qm7hM",
  authDomain: "klanfitness.firebaseapp.com",
  projectId: "klanfitness",
  storageBucket: "klanfitness.firebasestorage.app",
  messagingSenderId: "980382615322",
  appId: "1:980382615322:web:b3efc8fd22933831c48ea3",
  measurementId: "G-82YVKWDCVX"
};

// INICIALIZACIÓN
const app = initializeApp(firebaseConfig);

// EXPORTACIONES VITALES (Si falta una, la app se rompe)
export const db = getFirestore(app);
export const auth = getAuth(app);