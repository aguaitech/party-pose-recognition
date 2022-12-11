import {
  POSE_LEFT_EAR,
  POSE_LEFT_EYE,
  POSE_NOSE,
  POSE_RIGHT_EAR,
  POSE_RIGHT_EYE,
} from "@/core/constant";
import { Camera } from "@mediapipe/camera_utils";
// import { drawConnectors } from "@mediapipe/drawing_utils";
// import seedrandom from "seedrandom";
import * as PIXI from "pixi.js";
import color from "color";
import SimplexNoise from "simplex-noise";

// class Drop {
//   cx = 0;
//   cy = 0;
//   tick = 0;
//   vx = 0;
//   vy = 0;

//   constructor(x, y) {
//     this.cx = x;
//     this.cy = y;
//   }

//   next(vx, vy) {
//     this.vx += vx === undefined ? (Math.random() - 0.5) * 0.1 : vx;
//     this.vy += vy === undefined ? (Math.random() - 0.5) * 0.1 : vy;
//     const norm = Math.max(
//       Math.sqrt(this.vx * this.vx + this.vy * this.vy),
//       0.00000001
//     );
//     this.vx /= norm;
//     this.vy /= norm;
//     this.cx += this.vx;
//     this.cy += this.vy;
//     this.cx = Math.min(1920, Math.max(this.cx, 0));
//     this.cy = Math.min(1080, Math.max(this.cy, 0));
//   }
// }

/**
 *
 * @param {HTMLVideoElement} videoElement
 * @param {HTMLCanvasElement} canvasElement
 * @param {import("@tensorflow-models/posenet").PoseNet} net
 * @param {import("vue").DefineComponent} $Vue
 * @param {string} deviceId
 */
