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

// class Wind {
//     windMap = null;
//     width = 1081;
//     height = 1080;
//     maxWind = 10000;
//     kernel = 1081;
//     subStep = 3;
//     centroids = 2;
//     alpha = 0.95;
//     iterations = 0;
//     kernelCache = new Float32Array(this.kernel * this.kernel)
//     windsCache = Array(this.width).fill(0).map(() => Array(this.height).fill([0, 0]));

//     buildKernel() {
//         for (let m = 0; m < this.kernel; m++) {
//             for (let n = 0; n < this.kernel; n++) {
//                 const x = Math.floor(m);
//                 const y = Math.floor(n);
//                 if (x < 0 || x >= this.kernel || y < 0 || y >= this.kernel) continue;
//                 this.kernelCache[x * this.kernel + y] =
//                     (1 / ((this.kernel / 8) * Math.sqrt(2 * Math.PI))) *
//                     Math.exp(-((m - this.kernel / 2) * (m - this.kernel / 2) + (n - this.kernel / 2) * (n - this.kernel / 2)) / ((this.kernel * this.kernel) / 32));
//             }
//         }
//     }

//     applyCent(cent) {
//         for (let [i, j] of cent) {
//             const factor = Math.random() * this.maxWind;
//             for (let m = -this.kernel / 2; m < this.kernel / 2; m++) {
//                 for (let n = -this.kernel / 2; n < this.kernel / 2; n++) {
//                     const x = Math.floor(i + m);
//                     const y = Math.floor(j + n);
//                     if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
//                     this.windMap[x * this.height + y] += factor * this.kernelCache[Math.floor(m + this.kernel / 2) * this.kernel + Math.floor(n + this.kernel / 2)]
//                 }
//             }
//         }
//     }

//     next() {
//         if (this.windMap) {
//             this.windMap = this.windMap.map(x => x * this.alpha);
//         } else {
//             this.windMap = new Float32Array(this.width * this.height);
//         }

//         if (this.iterations % 6 == 0) {
//             const cent = Array(this.centroids)
//                 .fill(0)
//                 .map(() => [Math.random() * this.width, Math.random() * this.height]);

//             this.applyCent(cent);
//         }


//         this.iterations += 1;
//     }

//     getWind(x, y) {
//         if (!this.windMap) this.next();
//         if (x >= this.width) x = this.width - 1;
//         if (y >= this.height) y = this.height - 1;
//         if (x < 0) x = 0;
//         if (y < 0) y = 0;
//         x = Math.floor(x);
//         y = Math.floor(y);
//         let sx = 0,
//             sy = 0;
//         //let counterX = 0,
//         // counterY = 0;
//         for (let i = -3; i <= 3; i++) {
//             for (let j = -3; j <= 3; j++) {
//                 if (
//                     x + i < 0 ||
//                     x + i >= this.width ||
//                     y + j < 0 ||
//                     y + j >= this.height
//                 )
//                     continue;
//                 // if (i != 0) counterX++;
//                 // if (j != 0) counterY++;
//                 if (i != 0) sx += (this.windMap[x * this.height + y] - this.windMap[(x + i) * this.height + y + j]) / i;
//                 if (j != 0) sy += (this.windMap[x * this.height + y] - this.windMap[(x + i) * this.height + y + j]) / j;
//             }
//         }
//         return [-sy, sx];
//     }

//     getWinds() {
//         return Array(this.width).fill(0).map((_, i) => Array(this.height).fill(0).map((_, j) => this.getWind(i, j)))
//     }
// }

// const wind = new Wind()
// wind.buildKernel()
// function runWind() {
//     wind.next()
//     setTimeout(runWind, 1)
// }

const worker = new Worker('./server.js')

contextBridge.exposeInMainWorld('GlobalWind', {
    getWind: (x, y) => new Promise((res) => {
        const cbk = ({ data }) => {
            if (data.type === 'wind-data') {
                worker.removeEventListener('message', cbk)
                res(data.data)
            }
        }
        worker.addEventListener('message', cbk)
        worker.postMessage({ type: 'wind-data', args: [x, y] })
    }),
    getWinds: (args) => new Promise((res) => {
        const cbk = ({ data }) => {
            if (data.type === 'winds-data') {
                worker.removeEventListener('message', cbk)
                res(data.data)
            }
        }
        worker.addEventListener('message', cbk)
        worker.postMessage({ type: 'winds-data', args })
    }),
    applyCent: (x, y) => new Promise((res) => {
        const cbk = ({ data }) => {
            if (data.type === 'apply-cent') {
                worker.removeEventListener('message', cbk)
                res(data.data)
            }
        }
        worker.addEventListener('message', cbk)
        worker.postMessage({ type: 'apply-cent', args: [x, y] })
    }),
})

// runWind()