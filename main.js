// =========================
// 1. Setup Three.js
// =========================
const sceneCanvas = document.getElementById("scene3d");
const renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020617);

const camera3D = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
camera3D.position.set(0, 3, 8);

// Luces (compartidas para ambos modos)
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(4, 6, 8);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

// Grupos por área
const mathGroup = new THREE.Group();
const astroGroup = new THREE.Group();

scene.add(mathGroup);
scene.add(astroGroup);

// Sujeto actual: "math" o "science"
let currentSubject = "math";

// =========================
// 2. Matemáticas: figura 3D + herramientas
// =========================

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
  newMesh.userData.type = "figura";
  return newMesh;
}

mesh = createMesh(currentShape);
mathGroup.add(mesh);

// Plano cartesiano (ejes + grilla)
const axesHelper = new THREE.AxesHelper(4);
mathGroup.add(axesHelper);

const gridHelper = new THREE.GridHelper(12, 24, 0x444444, 0x222222);
gridHelper.rotation.x = Math.PI / 2;
mathGroup.add(gridHelper);

// Variables de rotación controladas por la mano
let targetRotX = mesh.rotation.x;
let targetRotY = mesh.rotation.y;

// =========================
// 3. HUD y controles (solo Matemáticas)
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
const modeBadgeEl = document.querySelector(".panel-badge-blue");

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
  if (controlRadioDiv)
    controlRadioDiv.style.display =
      currentShape === "esfera" || currentShape === "cilindro" ? "flex" : "none";
  if (controlAlturaDiv)
    controlAlturaDiv.style.display = currentShape === "cilindro" ? "flex" : "none";

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

// =========================
// 4. Layout y resize
// =========================
function onResize() {
  const width = sceneCanvas.clientWidth;
  const height = sceneCanvas.clientHeight;
  renderer.setSize(width, height, false);
  camera3D.aspect = width / height;
  camera3D.updateProjectionMatrix();
}
window.addEventListener("resize", onResize);
onResize();

// =========================
// 5. Extras interactivos 3D (Matemáticas)
// =========================
let objSeleccionado = null;
let puntos = [];
let vectores = [];
let planos = [];
let modoActual = "figura";   // "figura", "crear-punto", "crear-vector", "crear-plano", "borrar", "reset"

let vectorPointsBuffer = [];
let planePointsBuffer = [];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function crearPunto(x, y, z) {
  const geo = new THREE.SphereGeometry(0.07, 16, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd500 });
  const p = new THREE.Mesh(geo, mat);
  p.position.set(x, y, z);
  p.userData.type = "punto";
  mathGroup.add(p);
  puntos.push(p);
}

function crearVector(a, b, color = 0x00aaff) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const arrow = new THREE.ArrowHelper(dir.clone().normalize(), a, len, color, 0.3, 0.15);
  arrow.userData.type = "vector";
  mathGroup.add(arrow);
  vectores.push(arrow);
}

function resetSceneExtras() {
  puntos.forEach(p => mathGroup.remove(p));
  vectores.forEach(v => mathGroup.remove(v));
  planos.forEach(pl => mathGroup.remove(pl));
  puntos = [];
  vectores = [];
  planos = [];
  vectorPointsBuffer = [];
  planePointsBuffer = [];
  objSeleccionado = null;
}

function deleteSelectedObject() {
  if (!objSeleccionado) return;
  if (objSeleccionado === mesh) return; // no borrar la figura principal

  mathGroup.remove(objSeleccionado);
  puntos = puntos.filter(p => p !== objSeleccionado);
  vectores = vectores.filter(v => v !== objSeleccionado);
  planos = planos.filter(pl => pl !== objSeleccionado);
  objSeleccionado = null;
}

/* Menú lateral holográfico: herramientas */
const menuItems = document.querySelectorAll(".menu-item");

function setToolMode(tool, clickedItem) {
  // Solo aplica en Matemáticas
  if (currentSubject !== "math" && tool !== null) return;

  // actualizar clases
  menuItems.forEach(i => i.classList.remove("active"));
  if (clickedItem) clickedItem.classList.add("active");

  modoActual = tool;

  if (tool === "figura") {
    // Modo figura 3D: mostrar figura y limpiar extras
    mesh.visible = true;
    resetSceneExtras();
  } else if (tool === "crear-punto" ||
             tool === "crear-vector" ||
             tool === "crear-plano" ||
             tool === "borrar") {
    // Cualquier otro modo: ocultar figura
    mesh.visible = false;
  } else if (tool === "reset") {
    mesh.visible = true;
    resetSceneExtras();
  } else if (tool === null) {
    // Usado cuando cambiamos de asignatura
    modoActual = null;
    mesh.visible = false;
    menuItems.forEach(i => i.classList.remove("active"));
  }
}

