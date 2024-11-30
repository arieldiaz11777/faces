// Seleccionar el elemento del video
const video = document.getElementById('videoElement');

// Cargar modelos de face-api.js
async function loadModels() {
    try {
        // Ruta de los modelos (asegúrate de que estén en la carpeta `models/` o que se pueda acceder correctamente a ellos)
        const MODEL_URL = '/static/models';  // Este es el path relativo, asegúrate de que los modelos estén en esa ruta
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("Modelos cargados correctamente.");
    } catch (error) {
        console.error("Error al cargar los modelos:", error);
    }
}

// Iniciar la cámara
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });
        const video = document.getElementById('videoElement');
        video.srcObject = stream;
    } catch (err) {
        console.error("Error al acceder a la cámara:", err);
    }
}

// Cargar imágenes etiquetadas para reconocimiento
async function loadLabeledImages() {
    const labels = ['Debo', 'Rami', 'Ariel']; // Nombres de las personas
    const labeledDescriptors = [];

    for (const label of labels) {
        const descriptions = [];
        for (let i = 1; i <= 2; i++) { // Cambia este número según cuántas imágenes tengas por persona
            try {
                const imgPath = `/faces/${label}${i}.jpg`;  // Las imágenes deben estar en la carpeta 'faces'
                const img = await faceapi.fetchImage(imgPath);
                const detection = await faceapi.detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!detection) {
                    console.warn(`No se detectaron caras en la imagen: ${imgPath}`);
                    continue;
                }
                descriptions.push(detection.descriptor);
            } catch (error) {
                console.error(`Error al procesar la imagen ${label}${i}.jpg:`, error);
            }
        }

        if (descriptions.length > 0) {
            labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(label, descriptions));
            console.log(`Cargadas ${descriptions.length} descripciones para ${label}.`);
        } else {
            console.warn(`No se encontraron descripciones para ${label}.`);
        }
    }

    return labeledDescriptors;
}

// Configurar reconocimiento facial
async function setupFaceRecognition() {
    const labeledFaceDescriptors = await loadLabeledImages();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        resizedDetections.forEach(detection => {
            const box = detection.detection.box;
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            const drawBox = new faceapi.draw.DrawBox(box, { label: bestMatch.toString() });
            drawBox.draw(canvas);
        });
    }, 100);
}

// Iniciar todo el sistema
(async function init() {
    await loadModels(); // Cargar modelos
    await startCamera(); // Iniciar cámara

    video.addEventListener('play', async () => {
        console.log("Reconocimiento facial iniciado.");
        await setupFaceRecognition();
    });
})();
