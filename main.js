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

// Dimensiones (en unidades arbitrarias)
const dims = {
  lado: 1.5,
  radio: 1,
  altura: 1.5
};

function createGeometryFor(shape) {
  switch (shape) {
    case "esfera":
      return new THREE.SphereGeometry(0.8, 32, 32);
    case "cilindro":
      return new THREE.CylinderGeometry(0.6, 0.6, 1, 32);
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

// =========================
// 2. HUD y controles
// =========================
const shapeNameEl = document.getElementById("shape-name");
const rotationInfoEl = document.getElementById("rotation-info");
const formulaTextEl = document.getElementById("formula-text");
const formulaExplainEl = document.getElementById("formula-explain");
const volumeValueEl = document.getElementById("volume-value");

const controlLadoDiv = document.getElementById("control-lado");
const controlRadioDiv = document.getElementById("control-radio");
const controlAlturaDiv = document.getElementById("control-altura");

const ladoRange = document.getElementById("lado-range");
const ladoNumber = document.getElementById("lado-number");
const radioRange = document.getElementById("radio-range");
const radioNumber = document.getElementById("radio-number");
const alturaRange = document.getElementById("altura-range");
const alturaNumber = document.getElementById("altura-number");

const hudEl = document.getElementById("hud");
const hudToggleBtn = document.getElementById("hud-toggle");

// Escalar mesh según dimensiones
function applyScaleFromDimensions() {
  if (!mesh) return;

  if (currentShape === "cubo") {
    const s = dims.lado;
    mesh.scale.set(s, s, s);
  } else if (currentShape === "esfera") {
    const s = dims.radio;
    mesh.scale.set(s, s, s);
  } else if (currentShape === "cilindro") {
    const r = dims.radio;
    const h = dims.altura;
    mesh.scale.set(r, h, r); // radio en X/Z, altura en Y
  }
}

// Calcular volumen
function updateVolume() {
  let V = 0;
  if (currentShape === "cubo") {
    const lado = dims.lado;
    V = lado * lado * lado;
  } else if (currentShape === "esfera") {
    const radio = dims.radio;
    V = (4 / 3) * Math.PI * Math.pow(radio, 3);
  } else if (currentShape === "cilindro") {
    const radio = dims.radio;
    const altura = dims.altura;
    V = Math.PI * radio * radio * altura;
  }

  if (volumeValueEl) {
    volumeValueEl.textContent = `${V.toFixed(2)} u³`;
  }
}

// Actualizar HUD según figura
function updateHUDForShape() {
  if (!shapeNameEl || !formulaTextEl || !formulaExplainEl) return;

  formulaExplainEl.innerHTML = "";

  if (controlLadoDiv) controlLadoDiv.style.display = currentShape === "cubo" ? "flex" : "none";
  if (controlRadioDiv) controlRadioDiv.style.display =
    currentShape === "esfera" || currentShape === "cilindro" ? "flex" : "none";
  if (controlAlturaDiv) controlAlturaDiv.style.display = currentShape === "cilindro" ? "flex" : "none";

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

  applyScaleFromDimensions();
  updateVolume();
}

updateHUDForShape();

// Animación / resize
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

  mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.1;
  mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.1;

  const degX = (mesh.rotation.x * 180 / Math.PI).toFixed(0);
  const degY = (mesh.rotation.y * 180 / Math.PI).toFixed(0);
  if (rotationInfoEl) {
    rotationInfoEl.textContent = `${degX}° / ${degY}°`;
  }

  renderer.render(scene, camera3D);
}
animate();

// Sincronizar sliders / inputs numéricos
function syncRangeAndNumber(rangeEl, numberEl, onChange) {
  if (!rangeEl || !numberEl) return;

  rangeEl.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    numberEl.value = value;
    onChange(value);
  });

  numberEl.addEventListener("input", (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) return;

    const min = parseFloat(numberEl.min) || 0.5;
    const max = parseFloat(numberEl.max) || 3;
    if (value < min) value = min;
    if (value > max) value = max;

    numberEl.value = value;
    rangeEl.value = value;
    onChange(value);
  });
}

