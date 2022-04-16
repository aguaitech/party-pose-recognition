// import {
//   POSE_CARTOON_CONNECTIONS,
//   POSE_LEFT_EAR,
//   POSE_LEFT_EYE,
//   POSE_NOSE,
//   POSE_RIGHT_EAR,
//   POSE_RIGHT_EYE,
// } from "@/core/constant";
import { Camera } from "@mediapipe/camera_utils";
// import { drawConnectors } from "@mediapipe/drawing_utils";
// import seedrandom from "seedrandom";
import * as PIXI from "pixi.js";
import color from "color";

class Stick {
  cx = 0;
  cy = 0;
  lineWidth = 5;
  length = 50;
  rho = 0;
  phi = 0;
  vx = 0;
  vy = 0;
  alpha = 0.5;
  beta = 0.1;

  constructor(x, y) {
    this.cx = x;
    this.cy = y;
  }

  static toXY(rho, phi, length) {
    return [
      Math.cos((rho / 180) * Math.PI),
      Math.sin((rho / 180) * Math.PI),
    ].map((x) => x * Math.sin((phi / 180) * Math.PI) * length);
  }

  static toRhoPhi(x, y, length) {
    return [
      x == 0 && y == 0 ? 0 : (Math.atan2(y, x) / Math.PI) * 180,
      (Math.asin(Math.min(1, Math.sqrt(x * x + y * y) / length)) / Math.PI) *
        180,
    ];
  }

  toXY(rho, phi) {
    return Stick.toXY(rho, phi, this.length).map(
      (v, i) => v + (i == 0 ? this.cx : this.cy)
    );
  }

  toRhoPhi(x, y) {
    return Stick.toRhoPhi(x - this.cx, y - this.cy, this.length);
  }

  blow(vx, vy) {
    const [originX, originY] = this.toXY(this.rho, this.phi);
    const factor = Math.cos((this.phi / 180) * Math.PI);
    const finalVx =
        vx * factor + this.vx * this.alpha + (this.cx - originX) * this.beta,
      finalVy =
        vy * factor + this.vy * this.alpha + (this.cy - originY) * this.beta;
    const finalX = originX + finalVx,
      finalY = originY + finalVy;
    const [rho, phi] = this.toRhoPhi(finalX, finalY);
    this.vx = finalVx;
    this.vy = finalVy;
    this.rho = rho;
    this.phi = phi;
  }

  render() {
    const line = (x0, y0, x1, y1) => {
      var dx = Math.abs(x1 - x0);
      var dy = Math.abs(y1 - y0);
      var sx = x0 < x1 ? 1 : -1;
      var sy = y0 < y1 ? 1 : -1;
      var err = dx - dy;

      const fillArray = [];

      while (dx || dy) {
        fillArray.push([
          `rgba(0,255,0,${Math.pow(
            Math.sqrt(Math.pow(x0 - this.cx, 2) + Math.pow(y0 - this.cy, 2)) /
              this.length,
            3
          )})`,
          x0,
          y0,
          this.lineWidth / 2,
          0,
          Math.PI * 2,
        ]);

        if (x0 === x1 && y0 === y1) break;
        var e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x0 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y0 += sy;
        }
      }

      return fillArray;
    };

    return line(
      Math.floor(this.cx),
      Math.floor(this.cy),
      ...this.toXY(this.rho, this.phi).map(Math.floor)
    );
  }
}

class Wind {
  windMap = null;
  width = 1081;
  height = 1080;
  maxWind = 10000;
  kernel = 1081;
  subStep = 3;
  centroids = 2;
  alpha = 0.95;

