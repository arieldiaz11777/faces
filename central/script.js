// Importar los módulos necesarios de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, getDocs, collectionGroup, where } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCWQYVqq6gqJJe9fPMmgNHIAgj6yM_jViE",
    authDomain: "bonos-88a52.firebaseapp.com",
    projectId: "bonos-88a52",
    storageBucket: "bonos-88a52.firebasestorage.app",
    messagingSenderId: "170794030614",
    appId: "1:170794030614:web:f1f4a4cbbcf897e0200737"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Variables para la información del usuario
const userName = document.getElementById("user-name");
const userEmail = document.getElementById("user-email");
const userPhoto = document.querySelector(".user-photo");

// Obtener datos del usuario cuando el usuario está autenticado
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Obtener referencia del documento del usuario usando el email en lugar del UID
            const docRef = doc(db, "Bonos generados", user.email);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                
                // Mostrar datos del usuario
                userName.textContent = `${userData.nombre || ''} ${userData.apellido || ''}`.trim();
                userEmail.textContent = userData.email ? `Email: ${userData.email}` : '';
                userPhoto.src = userData.foto || "./perfil.png";

                // Guardar el email del usuario en localStorage
                localStorage.setItem("userEmail", userData.email);
            } else {
                console.log("No se encontraron datos del usuario");
            }
        } catch (error) {
            console.error("Error al obtener los datos del usuario:", error);
        }
    } else {
        console.log("No hay ningún usuario actualmente conectado");
        window.location.href = "/index.html"; // Redirección en caso de que el usuario no esté conectado
    }
});

// Cerrar sesión del usuario
document.getElementById("logout-btn").addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.reload(); // Refrescar la página después de cerrar sesión
    }).catch((error) => {
        console.error("Error durante el cierre de sesión:", error);
    });
});

// Alternar entre modo oscuro/claro
const toggleModeBtn = document.createElement("button");
toggleModeBtn.id = "toggle-mode-btn";
toggleModeBtn.textContent = "🌓";
document.querySelector(".header").appendChild(toggleModeBtn); // Aquí se añade el botón de alternar modo

toggleModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
});

// Funcionalidad del panel
const mainContent = document.getElementById("main-content");

async function loadContent(url) {
    try {
        const response = await fetch(url);
        const content = await response.text();
        mainContent.innerHTML = content;
    } catch (error) {
        console.error("Error al cargar el contenido:", error);
    }
}

// Función para formatear la fecha a dd/mm/aa hh:mm
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Función para obtener prestaciones desde valores.csv
async function fetchPrestaciones() {
    const response = await fetch('valores.csv');
    const data = await response.text();
    const lines = data.split('\n').slice(1); // Saltar el encabezado
    const prestaciones = lines.map(line => {
        const [prestacion, monto] = line.split(',');
        return { prestacion, monto: parseFloat(monto) };
    });
    return prestaciones;
}

// Función para mostrar el formulario en el contenido principal
async function displayForm() {
    // Eliminar el contenido del formulario
    mainContent.innerHTML = `
        <h1>Generar Cupón de Coseguro</h1>
        <p>Esta funcionalidad ha sido deshabilitada.</p>
    `;
}

// Función para mostrar los cupones en una tabla
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
                    <th>Usuario</th> <!-- Nueva columna para el usuario -->
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    try {
        const cuponesQuery = query(collectionGroup(db, "Cupones"));
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
                <td>${cuponData.usuario || 'Desconocido'}</td> <!-- Mostrar el usuario -->
            `;
            row.querySelector(".pdf-btn").addEventListener("click", () => generatePDF(cuponData, doc.id));
            tbody.appendChild(row);
        });

        // Añadir evento para filtrar
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
    } catch (error) {
        console.error("Error al obtener los cupones:", error);
    }
}

async function generatePDF(cuponData, docId) {
    const { nombre, dni, nro_afiliado, prestacion, fecha, importe, comprobante } = cuponData;

    // Verificar si el comprobante es una imagen o un PDF
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

// Eliminar el evento del botón "dashboard-btn" que ya no existe
// document.getElementById("dashboard-btn").addEventListener("click", () => {
//     displayForm();
// });

document.getElementById("courses-btn").addEventListener("click", () => {
    displayCupones();
});

// Mostrar la tabla de cupones al cargar la página
displayCupones();

// Función para mostrar la lista de usuarios
async function displayUserList() {
    mainContent.innerHTML = `
        <h2>Lista de Usuarios</h2>
        <ul id="user-list"></ul>
    `;

    try {
        const usersQuery = query(collection(db, "Bonos generados"));
        const querySnapshot = await getDocs(usersQuery);
        const userList = document.getElementById("user-list");

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.email !== "todocodigos1177@gmail.com") {
                const listItem = document.createElement("li");
                listItem.textContent = `${userData.nombre || ''} ${userData.apellido || ''}`.trim();
                listItem.addEventListener("click", () => displayUserCupones(userData.email));
                userList.appendChild(listItem);
            }
        });

        userList.style.display = "block";
    } catch (error) {
        console.error("Error al obtener la lista de usuarios:", error);
    }
}

// Función para mostrar los cupones generados por un usuario
async function displayUserCupones(email) {
    mainContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2>Cupones Generados por ${email}</h2>
            <div>
                <p id="cupones-count" style="margin: 0;"></p>
                <p id="total-importe" style="margin: 0;"></p>
            </div>
        </div>
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
                    <th>Usuario</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    try {
        const cuponesQuery = query(collectionGroup(db, "Cupones"), where("usuario", "==", email));
        const querySnapshot = await getDocs(cuponesQuery);
        const tbody = document.querySelector("#cupones-table tbody");

        let cuponCount = 0;
        let totalImporte = 0;

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
                <td>${cuponData.usuario || 'Desconocido'}</td>
            `;
            row.querySelector(".pdf-btn").addEventListener("click", () => generatePDF(cuponData, doc.id));
            tbody.appendChild(row);

            cuponCount++;
            totalImporte += parseFloat(cuponData.importe) || 0;
        });

        document.getElementById("cupones-count").textContent = `Cantidad de cupones: ${cuponCount}`;
        document.getElementById("total-importe").textContent = `Total Importe: $${totalImporte.toFixed(2)}`;
    } catch (error) {
        console.error("Error al obtener los cupones del usuario:", error);
    }
}

document.getElementById("summary-btn").addEventListener("click", () => {
    displayUserList();
});
