const STILL = 0;
const FALLING = 1;
const WAITING = 2;
const RISING = 3;

class Agent {
  mass = 0;
  velocityX;
  velocityY;
  velocityZ;
  state = STILL;

  targetX = 0;
  targetY = 0;
  targetZ = 0;

  constructor(id) {
    this.timers = [];
    this.waitingTimerSet = false;
    this.stillTimerSet = false;
    this.rad = p.agentR;
    this.baseRad = p.agentR;
    this.id = id; // agent id for knowing where to go in the blob
    this.reset();
  }

  setTimer(time, callback) {
    this.timers.push({
      duration: time,
      callback,
      start: millis(),
    });
  }

  checkTimers() {
    const currentTime = millis();
    for (let t of this.timers) {
      if (currentTime - t.start >= t.duration) t.callback();
    }
    this.timers = this.timers.filter((t) => currentTime - t.start < t.duration);
  }

  sphereMap() {
    // fibonacci sphere math credits: https://www.johndcook.com/blog/2023/08/12/fibonacci-lattice/
    let phi = asin((2 * this.id) / p.numAgents);
    let theta = (2 * PI * this.id) / ((1 + sqrt(5)) / 2);

    // radius of the big circle.
    let R = (p.sphereR * 0.5 * min(width, height)) / 2;

    this.targetX = R * cos(phi) * cos(theta);
    this.targetY = R * sin(phi);
    this.targetZ = R * cos(phi) * sin(theta) - 100;
  }

  update() {
    this.checkTimers();
    switch (this.state) {
      case STILL:
        this.updateStill();
        break;
      case FALLING:
        this.updateFalling();
        break;
      case WAITING:
        this.updateWaiting();
        break;
      case RISING:
        this.updateRising();
        break;
    }
  }

  draw() {
    push();
    noStroke();
    fill("white");
    shininess(20);
    specularMaterial(255);

    translate(0, -300, 0); // start the ball higher than (0, 0)

    if (this.state == STILL) {
      rotateY(-frameCount / 100);
      rotateZ(frameCount / 100);
    }

    translate(this.x, this.y, this.z);
    sphere(this.rad);
    pop();
  }

  burst(forceMin = -10) {
    this.state = FALLING;

    let x = this.x;
    let y = this.y;
  
    let len = dist(x, y, 0, 0) || 0.0001;
    x /= len;
    y /= len;

    let force = random(forceMin, 20);

    this.velocityX += x * force;
    this.velocityY += y * force;
    this.velocityZ += random(-10, 5);
  }

  reset() {
    this.rad = p.agentR;
    this.resetVelocity();
    this.mass = map(this.rad, 1, 100, 0.6, 2.0);
    this.state = STILL;

    this.sphereMap();
    this.x = this.targetX;
    this.y = this.targetY;
    this.z = this.targetZ;

    this.waitingTimerSet = false;
    this.stillTimerSet = false;
  }

  resetVelocity() {
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityZ = 0;
  }

  updateStill() {
    if (random() < 0.001 && random() < 0.005) {
      this.velocityY -= 1;
      this.velocityX += random(-1, 1);
      this.velocityZ += random(-1, 1);

      this.state = FALLING;
    }

    // 45sec timer for continuity, interaction or not
    if (!this.stillTimerSet) {
      this.setTimer(45000, () => {
        this.burst(-60);
        this.stillTimerSet = false;
      });

      this.stillTimerSet = true;
    }
  }

  updateFalling() {
    this.timers = [];

    // a lot of magic numbers live here, BUT they're mostly aesthetic choices :)
    this.mass = map(this.rad, 5, 40, 0.6, 2.0);
    // slowmo: random(0.001, 0.1)

    this.velocityY += 0.45 * this.mass;

    this.velocityX *= 0.995;
    this.velocityY *= 0.98;

    this.x += this.velocityX;
    this.y += this.velocityY;
    this.z += this.velocityZ;

    const bound = height * 2 - this.rad;

    if (this.y > bound + 300) {
      this.y = bound + 300;
      this.velocityY *= -0.8; // bounce to a stop
      // gradually lose movement on x and z-axes
      this.velocityX *= random(0.98, 1);
      this.velocityZ *= random(0.98, 1);
    }

    if (this.y < -bound) {
      this.y = -bound;
      this.velocityY += 1;
    }

    // hit and bounce check
    if (this.x < -bound) {
      this.x = -bound;
      this.velocityX *= -0.5;
    }
    if (this.x > bound) {
      this.x = bound;
      this.velocityX *= -0.5;
    }
    if (this.z < -bound) {
      this.z = -bound;
      this.velocityZ *= -0.5;
    }
    if (this.z > bound) {
      this.z = bound;
      this.velocityZ *= -0.5;
    }

    if (abs(this.velocityX) <= 0.0001 && this.y == bound + 300)
      this.state = WAITING;
  }

  updateWaiting() {
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.z += this.velocityZ;

    if (!this.waitingTimerSet) {
      this.setTimer(3000, () => {
        // wait 3 sec then "jitter"
        this.velocityX += random(-0.1, 0.1);
        this.velocityZ += random(-0.1, 0.1);

        this.setTimer(5000, () => {
          // start 5sec delay to start rising
          this.resetVelocity();
          this.state = RISING;
          this.waitingTimerSet = false;
        });
      });

      this.waitingTimerSet = true;
    }
  }

  updateRising() {
    this.rad = this.baseRad;
    this.sphereMap();
    this.resetVelocity();

    let t = 0.002; // controls rise speed
    this.x = lerp(this.x, this.targetX, t);
    this.y = lerp(this.y, this.targetY, t);
    this.z = lerp(this.z, this.targetZ, t);

    if (
      dist(this.x, this.y, this.z, this.targetX, this.targetY, this.targetZ) < 5
    ) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.z = this.targetZ;
      this.state = STILL;
    }
  }
}
