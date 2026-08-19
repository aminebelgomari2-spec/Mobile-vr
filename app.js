let scene, camera, renderer, effect;
let jointSpheres = [];

const startButton = document.getElementById('startButton');
const videoElement = document.getElementById('input_video');

startButton.addEventListener('click', () => {
  startButton.style.display = 'none';
  init3D();
  initHandTracking();
});

// 1. Initialisation de la scène VR 3D
function init3D() {
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limite la résolution pour éviter les crashs GPU
  document.getElementById('vr-container').appendChild(renderer.domElement);

  // Effet Stéréoscopique VR (2 écrans)
  effect = new THREE.StereoEffect(renderer);
  effect.setSize(window.innerWidth, window.innerHeight);

  // Lumière
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 1, 2);
  scene.add(light);

  // Création des 21 repères de la main (sphères légères)
  const sphereGeo = new THREE.SphereGeometry(0.015, 8, 8);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

  for (let i = 0; i < 21; i++) {
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.visible = false;
    scene.add(sphere);
    jointSpheres.push(sphere);
  }

  // Écoute de l'orientation du smartphone (Gyroscope)
  window.addEventListener('deviceorientation', handleOrientation, true);
  window.addEventListener('resize', onWindowResize);

  animate();
}

// Controls caméra via Gyroscope
function handleOrientation(event) {
  if (!event.alpha) return;
  const alpha = THREE.MathUtils.degToRad(event.alpha);
  const beta = THREE.MathUtils.degToRad(event.beta);
  const gamma = THREE.MathUtils.degToRad(event.gamma);
  
  camera.rotation.set(beta, alpha, -gamma, 'YXZ');
}

// 2. Initialisation du tracking de main avec MediaPipe
function initHandTracking() {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  // Configuration optimisée pour éviter la surchauffe et les crashs
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0, // 0 = Modèle ultra-léger pour mobile
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults(onHandResults);

  const cameraMediaPipe = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 320,
    height: 240,
    facingMode: "environment" // Utilise la caméra arrière
  });

  cameraMediaPipe.start();
}

// Mettre à jour les positions 3D des joints de la main
function onHandResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    for (let i = 0; i < 21; i++) {
      const lm = landmarks[i];
      // Conversion des coordonnées 2D vidéo vers l'espace 3D VR devant la caméra
      jointSpheres[i].position.set(
        (lm.x - 0.5) * 2,
        -(lm.y - 0.5) * 2,
        -lm.z * 2 - 0.5
      );
      jointSpheres[i].visible = true;
    }
  } else {
    jointSpheres.forEach(s => s.visible = false);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  effect.setSize(window.innerWidth, window.innerHeight);
}

// Boucle de rendu à 60 FPS
function animate() {
  requestAnimationFrame(animate);
  effect.render(scene, camera);
}