  next() {
    if (this.windMap) {
      this.windMap = this.windMap.map((row) => row.map((x) => x * this.alpha));
    } else {
      this.windMap = Array(this.width)
        .fill(0)
        .map(() => Array(this.height).fill(0));
    }
    const cent = Array(this.centroids)
      .fill(0)
      .map(() => [Math.random() * this.width, Math.random() * this.height]);
    for (let [i, j] of cent) {
      const factor = Math.random() * this.maxWind;
      for (let m = -this.kernel / 2; m < this.kernel / 2; m++) {
        for (let n = -this.kernel / 2; n < this.kernel / 2; n++) {
          const x = Math.floor(i + m);
          const y = Math.floor(j + n);
          if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
          this.windMap[x][y] +=
            (factor / ((this.kernel / 8) * Math.sqrt(2 * Math.PI))) *
            Math.exp(-(m * m + n * n) / ((this.kernel * this.kernel) / 32));
        }
      }
    }
  }

  getWind(x, y) {
    if (!this.windMap) this.next();
    if (x >= this.width) x = this.width - 1;
    if (y >= this.height) y = this.height - 1;
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    x = Math.floor(x);
    y = Math.floor(y);
    let sx = 0,
      sy = 0;
    //let counterX = 0,
    // counterY = 0;
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        if (
          x + i < 0 ||
          x + i >= this.width ||
          y + j < 0 ||
          y + j >= this.height
        )
          continue;
        // if (i != 0) counterX++;
        // if (j != 0) counterY++;
        if (i != 0) sx += (this.windMap[x][y] - this.windMap[x + i][y + j]) / i;
        if (j != 0) sy += (this.windMap[x][y] - this.windMap[x + i][y + j]) / j;
      }
    }
    return [-sy, sx];
  }
}

const MAX_CIRCLE_CNT = 1500,
  MIN_CIRCLE_CNT = 100;
//const MAX_VERTEX_CNT = 30,
// MIN_VERTEX_CNT = 3;
const BG_OPACITY = 0.5;

let circleCnt = 1500,
  vertexCnt = 30;

function getCenterByTheta(theta, time, scale) {
  const direction = [Math.cos(theta), Math.sin(theta)];
  const distance = 0.6 + 0.2 * Math.cos(theta * 6 + Math.cos(theta * 8 + time));
  const circleCenter = direction
    .map((v) => v * distance * scale)
    .map((v, i) => v + (i == 0 ? 1081 / 2 : 1080 / 2));
  return circleCenter;
}

function getSizeByTheta(theta, time, scale) {
  const offset = 0.2 + 0.12 * Math.cos(theta * 9 - time * 2);
  const circleSize = scale * offset;
  return circleSize;
}

function getColorByTheta(theta, time) {
  const th = 8 * theta + time * 2;
  const r = 0.6 + 0.4 * Math.cos(th),
    g = 0.6 + 0.4 * Math.cos(th - Math.PI / 3),
    b = 0.6 + 0.4 * Math.cos(th - (Math.PI * 2) / 3),
    a =
      ((circleCnt - MIN_CIRCLE_CNT) / (MAX_CIRCLE_CNT - MIN_CIRCLE_CNT)) *
        (0.3 - 1.5) +
      1.5;
  return [r * 255, g * 255, b * 255, a];
}

/**
 *
 * @param {HTMLVideoElement} videoElement
 * @param {HTMLCanvasElement} canvasElement
 * @param {import("@tensorflow-models/posenet").PoseNet} net
 * @param {import("vue").DefineComponent} $Vue
 */
