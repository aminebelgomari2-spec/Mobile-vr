let scene, camera, renderer, effect;
let handJoints = [];

const startBtn = document.getElementById('start-btn');
const joyconBtn = document.getElementById('joycon-btn');
const video = document.getElementById('webcam');

// --- 1. VR & THREE.JS ---
function initVR() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('vr-container').appendChild(renderer.domElement);

  effect = new THREE.StereoEffect(renderer);
  effect.setSize(window.innerWidth, window.innerHeight);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
  scene.add(new THREE.GridHelper(20, 20));

  // 21 points pour le squelette de la main
  for (let i = 0; i < 21; i++) {
    const joint = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    handJoints.push(joint);
    scene.add(joint);
  }

  // Orientation du téléphone
  window.addEventListener('deviceorientation', (e) => {
    if (!e.alpha) return;
    const alpha = THREE.MathUtils.degToRad(e.alpha);
    const beta = THREE.MathUtils.degToRad(e.beta);
    const gamma = THREE.MathUtils.degToRad(e.gamma);
    camera.rotation.set(beta, alpha, -gamma, 'YXZ');
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  effect.render(scene, camera);
}

// --- 2. HAND TRACKING ---
function initHandTracking() {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5 });

  hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      landmarks.forEach((pt, i) => {
        handJoints[i].position.set((pt.x - 0.5) * 2, -(pt.y - 0.5) * 2 + 1.5, -pt.z - 0.5);
      });
    }
  });

  const cameraUtils = new Camera(video, {
    onFrame: async () => await hands.send({ image: video }),
    width: 640, height: 480
  });
  cameraUtils.start();
}

// --- 3. DÉMARRAGE ET FIX CAMÉRA ---
startBtn.addEventListener('click', async () => {
  try {
    // Demande la caméra de manière tolérante
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: { ideal: "environment" } } 
    });
    video.srcObject = stream;
    
    document.getElementById('ui').style.display = 'none';
    initVR();
    initHandTracking();
  } catch (err) {
    alert("Erreur Caméra : Assure-toi qu'aucune autre application n'utilise la caméra et réessaie. (" + err.message + ")");
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
