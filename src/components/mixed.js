// import {
//   POSE_CARTOON_CONNECTIONS,
//   POSE_LEFT_EAR,
//   POSE_LEFT_EYE,
//   POSE_NOSE,
//   POSE_RIGHT_EAR,
//   POSE_RIGHT_EYE,
// } from "@/core/constant";
import { Camera } from "@/core/camera";
// import { drawConnectors } from "@mediapipe/drawing_utils";
// import seedrandom from "seedrandom";
import * as PIXI from "pixi.js";
import color from "color";
import { POSE_LEFT_WRIST, POSE_RIGHT_WRIST } from "@/core/constant";
const createREGL = require('regl')

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

let numCircleDivisions = 10;
const numCircleInstances = 10000;




let circleInstanceGeometry = Array.from(Array(numCircleDivisions + 1).keys()).map(i => {
  var theta = Math.PI * 2 * i / numCircleDivisions;
  return [Math.cos(theta), Math.sin(theta)];

});

let instanceTheta = Array.from(Array(numCircleInstances).keys()).map(i => 
  i / numCircleInstances * 2 * Math.PI
);

let coords = Array.from(Array(8).keys()).map( () => 10);
let targetAlpha = Array.from(Array(4).keys()).map(() => 0.0);

let peopleCount = 0;



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
    width: 1081,
    height: 1080,
  });

  let hightestLeftHand = 0;

  const sticks = [];

  // let counter = 0;

  const reglOptions = {
    extensions: ['ANGLE_instanced_arrays'],
    attributes: { antialias: true, depth: false}
  };
  const dpi = 1.5;
  const canvas = document.createElement("canvas")

  const regl = createREGL(Object.assign({}, reglOptions, {pixelRatio: dpi, canvas: canvas}));
  canvas.value = regl;
  canvas.__reglConfig = {dpi, reglOptions}

  canvas.width = 1081;
  canvas.height = 1080;
  canvas.style.position = 'absolute';
  canvas.style.left = '0';
  document.getElementById("canvas_container").appendChild(canvas);


