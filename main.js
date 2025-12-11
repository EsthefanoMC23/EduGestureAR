// =========================
// 1. Setup Three.js
// =========================
const sceneCanvas = document.getElementById("scene3d");
const renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020617);

const camera3D = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera3D.position.set(0, 0, 3);

// Luces
const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(2, 2, 3);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// Figura 3D (inicialmente cubo)
let mesh;
let currentShape = "cubo";

function createGeometryFor(shape) {
  switch (shape) {
    case "esfera":
      return new THREE.SphereGeometry(0.8, 32, 32);
    case "cilindro":
      return new THREE.CylinderGeometry(0.6, 0.6, 1.4, 32);
    case "cubo":
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

const material = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  metalness: 0.5,
  roughness: 0.2
});

function createMesh(shape) {
  const geometry = createGeometryFor(shape);
  const newMesh = new THREE.Mesh(geometry, material);
  newMesh.rotation.set(0.4, -0.4, 0.1);
  return newMesh;
}

mesh = createMesh(currentShape);
scene.add(mesh);

// Variables de rotación controladas por la mano
let targetRotX = mesh.rotation.x;
let targetRotY = mesh.rotation.y;

// HUD elements
const shapeNameEl = document.getElementById("shape-name");
const rotationInfoEl = document.getElementById("rotation-info");
const formulaTextEl = document.getElementById("formula-text");
const formulaExplainEl = document.getElementById("formula-explain");

// Actualizar HUD según figura actual
function updateHUDForShape() {
  if (!shapeNameEl || !formulaTextEl || !formulaExplainEl) return;

  formulaExplainEl.innerHTML = "";

  if (currentShape === "cubo") {
    shapeNameEl.textContent = "Cubo";

    formulaTextEl.textContent = "V = lado³";

    formulaExplainEl.innerHTML = `
      <li><strong>V</strong>: volumen del cubo</li>
      <li><strong>lado</strong>: longitud de cada arista del cubo</li>
    `;
  } else if (currentShape === "esfera") {
    shapeNameEl.textContent = "Esfera";

    formulaTextEl.textContent = "V = (4/3) · π · radio³";

    formulaExplainEl.innerHTML = `
      <li><strong>V</strong>: volumen de la esfera</li>
      <li><strong>radio</strong>: distancia desde el centro de la esfera a la superficie</li>
    `;
  } else if (currentShape === "cilindro") {
    shapeNameEl.textContent = "Cilindro";

    formulaTextEl.textContent = "V = π · radio² · altura";

    formulaExplainEl.innerHTML = `
      <li><strong>V</strong>: volumen del cilindro</li>
      <li><strong>radio</strong>: radio de la base circular</li>
      <li><strong>altura</strong>: distancia entre las dos bases</li>
    `;
  }
}

updateHUDForShape();

function onResize() {
  const width = sceneCanvas.clientWidth;
  const height = sceneCanvas.clientHeight;
  renderer.setSize(width, height, false);
  camera3D.aspect = width / height;
  camera3D.updateProjectionMatrix();
}
window.addEventListener("resize", onResize);
onResize();

function animate() {
  requestAnimationFrame(animate);

  // Suavizamos el movimiento hacia la rotación objetivo
  mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.1;
  mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.1;

  // Mostrar rotación en grados en el HUD
  const degX = (mesh.rotation.x * 180 / Math.PI).toFixed(0);
  const degY = (mesh.rotation.y * 180 / Math.PI).toFixed(0);
  if (rotationInfoEl) {
    rotationInfoEl.textContent = `${degX}° / ${degY}°`;
  }

  renderer.render(scene, camera3D);
}
animate();

// =========================
// 2. Setup MediaPipe Hands
// =========================
const videoElement = document.getElementById("input-video");
const overlay = document.getElementById("overlay");
const overlayCtx = overlay.getContext("2d");

// Ajustar tamaño del overlay
function resizeOverlay() {
  overlay.width = videoElement.clientWidth;
  overlay.height = videoElement.clientHeight;
}
window.addEventListener("resize", resizeOverlay);

// Pinch detection (pulgar + índice)
let pinchCooldown = false;

function detectPinch(landmarks) {
  // Pulgar: tip = 4
  // Índice: tip = 8
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  // Distancia en espacio normalizado [0,1]
  const dx = thumbTip.x - indexTip.x;
  const dy = thumbTip.y - indexTip.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Umbral simple: si están muy cerca -> pinch
  return dist < 0.04;
}

function cycleShape() {
  scene.remove(mesh);

  if (currentShape === "cubo") {
    currentShape = "esfera";
  } else if (currentShape === "esfera") {
    currentShape = "cilindro";
  } else {
    currentShape = "cubo";
  }

  mesh = createMesh(currentShape);
  scene.add(mesh);
  targetRotX = mesh.rotation.x;
  targetRotY = mesh.rotation.y;
  updateHUDForShape();
}

// Callback cuando MediaPipe procesa un frame
function onResults(results) {
  resizeOverlay();
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    return;
  }

  const landmarks = results.multiHandLandmarks[0];

  // Punto 8 = punta del dedo índice
  const indexTip = landmarks[8];

  // Dibujo simple del punto en pantalla (overlay)
  const x = indexTip.x * overlay.width;
  const y = indexTip.y * overlay.height;

  overlayCtx.beginPath();
  overlayCtx.arc(x, y, 10, 0, 2 * Math.PI);
  overlayCtx.fillStyle = "#38bdf8";
  overlayCtx.fill();

  // Mapear las coordenadas normalizadas [0,1] a ángulos de rotación
  const normX = indexTip.x - 0.5; // -0.5 a 0.5
  const normY = indexTip.y - 0.5;

  targetRotY = normX * Math.PI; // rotación horizontal
  targetRotX = normY * Math.PI; // rotación vertical

  // Detección de pinch para cambiar de figura
  if (!pinchCooldown && detectPinch(landmarks)) {
    pinchCooldown = true;
    cycleShape();
    setTimeout(() => {
      pinchCooldown = false;
    }, 700); // pequeña pausa para no cambiar muchas veces
  }
}

// Inicializar MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(onResults);

// =========================
// 3. Activar cámara con CameraUtils
// =========================
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoElement.srcObject = stream;
  await videoElement.play();

  resizeOverlay();

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
  });
  camera.start();
}

startCamera().catch((err) => {
  console.error("Error al iniciar cámara:", err);
  alert("No se pudo acceder a la cámara. Revisa permisos del navegador.");
});
