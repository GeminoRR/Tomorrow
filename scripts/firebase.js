// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAwj1k-7YWuuuTfrU9_kGSAO-7J75chn0A",
    authDomain: "tomorrow-lens.firebaseapp.com",
    projectId: "tomorrow-lens",
    storageBucket: "tomorrow-lens.appspot.com",
    messagingSenderId: "909952544554",
    appId: "1:909952544554:web:0344e8b8d8ad92677ff853",
    databaseURL: "https://tomorrow-lens-default-rtdb.europe-west1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export { app };

// Initialize Firebase Authentication and get a reference to the service
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
const auth = getAuth(app);
export { auth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser };


// Initialize Realtime Database and get a reference to the service
import { getDatabase, ref, set, onValue, update, get, remove } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
const db = getDatabase(app);
export { db, ref, set, onValue, update, get, remove }