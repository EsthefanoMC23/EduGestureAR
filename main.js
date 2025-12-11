// =========================
// 1. Setup Three.js
// =========================
const sceneCanvas = document.getElementById("scene3d");
const renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020617);

const camera3D = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
camera3D.position.set(0, 1.2, 7);
camera3D.lookAt(0, 0, 0);

// Control de zoom de la cámara (solo con botones)
let cameraZoom = camera3D.position.z;
const minZoom = 4;
const maxZoom = 40;

// Luces globales
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(4, 6, 8);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

// Grupos por área
const mathGroup = new THREE.Group();
mathGroup.position.set(0, 0, 0);

const astroGroup = new THREE.Group();
const artsGroup = new THREE.Group();

scene.add(mathGroup);
scene.add(astroGroup);
scene.add(artsGroup);

// Sujeto actual: "math" | "science" | "arts"
let currentSubject = "math";

// Overlay de carga
const loadingOverlay = document.getElementById("loading-overlay");
function hideLoading() {
  if (loadingOverlay && !loadingOverlay.classList.contains("hidden")) {
    loadingOverlay.classList.add("hidden");
  }
}

// =========================
// 2. Textura circular para estrellas
// =========================
function createCircleTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.9)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const starCircleTexture = createCircleTexture();

// =========================
// 3. Matemáticas: figura 3D + herramientas
// =========================

let mesh;
let currentShape = "cubo";

// Dimensiones
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
  newMesh.position.set(0, 0, 0);
  newMesh.userData.type = "figura";
  return newMesh;
}

mesh = createMesh(currentShape);
mathGroup.add(mesh);

// Ejes y grilla
const axesHelper = new THREE.AxesHelper(4);
mathGroup.add(axesHelper);

const gridHelper = new THREE.GridHelper(12, 24, 0x444444, 0x222222);
gridHelper.position.y = -1;
mathGroup.add(gridHelper);

// Rotación controlada por mano
let targetRotX = mesh.rotation.x;
let targetRotY = mesh.rotation.y;

// =========================
// 4. HUD y controles (Math)
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
    mesh.scale.set(r, h, r);
  }
}

// Volumen
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

// HUD por figura
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
// 5. Layout y resize
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
// 6. Interactivos 3D (Math)
// =========================
let objSeleccionado = null;
let puntos = [];
let vectores = [];
let planos = [];
let modoActual = "figura"; // "figura", "crear-punto", "crear-vector", "crear-plano", "borrar", "reset"

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
  if (objSeleccionado === mesh) return;

  mathGroup.remove(objSeleccionado);
  puntos = puntos.filter(p => p !== objSeleccionado);
  vectores = vectores.filter(v => v !== objSeleccionado);
  planos = planos.filter(pl => pl !== objSeleccionado);
  objSeleccionado = null;
}

// Menú holográfico
const menuItems = document.querySelectorAll(".menu-item");

function setToolMode(tool, clickedItem) {
  // Solo aplica en Matemáticas
  if (currentSubject !== "math" && tool !== null) return;

  // actualizar clases
  menuItems.forEach(i => i.classList.remove("active"));
  if (clickedItem) clickedItem.classList.add("active");

  modoActual = tool;

  if (tool === "figura") {
    mesh.visible = true;
    resetSceneExtras();
  } else if (
    tool === "crear-punto" ||
    tool === "crear-vector" ||
    tool === "crear-plano" ||
    tool === "borrar"
  ) {
    mesh.visible = false;
  } else if (tool === "reset") {
    mesh.visible = true;
    resetSceneExtras();
  } else if (tool === null) {
    modoActual = null;
    mesh.visible = false;
    menuItems.forEach(i => i.classList.remove("active"));
  }
}

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    const tool = item.dataset.tool;
    setToolMode(tool, item);
  });
});

// =========================
// 7. Pestañas de área
// =========================
const subjectTabs = document.querySelectorAll(".subject-tab");

function updateSubjectVisibility() {
  mathGroup.visible = currentSubject === "math";
  astroGroup.visible = currentSubject === "science";
  artsGroup.visible = currentSubject === "arts";
}

subjectTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const subject = tab.dataset.subject;

    subjectTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    if (subject === "math") {
      currentSubject = "math";
      if (modeBadgeEl) modeBadgeEl.textContent = "Math Mode";
      if (hudEl) hudEl.style.display = "block";

      const figuraItem = Array.from(menuItems).find(i => i.dataset.tool === "figura");
      setToolMode("figura", figuraItem);
    } else if (subject === "science") {
      currentSubject = "science";
      if (modeBadgeEl) modeBadgeEl.textContent = "Science: Astronomía";
      if (hudEl) hudEl.style.display = "none";

      setToolMode(null, null);
      ensureAstronomyScene();
    } else if (subject === "arts") {
      currentSubject = "arts";
      if (modeBadgeEl) modeBadgeEl.textContent = "Arts: Pintura 3D";
      if (hudEl) hudEl.style.display = "none";

      setToolMode(null, null);
      ensureArtsScene();
    }

    updateSubjectVisibility();
  });
});

// =========================
// 8. Astronomía
// =========================
let astroCreated = false;
let galaxyMesh = null;
let starField = null;
let planets = [];

function createStarField() {
  const starCount = 3500;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const r = 70 * Math.random();
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
    map: starCircleTexture,
    color: 0xffffff,
    size: 0.12,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  starField = new THREE.Points(geo, mat);
  starField.userData.type = "starfield";
  astroGroup.add(starField);
}

