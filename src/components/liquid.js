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
// import color from "color";

class Drop {
  cx = 0;
  cy = 0;
  tick = 0;
  vx = 0;
  vy = 0;

  constructor(x, y) {
    this.cx = x;
    this.cy = y;
  }

  next(vx, vy) {
    this.vx += vx === undefined ? (Math.random() - 0.5) * 0.1 : vx;
    this.vy += vy === undefined ? (Math.random() - 0.5) * 0.1 : vy;
    const norm = Math.max(
      Math.sqrt(this.vx * this.vx + this.vy * this.vy),
      0.00000001
    );
    this.vx /= norm;
    this.vy /= norm;
    this.cx += this.vx;
    this.cy += this.vy;
    this.cx = Math.min(1081, Math.max(this.cx, 0));
    this.cy = Math.min(1080, Math.max(this.cy, 0));
  }
}

class Wind {
  windMap = null;
  width = 1081;
  height = 1080;
  maxWind = 30000;
  kernel = 1081;
  subStep = 3;
  centroids = 2;
  alpha = 0.99;

  min = Infinity;
  max = -Infinity;
  normalizedMap = null;

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
      const factor = (Math.random() - 0.5) * this.maxWind;
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
    this.min = Infinity;
    this.max = -Infinity;
    this.normalizedMap = null;
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

  getMinMax() {
    if (!this.windMap) this.next();
    if (this.min == Infinity && this.max == -Infinity) {
      const [min, max] = this.windMap.reduce(
        (p, v) => {
          const [min, max] = v.reduce(
            (p, v) => [Math.min(p[0], v), Math.max(p[1], v)],
            [Infinity, -Infinity]
          );
          return [Math.min(p[0], min), Math.max(p[1], max)];
        },
        [Infinity, -Infinity]
      );
      this.min = min;
      this.max = max;
    }
    return [this.min, this.max];
  }

  getNormalizedMap() {
    if (!this.windMap) this.next();
    if (this.normalizedMap) return this.normalizedMap;
    else {
      const [min, max] = this.getMinMax();
      this.normalizedMap = this.windMap.map((row) =>
        row.map((v) => (v - min) / (max - min))
      );
      return this.normalizedMap;
    }
  }

  getContourLine(height, threshold) {
    if (!this.windMap) this.next();
    const normalizedMap = this.getNormalizedMap();
    const rows = normalizedMap.length,
      cols = normalizedMap[0].length;
    const bitmap = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (
          normalizedMap[i][j] >= height - threshold &&
          normalizedMap[i][j] <= height + threshold
        ) {
          bitmap.push([i, j]);
        }
      }
    }
    return bitmap;
  }
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

  const drops = [];

  for (let i = 0; i < 100; i++) {
    drops.push(new Drop(Math.random() * 1081, Math.random() * 1080));
  }

  // let pointer = 0;

  // const gap = 30;

  // for (let i = 0; i < 1081 / gap; i++) {
  //   for (let j = 0; j < 1080 / gap; j++) {
  //     sticks.push(new Stick(i * gap + gap / 2, j * gap + gap / 2));
  //   }
  // }

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      if (net) {
        // counter++;
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

  // create an array to store all the sprites
  const maggots = [];

  const totalSprites = (1081 + 1080) * 2 * 50;

  const particles = new PIXI.ParticleContainer(totalSprites, {
    position: true,
    uvs: false,
    vertices: false,
    rotation: false,
    tint: false,
  });
  app.stage.addChild(particles);

  const circleBase = new PIXI.Graphics();
  circleBase.lineStyle({ width: 1, color: 0xffffff });
  circleBase.drawCircle(0, 0, 1);
  const circleTexture = app.renderer.generateTexture(circleBase);

  const wind = new Wind();

  for (let i = 0; i < 10; i++) {
    const contour = wind.getContourLine(i / 10, 0.001);
    for (let j = 0; j < ((1081 + 1080) * 2 * 50) / 10; j++) {
      // create a new Sprite
      const dude = new PIXI.Sprite(circleTexture);

      dude.anchor.set(0.5);

      // const drop = drops[i];
      // drop.next();
      if (contour[j]) {
        dude.position.set(contour[j][0], contour[j][1]);
      } else {
        dude.position.set(-1, -1);
      }

      maggots.push(dude);

      particles.addChild(dude);
    }
  }

  app.ticker.add(() => {
    // counter++;
    // if (counter % 10 === 0) {
    //   wind.next();
    // }
    wind.next();
    // iterate through the sprites and update their position
    // for (let i = 0; i < maggots.length; i++) {
    //   const dude = maggots[i];
    //   let [vx, vy] = wind.getWind(dude.position.x, dude.position.y);
    //   const norm = Math.max(Math.sqrt(vx * vx + vy * vy), 0.000001);
    //   dude.position.set(
    //     dude.position.x + vx / norm,
    //     dude.position.y + vy / norm
    //   );
    //   dude.alpha = dude.alpha * 0.999;
    //   dude.scale.set(dude.scale.x * 0.999);
    // }

    for (let i = 0; i < 10; i++) {
      const contour = wind.getContourLine(i / 10, 0.001);
      for (let j = 0; j < ((1081 + 1080) * 2 * 50) / 10; j++) {
        const dude = maggots[(i * ((1081 + 1080) * 2 * 50)) / 10 + j];

        if (contour[j]) {
          dude.position.set(contour[j][0], contour[j][1]);
        } else {
          dude.position.set(-1, -1);
        }
      }
    }

    // for (let i = 0; i < drops.length; i++) {
    //   if (maggots.length >= totalSprites) {
    //     const dude = maggots[pointer++];
    //     const drop = drops[i];
    //     drop.next(...wind.getWind(drop.cx, drop.cy).map((x) => -x));

    //     dude.position.set(drop.cx, drop.cy);
    //     dude.alpha = 1;
    //     dude.scale.set(1);

    //     if (pointer >= totalSprites) {
    //       pointer = 0;
    //     }
    //   } else {
    //     // create a new Sprite
    //     const dude = new PIXI.Sprite(circleTexture);

    //     const drop = drops[i];
    //     drop.next();

    //     dude.position.set(drop.cx, drop.cy);

    //     dude.anchor.set(0.5);

    //     maggots.push(dude);

    //     particles.addChild(dude);
    //   }
    // }
  });

  return () => {
    camera.stop();
    app.destroy();
  };
}
