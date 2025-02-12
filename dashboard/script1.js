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
            <label for="nombre">Nombre y Apellido del Afiliado:</label>
            <input type="text" id="nombre" name="nombre" required>

            <label for="dni">DNI del Afiliado:</label>
            <input type="text" id="dni" name="dni" required>

            <label for="nro_afiliado">Número de Afiliado:</label>
            <input type="text" id="nro_afiliado" name="nro_afiliado" required>

            <label for="prestacion">Prestación:</label>
            <select id="prestacion" name="prestacion" required>
                ${prestaciones.map(p => `<option value="${p.prestacion}">${p.prestacion}</option>`).join('')}
            </select>

            <input type="hidden" id="fecha" name="fecha">

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
        submitButton.textContent = "Enviando..."; // Cambiar el texto del botón

        const nombre = document.getElementById("nombre").value;
        const dni = document.getElementById("dni").value;
        const nro_afiliado = document.getElementById("nro_afiliado").value;
        const prestacion = document.getElementById("prestacion").value;
        const fecha = new Date().toISOString();
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
                    dni,
                    nro_afiliado,
                    prestacion,
                    fecha,
                    importe,
                    comprobante: fileURL
                });

               

                alert("Cupón generado exitosamente"); // Asegurar que se muestre la alerta

                // Limpiar los campos del formulario
                e.target.reset();

                // Trigger change event to reset importe value
                prestacionSelect.dispatchEvent(new Event('change'));

                // Generate PDF
                generatePDF({
                    nombre,
                    dni,
                    nro_afiliado,
                    prestacion,
                    fecha,
                    importe,
                    comprobante: fileURL
                }, cuponRef.id);
            } else {
                console.error("No user email found in localStorage");
            }
        } catch (error) {
            console.error("Error generating cupon:", error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Generar Cupón"; // Restaurar el texto del botón
        }
    });

    // Trigger change event to set initial importe value
    prestacionSelect.dispatchEvent(new Event('change'));
}



// Function to display the cupones in a table
async function displayCupones() {
    mainContent.innerHTML = `
        <h2>Cupones Generados</h2>
        <input type="text" id="filter-afiliado" placeholder="Filtrar por N° Afiliado">
        <table id="cupones-table">
            <thead>
                <tr>
                    <th></th>
                    <th>Nombre y Apellido</th>
                    <th>DNI</th>
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
                    <td><button class="pdf-btn">📄</button></td>
                    <td>${cuponData.nombre}</td>
                    <td>${cuponData.dni}</td>
                    <td>${cuponData.nro_afiliado}</td>
                    <td>${cuponData.prestacion}</td>
                    <td>${formatDate(cuponData.fecha)}</td>
                    <td>${cuponData.importe}</td>
                    <td>${cuponData.comprobante ? `<a href="${cuponData.comprobante}" target="_blank">Ver Comprobante</a>` : 'No registra pago'}</td>
                `;
                row.querySelector(".pdf-btn").addEventListener("click", () => generatePDF(cuponData, doc.id));
                tbody.appendChild(row);
            });

            // Add event listener for filtering
            document.getElementById("filter-afiliado").addEventListener("input", function() {
                const filterValue = this.value.toLowerCase();
                const rows = tbody.getElementsByTagName("tr");
                for (let i = 0; i < rows.length; i++) {
                    const afiliadoCell = rows[i].getElementsByTagName("td")[3];
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

async function generatePDF(cuponData, docId) {
    const { nombre, dni, nro_afiliado, prestacion, fecha, importe, comprobante } = cuponData;

    // Verificamos si el comprobante es una imagen o un PDF
    const isImage = comprobante && /\.(jpeg|jpg|png|gif)$/i.test(comprobante);
    const isPDF = comprobante && /\.pdf$/i.test(comprobante);

    const pdfContent = `
        <html>
        <head>
            <title>Cupon de Coseguro</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f8f8f8;
                }
                .container {
                    width: 50%;
                    padding: 20px;
                    border-radius: 15px;
                    background: white;
                    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
                    text-align: left;
                }
                h1 {
                    text-align: center;
                    color: #333;
                    border-bottom: 2px solid #007BFF;
                    padding-bottom: 10px;
                }
                p {
                    font-size: 14px;
                    margin: 8px 0;
                    color: #555;
                }
                strong {
                    color: #000;
                }
                .comprobante {
                    margin-top: 10px;
                    text-align: center;
                }
                .comprobante a {
                    text-decoration: none;
                    color: #007BFF;
                    font-weight: bold;
                }
                .comprobante-view {
                    margin-top: 15px;
                    text-align: center;
                }
                iframe {
                    width: 100%;
                    height: 400px;
                    border: none;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 10px;
                    box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Cupon de Coseguro OSCHOCA</h1>
                <p><strong>Codigo:</strong> ${docId}</p>
                <p><strong>Nombre y Apellido:</strong> ${nombre}</p>
                <p><strong>DNI:</strong> ${dni}</p>
                <p><strong>N° Afiliado:</strong> ${nro_afiliado}</p>
                <p><strong>Prestación:</strong> ${prestacion}</p>
                <p><strong>Fecha:</strong> ${formatDate(fecha)}</p>
                <p><strong>Importe:</strong> $${importe}</p>
                
                <p class="comprobante">
                    <strong>Comprobante:</strong> 
                    ${comprobante ? `<a href="${comprobante}" target="_blank">Ver Comprobante</a>` : 'No registra pago'}
                </p>

                ${comprobante ? `
                <div class="comprobante-view">
                    ${isPDF ? `<iframe src="${comprobante}"></iframe>` : ''}
                    ${isImage ? `<img src="${comprobante}" alt="Comprobante">` : ''}
                </div>` : ''}
                
               
            </div>
        </body>
        </html>
    `;

    const pdfWindow = window.open("", "_blank");
    pdfWindow.document.write(pdfContent);
    pdfWindow.document.close();
    pdfWindow.print();
}

document.getElementById("dashboard-btn").addEventListener("click", () => {
    displayForm();
});

document.getElementById("courses-btn").addEventListener("click", () => {
    displayCupones();
});