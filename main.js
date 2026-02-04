let agents = [];

let scenes = [];
let mirrorCams = [];
let fovy;

let mic;
let audioLevel = 0;
let soundNorm;

let lightHue_1;
let lightHue_2;
let set1 = [180, 180, 300];
let set2 = [60, 39, 180];
let lightPos;

let p = {
  numAgents: 701,
  numAgentsMin: 101,
  numAgentsMax: 1001,
  numAgentsStep: 100,

  agentR: 30,
  agentRMin: 1,

  sphereR: 2.25,
  sphereRMin: 1,
  sphereRMax: 3,
  sphereRStep: 0.25,

  audioSensitivity: 80, // higher for in-class demo
  audioSensitivityMin: 10,
  audioSensitivityMax: 90,
};

function setup() {
  createSettingsGui(p, { callback: paramChanged, load: false });
  createCanvas(windowWidth, windowHeight, WEBGL);
  frameRate(60); // just a hope and a dream...

  createAgents();
  setupParticles();

  fovy = PI / 1.75;
  windowResized();

  //------------ audio --------------
  mic = new p5.AudioIn();
  mic.start();

  //--------- scene cameras ---------
  mCam0 = createCamera();
  mCam1 = createCamera();
  mCam2 = createCamera();
  mCam3 = createCamera();
  mirrorCams = [mCam0, mCam1, mCam2, mCam3];

  cam = createCamera();
  cam.camera(0, 200, 1200, 0, 1, 0);

  //-------- initial scene lighting ----------
  lightPos = 0;
  lightHue_1 = set1[lightPos];
  lightHue_2 = set2[lightPos];

  // offscreen buffers for mirroring
  for (let i = 0; i < 4; i++) scenes[i] = createFramebuffer();
}

function draw() {
  if (frameCount % 300 == 0) lightPos = (lightPos + 1) % set1.length;
  background(0);

  audioLevel = mic.amplitude.getLevel() * 100;
  soundNorm = constrain(audioLevel / (100 - p.audioSensitivity), 0, 1);

  // burst on loud sound > sensitivity level. otherwise, each agent expands uniformly with sound.
  for (const a of agents) {
    if (audioLevel > (100 - p.audioSensitivity)) {
      agents.forEach(a => a.burst());
      break;
    }
    a.rad = lerp(a.rad, a.baseRad + soundNorm * 50, 0.2);
  }

  // scene creation. see 'scene.js'
  setupScene();
  setupMirrors();
  createMirror(0);
  createMirror(1, PI / 2);
  createMirror(2, -PI / 2);
  createMirror(3, PI / 2, true);
}

function createAgents() {
  agents = [];

  let N = (p.numAgents - 1) / 2;
  for (let i = -N; i <= N; i++) {
    let a = new Agent(i);
    agents.push(a);
  }
}

function keyPressed() {
  if (key == " ") { // burst shortcut
      agents.forEach(a => a.burst());
  } else if (key.toLowerCase() == "r") { // reset scene
    createAgents();
  }
}

function doubleClicked() {
  let current = document.body.style.cursor;
  if (current === "none") document.body.style.cursor = "auto";
  else document.body.style.cursor = "none";
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  perspective(fovy, width / height, 10, 10000);
}

function paramChanged(param) {
  if (param != "audioSensitivity") createAgents();
}