export class Camera {
    constructor(videoElement, options) {
        this.kinect = options.net
        this.options = options
        this.videoElement = videoElement
    }

    // Depth: 512 * 424 * 1, Color: 1920 * 1080 * 4, Infrared: 512 * 424 * 1
    start () {
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
            if (this.options.infraredCanvas) {
                const canvas = document.createElement('canvas')
                canvas.width = 512
                canvas.height = 424
                const ctx = canvas.getContext('2d')
                const imageData = ctx.createImageData(512, 424)
                for (let i = 0; i < s.infrared.buffer.length; i++) {
                    imageData.data.set([s.infrared.buffer[i], s.infrared.buffer[i], s.infrared.buffer[i], s.infrared.buffer[i]], i * 4)
                }
                ctx.putImageData(imageData, 0, 0)
                const infraredCtx = this.options.infraredCanvas.getContext('2d')
                infraredCtx.drawImage(canvas, 0, 0, 1081, 1080)
            }
            if (this.options.depthCanvas) {
                const canvas = document.createElement('canvas')
                canvas.width = 512
                canvas.height = 424
                const ctx = canvas.getContext('2d')
                const imageData = ctx.createImageData(512, 424)
                for (let i = 0; i < s.depth.buffer.length; i++) {
                    imageData.data.set([s.depth.buffer[i], s.depth.buffer[i], s.depth.buffer[i], s.depth.buffer[i]], i * 4)
                }
                ctx.putImageData(imageData, 0, 0)
                const depthCtx = this.options.depthCanvas.getContext('2d')
                depthCtx.drawImage(canvas, 0, 0, 1081, 1080)
            }
            this.options.onFrame && this.options.onFrame(s)
        })
    }

    stop () {
        this.kinect.onupdate(null)
    }
}