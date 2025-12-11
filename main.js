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

// Luz
const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(2, 2, 3);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// Cubo
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  metalness: 0.5,
  roughness: 0.2
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Variables de rotación controladas por la mano
let targetRotX = 0;
let targetRotY = 0;

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
  cube.rotation.x += (targetRotX - cube.rotation.x) * 0.1;
  cube.rotation.y += (targetRotY - cube.rotation.y) * 0.1;

  renderer.render(scene, camera3D);
}
animate();

// =========================
// 2. Setup MediaPipe Hands
// =========================
const videoElement = document.getElementById("input-video");
const overlay = document.getElementById("overlay");
const overlayCtx = overlay.getContext("2d");

// Ajustar tamaño del overlay cada vez que cambia el layout
function resizeOverlay() {
  overlay.width = videoElement.clientWidth;
  overlay.height = videoElement.clientHeight;
}
window.addEventListener("resize", resizeOverlay);

// Callback cuando MediaPipe procesa un frame
function onResults(results) {
  resizeOverlay();
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    return;
  }

  // Tomamos la primera mano detectada
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
  // indexTip.x: 0 (izquierda) -> -PI/2, 1 (derecha) -> PI/2
  // indexTip.y: 0 (arriba) -> -PI/2, 1 (abajo) -> PI/2
  const normX = indexTip.x - 0.5; // -0.5 a 0.5
  const normY = indexTip.y - 0.5;

  targetRotY = normX * Math.PI; // rotación horizontal
  targetRotX = normY * Math.PI; // rotación vertical
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
