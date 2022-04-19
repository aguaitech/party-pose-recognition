import { POSE_CONNECTIONS } from '@/core/constant';
import { Camera } from "@mediapipe/camera_utils";
import { drawLandmarks, drawConnectors } from '@mediapipe/drawing_utils'
import seedrandom from 'seedrandom';

/**
 * 
 * @param {HTMLVideoElement} videoElement 
 * @param {HTMLCanvasElement} canvasElement 
 * @param {import("@tensorflow-models/posenet").PoseNet} net 
 * @param {import("vue").DefineComponent} $Vue 
 */
export default function (videoElement, canvasElement, net, $Vue) {
  const canvasCtx = canvasElement.getContext("2d");

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      if (net) {
        let startTime = Date.now();
        const poses = await net.estimateMultiplePoses(videoElement, {
          // flipHorizontal: true,
          maxDetections: 64,
        });
        let endTime = Date.now();
        $Vue.fpsCount = Math.round(1000 / (endTime - startTime));
        $Vue.peopleCount = poses.length;
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(
          videoElement,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        const myrng = new seedrandom(666)

        let tmp_poses = poses.filter(pose => pose.score > 0.2)

        for (let pose of tmp_poses) {
          const hue = Math.round(myrng.quick() * 360)
          const color = `hsl(${hue},100%,50%)`
          drawConnectors(canvasCtx, [].map(point => ({ x: point.position.x / canvasElement.width, y: point.position.y / canvasElement.height })), POSE_CONNECTIONS, { color: '#ffffff', lineWidth: 5 })
          drawLandmarks(canvasCtx, [pose.keypoints[10]].map(point => ({ x: point.position.x / canvasElement.width, y: point.position.y / canvasElement.height })), { color, fillColor: color, radius: 5 })
        }
      }
    },
    width: 1081,
    height: 1080,
  });
  camera.start();

  return camera.stop.bind(camera)
}