export default function (videoElement, canvasElement, net, $Vue, deviceId) {
  // const canvasCtx = canvasElement.getContext("2d");

  const app = new PIXI.Application({
    view: canvasElement,
    width: 1920,
    height: 1080,
  });

  // const drops = [];

  // for (let i = 0; i < 100; i++) {
  //   drops.push(new Drop(Math.random() * 1920, Math.random() * 1080));
  // }

  const colorCache = [];

  for (let i = 0; i < 100; i++) {
    const c = parseInt(
      color(
        `hsl(${206 * (1 - i / 100) + (199 * i) / 100}, ${
          82 * (1 - i / 100) + (85 * i) / 100
        }%, ${34 * (1 - i / 100) + (71 * i) / 100}%)`
      )
        .hex()
        .slice(1),
      16
    );
    colorCache.push([c >> 16, (c >> 8) & 0xff, c & 0xff]);
  }

  let counter = 0;
  let pointer = 0;

  // const gap = 30;

  // for (let i = 0; i < 1920 / gap; i++) {
  //   for (let j = 0; j < 1080 / gap; j++) {
  //     sticks.push(new Stick(i * gap + gap / 2, j * gap + gap / 2));
  //   }
  // }

  const userMaxSprites = (1920 * 1080) / 100;

  const drops = [];

  const particles2 = new PIXI.ParticleContainer(userMaxSprites, {
    position: true,
    vertices: false,
    tint: true,
    rotation: false,
    uvs: false,
  });

  const camera = new Camera(videoElement, {
    deviceId,
    onFrame: async () => {
      if (net) {
        // counter++;
        let startTime = Date.now();
        const poses = await net.estimateMultiplePoses(videoElement, {
          maxDetections: 64,
        });
        let endTime = Date.now();

        for (let pose of poses) {
          let nose = pose.keypoints[POSE_NOSE];
          const leye = pose.keypoints[POSE_LEFT_EYE];
          const reye = pose.keypoints[POSE_RIGHT_EYE];
          let lear = pose.keypoints[POSE_LEFT_EAR];
          let rear = pose.keypoints[POSE_RIGHT_EAR];

          if (nose.score < 0.5) {
            nose = { position: { x: 0, y: 0 }, score: 0 };
            if (leye.score + reye.score >= 1) {
              nose.position.x = (leye.position.x + reye.position.x) / 2;
              nose.position.y = (leye.position.y + reye.position.y) / 2;
              nose.score = (leye.score + reye.score) / 2;
            } else {
              if (lear.score + rear.score >= 1) {
                nose.position.x = (lear.position.x + rear.position.x) / 2;
                nose.position.y = (lear.position.y + rear.position.y) / 2;
                nose.score = (lear.score + rear.score) / 2;
              }
            }
          }

          if (lear.score < 0.5) {
            lear = { position: { x: 0, y: 0 }, score: 0 };
            if (leye.score + nose.score >= 1) {
              lear.position.x = 2 * leye.position.x - nose.position.x;
              lear.position.y =
                leye.position.y - reye.position.y + nose.position.y;
              lear.score = (leye.score + nose.score) / 2;
            }
          }

          if (rear.score < 0.5) {
            rear = { position: { x: 0, y: 0 }, score: 0 };
            if (reye.score + nose.score >= 1) {
              rear.position.x = 2 * reye.position.x - nose.position.x;
              rear.position.y =
                reye.position.y - leye.position.y + nose.position.y;
              rear.score = (reye.score + nose.score) / 2;
            }
          }

          if (nose.score >= 0.5 && lear.score >= 0.5 && rear.score >= 0.5) {
            if (drops.length >= userMaxSprites) {
              const dude = drops[pointer++];

              dude.position.set(nose.position.x, nose.position.y);
              dude.alpha = 1;
              dude.scale.set(1);

              if (pointer >= userMaxSprites) {
                pointer = 0;
              }
            } else {
              // create a new Sprite
              const dude = new PIXI.Sprite(circleTexture);

              dude.position.set(nose.position.x, nose.position.y);

              dude.anchor.set(0.5);

              drops.push(dude);

              particles2.addChild(dude);
            }
          }
        }

        $Vue.fpsCount = Math.round(1000 / (endTime - startTime));
        $Vue.peopleCount = poses.length;
      }
    },
    width: 1920,
    height: 1080,
  });
  camera.start();

  // create an array to store all the sprites
  // const maggots = [];

  const totalSprites = 1920 * 1080;

  // const particles = new PIXI.ParticleContainer(totalSprites, {
  //   position: false,
  //   uvs: false,
  //   vertices: false,
  //   rotation: false,
  //   tint: true,
  // });
  // app.stage.addChild(particles);

  const circleBase = new PIXI.Graphics();
  circleBase.lineStyle({ width: 1, color: 0xffffff });
  circleBase.drawCircle(0, 0, 1);
  const circleTexture = app.renderer.generateTexture(circleBase);

  const wind = new SimplexNoise();

  const uArray = new Uint8Array(totalSprites * 4);

  for (let i = 0; i < 1920; i++) {
    for (let j = 0; j < 1080; j++) {
      uArray[(i * 1080 + j) * 4] = 0;
      uArray[(i * 1080 + j) * 4 + 1] = 0;
      uArray[(i * 1080 + j) * 4 + 2] = 0;
      uArray[(i * 1080 + j) * 4 + 3] = 255;

      // const dude = new PIXI.Sprite(circleTexture);

      // dude.position.set(i, j);

      // dude.tint =
      //   colorCache[
      //     Math.round(
      //       wind.noise3D((i / 1920) * 16, (j / 1080) * 16, counter / 32) * 99
      //     )
      //   ];

      // maggots.push(dude);

      // particles.addChild(dude);
    }
  }

  const texture = PIXI.Texture.fromBuffer(uArray, 1920, 1080);
  const BG = new PIXI.Sprite(texture);
  app.stage.addChild(BG);

  app.stage.addChild(particles2);

  // let oldCache = null;

  var g_TICK = 1000 / 30; // 1000/40 = 25 frames per second
  var g_Time = 0;

  app.ticker.add(() => {
    var timeNow = new Date().getTime();
    var timeDiff = timeNow - g_Time;
    if (timeDiff < g_TICK) return;

    // We are now meeting the frame rate, so reset the last time the animation is done
    g_Time = timeNow;

    const noiseArray = new Uint8Array(1920 * 1080);
    for (let i = 0; i < 1920; i++) {
      for (let j = 0; j < 1080; j++) {
        noiseArray[i * 1080 + j] = Math.min(
          Math.max(
            0,
            Math.round(
              wind.noise3D((i / 1920) * 4, (j / 1080) * 4, counter / 100) * 99
            )
          ),
          99
        );
      }
    }

    const getWind = (x, y) => {
      if (x >= 1920) x = 1920 - 1;
      if (y >= 1080) y = 1080 - 1;
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
          if (x + i < 0 || x + i >= 1920 || y + j < 0 || y + j >= 1080)
            continue;
          // if (i != 0) counterX++;
          // if (j != 0) counterY++;
          if (i != 0)
            sx +=
              (noiseArray[x * 1080 + y] - noiseArray[(x + i) * 1080 + y + j]) /
              i;
          if (j != 0)
            sy +=
              (noiseArray[x * 1080 + y] - noiseArray[(x + i) * 1080 + y + j]) /
              j;
        }
      }
      return [-sy, sx];
    };

    // if (counter % 10 === 0) {
    //   oldCache = wind.getNormalizedMap();
    // wind.next();
    // }
    // wind.next();
    // iterate through the sprites and update their position
    for (let i = 0; i < drops.length; i++) {
      const dude = drops[i];
      let [vx, vy] = getWind(dude.position.x, dude.position.y);
      const norm = Math.max(Math.sqrt(vx * vx + vy * vy), 0.000001);
      dude.position.set(
        dude.position.x + vx / norm,
        dude.position.y + vy / norm
      );
      dude.alpha = dude.alpha * 0.999;
      dude.scale.set(dude.scale.x * 0.999);
    }

    for (let i = 0; i < 1920; i++) {
      for (let j = 0; j < 1080; j++) {
        const noise = noiseArray[i * 1080 + j];
        // if (noise % 9 === 0 && noise !== 0) {
        //   uArray[(i * 1920 + j) * 4] = 255;
        //   uArray[(i * 1920 + j) * 4 + 1] = 255;
        //   uArray[(i * 1920 + j) * 4 + 2] = 255;
        // } else {
        //   uArray[(i * 1920 + j) * 4] = 0;
        //   uArray[(i * 1920 + j) * 4 + 1] = 0;
        //   uArray[(i * 1920 + j) * 4 + 2] = 0;
        // }
        uArray[(i * 1920 + j) * 4] = colorCache[noise][0];
        uArray[(i * 1920 + j) * 4 + 1] = colorCache[noise][1];
        uArray[(i * 1920 + j) * 4 + 2] = colorCache[noise][2];
        uArray[(i * 1920 + j) * 4 + 3] = 255;
      }
    }

    texture.update();
    counter++;

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
