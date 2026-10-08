class CapeExporter {
    static exportBetterCapesStrip(frames, width = 64, height = 32) {
        if (!frames || frames.length === 0) {
            alert("Pehle koi GIF ya Image load karein!");
            return;
        }

        const totalFrames = frames.length;
        const stripCanvas = document.createElement('canvas');
        
        // Better Capes Mod layout: Vertical Strip (Width x (Height * Total Frames))
        stripCanvas.width = width;
        stripCanvas.height = height * totalFrames;
        const ctx = stripCanvas.getContext('2d');
        ctx.clearRect(0, 0, stripCanvas.width, stripCanvas.height);

        // Stack every decoded frame vertically
        frames.forEach((frame, index) => {
            ctx.drawImage(frame, 0, index * height, width, height);
        });

        // Trigger Instant Download
        const link = document.createElement('a');
        link.download = `animated_cape_strip_${Date.now()}.png`;
        link.href = stripCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

window.CapeExporter = CapeExporter;