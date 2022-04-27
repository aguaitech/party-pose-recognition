const { contextBridge } = require('electron');
const Kinect = require('kinect2')

const kinect = new Kinect()
contextBridge.exposeInMainWorld('Kinect', {
    instance: kinect,
    open: kinect.open.bind(kinect),
    on: kinect.on.bind(kinect),
    removeAllListeners: kinect.removeAllListeners.bind(kinect),
    close: kinect.close.bind(kinect),
    openColorReader: kinect.openColorReader.bind(kinect),
    colorFrameCallback: kinect.colorFrameCallback.bind(kinect),
    closeColorReader: kinect.closeColorReader.bind(kinect),
    openInfraredReader: kinect.openInfraredReader.bind(kinect),
    infraredFrameCallback: kinect.infraredFrameCallback.bind(kinect),
    closeInfraredReader: kinect.closeInfraredReader.bind(kinect),
    openLongExposureInfraredReader: kinect.openLongExposureInfraredReader.bind(kinect),
    longExposureInfraredFrameCallback: kinect.longExposureInfraredFrameCallback.bind(kinect),
    closeLongExposureInfraredReader: kinect.closeLongExposureInfraredReader.bind(kinect),
    openDepthReader: kinect.openDepthReader.bind(kinect),
    depthFrameCallback: kinect.depthFrameCallback.bind(kinect),
    closeDepthReader: kinect.closeDepthReader.bind(kinect),
    openRawDepthReader: kinect.openRawDepthReader.bind(kinect),
    rawDepthFrameCallback: kinect.rawDepthFrameCallback.bind(kinect),
    closeRawDepthReader: kinect.closeRawDepthReader.bind(kinect),
    openBodyReader: kinect.openBodyReader.bind(kinect),
    bodyFrameCallback: kinect.bodyFrameCallback.bind(kinect),
    closeBodyReader: kinect.closeBodyReader.bind(kinect),
    openMultiSourceReader: kinect.openMultiSourceReader.bind(kinect),
    closeMultiSourceReader: kinect.closeMultiSourceReader.bind(kinect),
    multiSourceFrameCallback: kinect.multiSourceFrameCallback.bind(kinect),
    trackPixelsForBodyIndices: kinect.trackPixelsForBodyIndices.bind(kinect),
    FrameType: Kinect.FrameType,
    JointType: Kinect.JointType,
    HandState: Kinect.HandState,
    TrackingState: Kinect.TrackingState
})