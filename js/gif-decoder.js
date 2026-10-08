class GifDecoder {
    static async decodeGif(file) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        if (bytes[0] !== 0x47 || bytes[1] !== 0x49 || bytes[2] !== 0x46) {
            throw new Error("Invalid GIF file");
        }

        const width = bytes[6] | (bytes[7] << 8);
        const height = bytes[8] | (bytes[9] << 8);

        let pos = 13;
        const gctFlag = bytes[10] & 0x80;
        const gctSize = gctFlag ? 3 * (1 << ((bytes[10] & 0x07) + 1)) : 0;
        let globalPalette = null;
        if (gctFlag) {
            globalPalette = bytes.subarray(pos, pos + gctSize);
            pos += gctSize;
        }

        const frames = [];
        let transparentIndex = null;
        let disposalMethod = 0;

        // Cumulative Canvas for Transparency
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = width;
        fullCanvas.height = height;
        const fullCtx = fullCanvas.getContext('2d');

        while (pos < bytes.length) {
            const blockType = bytes[pos++];
            if (blockType === 0x21) {
                const extType = bytes[pos++];
                if (extType === 0xF9) {
                    const blockSize = bytes[pos++];
                    const flags = bytes[pos];
                    disposalMethod = (flags >> 2) & 7;
                    transparentIndex = (flags & 0x01) ? bytes[pos + 3] : null;
                    pos += blockSize;
                } else {
                    let subSize = bytes[pos++];
                    while (subSize > 0) {
                        pos += subSize;
                        subSize = bytes[pos++];
                    }
                }
            } else if (blockType === 0x2C) {
                const left = bytes[pos] | (bytes[pos + 1] << 8);
                const top = bytes[pos + 2] | (bytes[pos + 3] << 8);
                const w = bytes[pos + 4] | (bytes[pos + 5] << 8);
                const h = bytes[pos + 6] | (bytes[pos + 7] << 8);
                pos += 8;

                const localFlags = bytes[pos++];
                const lctFlag = localFlags & 0x80;
                const lctSize = lctFlag ? 3 * (1 << ((localFlags & 0x07) + 1)) : 0;
                let activePalette = globalPalette;

                if (lctFlag) {
                    activePalette = bytes.subarray(pos, pos + lctSize);
                    pos += lctSize;
                }

                const minCodeSize = bytes[pos++];
                const lzwData = [];
                let subSize = bytes[pos++];
                while (subSize > 0) {
                    for (let i = 0; i < subSize; i++) lzwData.push(bytes[pos + i]);
                    pos += subSize;
                    subSize = bytes[pos++];
                }

                const pixels = GifDecoder.lzwDecode(minCodeSize, lzwData, w * h);

                const frameCanvas = document.createElement('canvas');
                frameCanvas.width = w;
                frameCanvas.height = h;
                const frameCtx = frameCanvas.getContext('2d');
                const imgData = frameCtx.createImageData(w, h);

                for (let i = 0; i < pixels.length; i++) {
                    const colorIdx = pixels[i];
                    const pxIdx = i * 4;

                    if (colorIdx === transparentIndex) {
                        imgData.data[pxIdx + 3] = 0; // Clean Transparent Alpha
                    } else if (activePalette) {
                        const palIdx = colorIdx * 3;
                        imgData.data[pxIdx] = activePalette[palIdx];
                        imgData.data[pxIdx + 1] = activePalette[palIdx + 1];
                        imgData.data[pxIdx + 2] = activePalette[palIdx + 2];
                        imgData.data[pxIdx + 3] = 255;
                    }
                }

                frameCtx.putImageData(imgData, 0, 0);

                if (disposalMethod === 2) {
                    fullCtx.clearRect(0, 0, width, height);
                }

                fullCtx.drawImage(frameCanvas, left, top);

                // Clone clean frame
                const exportCanvas = document.createElement('canvas');
                exportCanvas.width = width;
                exportCanvas.height = height;
                exportCanvas.getContext('2d').drawImage(fullCanvas, 0, 0);
                frames.push(exportCanvas);
            } else if (blockType === 0x3B) {
                break;
            }
        }

        return frames;
    }

    static lzwDecode(minCodeSize, data, pixelCount) {
        const clearCode = 1 << minCodeSize;
        const eoiCode = clearCode + 1;
        let codeSize = minCodeSize + 1;
        let dict = [];

        const resetDict = () => {
            dict = [];
            for (let i = 0; i < clearCode; i++) dict[i] = [i];
            dict[clearCode] = [];
            dict[eoiCode] = null;
        };

        resetDict();

        const pixels = [];
        let bitPos = 0;

        const readCode = () => {
            let code = 0;
            for (let i = 0; i < codeSize; i++) {
                const byteIdx = (bitPos + i) >> 3;
                const bitIdx = (bitPos + i) & 7;
                if (byteIdx < data.length) {
                    if (data[byteIdx] & (1 << bitIdx)) code |= (1 << i);
                }
            }
            bitPos += codeSize;
            return code;
        };

        let prevCode = null;

        while (bitPos < data.length * 8 && pixels.length < pixelCount) {
            const code = readCode();
            if (code === clearCode) {
                codeSize = minCodeSize + 1;
                resetDict();
                prevCode = null;
                continue;
            }
            if (code === eoiCode) break;

            let entry;
            if (code < dict.length) {
                entry = dict[code];
            } else if (code === dict.length && prevCode !== null) {
                entry = [...dict[prevCode], dict[prevCode][0]];
            } else {
                break;
            }

            for (let i = 0; i < entry.length; i++) pixels.push(entry[i]);

            if (prevCode !== null && dict.length < 4096) {
                dict.push([...dict[prevCode], entry[0]]);
                if (dict.length === (1 << codeSize) && codeSize < 12) codeSize++;
            }
            prevCode = code;
        }

        return pixels;
    }
}

window.GifDecoder = GifDecoder;