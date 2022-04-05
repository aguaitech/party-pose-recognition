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