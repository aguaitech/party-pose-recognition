import { Camera } from "@mediapipe/camera_utils";
import { POSE_RIGHT_WRIST } from "@/core/constant";
import * as PIXI from "pixi.js";

function distanceBetweenTwoPoints(p1, p2) {
  const a = p1.x - p2.x;
  const b = p1.y - p2.y;

  return Math.hypot(a, b);
}

class Kaleidoscope {
  constructor(pixiApp) {
    this.HALF_PI = Math.PI / 2;
    this.TWO_PI = Math.PI * 2;
    this.ANGLE = Math.PI / 3;
    this.sq3 = Math.sqrt(3);
    // triangle radius arrays for rotation
    this.arrs = [
      0,
      -1 * this.ANGLE,
      -4 * this.ANGLE,
      -3 * this.ANGLE,
      -2 * this.ANGLE,
      -5 * this.ANGLE,
    ];
    this.pixiApp = pixiApp;
    this.offsetRotation = 0.0;
    this.offsetScale = 1.0;
    this.offsetX = 0.0;
    this.offsetY = 0.0;
    this.radius = window.innerWidth / 2;
    this.slices = 12;
    this.zoom = 1.0;
    this.width = 1081;
    this.height = 1080;
    this.triangleSize = 200;
    this.cols = Math.ceil(this.width / (this.triangleSize / 2)) + 1;
    this.rows = Math.ceil(this.height / ((this.triangleSize / 2) * this.sq3));
    this.centerDeltaY = (this.triangleSize / 2) * this.sq3;
    this.posX = this.width / 2;
    this.posY = this.height / 2;
    this.step = this.TWO_PI / this.slices;
    this.arcs = [];
    this.spriteTiles = [];
    this.containers = [];
    this.image = PIXI.Texture.from("NYC Skyline.jpeg");
    this.count = 0;
    this.interactiveMode = true;
    this.mouseX = 0;
    this.mouseY = 0;
    this.speed = 0.1;
    this.mouses = [];
  }

  draw() {
    let mainContainer = new PIXI.Container();
    mainContainer.interactive = true;
    // mainContainer.mousemove = e => {
    //     const {x,y} = e.data.global;
    //     this.mouseX = x;
    //     this.mouseY = y;
    // }
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        let img = new PIXI.TilingSprite(
          this.image,
          this.image.width * 1,
          this.image.height * 1
        );
        img.anchor.set(0.5, 0.5);
        img.scale.x = j % 2 === 0 ? 1 : -1;
        img.x = 0;
        img.y = ((this.triangleSize * (2 - (j % 2))) / 6) * this.sq3;
        img.rotation = this.arrs[j % 6];
        let arc = new PIXI.Graphics();
        arc.beginFill("0x000000");
        if ((0 + j) % 2 === 0) {
          arc.moveTo(0, 0);
          arc.lineTo(
            -this.triangleSize / 2,
            (this.sq3 * this.triangleSize) / 2
          );
          arc.lineTo(this.triangleSize / 2, (this.sq3 * this.triangleSize) / 2);
          arc.lineTo(0, 0);
        } else {
          arc.moveTo(0, (this.sq3 * this.triangleSize) / 2);
          arc.lineTo(-this.triangleSize / 2, 0);
          arc.lineTo(this.triangleSize / 2, 0);
          arc.lineTo(0, (this.sq3 * this.triangleSize) / 2);
          // arc.moveTo(img.x, (i+1) * this.sq3 * this.triangleSize / 2);
          // arc.lineTo(img.x - this.triangleSize / 2, i* this.sq3 * this.triangleSize / 2);
          // arc.lineTo(img.x + this.triangleSize / 2, i * this.sq3 * this.triangleSize / 2);
          // arc.lineTo(img.x, (i+1) * this.sq3 * this.triangleSize / 2);
        }
        arc.endFill();
        img.mask = arc;

        let container = new PIXI.Container();
        container.addChild(arc);
        container.addChild(img);
        container.y = (i * this.sq3 * this.triangleSize) / 2;
        container.x = (j * this.triangleSize) / 2;
        // container.alpha = 0.4;
        if (i % 2 == 1) {
          container.y = ((i + 1) * this.sq3 * this.triangleSize) / 2;

          container.scale.y = -1;
        }

        mainContainer.addChild(container);
        this.spriteTiles.push(img);
        this.containers.push(container);
      }
    }
    this.pixiApp.stage.addChild(mainContainer);

    this.pixiApp.ticker.add(() => {
      this.count += this.speed;
      for (let i = 0; i < this.spriteTiles.length; i++) {
        this.spriteTiles[i].tilePosition.x = this.mouseX + this.count;
        this.spriteTiles[i].tilePosition.y = this.mouseY + this.count;

        let v = 0.0;
        console.log(this.mouses);
        for (let j = 0; j < this.mouses.length; j++) {
          v = Math.max(
            v,
            1 -
              Math.sqrt(
                Math.pow(this.mouses[j].x - this.spriteTiles[i].parent.x, 2) +
                  Math.pow(this.mouses[j].y - this.spriteTiles[i].parent.y, 2)
              ) /
                Math.sqrt(Math.pow(this.width, 2) + Math.pow(this.height, 2))
          );
        }
        if (!this.mouses.length) v = 1;
        else {
          v = v * v;
          if (v > 0.2) v = v * v * v;
          else v = 0.1;
        }
        this.spriteTiles[i].alpha = v;
      }
    });
  }

  toggleInteractiveMode() {
    console.log("toggleinteractive", this.interactiveMode);
    this.interactiveMode = !this.interactiveMode;
  }

  setBaseSpeed(speed) {
    this.speed = speed;
  }
  updateMousePosition(dx, dy, mouses) {
    this.mouseX = dx;
    this.mouseY = dy;
    this.mouses = mouses;
  }
}