syncRangeAndNumber(ladoRange, ladoNumber, (val) => {
  dims.lado = val;
  applyScaleFromDimensions();
  updateVolume();
});

syncRangeAndNumber(radioRange, radioNumber, (val) => {
  dims.radio = val;
  applyScaleFromDimensions();
  updateVolume();
});

syncRangeAndNumber(alturaRange, alturaNumber, (val) => {
  dims.altura = val;
  applyScaleFromDimensions();
  updateVolume();
});

// HUD desplegable
let hudOpen = true;

if (hudToggleBtn && hudEl) {
  hudToggleBtn.addEventListener("click", () => {
    hudOpen = !hudOpen;
    if (hudOpen) {
      hudEl.classList.remove("hud-collapsed");
      hudToggleBtn.textContent = "▼";
    } else {
      hudEl.classList.add("hud-collapsed");
      hudToggleBtn.textContent = "▲";
    }
  });
}

// =========================
// 3. MediaPipe Hands
// =========================
const videoElement = document.getElementById("input-video");
const overlay = document.getElementById("overlay");
const overlayCtx = overlay.getContext("2d");

function resizeOverlay() {
  overlay.width = videoElement.clientWidth;
  overlay.height = videoElement.clientHeight;
}
window.addEventListener("resize", resizeOverlay);

// Botón fijo en una esquina (lado superior izquierdo)
const activationRadius = 35;
const buttonCenter = { x: 0, y: 0 };

// estados de clic por pinch
let clickActive = false;
let shapeChangeCooldown = false;

function isIndexOnButton(ix, iy) {
  const dx = ix - buttonCenter.x;
  const dy = iy - buttonCenter.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < activationRadius;
}

function detectPinch(landmarks) {
  const thumb = landmarks[4];
  const index = landmarks[8];
  const dx = thumb.x - index.x;
  const dy = thumb.y - index.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
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

// Callback de MediaPipe
function onResults(results) {
  resizeOverlay();
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    return;
  }

  const landmarks = results.multiHandLandmarks[0];

  const indexTip = landmarks[8];

  const ix = indexTip.x * overlay.width;
  const iy = indexTip.y * overlay.height;

  // botón fijo: ahora margen desde el lado izquierdo
  const margin = 40;
  buttonCenter.x = margin;
  buttonCenter.y = margin;

  const touchingButton = isIndexOnButton(ix, iy);

  // Detección de pinch -> "clic" corto
  if (detectPinch(landmarks) && !clickActive) {
    clickActive = true;
    setTimeout(() => {
      clickActive = false;
    }, 200);
  }

  // Dibujar botón verde fijo
  overlayCtx.beginPath();
  overlayCtx.arc(buttonCenter.x, buttonCenter.y, activationRadius, 0, 2 * Math.PI);
  overlayCtx.fillStyle = touchingButton
    ? "rgba(250, 204, 21, 0.25)"
    : "rgba(22, 163, 74, 0.18)";
  overlayCtx.strokeStyle = touchingButton ? "#facc15" : "#22c55e";
  overlayCtx.lineWidth = 3;
  overlayCtx.fill();
  overlayCtx.stroke();

  overlayCtx.beginPath();
  overlayCtx.arc(buttonCenter.x, buttonCenter.y, 8, 0, 2 * Math.PI);
  overlayCtx.fillStyle = touchingButton ? "#facc15" : "#22c55e";
  overlayCtx.fill();

  // Punto del índice
  overlayCtx.beginPath();
  overlayCtx.arc(ix, iy, 10, 0, 2 * Math.PI);
  overlayCtx.fillStyle = touchingButton ? "#fbbf24" : "#38bdf8";
  overlayCtx.fill();

  // Rotación con la mano
  const normX = indexTip.x - 0.5;
  const normY = indexTip.y - 0.5;

  targetRotY = normX * Math.PI;
  targetRotX = normY * Math.PI;

  // Clic gestual sobre el botón → cambio de figura
  if (!shapeChangeCooldown && clickActive && touchingButton) {
    shapeChangeCooldown = true;
    cycleShape();
    setTimeout(() => {
      shapeChangeCooldown = false;
    }, 700);
  }
}

// Inicializar MediaPipe
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
// 4. Cámara
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
