import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBqClsoZiDSO8Pe_426ApZD3fXhZ1-WHPM",
    authDomain: "aulavirtualsdc.firebaseapp.com",
    projectId: "aulavirtualsdc",
    storageBucket: "aulavirtualsdc.firebasestorage.app",
    messagingSenderId: "378515360304",
    appId: "1:378515360304:web:2c97ea6f0bc99b4eebbbf5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Utility: Function to show alerts
function showAlert(message, type = "success") {
    const alertBox = document.getElementById("alert-box");
    if (alertBox) {
        alertBox.textContent = message;
        alertBox.className = `alert ${type}`;
        alertBox.style.display = "block";
        setTimeout(() => (alertBox.style.display = "none"), 5000);
    } else {
        alert(message); // Remove the prefix here
    }
}

// Function: Register with Google
async function registerWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        await setDoc(doc(db, "profesores", user.email), { // Usa el email como identificador
            nombre: user.displayName,
            email: user.email,
            foto: user.photoURL || "",
            fechaRegistro: new Date().toISOString()
        });
        

        showAlert(`¡Bienvenido/a, ${user.displayName}! `);
        window.location.href = "./dashboard/index.html";
    } catch (error) {
        console.error("Error en el registro con Google:", error);
        showAlert("Hubo un error en el registro con Google: " + error.message, "error");
    }
}

// Variables globales
const welcomeText = document.getElementById("welcome-text");
const formsContainer = document.getElementById("forms-container");

// Mostrar mensaje de bienvenida y luego formularios con efecto de desenfoque
document.addEventListener("DOMContentLoaded", () => {
    welcomeText.style.display = "block";
    formsContainer.style.display = "none"; // Ocultar el formulario inicialmente
    setTimeout(() => {
        welcomeText.classList.add("hidden");
        setTimeout(() => {
            welcomeText.style.display = "none";
            formsContainer.style.display = "flex"; // Mostrar el formulario después del desenfoque
        }, 1000); // Esperar a que termine la transición de desenfoque
    }, 3000);
});

// Función para actualizar la barra de progreso
function updateProgressBar(progressBar, value) {
    progressBar.style.width = `${value}%`;
}

// Manejar el registro de usuarios
const registerForm = document.getElementById("register-form");
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();
    const firstname = document.getElementById("register-firstname").value.trim();
    const lastname = document.getElementById("register-lastname").value.trim();
    const phone = document.getElementById("register-phone").value.trim();
    const progressBar = document.getElementById("barra-progreso");

    if (!email || !password || !firstname || !lastname) {
        showAlert("Por favor completa todos los campos obligatorios.", "error");
        return;
    }

    try {
        updateProgressBar(progressBar, 25);
        // Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        updateProgressBar(progressBar, 50);
        
        // Guardar datos adicionales en Firestore
        await setDoc(doc(db, "profesores", email), { // Usa el email como identificador
            nombre: firstname,
            apellido: lastname,
            email: email,
            telefono: phone,
            fechaRegistro: new Date().toISOString()
        });
        

        updateProgressBar(progressBar, 100);
        showAlert("Registro exitoso. ¡Bienvenido/a!");
        window.location.href = "./dashboard/index.html";
    } catch (error) {
        console.error("Error al registrar el usuario:", error);
        showAlert("Hubo un error en el registro: " + error.message, "error");
        updateProgressBar(progressBar, 0);
    }
});

// Manejar el inicio de sesión de usuarios
const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const progressBar = document.getElementById("barra-progreso");

    if (!email || !password) {
        showAlert("Por favor ingresa tu correo y contraseña.", "error");
        return;
    }

    try {
        updateProgressBar(progressBar, 50);
        await signInWithEmailAndPassword(auth, email, password);
        updateProgressBar(progressBar, 100);
        showAlert("Inicio de sesión exitoso. ¡Bienvenido/a!");
        window.location.href = "./dashboard/index.html";
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        showAlert("Inicio de sesión fallido: " + error.message, "error");
        updateProgressBar(progressBar, 0);
    }
});

// Función para alternar formularios
window.showForm = (formId) => {
    document.querySelectorAll(".form-container").forEach((form) => {
        form.style.display = "none";
    });
    const formToShow = document.getElementById(formId);
    if (formToShow) formToShow.style.display = "block";
};

// Función para recuperar contraseña
async function recoverPassword() {
    const email = document.getElementById("recover-email").value.trim();

    if (!email) {
        showAlert("Por favor, ingresa tu correo electrónico.", "error");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showAlert("Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.");
    } catch (error) {
        console.error("Error al intentar recuperar la contraseña:", error);
        showAlert("Hubo un error al enviar el correo de recuperación: " + error.message, "error");
    }
}

// Exponer funciones al ámbito global
window.registerWithGoogle = registerWithGoogle;
window.recoverPassword = recoverPassword;