/**
 *
 * @param {HTMLVideoElement} videoElement
 * @param {HTMLCanvasElement} canvasElement
 * @param {import("@tensorflow-models/posenet").PoseNet} net
 * @param {import("vue").DefineComponent} $Vue
 */
export default function (videoElement, canvasElement, net, $Vue, deviceId) {
  // const canvasCtx = canvasElement.getContext("2d");

  const app = new PIXI.Application({
    view: canvasElement,
    width: 1081,
    height: 1080,
  });

  const movementSpeed = 0.05;
  let redSquare = null;
  let mouseCoords = null;
  let mouses = [];
  let scope = new Kaleidoscope(app);

  scope.draw();

  const camera = new Camera(videoElement, {
    deviceId,
    onFrame: async () => {
      if (net) {
        let startTime = Date.now();
        const poses = await net.estimateMultiplePoses(videoElement, {
          maxDetections: 64,
        });
        let endTime = Date.now();
        $Vue.fpsCount = Math.round(1000 / (endTime - startTime));
        $Vue.peopleCount = poses.length;

        let filterPoses = poses.filter((pose) => pose.score > 0.3);
        const baseSpeed = 0.2 + 2 * filterPoses.length;
        scope.setBaseSpeed(baseSpeed);
        if (
          !filterPoses.length ||
          !filterPoses[0].keypoints[POSE_RIGHT_WRIST]
        ) {
          redSquare = null;
          mouseCoords = null;
          mouses = [];
        } else {
          let rwrist = filterPoses[0].keypoints[POSE_RIGHT_WRIST];

          if (rwrist.score > 0.3) {
            if (!redSquare) {
              redSquare = new PIXI.Sprite(PIXI.Texture.WHITE);
              redSquare.position.set(0, 0);
              redSquare.width = 100;
              redSquare.height = 100;
              redSquare.tint = "0xFF0000";
              redSquare.acceleration = new PIXI.Point(0);
              redSquare.mass = 1;
              mouseCoords = new PIXI.Point(
                rwrist.position.x,
                rwrist.position.y
              );
              mouseCoords.x = rwrist.position.x;
              mouseCoords.y = rwrist.position.y;
            }
            mouses = filterPoses
              // .filter((pose) => pose.keypoints[POSE_RIGHT_WRIST].score > 0.2)
              .map((pose) => pose.keypoints[POSE_RIGHT_WRIST].position);
          }
        }
      }
    },
    width: 1081,
    height: 1080,
  });
  camera.start();

  app.ticker.add((delta) => {
    if (redSquare && mouseCoords) {
      redSquare.acceleration.set(
        redSquare.acceleration.x * 0.99,
        redSquare.acceleration.y * 0.99
      );
      if (
        app.screen.width > mouseCoords.x ||
        mouseCoords.x > 0 ||
        app.screen.height > mouseCoords.y ||
        mouseCoords.y > 0
      ) {
        // Get the red square's center point
        const redSquareCenterPosition = new PIXI.Point(
          redSquare.x + redSquare.width * 0.5,
          redSquare.y + redSquare.height * 0.5
        );

        const toMouseDirection = new PIXI.Point(
          mouseCoords.x - redSquareCenterPosition.x,
          mouseCoords.y - redSquareCenterPosition.y
        );

        // Use the above to figure out the angle that direction has
        const angleToMouse = Math.atan2(toMouseDirection.y, toMouseDirection.x);

        const distMouseRedSquare = distanceBetweenTwoPoints(
          mouseCoords,
          redSquareCenterPosition
        );

        const redSpeed = distMouseRedSquare * movementSpeed;

        // Calculate the acceleration of the red square
        redSquare.acceleration.set(
          Math.cos(angleToMouse) * redSpeed,
          Math.sin(angleToMouse) * redSpeed
        );
      }

      redSquare.x += redSquare.acceleration.x * delta;
      redSquare.y += redSquare.acceleration.y * delta;
      scope.updateMousePosition(redSquare.x, redSquare.y, [
        ...mouses,
        { x: 0, y: 0 },
      ]);
    }
  });

  // create a texture from
  return () => {
    camera.stop();
    app.destroy();
  };
}
