export type Format = 'image/jpeg' | 'image/png' | 'image/webp';
export type Settings = {
  width: number;
  height: number;
  format: Format;
  quality: number;
  targetKB: number;
};

self.onmessage = async ({ data }: MessageEvent<{ file: File; settings: Settings }>) => {
  const { file, settings } = data;
  try {
    const bitmap = await createImageBitmap(file);
    let canvas: OffscreenCanvas;
    try {
      const scale = Math.min(settings.width / bitmap.width, settings.height / bitmap.height, 1);
      canvas = new OffscreenCanvas(
        Math.max(1, Math.round(bitmap.width * scale)),
        Math.max(1, Math.round(bitmap.height * scale)),
      );
      const context = canvas.getContext('2d', { alpha: settings.format !== 'image/jpeg' });
      if (!context) throw new Error('Could not prepare this image.');
      if (settings.format === 'image/jpeg') {
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    } finally {
      bitmap.close();
    }

    const encode = (quality: number) => canvas.convertToBlob({ type: settings.format, quality });
    const limit = settings.targetKB * 1024;
    let blob = await encode(settings.quality / 100);
    if (blob.type !== settings.format) throw new Error('This browser cannot write the selected format.');
    if (limit && blob.size > limit && settings.format !== 'image/png') {
      let low = 0;
      let high = settings.quality / 100;
      blob = await encode(low);
      if (blob.size <= limit) {
        for (let step = 0; step < 7; step++) {
          const middle = (low + high) / 2;
          const candidate = await encode(middle);
          if (candidate.size <= limit) {
            blob = candidate;
            low = middle;
          } else {
            high = middle;
          }
        }
      }
    }
    self.postMessage({ blob, width: canvas.width, height: canvas.height, overLimit: !!limit && blob.size > limit });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Could not process this image.' });
  }
};
