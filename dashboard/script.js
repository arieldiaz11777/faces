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

// Function to format date to dd/mm/aa hh:mm
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Function to fetch prestaciones from valores.csv
async function fetchPrestaciones() {
    const response = await fetch('valores.csv');
    const data = await response.text();
    const lines = data.split('\n').slice(1); // Skip header
    const prestaciones = lines.map(line => {
        const [prestacion, monto] = line.split(',');
        return { prestacion, monto: parseFloat(monto) };
    });
    return prestaciones;
}

// Function to display the form in the main content
async function displayForm() {
    const prestaciones = await fetchPrestaciones();

    mainContent.innerHTML = `
        <h1>Generar Cupón de Coseguro</h1>
        <form id="cuponForm" action="#" method="post" enctype="multipart/form-data">
            <label for="nombre">Nombre del Afiliado:</label>
            <input type="text" id="nombre" name="nombre" required>

            <label for="apellido">Apellido del Afiliado:</label>
            <input type="text" id="apellido" name="apellido" required>

            <label for="nro_afiliado">Número de Afiliado:</label>
            <input type="text" id="nro_afiliado" name="nro_afiliado" required>

            <label for="prestacion">Prestación:</label>
            <select id="prestacion" name="prestacion" required>
                ${prestaciones.map(p => `<option value="${p.prestacion}">${p.prestacion}</option>`).join('')}
            </select>

            <label for="fecha">Fecha de la Prestación:</label>
            <input type="date" id="fecha" name="fecha" required>

            <label for="importe">Importe del Coseguro:</label>
            <input type="number" id="importe" name="importe" step="0.01" required readonly>

            <label for="comprobante">Comprobante de Pago:</label>
            <input type="file" id="comprobante" name="comprobante" required>

            <button type="submit">Generar Cupón</button>
        </form>
    `;

    const prestacionSelect = document.getElementById("prestacion");
    const importeInput = document.getElementById("importe");

    prestacionSelect.addEventListener("change", () => {
        const selectedPrestacion = prestacionSelect.value;
        const selectedMonto = prestaciones.find(p => p.prestacion === selectedPrestacion).monto;
        importeInput.value = selectedMonto.toFixed(2);
    });

    document.getElementById("cuponForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector("button[type='submit']");
        submitButton.disabled = true;

        const nombre = document.getElementById("nombre").value;
        const apellido = document.getElementById("apellido").value;
        const nro_afiliado = document.getElementById("nro_afiliado").value;
        const prestacion = document.getElementById("prestacion").value;
        const fecha = document.getElementById("fecha").value;
        const importe = document.getElementById("importe").value;
        const comprobante = document.getElementById("comprobante").files[0];

        try {
            const userEmail = localStorage.getItem("userEmail");
            if (userEmail) {
                let fileURL = "";
                if (comprobante) {
                    const storageRef = ref(storage, `Bonos generados/${userEmail}/Cupones/${comprobante.name}`);
                    await uploadBytes(storageRef, comprobante);
                    fileURL = await getDownloadURL(storageRef);
                }

                const cuponRef = doc(collection(db, "Bonos generados", userEmail, "Cupones"));
                await setDoc(cuponRef, {
                    nombre,
                    apellido,
                    nro_afiliado,
                    prestacion,
                    fecha: new Date(fecha).toISOString(),
                    importe,
                    comprobante: fileURL
                });
                alert("Cupón generado exitosamente");
            } else {
                console.error("No user email found in localStorage");
            }
        } catch (error) {
            console.error("Error generating cupon:", error);
        } finally {
            submitButton.disabled = false;
        }
    });

    // Trigger change event to set initial importe value
    prestacionSelect.dispatchEvent(new Event('change'));
}

// Function to generate PDF from cupon data
async function generatePDF(cuponData, docId) {
    const { nombre, apellido, nro_afiliado, prestacion, fecha, importe, comprobante } = cuponData;
    const pdfContent = `
        <h1>Cupon de Coseguro</h1>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Apellido:</strong> ${apellido}</p>
        <p><strong>N° Afiliado:</strong> ${nro_afiliado}</p>
        <p><strong>Prestación:</strong> ${prestacion}</p>
        <p><strong>Fecha:</strong> ${formatDate(fecha)}</p>
        <p><strong>Importe:</strong> ${importe}</p>
        <p><strong>Comprobante:</strong> ${comprobante ? `<a href="${comprobante}" target="_blank">Ver Comprobante</a>` : 'No registra pago'}</p>
        <p><strong>ID del Documento:</strong> ${docId}</p>
    `;

    const pdfWindow = window.open("", "_blank");
    pdfWindow.document.write(pdfContent);
    pdfWindow.document.close();
    pdfWindow.print();
}

// Function to display the cupones in a table
async function displayCupones() {
    mainContent.innerHTML = `
        <h2>Cupones Generados</h2>
        <input type="text" id="filter-afiliado" placeholder="Filtrar por N° Afiliado">
        <table id="cupones-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>N° Afiliado</th>
                    <th>Prestación</th>
                    <th>Fecha</th>
                    <th>Importe</th>
                    <th>Comprobante</th>
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
                    <td>${cuponData.apellido}</td>
                    <td>${cuponData.nro_afiliado}</td>
                    <td>${cuponData.prestacion}</td>
                    <td>${formatDate(cuponData.fecha)}</td>
                    <td>${cuponData.importe}</td>
                    <td>${cuponData.comprobante ? `<a href="${cuponData.comprobante}" target="_blank">Ver Comprobante</a>` : 'No registra pago'}</td>
                `;
                row.addEventListener("click", () => generatePDF(cuponData, doc.id));
                tbody.appendChild(row);
            });

            // Add event listener for filtering
            document.getElementById("filter-afiliado").addEventListener("input", function() {
                const filterValue = this.value.toLowerCase();
                const rows = tbody.getElementsByTagName("tr");
                for (let i = 0; i < rows.length; i++) {
                    const afiliadoCell = rows[i].getElementsByTagName("td")[2];
                    if (afiliadoCell) {
                        const afiliadoText = afiliadoCell.textContent || afiliadoCell.innerText;
                        if (afiliadoText.toLowerCase().indexOf(filterValue) > -1) {
                            rows[i].style.display = "";
                        } else {
                            rows[i].style.display = "none";
                        }
                    }
                }
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