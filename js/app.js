document.addEventListener('DOMContentLoaded', () => {
    const capeGen = new CapeGenerator('capeCanvas');
    let loadedFrames = [];
    let currentFrameIdx = 0;
    let animInterval = null;
    let customBgImg = null;

    const gifUpload = document.getElementById('gifUpload');
    const bgUpload = document.getElementById('bgUpload');
    const bgColor = document.getElementById('bgColor');
    const capeScale = document.getElementById('capeScale');
    const animSpeed = document.getElementById('animSpeed');
    const fpsVal = document.getElementById('fpsVal');
    
    // Download Button Element
    const downloadBtn = document.querySelector('.download-btn') || document.getElementById('downloadBtn');

    updatePreview();

    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Export vertical strip PNG for Better Capes
            CapeExporter.exportBetterCapesStrip(loadedFrames, 64, 32);
        });
    }

    if (capeScale) {
        capeScale.addEventListener('change', (e) => {
            const res = parseInt(e.target.value);
            capeGen.setResolution(res, res / 2);
            updatePreview();
        });
    }

    if (animSpeed) {
        animSpeed.addEventListener('input', (e) => {
            if (fpsVal) fpsVal.textContent = `${e.target.value} ms`;
            startAnimationLoop();
        });
    }

    if (bgColor) {
        bgColor.addEventListener('input', () => updatePreview());
    }

    if (bgUpload) {
        bgUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const img = new Image();
            img.onload = () => {
                customBgImg = img;
                updatePreview();
            };
            img.src = URL.createObjectURL(file);
        });
    }

    if (gifUpload) {
        gifUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                if (file.type === 'image/gif') {
                    loadedFrames = await GifDecoder.decodeGif(file);
                } else {
                    const img = new Image();
                    const url = URL.createObjectURL(file);
                    await new Promise((res, rej) => {
                        img.onload = res;
                        img.onerror = rej;
                        img.src = url;
                    });
                    loadedFrames = [img];
                }

                currentFrameIdx = 0;
                startAnimationLoop();
            } catch (err) {
                console.error('GIF Parse Error:', err);
            }
        });
    }

    function startAnimationLoop() {
        if (animInterval) clearInterval(animInterval);
        if (!loadedFrames || loadedFrames.length <= 1) {
            updatePreview();
            return;
        }

        const delay = parseInt(animSpeed ? animSpeed.value : 100) || 100;
        animInterval = setInterval(() => {
            currentFrameIdx = (currentFrameIdx + 1) % loadedFrames.length;
            updatePreview();
        }, delay);
    }

    function updatePreview() {
        const activeFrame = loadedFrames[currentFrameIdx] || null;
        capeGen.renderFrame(activeFrame, {
            bgColor: bgColor ? bgColor.value : '#ffffff',
            bgImage: customBgImg
        });

        if (window.update3dCapeTexture) {
            window.update3dCapeTexture(capeGen.canvas);
        }
    }
});