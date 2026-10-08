class CapeGenerator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.setResolution(256, 128); // Standard High Quality Resolution
    }

    setResolution(targetWidth, targetHeight) {
        this.width = targetWidth;
        this.height = targetHeight;
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
    }

    renderFrame(imageSource = null, options = {}) {
        const { bgColor = '#ffffff', bgImage = null } = options;
        const w = this.width;
        const h = this.height;

        this.ctx.clearRect(0, 0, w, h);
        
        // High Quality Smooth Interpolation
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // 1. Fill Background
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, w, h);

        // 2. Background Image
        if (bgImage) {
            this.ctx.drawImage(bgImage, 0, 0, w, h);
        }

        if (!imageSource) return;

        // 3. Draw high quality stretched image on cape canvas
        this.ctx.drawImage(imageSource, 0, 0, w, h);
    }
}