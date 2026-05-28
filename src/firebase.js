import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWHved2GrztJuCINFMYgqigF8iFv_mtFs",
  authDomain: "vesak-dansal-live.firebaseapp.com",
  projectId: "vesak-dansal-live",
  storageBucket: "vesak-dansal-live.firebasestorage.app",
  messagingSenderId: "686956933156",
  appId: "1:686956933156:web:788d894f965e8fa6fa28b1",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

signInAnonymously(auth).catch(console.error);

export function getCurrentUserId() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user?.uid || null);
    });
  });
}