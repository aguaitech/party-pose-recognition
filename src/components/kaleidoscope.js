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
    this.pixiApp = pixiApp;
    this.offsetRotation = 0.0;
    this.offsetScale = 1.0;
    this.offsetX = 0.0;
    this.offsetY = 0.0;
    this.radius = window.innerWidth / 2;
    this.slices = 12;
    this.zoom = 1.0;
    this.posX = 1081 / 2;
    this.posY = 1080 / 2;
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
  }

  draw() {
    let mainContainer = new PIXI.Container();
    mainContainer.interactive = true;
    // mainContainer.mousemove = e => {
    //     const {x,y} = e.data.global;
    //     this.mouseX = x;
    //     this.mouseY = y;
    // }
    for (let i = 0; i < this.slices; i++) {
      let arc = new PIXI.Graphics();
      let spriteTileArc = new PIXI.TilingSprite(this.image, 1082 * 2, 1080 * 2);
      const currentStep = this.step * i + 1;
      arc.beginFill("0x000000");
      arc.moveTo(this.posX, this.posY);
      arc.arc(
        this.posX,
        this.posY,
        this.radius * 1.3,
        -0.5 * this.step,
        0.5 * this.step
      );
      arc.endFill();
      spriteTileArc.mask = arc;
      var container = new PIXI.Container();
      container.addChild(arc);
      container.addChild(spriteTileArc);
      container.pivot.x = this.posX;
      container.pivot.y = this.posY;
      container.rotation = -currentStep;
      container.scale.x = i % 2 ? 1 : -1;
      this.spriteTiles.push(spriteTileArc);
      this.arcs.push(arc);
      this.containers.push(container);
      mainContainer.addChild(container);
    }
    mainContainer.x = this.posX;
    mainContainer.y = this.posY;
    this.pixiApp.stage.addChild(mainContainer);

    this.pixiApp.ticker.add(() => {
      this.count += this.speed;
      for (let i = 0; i < this.spriteTiles.length; i++) {
        if (this.interactiveMode) {
          // this.spriteTiles[i].tilePosition.x = this.mouseX + Math.sin(this.count);
          this.spriteTiles[i].tilePosition.x = this.mouseX + this.count;
          // this.spriteTiles[i].tilePosition.y = this.mouseY + Math.cos(this.count);
          this.spriteTiles[i].tilePosition.y = this.mouseY + this.count;
          // this.mouseX = 0;
          // this.mouseY = 0;
        } else {
          this.spriteTiles[i].tilePosition.x += Math.sin(this.count);
          this.spriteTiles[i].tilePosition.y += Math.cos(this.count);
        }
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
  updateMousePosition(dx, dy) {
    this.mouseX += dx;
    this.mouseY += dy;
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

  const movementSpeed = 0.05;
  let redSquare = null;
  let mouseCoords = null;
  let scope = new Kaleidoscope(app);

  scope.draw();

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

        let filterPoses = poses.filter((pose) => pose.score > 0.3);
        const baseSpeed = 0.2 + 2 * filterPoses.length;
        scope.setBaseSpeed(baseSpeed);
        if (!filterPoses.length || !filterPoses[0][POSE_RIGHT_WRIST]) {
          redSquare = null;
          mouseCoords = null;
        } else {
          let rwrist = filterPoses[0][POSE_RIGHT_WRIST];
          if (!redSquare) {
            redSquare = new PIXI.Sprite(PIXI.Texture.WHITE);
            redSquare.position.set(0, 0);
            redSquare.width = 100;
            redSquare.height = 100;
            redSquare.tint = 0xff0000;
            redSquare.acceleration = new PIXI.Point(0);
            redSquare.mass = 1;
            mouseCoords = new PIXI.Point(rwrist.position.x, rwrist.position.y);
          }
          mouseCoords.x = rwrist.position.x;
          mouseCoords.y = rwrist.position.y;
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
      scope.updateMousePosition(redSquare.x, redSquare.y);
      console.log(redSquare.x, redSquare.y);
    }
    console.log("233");
  });

  // create a texture from
  return () => {
    camera.stop();
    app.destroy();
  };
}