let draw = () => {regl({
  vert: `
    #define numTextures 4
    precision highp float;
    attribute float theta;
    attribute vec2 circlePoint;
    varying vec3 vColor;
    varying float aa;
    uniform vec2 aspectRatio;
    uniform float time;
    uniform vec4 otP;
    uniform vec4 tfP;
    uniform vec4 ta;
    uniform int num;
    const float PI = 3.1415926535;
    void main () {
      // Use lots of sines and cosines to place the circles
      vec2 circleCenter = vec2(cos(theta), sin(theta))
        * (0.6 + 0.2 * cos(theta * 6.0 + cos(theta * 8.0 + time)));

      vec2 c1 = otP.xy;
      vec2 c2 = otP.zw;
      vec2 c3 = tfP.xy;
      vec2 c4 = tfP.zw;
      vec4 t = ta;
      if(num == 0){
        c1 = circleCenter;
        t.x = 1.0;
      }
      c1 = c1 - circleCenter;
      c2 = c2 - circleCenter;
      c3 = c3 - circleCenter;
      c4 = c4 - circleCenter;
      if (length(c1) > length(c2)) {
        c1 = c2;
        t.x = t.y;
      }
      if(length(c3) > length(c4)){
        c3 = c4;
        t.z = t.w;
      }
      if(length(c1) > length(c3)) {
        c1 = c3;
        t.x = t.z;
      }
      c1 = c1 * 0.5;
      circleCenter = circleCenter + c1;
      // Modulate the circle sizes around the circle and in time
      float circleSize = 0.2 + 0.12 * cos(theta * 9.0 - time * 2.0);

      vec2 xy = circleCenter + circlePoint * circleSize;

      // Define some pretty colors
      float th = 8.0 * theta + time * 2.0;
      vColor = 0.6 + 0.4 * vec3(
        cos(th),
        cos(th - PI / 3.0),
        cos(th - PI * 2.0 / 3.0)
      );
      aa = t.x;

      gl_Position = vec4(xy / aspectRatio, 0, 1);
    }`,
  frag: `
    precision highp float;
    varying vec3 vColor;
    varying float aa;
    uniform float alpha;
    void main () {
      gl_FragColor = vec4(vColor, alpha * aa);
    }`,
  attributes: {
    // This attribute defines what we draw; we fundamentally draw circle vertices
    circlePoint: circleInstanceGeometry,
    
    // This attribute allows us to compute where we draw each circle. the divisor
    // means we step through one value *per circle*.
    theta: {buffer: instanceTheta, divisor: 1},
  },
  uniforms: {
    // Scale so that it fits in the view whether it's portrait or landscape:
    aspectRatio: ctx => ctx.framebufferWidth > ctx.framebufferHeight ?
      [ctx.framebufferWidth / ctx.framebufferHeight, 1] :
      [1, ctx.framebufferHeight / ctx.framebufferWidth],
    
    time: regl.context('time'),
    
    // Decrease opacity when there are more circles
    alpha: Math.max(0, Math.min(1, 0.15 * 2000 / numCircleInstances)),
    u_textures: [0, 1, 2, 3],
    otP: coords.slice(0, 4),
    tfP: coords.slice(4, 8),
    num: peopleCount,
    ta: targetAlpha,
  },
  blend: {
    // Additive blending
    enable: true,
    func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},  
    equation: {rgb: 'add', alpha: 'add'}
  },
  // GL_LINES are in general *pretty bad*, but they're good for some things
  primitive: 'line strip',
  depth: {enable: false},
  count: numCircleDivisions + 1,
  instances: numCircleInstances,
})() };


  const gap = 30;

  for (let i = 0; i < 1081 / gap; i++) {
    for (let j = 0; j < 1080 / gap; j++) {
      sticks.push(new Stick(i * gap + gap / 2, j * gap + gap / 2));
    }
  }


  let latestNum = 0;

  const camera = new Camera(videoElement, {
    deviceId,
    net,
    onFrame: async () => {
      if (net) {
        let startTime = Date.now();
        const poses = await net.estimateMultiplePoses(videoElement, {
          maxDetections: 64,
        });
        let endTime = Date.now();
        $Vue.fpsCount = Math.round(1000 / (endTime - startTime));
        $Vue.peopleCount = poses.length;

        let filteredPoses = poses.filter(pose => pose.score > 0.3);

        if (latestNum != filteredPoses.length) {
          latestNum = filteredPoses.length;
          if(latestNum) {
            numCircleDivisions = latestNum + 2;
            peopleCount = Math.min(4, latestNum);
          }

          else {
            numCircleDivisions = 10;
            peopleCount = 0;
          }
          circleInstanceGeometry = Array.from(Array(numCircleDivisions + 1).keys()).map(i => {
            var theta = Math.PI * 2 * i / numCircleDivisions;
            return [Math.cos(theta), Math.sin(theta)];
          
          }); 
          instanceTheta = Array.from(Array(numCircleInstances).keys()).map(i => 
            i / numCircleInstances * 2 * Math.PI
          );
        }

        coords = Array.from(Array(8).keys()).map( () => 10 );
        for(let i = 0; i < filteredPoses.length && i < 4; i++) {
          coords[2*i] = filteredPoses[i].keypoints[0].position.x / 1081 * (-2) + 1;
          coords[2*i+1] = filteredPoses[i].keypoints[0].position.y / 1080 * 2 - 1;
          targetAlpha[i] = (1 - filteredPoses[i].keypoints[POSE_RIGHT_WRIST].position.y / 1080) * 0.7 + 0.3;
          // targetAlpha[i] = 1;
        }


        hightestLeftHand = Math.max(...filteredPoses.map(pose => pose.keypoints[POSE_LEFT_WRIST].position.y));

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
    regl.poll();
    regl.clear({ color: [0, 0, 0, 0] });
    // regl.clear({ color: [1, 1, 1, 1] });
    draw();
    wind.next();
    // iterate through the sprites and update their position
    for (let i = 0; i < maggots.length; i++) {
      const dude = maggots[i];
      sticks[i].blow(...wind.getWind(sticks[i].cx, sticks[i].cy));
      dude.alpha = Math.sin((sticks[i].phi / 180) * Math.PI) * (1 - hightestLeftHand / 1081 + 0.2);
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
