// Import necessary modules from Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, collectionGroup } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

// Firebase configuration
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
            const docRef = doc(db, "profesores", user.email);
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
        <h2>Agregar Curso</h2>
        <form id="course-form">
        <label for="course-name">Curso:</label>
     <select id="course-name" name="course-name" required>
        <option value="" disabled selected>Seleccione un curso</option>
        <option value="Neumatica Modulo I">Neumatica Modulo I</option>
        <option value="Neumatica Modulo II">Neumatica Modulo II</option>
        <option value="Neumatica Modulo III">Neumatica Modulo III</option>
        <option value="Mecanica del Automotor Modulo I">Mecanica del Automotor Modulo I</option>
        <option value="Mecanica del Automotor Modulo II">Mecanica del Automotor Modulo II</option>
        <option value="Mecanica del Automotor Modulo III">Mecanica del Automotor Modulo III</option>
        <option value="Mecanica del Automotor Modulo IIII">Mecanica del Automotor Modulo IIII</option>
        <option value="Cajas Automaticas Modulo I">Cajas Automaticas Modulo I</option>
        <option value="Cajas Automaticas Modulo II">Cajas Automaticas Modulo II</option>
        <option value="Cajas Automaticas Modulo III">Cajas Automaticas Modulo III</option>
        <option value="Hidraulica Modulo I">Hidraulica Modulo I</option>
        <option value="Hidraulica Modulo II">Hidraulica Modulo II</option>
        <option value="Hidraulica Modulo III">Hidraulica Modulo III</option>
        <option value="Electronica del Automotor Modulo I">Electronica del Automotor Modulo I</option>
        <option value="Electronica del Automotor Modulo II">Electronica del Automotor Modulo II</option>
        <option value="Electronica del Automotor Modulo III">Electronica del Automotor Modulo III</option>
        <option value="Soldadura Modulo I">Soldadura Modulo I</option>
        <option value="Soldadura Modulo II">Soldadura Modulo II</option>
        <option value="Soldadura Modulo III">Soldadura Modulo III</option>
        <option value="Inyeccion Electronica Modulo I">Inyeccion Electronica Modulo I</option>
        <option value="Inyeccion Electronica Modulo II">Inyeccion Electronica Modulo II</option>
        <option value="Inyeccion Electronica Modulo III">Inyeccion Electronica Modulo III</option>
        <option value="Mecatronica Modulo I">Mecatronica Modulo I</option>
        <option value="Mecatronica Modulo II">Mecatronica Modulo II</option>
        <option value="Mecatronica Modulo III">Mecatronica Modulo III</option>
     </select>
            <label for="course-start-date">Fecha de Inicio:</label>
            <input type="date" id="course-start-date" name="course-start-date" required>
            <label for="course-end-date">Fecha de Finalización:</label>
            <input type="date" id="course-end-date" name="course-end-date" required>
            <label for="course-classes">Cantidad de Clases:</label>
            <input type="number" id="course-classes" name="course-classes" required>
            <label for="course-materials">Materiales:</label>
            <input type="file" id="course-materials" name="course-materials" required>
            <button type="submit">Guardar</button>
        </form>
    `;

    document.getElementById("course-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const courseName = document.getElementById("course-name").value;
        const courseStartDate = document.getElementById("course-start-date").value;
        const courseEndDate = document.getElementById("course-end-date").value;
        const courseClasses = document.getElementById("course-classes").value;
        const courseMaterials = document.getElementById("course-materials").files[0];

        try {
            const userEmail = localStorage.getItem("userEmail");
            if (userEmail) {
                // Upload file to Firebase Storage
                const storageRef = ref(storage, `profesores/${userEmail}/Cursos/${courseName}/${courseMaterials.name}`);
                await uploadBytes(storageRef, courseMaterials);
                const fileURL = await getDownloadURL(storageRef);

                // Save course data to Firestore
                const courseRef = doc(db, "profesores", userEmail, "Cursos", courseName);
                await setDoc(courseRef, {
                    curso: courseName,
                    fechaInicio: courseStartDate,
                    fechaFin: courseEndDate,
                    cantidadClases: courseClasses,
                    materiales: fileURL
                });
                alert("Curso guardado exitosamente");
            } else {
                console.error("No user email found in localStorage");
            }
        } catch (error) {
            console.error("Error saving course data:", error);
        }
    });
}

// Function to display the student form in the main content
async function displayStudentForm() {
    mainContent.innerHTML = `
        <h2>Agregar Alumno a Curso</h2>
        <form id="student-form">
            <label for="student-name">Nombre y Apellido:</label>
            <select id="student-name" name="student-name" required>
                <option value="" disabled selected>Seleccione un alumno</option>
            </select>
            <label for="student-course">Curso:</label>
            <select id="student-course" name="student-course" required>
                <option value="" disabled selected>Seleccione un curso</option>
            </select>
            <button type="submit">Guardar</button>
        </form>
    `;

    try {
        // Fetch students from the "Alumnos" collection
        const studentsQuery = query(collection(db, "Alumnos"));
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentSelect = document.getElementById("student-name");

        // Fetch all students already added to any course
        const allCoursesQuery = query(collectionGroup(db, "Alumnos"));
        const allCoursesSnapshot = await getDocs(allCoursesQuery);
        const addedStudents = new Set();

        allCoursesSnapshot.forEach((doc) => {
            addedStudents.add(doc.id);
        });

        // Populate student dropdown excluding already added students
        studentsSnapshot.forEach((doc) => {
            const studentData = doc.data();
            if (!addedStudents.has(studentData.nombre)) {
                const option = document.createElement("option");
                option.value = studentData.nombre;
                option.textContent = studentData.nombre;
                studentSelect.appendChild(option);
            }
        });

        // Populate course dropdown
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
            const coursesQuery = query(collection(db, "profesores", userEmail, "Cursos"));
            const coursesSnapshot = await getDocs(coursesQuery);
            const courseSelect = document.getElementById("student-course");

            coursesSnapshot.forEach((doc) => {
                const courseData = doc.data();
                const option = document.createElement("option");
                option.value = courseData.curso;
                option.textContent = courseData.curso;
                courseSelect.appendChild(option);
            });
        } else {
            console.error("No user email found in localStorage");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }

    document.getElementById("student-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const studentName = document.getElementById("student-name").value;
        const studentCourse = document.getElementById("student-course").value;

        try {
            const userEmail = localStorage.getItem("userEmail");
            if (userEmail) {
                const studentRef = doc(db, "profesores", userEmail, "Cursos", studentCourse, "Alumnos", studentName);
                await setDoc(studentRef, {
                    nombre: studentName,
                    curso: studentCourse
                });
                alert("Alumno agregado al curso exitosamente");
            } else {
                console.error("No user email found in localStorage");
            }
        } catch (error) {
            console.error("Error saving student data:", error);
        }
    });
}

// Function to display the students in a table
async function displayStudents() {
    mainContent.innerHTML = `
        <h2>Mis Alumnos</h2>
        <table id="students-table">
            <thead>
                <tr>
                    <th>Nombre y Apellido</th>
                    <th>Curso</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
            const studentsQuery = query(collection(db, "profesores", userEmail, "Alumnos"));
            const querySnapshot = await getDocs(studentsQuery);
            const tbody = document.querySelector("#students-table tbody");

            querySnapshot.forEach((doc) => {
                const studentData = doc.data();
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${studentData.nombre}</td>
                    <td>${studentData.curso}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            console.error("No user email found in localStorage");
        }
    } catch (error) {
        console.error("Error fetching students:", error);
    }
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

document.getElementById("dashboard-btn").addEventListener("click", () => {
    displayForm();
});

document.getElementById("courses-btn").addEventListener("click", () => {
    displayCourses();
});

document.getElementById("assignments-btn").addEventListener("click", () => {
    displayStudentForm();
});

document.getElementById("grades-btn").addEventListener("click", () => {
    displayStudents();
});

document.getElementById("profile-btn").addEventListener("click", () => {
    loadContent("/c:/AulaTC/profile/index.html");
});

document.getElementById("resources-btn").addEventListener("click", () => {
    loadContent("/c:/AulaTC/resources/index.html");
});