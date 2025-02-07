import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCWQYVqq6gqJJe9fPMmgNHIAgj6yM_jViE",
    authDomain: "bonos-88a52.firebaseapp.com",
    projectId: "bonos-88a52",
    storageBucket: "bonos-88a52.firebasestorage.app",
    messagingSenderId: "170794030614",
    appId: "1:170794030614:web:f1f4a4cbbcf897e0200737"
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
        alert(message);
    }
}

// Function: Register and Login with Google
async function registerWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        await setDoc(doc(db, "Bonos generados", user.email), {
            nombre: user.displayName,
            email: user.email,
            foto: user.photoURL || "",
            fechaRegistro: new Date().toISOString()
        });

        showAlert(`¡Bienvenido/a, ${user.displayName}! `);
        if (user.email === "todocodigos1177@gmail.com") {
            window.location.href = "./central/index.html";//redireccionar a la pagina de administrador
        } else {
            window.location.href = "./dashboard/index.html";
        }
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
    formsContainer.style.display = "none";
    setTimeout(() => {
        welcomeText.classList.add("hidden");
        setTimeout(() => {
            welcomeText.style.display = "none";
            formsContainer.style.display = "flex";
        }, 1000);
    }, 3000);
});

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
