export class Camera {
    constructor(videoElement, options) {
        this.kinect = options.net
        this.options = options
        this.videoElement = videoElement
    }

    // Depth: 512 * 424 * 1, Color: 1920 * 1080 * 4, Infrared: 512 * 424 * 1
    start() {
        this.kinect.onupdate((s) => {
            if (this.videoElement) {
                const canvas = document.createElement('canvas')
                canvas.width = 1920
                canvas.height = 1080
                const ctx = canvas.getContext('2d')
                const imageData = ctx.createImageData(1920, 1080)
                imageData.data.set(s.color.buffer)
                ctx.putImageData(imageData, 0, 0)
                const videoCtx = this.videoElement.getContext('2d')
                videoCtx.drawImage(canvas, 0, 0, 1081, 1080)
            }
            this.options.onFrame && this.options.onFrame(s)
        })
    }

    stop() {
        this.kinect.onupdate(null)
    }
}