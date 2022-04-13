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

const MAX_CIRCLE_CNT = 2500,
  MIN_CIRCLE_CNT = 100;
//const MAX_VERTEX_CNT = 30,
// MIN_VERTEX_CNT = 3;
const BG_OPACITY = 0.3;

let circleCnt = 2500,
  vertexCnt = 30;

function getCenterByTheta(theta, time, scale) {
  const direction = [Math.cos(theta), Math.sin(theta)];
  const distance = 0.6 + 0.2 * Math.cos(theta * 6 + Math.cos(theta * 8 + time));
  const circleCenter = direction
    .map((v) => v * distance * scale)
    .map((v, i) => v + (i == 0 ? 640 : 360));
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
    width: 1280,
    height: 720,
  });

  const circles = [];
  let counter = 0;
  const scale = 640;

  const particles = new PIXI.ParticleContainer(MAX_CIRCLE_CNT, {
    position: true,
    uvs: false,
    vertices: true,
    rotation: false,
    tint: true,
  });
  app.stage.addChild(particles);

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
    width: 1280,
    height: 720,
  });
  camera.start();

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
  });

  return () => {
    camera.stop();
    app.destroy();
  };
}