export default function (videoElement, canvasElement, net, $Vue) {
  // const canvasCtx = canvasElement.getContext("2d");

  const app = new PIXI.Application({
    view: canvasElement,
    width: 1081,
    height: 1080,
  });

  const circles = [];
  let counter = 0;
  const scale = 1081 / 2;

  const sticks = [];

  // let counter = 0;

  const gap = 30;

  for (let i = 0; i < 1081 / gap; i++) {
    for (let j = 0; j < 1080 / gap; j++) {
      sticks.push(new Stick(i * gap + gap / 2, j * gap + gap / 2));
    }
  }

  const particles = new PIXI.ParticleContainer(MAX_CIRCLE_CNT, {
    position: true,
    uvs: false,
    vertices: true,
    rotation: false,
    tint: true,
  });

  const circleBase = new PIXI.Graphics();
  circleBase.lineStyle({ width: 5, color: 0xffffff });

  for (let vi = 0; vi <= vertexCnt; vi++) {
    const thetaV = (vi / vertexCnt) * Math.PI * 2;
    const x = Math.cos(thetaV) * scale;
    const y = Math.sin(thetaV) * scale;
    if (vi == 0) {
      circleBase.moveTo(x, y);
    } else {
      circleBase.lineTo(x, y);
    }
  }

  const circleTexture = app.renderer.generateTexture(circleBase);

  for (let i = 0; i < circleCnt; i++) {
    const circle = new PIXI.Sprite(circleTexture);

    const time = counter / 20;
    const thetaC = (i / circleCnt) * Math.PI * 2;

    const circleSize = getSizeByTheta(thetaC, time, scale);

    circle.anchor.set(0.5);
    circle.position.set(...getCenterByTheta(thetaC, time, scale));
    circle.scale.set(circleSize / scale);

    const circleColor = getColorByTheta(thetaC, time);

    circle.tint = circleColor.slice(0, 3).reduce((p, v) => p * 256 + v);
    circle.alpha = circleColor[3] * BG_OPACITY;

    circles.push(circle);
    particles.addChild(circle);
  }

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      if (net) {
        let startTime = Date.now();
        const poses = await net.estimateMultiplePoses(videoElement, {
          maxDetections: 64,
        });

        let endTime = Date.now();
        $Vue.fpsCount = Math.round(1000 / (endTime - startTime));
        $Vue.peopleCount = poses.length;
      }
    },
    width: 1081,
    height: 1080,
  });
  camera.start();

  const maggots = [];

  const totalSprites = sticks.length;

  const particles2 = new PIXI.ParticleContainer(totalSprites, {
    position: false,
    uvs: false,
    vertices: true,
    rotation: true,
    tint: true,
  });

  // particles2.alpha = BG_OPACITY;
  app.stage.addChild(particles);
  app.stage.addChild(particles2);

  for (let i = 0; i < totalSprites; i++) {
    // create a new Sprite
    const dude = PIXI.Sprite.from("examples/assets/maggot_tiny.png");

    dude.alpha = Math.sin((sticks[i].phi / 180) * Math.PI);
    dude.tint = 0x00ff00;
    dude.anchor.set(0.5, 1);
    dude.position.set(sticks[i].cx, sticks[i].cy);
    dude.angle = sticks[i].rho;
    dude.scale.set(Math.sin((sticks[i].phi / 180) * Math.PI));

    maggots.push(dude);

    particles2.addChild(dude);
  }

  const wind = new Wind();

  app.ticker.add(() => {
    counter++;
    for (const i in circles) {
      const circle = circles[i];

      const time = counter / 20;
      const thetaC = (i / circleCnt) * Math.PI * 2;

      const circleSize = getSizeByTheta(thetaC, time, scale);

      circle.position.set(...getCenterByTheta(thetaC, time, scale));
      circle.scale.set(circleSize / scale);

      const circleColor = getColorByTheta(thetaC, time);

      circle.tint = circleColor.slice(0, 3).reduce((p, v) => p * 256 + v);
      circle.alpha = circleColor[3] * BG_OPACITY;
    }

    wind.next();
    // iterate through the sprites and update their position
    for (let i = 0; i < maggots.length; i++) {
      const dude = maggots[i];
      sticks[i].blow(...wind.getWind(sticks[i].cx, sticks[i].cy));
      dude.alpha = Math.sin((sticks[i].phi / 180) * Math.PI);
      dude.angle = sticks[i].rho;
      dude.tint = parseInt(
        color(`hsl(${sticks[i].rho.toFixed(6)},100%,50%)`)
          .hex()
          .slice(1),
        16
      );
      dude.scale.set(Math.sin((sticks[i].phi / 180) * Math.PI));
    }
  });

  return () => {
    camera.stop();
    app.destroy();
  };
}
