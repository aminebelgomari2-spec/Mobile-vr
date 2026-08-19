const startBtn = document.getElementById('start-btn');
const joyconBtn = document.getElementById('joycon-btn');
const video = document.getElementById('webcam');

// Crée un canvas léger pour dessiner les mains
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.getElementById('vr-container').appendChild(canvas);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Configuration ultra-légère de MediaPipe
function initHandTracking() {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0, // 0 = Modèle le plus rapide/léger
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults((results) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessine l'image vidéo en fond
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Dessine les points de la main
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      ctx.fillStyle = '#00FF00';
      landmarks.forEach((pt) => {
        const x = pt.x * canvas.width;
        const y = pt.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  });

  // Utilise l'API native pour économiser la RAM
  async function processFrame() {
    if (video.readyState >= 2) {
      await hands.send({ image: video });
    }
    requestAnimationFrame(processFrame);
  }
  
  processFrame();
}

// Démarrage
startBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
    });
    video.srcObject = stream;
    await video.play();

    document.getElementById('ui').style.display = 'none';
    initHandTracking();
  } catch (err) {
    alert("Erreur : " + err.message);
  }
});

// Connexion Joy-Con
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