// listeners de menú
menuItems.forEach(item => {
  item.addEventListener("click", () => {
    const tool = item.dataset.tool;
    setToolMode(tool, item);
  });
});

// =========================
// 6. Pestañas de área (Matemáticas / Ciencias)
// =========================
const subjectTabs = document.querySelectorAll(".subject-tab");

function updateSubjectVisibility() {
  mathGroup.visible = (currentSubject === "math");
  astroGroup.visible = (currentSubject === "science");
}

subjectTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    if (tab.disabled) return;

    subjectTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const subject = tab.dataset.subject;
    if (subject === "math") {
      currentSubject = "math";
      if (modeBadgeEl) modeBadgeEl.textContent = "Math Mode";
      hudEl.style.display = "block";

      // Volver a figura 3D por defecto
      const figuraItem = Array.from(menuItems).find(i => i.dataset.tool === "figura");
      setToolMode("figura", figuraItem);
    } else if (subject === "science") {
      currentSubject = "science";
      if (modeBadgeEl) modeBadgeEl.textContent = "Science: Astronomía";
      hudEl.style.display = "none";

      // Sin herramientas de matemáticas activas
      setToolMode(null, null);
      ensureAstronomyScene();
    }

    updateSubjectVisibility();
  });
});

// =========================
// 7. Astronomía: galaxia + estrellas + planetas
// =========================
let astroCreated = false;
let galaxyMesh = null;
let starField = null;
let planets = [];

function createStarField() {
  const starCount = 3000;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const r = 60 * Math.random();
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.08,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9
  });

  starField = new THREE.Points(geo, mat);
  starField.userData.type = "starfield";
  astroGroup.add(starField);
}

function createGalaxy() {
  const arms = 4;
  const starsPerArm = 900;
  const radius = 18;

  const positions = new Float32Array(arms * starsPerArm * 3);
  let idx = 0;

  for (let a = 0; a < arms; a++) {
    const armOffset = (a / arms) * Math.PI * 2;
    for (let i = 0; i < starsPerArm; i++) {
      const r = (i / starsPerArm) * radius;
      const angle = r * 0.5 + armOffset; // curva en espiral
      const spread = 0.7;

      const x = r * Math.cos(angle) + (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * spread * 0.4;
      const z = r * Math.sin(angle) + (Math.random() - 0.5) * spread;

      positions[idx++] = x;
      positions[idx++] = y;
      positions[idx++] = z;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x9fdbff,
    size: 0.06,
    transparent: true,
    opacity: 0.95
  });

  galaxyMesh = new THREE.Points(geo, mat);
  galaxyMesh.userData.type = "galaxy";
  astroGroup.add(galaxyMesh);
}

function createPlanetarySystem() {
  // estrella central
  const starGeo = new THREE.SphereGeometry(0.9, 32, 32);
  const starMat = new THREE.MeshBasicMaterial({
    color: 0xfff3b0,
    emissive: 0xffdd88,
    emissiveIntensity: 2.0
  });
  const star = new THREE.Mesh(starGeo, starMat);
  star.userData.type = "star";
  astroGroup.add(star);

  // planetas
  const configs = [
    { radius: 0.25, orbit: 3, speed: 0.9, color: 0x4b9fff },
    { radius: 0.35, orbit: 5, speed: 0.6, color: 0xff854b },
    { radius: 0.5, orbit: 7, speed: 0.35, color: 0x7cffb0 }
  ];

  configs.forEach(cfg => {
    const geo = new THREE.SphereGeometry(cfg.radius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.6,
      metalness: 0.1
    });
    const planet = new THREE.Mesh(geo, mat);
    planet.userData.orbitRadius = cfg.orbit;
    planet.userData.orbitSpeed = cfg.speed;
    planet.userData.orbitAngle = Math.random() * Math.PI * 2;
    planet.userData.type = "planet";
    astroGroup.add(planet);
    planets.push(planet);
  });
}

function ensureAstronomyScene() {
  if (astroCreated) return;
  createStarField();
  createGalaxy();
  createPlanetarySystem();
  astroCreated = true;
}

