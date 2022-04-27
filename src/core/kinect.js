import { KINECT_ANKLE_LEFT, KINECT_ANKLE_RIGHT, KINECT_ELBOW_LEFT, KINECT_ELBOW_RIGHT, KINECT_HEAD, KINECT_HIP_LEFT, KINECT_HIP_RIGHT, KINECT_KNEE_LEFT, KINECT_KNEE_RIGHT, KINECT_SHOULDER_LEFT, KINECT_SHOULDER_RIGHT, KINECT_WRIST_LEFT, KINECT_WRIST_RIGHT } from "./constant";

const kinect = window.Kinect

export default () => {
    if (kinect.open()) {
        // if (kinect.openColorReader()) {
        //     kinect.on('colorFrame', (colorFrame) => {
        //         window.colorFrameCallback && window.colorFrameCallback(bodyFrame)
        //     })
        // }
        // if (kinect.openInfraredReader()) {
        //     kinect.on('infraredFrame', (bodyFrame) => {
        //         window.infraredFrameCallback && window.infraredFrameCallback(bodyFrame)
        //     });
        // }
        // if (kinect.openDepthReader()) {
        //     kinect.on('depthFrame', (bodyFrame) => {
        //         window.depthFrameCallback && window.depthFrameCallback(bodyFrame)
        //     });
        // }
        // if (kinect.openBodyReader()) {
        //     kinect.on('bodyFrame', (bodyFrame) => {
        //         window.bodyFrameCallback && window.bodyFrameCallback(bodyFrame)
        //     });
        // }
        let latestSource = {}
        let extraCbk = null
        let handling = false
        kinect.on('multiSourceFrame', async (source) => {
            latestSource = source
            if (!handling) {
                handling = true
                await (extraCbk && extraCbk(source))
                handling = false
            }
        });
        try {
            kinect.openMultiSourceReader({
                frameTypes: kinect.FrameType.color | kinect.FrameType.infrared | kinect.FrameType.depth | kinect.FrameType.body,
                includeJointFloorData: true
            })
        } catch {
            //ignore
        }
        return {
            dispose() {
                kinect.removeAllListeners()
            },
            estimateMultiplePoses() {
                if (!latestSource || !latestSource.body || !latestSource.body.bodies) {
                    return []
                }
                return latestSource.body.bodies.filter(body => body.tracked).map(body => {
                    body.score = 1
                    body.keypoints = [KINECT_HEAD, KINECT_HEAD, KINECT_HEAD, KINECT_HEAD, KINECT_HEAD, KINECT_SHOULDER_LEFT, KINECT_SHOULDER_RIGHT, KINECT_ELBOW_LEFT, KINECT_ELBOW_RIGHT, KINECT_WRIST_LEFT, KINECT_WRIST_RIGHT, KINECT_HIP_LEFT, KINECT_HIP_RIGHT, KINECT_KNEE_LEFT, KINECT_KNEE_RIGHT, KINECT_ANKLE_LEFT, KINECT_ANKLE_RIGHT].map((i) => body.joints[i]).map((j, i) => {
                        const part = ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'][i]
                        const score = j.trackingState == kinect.TrackingState.notTracked ? 0 : j.trackingState == kinect.TrackingState.inferred ? 0.5 : j.trackingState == kinect.TrackingState.tracked ? 1 : 0
                        const position = { x: (j.depthX) * 1081, y: (j.depthY) * 1080 }
                        return { part, score, position }
                    })
                    return body
                })
            },
            onupdate(cbk) {
                extraCbk = cbk
            }
        }
    }
    return false
}