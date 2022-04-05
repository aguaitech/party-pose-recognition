import { POSE_CARTOON_CONNECTIONS, POSE_LEFT_EAR, POSE_LEFT_EYE, POSE_NOSE, POSE_RIGHT_EAR, POSE_RIGHT_EYE } from '@/core/constant';
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors } from '@mediapipe/drawing_utils'
import seedrandom from 'seedrandom';

/**
 * 
 * @param {import("@tensorflow-models/posenet").Keypoint} lear 
 * @param {import("@tensorflow-models/posenet").Keypoint} rear 
 * @param {import("@tensorflow-models/posenet").Keypoint} nose 
 * @param {{position:{x:number,y:number}}[]} keypoints 
 * @param {number} avatarWidth 
 * @param {number} targetHeight 
 * @returns {{x:number,y:number,visibility:1}[]}
 */
function normalizePoints (lear, rear, nose, keypoints, avatarWidth, targetHeight, canvasWidth, canvasHeight) {
  const scale = Math.min(1 / 3, Math.abs(avatarWidth / (rear.position.x - lear.position.x)))
  const yOffset = targetHeight - nose.position.y
  return keypoints.map(({ position }) => ({ x: ((position.x - nose.position.x) * scale + nose.position.x) / canvasWidth, y: ((position.y - nose.position.y) * scale + nose.position.y + yOffset) / canvasHeight, visibility: 1 })
  )
}

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
          maxDetections: 64,
        });
        let endTime = Date.now();
        $Vue.fpsCount = Math.round(1000 / (endTime - startTime));
        $Vue.peopleCount = poses.length;
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        const myrng = new seedrandom(666)

        for (let pose of poses) {
          const hue = Math.round(myrng.quick() * 360)
          const color = `hsl(${hue},100%,50%)`

          let nose = pose.keypoints[POSE_NOSE]
          const leye = pose.keypoints[POSE_LEFT_EYE]
          const reye = pose.keypoints[POSE_RIGHT_EYE]
          let lear = pose.keypoints[POSE_LEFT_EAR]
          let rear = pose.keypoints[POSE_RIGHT_EAR]

          if (nose.score < 0.5) {
            nose = { position: { x: 0, y: 0 }, score: 0 }
            if (leye.score + reye.score >= 1) {
              nose.position.x = (leye.position.x + reye.position.x) / 2
              nose.position.y = (leye.position.y + reye.position.y) / 2
              nose.score = (leye.score + reye.score) / 2
            } else {
              if (lear.score + rear.score >= 1) {
                nose.position.x = (lear.position.x + rear.position.x) / 2
                nose.position.y = (lear.position.y + rear.position.y) / 2
                nose.score = (lear.score + rear.score) / 2
              }
            }
          }

          if (lear.score < 0.5) {
            lear = { position: { x: 0, y: 0 }, score: 0 }
            if (leye.score + nose.score >= 1) {
              lear.position.x = 2 * leye.position.x - nose.position.x
              lear.position.y = leye.position.y - reye.position.y + nose.position.y
              lear.score = (leye.score + nose.score) / 2
            }
          }

          if (rear.score < 0.5) {
            rear = { position: { x: 0, y: 0 }, score: 0 }
            if (reye.score + nose.score >= 1) {
              rear.position.x = 2 * reye.position.x - nose.position.x
              rear.position.y = reye.position.y - leye.position.y + nose.position.y
              rear.score = (reye.score + nose.score) / 2
            }
          }

          if (nose.score >= 0.5 && lear.score >= 0.5 && rear.score >= 0.5) {
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = canvasElement.width
            tempCanvas.height = canvasElement.height
            const tempCtx = tempCanvas.getContext('2d')

            tempCtx.save()

            tempCtx.fillStyle = '#ff0000'
            tempCtx.beginPath()
            tempCtx.ellipse(nose.position.x, canvasElement.height / 2, 100 / 2, 130 / 2, 0, 0, 2 * Math.PI)
            tempCtx.closePath()
            tempCtx.fill()

            tempCtx.globalCompositeOperation = 'source-in'
            tempCtx.drawImage(videoElement, lear.position.x, lear.position.y - (rear.position.x - lear.position.x) * 1.3 / 2, rear.position.x - lear.position.x, (rear.position.x - lear.position.x) * 1.3, nose.position.x - 50, canvasElement.height / 2 - 130 / 2, 100, 130)

            tempCtx.globalCompositeOperation = 'destination-over'
            drawConnectors(tempCtx, normalizePoints(lear, rear, nose, pose.keypoints, 100, canvasElement.height / 2, canvasElement.width, canvasElement.height), POSE_CARTOON_CONNECTIONS, {
              color,
              lineWidth: 5
            })

            // tempCtx.globalCompositeOperation = 'source-over'

            tempCtx.restore()

            canvasCtx.drawImage(tempCanvas, 0, 0, canvasElement.width, canvasElement.height)
          }
        }
      }
    },
    width: 1280,
    height: 720,
  });
  camera.start();

  return camera.stop.bind(camera)
}