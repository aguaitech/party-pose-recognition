class Wind {
    windMap = null;
    width = 1081;
    height = 1080;
    maxWind = 10000;
    kernel = 1081;
    subStep = 3;
    centroids = 2;
    alpha = 0.95;
    iterations = 0;
    kernelCache = new Float32Array(this.kernel * this.kernel)

    buildKernel() {
        for (let m = 0; m < this.kernel; m++) {
            for (let n = 0; n < this.kernel; n++) {
                const x = Math.floor(m);
                const y = Math.floor(n);
                if (x < 0 || x >= this.kernel || y < 0 || y >= this.kernel) continue;
                this.kernelCache[x * this.kernel + y] =
                    (1 / ((this.kernel / 8) * Math.sqrt(2 * Math.PI))) *
                    Math.exp(-((m - this.kernel / 2) * (m - this.kernel / 2) + (n - this.kernel / 2) * (n - this.kernel / 2)) / ((this.kernel * this.kernel) / 32));
            }
        }
    }

    applyCent(cent) {
        for (let [i, j] of cent) {
            const factor = Math.random() * this.maxWind;
            for (let m = -this.kernel / 2; m < this.kernel / 2; m++) {
                for (let n = -this.kernel / 2; n < this.kernel / 2; n++) {
                    const x = Math.floor(i + m);
                    const y = Math.floor(j + n);
                    if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
                    this.windMap[x * this.height + y] += factor * this.kernelCache[Math.floor(m + this.kernel / 2) * this.kernel + Math.floor(n + this.kernel / 2)]
                }
            }
        }
    }

    next() {
        if (this.windMap) {
            this.windMap = this.windMap.map(x => x * this.alpha);
        } else {
            this.windMap = new Float32Array(this.width * this.height);
        }

        if (this.iterations % 6 == 0) {
            const cent = Array(this.centroids)
                .fill(0)
                .map(() => [Math.random() * this.width, Math.random() * this.height]);

            this.applyCent(cent);
        }


        this.iterations += 1;
    }

    getWind(x, y) {
        if (!this.windMap) this.next();
        if (x >= this.width) x = this.width - 1;
        if (y >= this.height) y = this.height - 1;
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        x = Math.floor(x);
        y = Math.floor(y);
        let sx = 0,
            sy = 0;
        //let counterX = 0,
        // counterY = 0;
        for (let i = -3; i <= 3; i++) {
            for (let j = -3; j <= 3; j++) {
                if (
                    x + i < 0 ||
                    x + i >= this.width ||
                    y + j < 0 ||
                    y + j >= this.height
                )
                    continue;
                // if (i != 0) counterX++;
                // if (j != 0) counterY++;
                if (i != 0) sx += (this.windMap[x * this.height + y] - this.windMap[(x + i) * this.height + y + j]) / i;
                if (j != 0) sy += (this.windMap[x * this.height + y] - this.windMap[(x + i) * this.height + y + j]) / j;
            }
        }
        return [-sy, sx];
    }

    getWinds(args) {
        return args.map(pos => this.getWind(...pos))
    }
}

const wind = new Wind()
wind.buildKernel()
function runWind() {
    wind.next()
    setTimeout(runWind, 1)
}

self.addEventListener('message', ({ data }) => {
    const { type, args } = data
    switch (type) {
        case 'wind-data':
            return self.postMessage({ type: 'wind-data', data: wind.getWind(...args) })
        case 'winds-data':
            return self.postMessage({ type: 'winds-data', data: wind.getWinds(args) })
        case 'apply-cent':
            return self.postMessage({ type: 'apply-cent', data: wind.applyCent(...args) })
    }
})

runWind()