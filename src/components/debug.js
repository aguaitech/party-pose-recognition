import { KINECT_CONNECTIONS } from "@/core/constant";
import { Camera } from "@/core/camera";
import { drawLandmarks, drawConnectors } from "@mediapipe/drawing_utils";
import seedrandom from "seedrandom";

/**
 *
 * @param {HTMLVideoElement} videoElement
 * @param {HTMLCanvasElement} canvasElement
 * @param {import("@tensorflow-models/posenet").PoseNet} net
 * @param {import("vue").DefineComponent} $Vue
 * @param {string} deviceId
 */
export default function (videoElement, canvasElement, net, $Vue, deviceId) {
  const canvasCtx = canvasElement.getContext("2d");

  const camera = new Camera(videoElement, {
    deviceId,
    net,
    onFrame: async () => {
      if (net) {
        let startTime = Date.now();
        const poses = await net.estimateMultiplePoses(videoElement, {
          // flipHorizontal: true,
          maxDetections: 64,
        });
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(
          videoElement,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        const myrng = new seedrandom(666);

        for (let pose of poses) {
          const hue = Math.round(myrng.quick() * 360);
          const color = `hsl(${hue},100%,50%)`;
          drawConnectors(
            canvasCtx,
            pose.joints.map((point) => ({
              x: point.depthX,
              y: point.depthY,
            })),
            KINECT_CONNECTIONS,
            { color: "#ffffff", lineWidth: 5 }
          );
          drawLandmarks(
            canvasCtx,
            pose.joints.map((point) => ({
              x: point.depthX,
              y: point.depthY,
            })),
            { color, fillColor: color, radius: 5 }
          );


          let endTime = Date.now();
          $Vue.fpsCount = Math.round(1000 / (endTime - startTime));
          $Vue.peopleCount = poses.length;
        }
      }
    },
    width: 1920,
    height: 1080,
  });
  camera.start();

  return camera.stop.bind(camera);
}
