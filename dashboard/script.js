// Import necessary modules from Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, collectionGroup } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

// Firebase configuration
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
const storage = getStorage(app);

// Variables for user info
const userName = document.getElementById("user-name");
const userEmail = document.getElementById("user-email");
const userPhoto = document.querySelector(".user-photo");

// Fetch user data when the user is authenticated
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Get user document reference using email instead of UID
            const docRef = doc(db, "Bonos generados", user.email);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                
                // Display user data
                userName.textContent = `${userData.nombre || ''} ${userData.apellido || ''}`.trim();
                userEmail.textContent = userData.email ? `Email: ${userData.email}` : '';
                userPhoto.src = userData.foto || "./perfil.png";

                // Guardar el email del usuario en localStorage
                localStorage.setItem("userEmail", userData.email);
            } else {
                console.log("No user data found");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        console.log("No user currently logged in");
        window.location.href = "/index.html"; // Redirection in case the user is not logged in
    }
});

// Log out the user
document.getElementById("logout-btn").addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.reload(); // Refresh the page after logging out
    }).catch((error) => {
        console.error("Error during logout:", error);
    });
});

// Toggle dark/light mode
const toggleModeBtn = document.createElement("button");
toggleModeBtn.id = "toggle-mode-btn";
toggleModeBtn.textContent = "🌓";
document.querySelector(".header").appendChild(toggleModeBtn); // This is where the toggle mode button is appended

toggleModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
});

// Panel functionality
const mainContent = document.getElementById("main-content");

async function loadContent(url) {
    try {
        const response = await fetch(url);
        const content = await response.text();
        mainContent.innerHTML = content;
    } catch (error) {
        console.error("Error loading content:", error);
    }
}

// Function to display the form in the main content
function displayForm() {
    mainContent.innerHTML = `
        <h2>Nuevo Bono</h2>
        <form id="bono-form">
            <label for="affiliate-number">Número de Afiliado:</label>
            <input type="text" id="affiliate-number" name="affiliate-number" pattern="\\d{6}/\\d{2}" required>
            <label for="full-name">Nombre y Apellido:</label>
            <input type="text" id="full-name" name="full-name" required>
            <label for="dni-number">Número de DNI:</label>
            <input type="text" id="dni-number" name="dni-number" required>
            <label for="service-provider">Prestador de Servicio:</label>
            <select id="service-provider" name="service-provider" required>
                <option value="" disabled selected>Seleccione un prestador</option>
                <!-- Agregar 10 opciones de prestadores -->
                <option value="Prestador 1">Prestador 1</option>
                <option value="Prestador 2">Prestador 2</option>
                <option value="Prestador 3">Prestador 3</option>
                <option value="Prestador 4">Prestador 4</option>
                <option value="Prestador 5">Prestador 5</option>
                <option value="Prestador 6">Prestador 6</option>
                <option value="Prestador 7">Prestador 7</option>
                <option value="Prestador 8">Prestador 8</option>
                <option value="Prestador 9">Prestador 9</option>
                <option value="Prestador 10">Prestador 10</option>
            </select>
            <label for="specialty">Especialidad:</label>
            <select id="specialty" name="specialty" required>
                <option value="" disabled selected>Seleccione una especialidad</option>
                <!-- Agregar 10 opciones de especialidades -->
                <option value="Especialidad 1">Especialidad 1</option>
                <option value="Especialidad 2">Especialidad 2</option>
                <option value="Especialidad 3">Especialidad 3</option>
                <option value="Especialidad 4">Especialidad 4</option>
                <option value="Especialidad 5">Especialidad 5</option>
                <option value="Especialidad 6">Especialidad 6</option>
                <option value="Especialidad 7">Especialidad 7</option>
                <option value="Especialidad 8">Especialidad 8</option>
                <option value="Especialidad 9">Especialidad 9</option>
                <option value="Especialidad 10">Especialidad 10</option>
            </select>
            <label for="start-date">Fecha de Inicio:</label>
            <input type="date" id="start-date" name="start-date" required>
            <label for="bono-status">Estado de Bono:</label>
            <input type="text" id="bono-status" name="bono-status" value="Aprobado" readonly>
            <label for="file-upload">Subir Archivo (opcional):</label>
            <input type="file" id="file-upload" name="file-upload">
            <button type="submit">Guardar</button>
        </form>
    `;

    document.getElementById("bono-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const affiliateNumber = document.getElementById("affiliate-number").value;
        const fullName = document.getElementById("full-name").value;
        const dniNumber = document.getElementById("dni-number").value;
        const serviceProvider = document.getElementById("service-provider").value;
        const specialty = document.getElementById("specialty").value;
        const startDate = document.getElementById("start-date").value;
        const bonoStatus = document.getElementById("bono-status").value;
        const fileUpload = document.getElementById("file-upload").files[0];

        try {
            const userEmail = localStorage.getItem("userEmail");
            if (userEmail) {
                let fileURL = "";
                if (fileUpload) {
                    const storageRef = ref(storage, `bonos/${userEmail}/${affiliateNumber}/${fileUpload.name}`);
                    await uploadBytes(storageRef, fileUpload);
                    fileURL = await getDownloadURL(storageRef);
                }

                const bonoRef = doc(db, "usuarios", userEmail, "afiliados", affiliateNumber.replace("/", "_"), "bonos", startDate);
                await setDoc(bonoRef, {
                    numeroAfiliado: affiliateNumber,
                    nombreApellido: fullName,
                    dni: dniNumber,
                    prestador: serviceProvider,
                    especialidad: specialty,
                    fechaInicio: startDate,
                    estado: bonoStatus,
                    archivo: fileURL
                });
                alert("Bono guardado exitosamente");
            } else {
                console.error("No user email found in localStorage");
            }
        } catch (error) {
            console.error("Error saving bono data:", error);
        }
    });
}

// Function to display the courses in a container format
async function displayCourses() {
    mainContent.innerHTML = `
        <h2>Mis Cursos</h2>
        <div id="courses-container"></div>
    `;

    try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
            const coursesQuery = query(collection(db, "profesores", userEmail, "Cursos"));
            const querySnapshot = await getDocs(coursesQuery);
            const coursesContainer = document.getElementById("courses-container");

            querySnapshot.forEach((doc) => {
                const courseData = doc.data();
                const courseDiv = document.createElement("div");
                courseDiv.classList.add("course-item");
                courseDiv.innerHTML = `
                    <h3>${courseData.curso}</h3>
                    <p>Fecha de Inicio: ${courseData.fechaInicio}</p>
                    <p>Fecha de Finalización: ${courseData.fechaFin}</p>
                    <p>Cantidad de Clases: ${courseData.cantidadClases}</p>
                    <p><a href="${courseData.materiales}" target="_blank">Ver Material</a></p>
                    <img src="${courseData.materiales}" alt="Miniatura" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                `;
                coursesContainer.appendChild(courseDiv);
            });
        } else {
            console.error("No user email found in localStorage");
        }
    } catch (error) {
        console.error("Error fetching courses:", error);
    }
}

// Ensure elements exist before adding event listeners
document.addEventListener("DOMContentLoaded", () => {
    const dashboardBtn = document.getElementById("dashboard-btn");
    const coursesBtn = document.getElementById("courses-btn");

    if (dashboardBtn) {
        dashboardBtn.addEventListener("click", () => {
            displayForm();
        });
    }

    if (coursesBtn) {
        coursesBtn.addEventListener("click", () => {
            displayCourses();
        });
    }
});