let scene, camera, renderer;
let handJoints = [];

const startBtn = document.getElementById('start-btn');
const joyconBtn = document.getElementById('joycon-btn');
const video = document.getElementById('webcam');

// --- 1. RENDERER 3D (ÉCRAN UNIQUE) ---
function init3D() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.5, 0);

  // Initialisation du WebGL classique
  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('vr-container').appendChild(renderer.domElement);

  // Lumière et Grille
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
  scene.add(new THREE.GridHelper(20, 20));

  // 21 repères verts pour le squelette de la main
  for (let i = 0; i < 21; i++) {
    const joint = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    handJoints.push(joint);
    scene.add(joint);
  }

  // Redimensionnement automatique si l'écran tourne
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// --- 2. MEDIAPIPE HAND TRACKING ---
function initHandTracking() {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({ 
    maxNumHands: 1, 
    modelComplexity: 0, // Version légère pour mobile
    minDetectionConfidence: 0.5 
  });

  hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      landmarks.forEach((pt, i) => {
        handJoints[i].position.set((pt.x - 0.5) * 3, -(pt.y - 0.5) * 3 + 1.5, -pt.z - 1);
      });
    }
  });

  const cameraUtils = new Camera(video, {
    onFrame: async () => await hands.send({ image: video }),
    width: 480, 
    height: 360
  });
  cameraUtils.start();
}

// --- 3. DÉMARRAGE ---
startBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    
    document.getElementById('ui').style.display = 'none';
    init3D();
    initHandTracking();
  } catch (err) {
    alert("Erreur Caméra : " + err.message);
  }
});

// --- 4. JOY-CON ---
joyconBtn.addEventListener('click', async () => {
  try {
    const devices = await navigator.hid.requestDevice({ filters: [{ vendorId: 0x057e }] });
    if (devices.length > 0) {
      const joycon = devices[0];
      await joycon.open();
      alert("Joy-Con connecté : " + joycon.productName);
    }
  } catch (err) {
    alert("Erreur Joy-Con : " + err);
  }
});
