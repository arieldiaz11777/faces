// Import necessary modules from Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, getDocs } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

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
        <h2>Generar Cupón de Atención Médica</h2>
        <form id="cuponForm">
            <label for="nombre">Nombre y Apellido:</label>
            <input type="text" id="nombre" name="nombre" required>

            <label for="dni">Número de DNI:</label>
            <input type="text" id="dni" name="dni" required>

            <label for="afiliado">Número de Afiliado:</label>
            <input type="text" id="afiliado" name="afiliado" pattern="\\d{6}/\\d{2}" placeholder="000000/00" required>

            <label for="prestador">Prestador de Servicio:</label>
            <select id="prestador" name="prestador" required>
                <option value="" disabled selected>Seleccione un prestador</option>
                <option value="Prestador 1">Prestador 1</option>
                <option value="Prestador 2">Prestador 2</option>
                <option value="Prestador 3">Prestador 3</option>
                <option value="Prestador 4">Prestador 4</option>
                <option value="Prestador 5">Prestador 5</option>
            </select>

            <label for="especialidad">Especialidad Médica o Tipo de Estudio:</label>
            <select id="especialidad" name="especialidad" required>
                <option value="" disabled selected>Seleccione una opción</option>
                <option value="Cardiología">Cardiología</option>
                <option value="Pediatría">Pediatría</option>
                <option value="Traumatología">Traumatología</option>
                <option value="Radiografía">Radiografía</option>
                <option value="Ecografía">Ecografía</option>
            </select>

            <label for="otraEspecialidad">Otra Especialidad/Estudio:</label>
            <input type="text" id="otraEspecialidad" name="otraEspecialidad" placeholder="Ingresar manualmente">

            <label for="fechaInicio">Fecha de Inicio:</label>
            <input type="date" id="fechaInicio" name="fechaInicio" required>

            <label for="archivo">Cargar Archivo (Opcional):</label>
            <input type="file" id="archivo" name="archivo" accept=".pdf,.jpg,.png">

            <button type="submit">Generar Cupón</button>
        </form>
    `;

    document.getElementById("cuponForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombre = document.getElementById("nombre").value;
        const dni = document.getElementById("dni").value;
        const afiliado = document.getElementById("afiliado").value;
        const prestador = document.getElementById("prestador").value;
        const especialidad = document.getElementById("especialidad").value;
        const otraEspecialidad = document.getElementById("otraEspecialidad").value;
        const fechaInicio = document.getElementById("fechaInicio").value;
        const archivo = document.getElementById("archivo").files[0];

        try {
            const userEmail = localStorage.getItem("userEmail");
            if (userEmail) {
                let fileURL = "";
                if (archivo) {
                    const storageRef = ref(storage, `Bonos generados/${userEmail}/Cupones/${archivo.name}`);
                    await uploadBytes(storageRef, archivo);
                    fileURL = await getDownloadURL(storageRef);
                }

                const cuponRef = doc(collection(db, "Bonos generados", userEmail, "Cupones"));
                await setDoc(cuponRef, {
                    nombre,
                    dni,
                    afiliado,
                    prestador,
                    especialidad: especialidad || otraEspecialidad,
                    fechaInicio,
                    archivo: fileURL
                });
                alert("Cupón generado exitosamente");
            } else {
                console.error("No user email found in localStorage");
            }
        } catch (error) {
            console.error("Error generating cupon:", error);
        }
    });
}

// Function to display the cupones in a table
async function displayCupones() {
    mainContent.innerHTML = `
        <h2>Cupones Generados</h2>
        <table id="cupones-table">
            <thead>
                <tr>
                    <th>Nombre y Apellido</th>
                    <th>DNI</th>
                    <th>N° Afiliado</th>
                    <th>Prestador</th>
                    <th>Especialidad/Estudio</th>
                    <th>Fecha de Inicio</th>
                    <th>Archivo</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
            const cuponesQuery = query(collection(db, "Bonos generados", userEmail, "Cupones"));
            const querySnapshot = await getDocs(cuponesQuery);
            const tbody = document.querySelector("#cupones-table tbody");

            querySnapshot.forEach((doc) => {
                const cuponData = doc.data();
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${cuponData.nombre}</td>
                    <td>${cuponData.dni}</td>
                    <td>${cuponData.afiliado}</td>
                    <td>${cuponData.prestador}</td>
                    <td>${cuponData.especialidad}</td>
                    <td>${cuponData.fechaInicio}</td>
                    <td><a href="${cuponData.archivo}" target="_blank">Ver Archivo</a></td>
                `;
                tbody.appendChild(row);
            });
        } else {
            console.error("No user email found in localStorage");
        }
    } catch (error) {
        console.error("Error fetching cupones:", error);
    }
}

document.getElementById("dashboard-btn").addEventListener("click", () => {
    displayForm();
});

document.getElementById("courses-btn").addEventListener("click", () => {
    displayCupones();
});