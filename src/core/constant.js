export const POSE_NOSE = 0
export const POSE_LEFT_EYE = 1
export const POSE_RIGHT_EYE = 2
export const POSE_LEFT_EAR = 3
export const POSE_RIGHT_EAR = 4
export const POSE_LEFT_SHOULDER = 5
export const POSE_RIGHT_SHOULDER = 6
export const POSE_LEFT_ELBOW = 7
export const POSE_RIGHT_ELBOW = 8
export const POSE_LEFT_WRIST = 9
export const POSE_RIGHT_WRIST = 10
export const POSE_LEFT_HIP = 11
export const POSE_RIGHT_HIP = 12
export const POSE_LEFT_KNEE = 13
export const POSE_RIGHT_KNEE = 14
export const POSE_LEFT_ANKLE = 15
export const POSE_RIGHT_ANKLE = 16

export const POSE_HEAD_CONNECTIONS = [[3, 1], [1, 0], [0, 2], [2, 4]]

export const POSE_NECK_CONNECTIONS = [[0, 5], [0, 6]]

export const POSE_UPPER_BODY_CONNECTIONS = [[9, 7], [7, 5], [5, 6], [6, 8], [8, 10]]

export const POSE_LOWER_BODY_CONNECTIONS = [[11, 13], [13, 15], [11, 12], [12, 14], [14, 16]]

export const POSE_BODY_CONNECTIONS = [...POSE_UPPER_BODY_CONNECTIONS, ...POSE_LOWER_BODY_CONNECTIONS, [5, 11], [6, 12]]

export const POSE_LEFT_CONNECTIONS = [[3, 1], [1, 0], [0, 5], [9, 7], [7, 5], [11, 13], [13, 15], [5, 11]]

export const POSE_RIGHT_CONNECTIONS = [[0, 2], [2, 4], [0, 6], [6, 8], [8, 10], [12, 14], [14, 16], [6, 12]]

export const POSE_CONNECTIONS = [...POSE_HEAD_CONNECTIONS, ...POSE_NECK_CONNECTIONS, ...POSE_BODY_CONNECTIONS]

export const POSE_CARTOON_CONNECTIONS = [[POSE_NOSE, POSE_LEFT_ANKLE], [POSE_NOSE, POSE_RIGHT_ANKLE], [POSE_LEFT_ANKLE, POSE_RIGHT_ANKLE], [POSE_LEFT_SHOULDER, POSE_LEFT_WRIST], [POSE_RIGHT_SHOULDER, POSE_RIGHT_WRIST]]

export const KINECT_SPINE_BASE = 0
export const KINECT_SPINE_MID = 1
export const KINECT_NECK = 2
export const KINECT_HEAD = 3
export const KINECT_SHOULDER_LEFT = 4
export const KINECT_ELBOW_LEFT = 5
export const KINECT_WRIST_LEFT = 6
export const KINECT_HAND_LEFT = 7
export const KINECT_SHOULDER_RIGHT = 8
export const KINECT_ELBOW_RIGHT = 9
export const KINECT_WRIST_RIGHT = 10
export const KINECT_HAND_RIGHT = 11
export const KINECT_HIP_LEFT = 12
export const KINECT_KNEE_LEFT = 13
export const KINECT_ANKLE_LEFT = 14
export const KINECT_FOOT_LEFT = 15
export const KINECT_HIP_RIGHT = 16
export const KINECT_KNEE_RIGHT = 17
export const KINECT_ANKLE_RIGHT = 18
export const KINECT_FOOT_RIGHT = 19
export const KINECT_SPINE_SHOULDER = 20
export const KINECT_HAND_TIP_LEFT = 21
export const KINECT_THUMB_LEFT = 22
export const KINECT_HAND_TIP_RIGHT = 23
export const KINECT_THUMB_RIGHT = 24

export const KINECT_HEAD_CONNECTIONS = [[3, 2]]

export const KINECT_NECK_CONNECTIONS = [[2, 20]]

export const KINECT_UPPER_BODY_CONNECTIONS = [[21, 7], [7, 6], [22, 6], [6, 5], [5, 4], [4, 20], [20, 1], [20, 8], [8, 9], [9, 10], [10, 11], [11, 23], [10, 24]]

export const KINECT_LOWER_BODY_CONNECTIONS = [[15, 14], [14, 13], [13, 12], [12, 0], [0, 16], [16, 17], [17, 18], [18, 19]]

export const KINECT_BODY_CONNECTIONS = [...KINECT_UPPER_BODY_CONNECTIONS, ...KINECT_LOWER_BODY_CONNECTIONS, [0, 1]]

export const KINECT_LEFT_CONNECTIONS = [[21, 7], [7, 6], [22, 6], [6, 5], [5, 4], [4, 20], [15, 14], [14, 13], [13, 12], [12, 0]]

export const KINECT_RIGHT_CONNECTIONS = [[20, 8], [8, 9], [9, 10], [10, 11], [11, 23], [10, 24], [0, 16], [16, 17], [17, 18], [18, 19]]

export const KINECT_CONNECTIONS = [...KINECT_HEAD_CONNECTIONS, ...KINECT_NECK_CONNECTIONS, ...KINECT_BODY_CONNECTIONS]

export const KINECT_CARTOON_CONNECTIONS = [[KINECT_HEAD, KINECT_FOOT_LEFT], [KINECT_FOOT_LEFT, KINECT_FOOT_RIGHT], [KINECT_HEAD, KINECT_FOOT_RIGHT], [KINECT_SHOULDER_LEFT, KINECT_HAND_LEFT], [KINECT_SHOULDER_RIGHT, KINECT_HAND_RIGHT]]