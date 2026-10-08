class GifAnimationEngine {
    constructor() {
        this.frames = [];
        this.currentFrame = 0;
        this.timer = null;
        this.delay = 100;
        this.isPlaying = false;
    }

    setFrames(frameImages, customDelay = 100) {
        this.stop();
        this.frames = frameImages;
        this.delay = customDelay;
        this.currentFrame = 0;
        this.startLoop();
    }

    startLoop() {
        this.stop();
        if (!this.frames || this.frames.length === 0) return;

        this.isPlaying = true;
        this.timer = setInterval(() => {
            this.step();
        }, this.delay);
    }

    step() {
        if (!this.frames || this.frames.length === 0) return;

        const currentSource = this.frames[this.currentFrame];

        if (window.capeGen) {
            const bgVal = document.getElementById('bgColor')?.value || '#ffffff';
            window.capeGen.renderFrame(currentSource, {
                bgColor: bgVal,
                bgImage: window.customBgImg || null
            });
        }

        if (typeof window.update3dCapeTexture === 'function' && window.capeGen) {
            window.update3dCapeTexture(window.capeGen.canvas);
        }

        if (this.frames.length > 1) {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        }
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isPlaying = false;
    }
}

window.gifEngine = new GifAnimationEngine();