// =========================
// 8. Animación principal
// =========================
function animate() {
  requestAnimationFrame(animate);

  // Matemáticas: rotar figura / objeto seleccionado
  if (currentSubject === "math") {
    if (modoActual === "figura" || !objSeleccionado || objSeleccionado === mesh) {
      mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.1;
      mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.1;
    } else if (objSeleccionado) {
      objSeleccionado.rotation.x += (targetRotX - objSeleccionado.rotation.x) * 0.1;
      objSeleccionado.rotation.y += (targetRotY - objSeleccionado.rotation.y) * 0.1;
    }

    const degX = (mesh.rotation.x * 180 / Math.PI).toFixed(0);
    const degY = (mesh.rotation.y * 180 / Math.PI).toFixed(0);
    if (rotationInfoEl) {
      rotationInfoEl.textContent = `${degX}° / ${degY}°`;
    }
  }

  // Astronomía: animar galaxia y planetas + girar el conjunto con la mano
  if (currentSubject === "science" && astroCreated) {
    // rotación suave del conjunto según la mano
    astroGroup.rotation.y += (targetRotY - astroGroup.rotation.y) * 0.03;
    astroGroup.rotation.x += (targetRotX - astroGroup.rotation.x) * 0.03;

    if (galaxyMesh) {
      galaxyMesh.rotation.y += 0.0008;
      galaxyMesh.rotation.z += 0.0003;
    }

    planets.forEach(p => {
      p.userData.orbitAngle += 0.0015 * p.userData.orbitSpeed;
      const r = p.userData.orbitRadius;
      p.position.set(
        Math.cos(p.userData.orbitAngle) * r,
        0,
        Math.sin(p.userData.orbitAngle) * r
      );
      p.rotation.y += 0.01;
    });

    if (starField) {
      starField.rotation.y += 0.0002;
    }
  }

  renderer.render(scene, camera3D);
}
animate();

// =========================
// 9. Sincronizar sliders / inputs numéricos
// =========================
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
// 10. MediaPipe Hands
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
let clickProcessed = false;
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
  mathGroup.remove(mesh);

  if (currentShape === "cubo") {
    currentShape = "esfera";
  } else if (currentShape === "esfera") {
    currentShape = "cilindro";
  } else {
    currentShape = "cubo";
  }

  mesh = createMesh(currentShape);
  applyScaleFromDimensions();
  mathGroup.add(mesh);
  targetRotX = mesh.rotation.x;
  targetRotY = mesh.rotation.y;

  updateHUDForShape();
}

// Procesar clic en la escena (no botón verde)
function handleSceneClick(ix, iy) {
  if (currentSubject === "science") {
    // Futuro: seleccionar planeta, mostrar datos, etc.
    return;
  }

  mouse.x = (ix / overlay.width) * 2 - 1;
  mouse.y = -(iy / overlay.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera3D);
  const intersects = raycaster.intersectObjects(mathGroup.children, true);

  let hitObject = null;
  let hitPoint = null;

  if (intersects.length > 0) {
    hitObject = intersects[0].object;
    hitPoint = intersects[0].point;
  }

  if (modoActual === "crear-punto") {
    if (hitPoint) crearPunto(hitPoint.x, hitPoint.y, hitPoint.z);
    return;
  }

  if (modoActual === "crear-vector") {
    if (hitPoint) {
      vectorPointsBuffer.push(hitPoint.clone());
      if (vectorPointsBuffer.length >= 2) {
        const a = vectorPointsBuffer[vectorPointsBuffer.length - 2];
        const b = vectorPointsBuffer[vectorPointsBuffer.length - 1];
        crearVector(a, b);
      }
    }
    return;
  }

  if (modoActual === "borrar") {
    if (hitObject && hitObject !== mesh) {
      objSeleccionado = hitObject;
      deleteSelectedObject();
    }
    return;
  }

  // En modo figura o cualquier otro: seleccionar objeto
  objSeleccionado = hitObject || null;
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

  // botón fijo: margen desde el lado izquierdo
  const margin = 40;
  buttonCenter.x = margin;
  buttonCenter.y = margin;

  const touchingButton = isIndexOnButton(ix, iy);

  // Detección de pinch -> "clic" corto
  if (detectPinch(landmarks) && !clickActive) {
    clickActive = true;
    clickProcessed = false;

    setTimeout(() => {
      clickActive = false;
      clickProcessed = false;
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

  // Rotación con la mano (normalizada)
  const normX = indexTip.x - 0.5;
  const normY = indexTip.y - 0.5;

  targetRotY = normX * Math.PI;
  targetRotX = normY * Math.PI;

  // Clic gestual:
  // 1) Si toca el botón verde y estamos en Matemáticas → cambiar de figura
  if (!shapeChangeCooldown && clickActive && touchingButton && currentSubject === "math") {
    shapeChangeCooldown = true;
    cycleShape();
    setTimeout(() => {
      shapeChangeCooldown = false;
    }, 700);
    clickProcessed = true;
  }

  // 2) Si no está sobre el botón verde → interactuar con la escena
  if (clickActive && !clickProcessed && !touchingButton) {
    handleSceneClick(ix, iy);
    clickProcessed = true;
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
// 11. Cámara
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

// Al inicio: mostrar matemáticas
updateSubjectVisibility();
if (modeBadgeEl) modeBadgeEl.textContent = "Math Mode";
