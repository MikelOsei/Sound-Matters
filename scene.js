function setupScene() {
  colorMode(HSB);
  push();

  // color is rotated every 300 frames or so
  lightHue_1 = lerp(lightHue_1, set1[(lightPos + 1) % 3], 1 / 300) % 360;
  lightHue_2 = lerp(lightHue_2, set2[(lightPos + 1) % 3], 1 / 300) % 360;

  background(lightHue_1, 50, 15);

  ambientMaterial(0, 0, 40);
  ambientLight(300, 100, 100, 100);
  pointLight(lightHue_1, 100, 100, -500, -500, 500);
  pointLight(lightHue_2, 100, 100, 500, 500, 500);

  agents.forEach((a) => a.update());
  agents.forEach((a) => a.draw());
  pop();
  drawParticles();
  colorMode(RGB); // for backwards compatibility w/ older code
}

//re-creates the scenes from different ("mirrored") camera views
function setupMirrors() {
  for (let i = 0; i < 4; i++) {
    scenes[i].begin(); // render to offscreen buffer
    let c = mirrorCams[i];
    setCamera(c);
    c.lookAt(0, 1, 0);
    c.perspective(-fovy, 1, 1, 10000);
    
    // mirror aspect ratio is 1:1
    if (i == 0) c.setPosition(0, 0, -2 * (height + 600));
    else if (i == 1) c.setPosition(-2 * (height + 600), 0, 0);
    else if (i == 2) c.setPosition(2 * (height + 600), 0, 0);
    else {
      c.lookAt(0, 0, 1);
      c.setPosition(0, 2 * (height + 600), 0);
    }

    background(0);
    setupScene();
    scenes[i].end();
  }
}

function createMirror(scene = 0, angle = 0, isFloor = false) {
  push();
  stroke(100);
  strokeWeight(2);
  tint(200); // "glass" look, darkened to visually tell the difference

  // uses the offscreen mirror buffers as a texture
  texture(scenes[scene]); 

  if (isFloor) {
    translate(0, height * 2, 0);
    rotateX(angle);
  } else {
    rotateY(angle);
    translate(0, 0, -height * 2);
  }

  // using rect instead of a plane to take advantage of the stroke without a diagonal line across it.
  // the stroke is subtle but really helps the scene feel like an actual "room"
  let size = height * 4;
  rect(-size / 2, -size / 2, size, size);
  pop();
}


/*--------particles for atmosphere---------*/
let particles = [];
function setupParticles(num = 400) {
  particles = [];
  for (let i = 0; i < num; i++) {
    particles.push({
      x: random(-width, width),
      y: random(-height, height),
      z: 500,
      r: random(2, 6),
      hue: random(140, 240),
      speedX: random(-0.2, 0.2),
      speedY: random(-0.2, 0.2),
    });
  }
}

function drawParticles() {
  push();
  noStroke();
  particles.forEach((p) => {
    push();
    fill(p.hue, 50, 100);
    translate(p.x, p.y, p.z);
    circle(p.x, p.y, p.r);
    pop();

    p.x += p.speedX;
    p.y += p.speedY;

    // wrap aroudn to other side if OOB
    if (p.x > width) p.x = -width;
    if (p.x < -width) p.x = width;
    if (p.y > height) p.y = -height;
    if (p.y < -height) p.y = height;
  });
  pop();
}