function createGalaxy() {
  const arms = 4;
  const starsPerArm = 1100;
  const radius = 22;

  const positions = new Float32Array(arms * starsPerArm * 3);
  let idx = 0;

  for (let a = 0; a < arms; a++) {
    const armOffset = (a / arms) * Math.PI * 2;
    for (let i = 0; i < starsPerArm; i++) {
      const r = (i / starsPerArm) * radius;
      const angle = r * 0.5 + armOffset;
      const spread = 0.9;

      const x = r * Math.cos(angle) + (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * spread * 0.35;
      const z = r * Math.sin(angle) + (Math.random() - 0.5) * spread;

      positions[idx++] = x;
      positions[idx++] = y;
      positions[idx++] = z;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    map: starCircleTexture,
    color: 0x9fdbff,
    size: 0.1,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  galaxyMesh = new THREE.Points(geo, mat);
  galaxyMesh.userData.type = "galaxy";
  astroGroup.add(galaxyMesh);
}

function createPlanetarySystem() {
  const starGeo = new THREE.SphereGeometry(0.9, 32, 32);
  const starMat = new THREE.MeshBasicMaterial({
    color: 0xfff3b0,
    emissive: 0xffdd88,
    emissiveIntensity: 2.2
  });
  const star = new THREE.Mesh(starGeo, starMat);
  star.userData.type = "star";
  astroGroup.add(star);

  const configs = [
    {
      radius: 3,
      radiusZ: 2.2,
      planetRadius: 0.25,
      speed: 0.9,
      color: 0x4b9fff,
      tilt: 0.2,
      inclination: 0.05,
      spinSpeed: 0.02
    },
    {
      radius: 5,
      radiusZ: 3.5,
      planetRadius: 0.35,
      speed: 0.6,
      color: 0xff854b,
      tilt: 0.4,
      inclination: -0.08,
      spinSpeed: 0.018
    },
    {
      radius: 7,
      radiusZ: 5.4,
      planetRadius: 0.5,
      speed: 0.35,
      color: 0x7cffb0,
      tilt: 0.1,
      inclination: 0.12,
      spinSpeed: 0.015
    }
  ];

  planets = [];

  configs.forEach(cfg => {
    const geo = new THREE.SphereGeometry(cfg.planetRadius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.6,
      metalness: 0.1
    });
    const planet = new THREE.Mesh(geo, mat);
    planet.userData.orbitRadiusX = cfg.radius;
    planet.userData.orbitRadiusZ = cfg.radiusZ;
    planet.userData.orbitSpeed = cfg.speed;
    planet.userData.orbitAngle = Math.random() * Math.PI * 2;
    planet.userData.type = "planet";
    planet.userData.tilt = cfg.tilt;
    planet.userData.inclination = cfg.inclination;
    planet.userData.spinSpeed = cfg.spinSpeed;

    planet.rotation.z = cfg.tilt;
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
// 9. Artes: lienzo 3D pintable
// =========================
let artsCreated = false;
let artCanvas = null;
let artStrokes = [];
let currentBrushColor = 0xff6b9b; // color base

function ensureArtsScene() {
  if (artsCreated) return;

  // Lienzo (como cuadro 3D)
  const canvasGeo = new THREE.PlaneGeometry(6, 4, 1, 1);
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xf9fafb,
    roughness: 0.8,
    metalness: 0.05
  });
  artCanvas = new THREE.Mesh(canvasGeo, canvasMat);
  artCanvas.position.set(0, 0.5, 0);
  artCanvas.rotation.y = 0;
  artCanvas.userData.type = "art-canvas";
  artsGroup.add(artCanvas);

  // Marco del cuadro
  const frameGeo = new THREE.BoxGeometry(6.2, 4.2, 0.1);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.4,
    roughness: 0.4
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.copy(artCanvas.position);
  frame.position.z -= 0.06;
  frame.userData.type = "art-frame";
  artsGroup.add(frame);

  // Luz adicional suave hacia el lienzo
  const spot = new THREE.SpotLight(0xffffff, 1.1, 25, Math.PI / 4, 0.4, 1);
  spot.position.set(0, 5, 8);
  spot.target = artCanvas;
  artsGroup.add(spot);
  artsGroup.add(spot.target);

  // Piso suave debajo del cuadro para dar volumen
  const floorGeo = new THREE.PlaneGeometry(20, 20);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x020617,
    roughness: 1,
    metalness: 0
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.5;
  floor.userData.type = "art-floor";
  artsGroup.add(floor);

  artsCreated = true;
}

// Cada click (pinch) en el lienzo crea un "trazo" 3D (cubito)
function paintOnCanvas(hitPoint) {
  if (!artCanvas) return;

  const strokeSize = 0.15;
  const geo = new THREE.BoxGeometry(strokeSize, strokeSize, 0.06);
  const mat = new THREE.MeshStandardMaterial({
    color: currentBrushColor,
    roughness: 0.4,
    metalness: 0.2
  });
  const stroke = new THREE.Mesh(geo, mat);

  // Posición ligeramente separada del lienzo para que se vea relieve
  const normal = new THREE.Vector3(0, 0, 1);
  stroke.position.copy(hitPoint).addScaledVector(normal, 0.03);

  // Rotación aleatoria ligera para que parezca trazo de pintura
  stroke.rotation.z = (Math.random() - 0.5) * 0.6;
  stroke.rotation.y = (Math.random() - 0.5) * 0.2;

  stroke.userData.type = "art-stroke";
  artsGroup.add(stroke);
  artStrokes.push(stroke);
}

// =========================
// 10. Animación principal
// =========================
function animate() {
  requestAnimationFrame(animate);

  // Matemáticas
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

  // Ciencias
  if (currentSubject === "science" && astroCreated) {
    astroGroup.rotation.y += (targetRotY - astroGroup.rotation.y) * 0.03;
    astroGroup.rotation.x += (targetRotX - astroGroup.rotation.x) * 0.03;

    if (galaxyMesh) {
      galaxyMesh.rotation.y += 0.0008;
      galaxyMesh.rotation.z += 0.0003;
    }

    planets.forEach(p => {
      p.userData.orbitAngle += 0.0015 * p.userData.orbitSpeed;
      const ax = p.userData.orbitRadiusX;
      const az = p.userData.orbitRadiusZ;

      const angle = p.userData.orbitAngle;
      const x = Math.cos(angle) * ax;
      const z = Math.sin(angle) * az;
      const y = Math.sin(angle * 0.7) * p.userData.inclination * 10;

      p.position.set(x, y, z);
      p.rotation.y += p.userData.spinSpeed;
    });

    if (starField) {
      starField.rotation.y += 0.0002;
    }
  }

  // Artes: rotación suave del grupo según gestos (como si giraras el cuadro en 3D)
  if (currentSubject === "arts" && artsCreated) {
    artsGroup.rotation.y += (targetRotY - artsGroup.rotation.y) * 0.08;
    artsGroup.rotation.x += (targetRotX - artsGroup.rotation.x) * 0.04;
  }

  renderer.render(scene, camera3D);
}
animate();

// =========================
// 11. Sliders HUD (Math)
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
// 12. Controles de ZOOM con botones
// =========================
const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");

function applyZoom(delta) {
  cameraZoom += delta;
  if (cameraZoom < minZoom) cameraZoom = minZoom;
  if (cameraZoom > maxZoom) cameraZoom = maxZoom;
  camera3D.position.z = cameraZoom;
}

if (zoomInBtn && zoomOutBtn) {
  zoomInBtn.addEventListener("click", () => applyZoom(-1));
  zoomOutBtn.addEventListener("click", () => applyZoom(+1));
}

// =========================
// 13. MediaPipe Hands
// =========================
const videoElement = document.getElementById("input-video");
const overlay = document.getElementById("overlay");
const overlayCtx = overlay.getContext("2d");

function resizeOverlay() {
  overlay.width = videoElement.clientWidth;
  overlay.height = videoElement.clientHeight;
}
window.addEventListener("resize", resizeOverlay);

// Botón fijo
const activationRadius = 35;
const buttonCenter = { x: 0, y: 0 };

let clickActive = false;
let clickProcessed = false;
let shapeChangeCooldown = false;

function isIndexOnButton(ix, iy) {
  const dx = ix - buttonCenter.x;
  const dy = iy - buttonCenter.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < activationRadius;
}

function detectPinchDistance(landmarks) {
  const thumb = landmarks[4];
  const index = landmarks[8];
  const dx = thumb.x - index.x;
  const dy = thumb.y - index.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function isThumbExtended(landmarks) {
  const thumbTip = landmarks[4];
  const wrist = landmarks[0];
  const dx = thumbTip.x - wrist.x;
  const dy = thumbTip.y - wrist.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist > 0.18;
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

// =========================
// 14. Clicks en escena (Math + Arts)
// =========================
function handleSceneClick(ix, iy) {
  if (currentSubject === "science") return;

  mouse.x = (ix / overlay.width) * 2 - 1;
  mouse.y = -(iy / overlay.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera3D);

  if (currentSubject === "arts") {
    const intersects = raycaster.intersectObjects(artsGroup.children, true);
    if (intersects.length > 0) {
      const obj = intersects[0].object;
      const point = intersects[0].point;

      // Solo pintamos si tocamos el lienzo
      if (obj === artCanvas || obj.userData.type === "art-canvas") {
        paintOnCanvas(point);
      }
    }
    return;
  }

  // Matemáticas
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

  // botón fijo (arriba izquierda de la mini-cámara, pero relativo al overlay)
  const margin = 40;
  buttonCenter.x = margin;
  buttonCenter.y = margin;

  const touchingButton = isIndexOnButton(ix, iy);
  const thumbExtended = isThumbExtended(landmarks);
  const thumbIndexDist = detectPinchDistance(landmarks);

  // Dibujo botón
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

  // punto índice
  overlayCtx.beginPath();
  overlayCtx.arc(ix, iy, 10, 0, 2 * Math.PI);
  overlayCtx.fillStyle = touchingButton ? "#fbbf24" : "#38bdf8";
  overlayCtx.fill();

  // Rotación (siempre activa)
  const normX = indexTip.x - 0.5;
  const normY = indexTip.y - 0.5;
  targetRotY = normX * Math.PI;
  targetRotX = normY * Math.PI;

  // Si el pulgar no está extendido, no hay clic
  if (!thumbExtended) {
    return;
  }

  const clickThreshold = 0.035;
  if (thumbIndexDist < clickThreshold && !clickActive) {
    clickActive = true;
    clickProcessed = false;

    setTimeout(() => {
      clickActive = false;
      clickProcessed = false;
    }, 200);
  }

  // Cambio de figura con el botón verde (solo en Math)
  if (!shapeChangeCooldown && clickActive && touchingButton && currentSubject === "math" && !clickProcessed) {
    shapeChangeCooldown = true;
    cycleShape();
    setTimeout(() => {
      shapeChangeCooldown = false;
    }, 700);
    clickProcessed = true;
  }

  // Clic "normal": interactuar con escena (Math o Arts)
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
// 15. Cámara
// =========================
async function startCamera() {
  try {
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

    // Cuando la cámara está lista, quitamos el overlay de carga
    hideLoading();
  } catch (err) {
    console.error("Error al iniciar cámara:", err);
    alert("No se pudo acceder a la cámara. Revisa permisos del navegador.");
    hideLoading();
  }
}

startCamera();

// Estado inicial
updateSubjectVisibility();
if (modeBadgeEl) modeBadgeEl.textContent = "Math Mode";
