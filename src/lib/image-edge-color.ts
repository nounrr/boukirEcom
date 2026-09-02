/** Dominant edge color; nearby shades share a bucket to tolerate JPEG noise. */
export function dominantEdgeColor(samples: Uint8ClampedArray[]): string | null {
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (const pixels of samples) {
    for (let i = 0; i + 3 < pixels.length; i += 4) {
      // Transparent edges keep the gallery's white backing.
      const alpha = pixels[i + 3] / 255;
      const r = Math.round(pixels[i] * alpha + 255 * (1 - alpha));
      const g = Math.round(pixels[i + 1] * alpha + 255 * (1 - alpha));
      const b = Math.round(pixels[i + 2] * alpha + 255 * (1 - alpha));
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(key, bucket);
    }
  }
  let dominant: { count: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!dominant || bucket.count > dominant.count) dominant = bucket;
  }
  if (!dominant) return null;
  return '#' + [dominant.r, dominant.g, dominant.b]
    .map(channel => Math.round(channel / dominant.count).toString(16).padStart(2, '0'))
    .join('');
}

/** Read only the outer 10px of an already loaded image, using small canvases. */
export function getImageEdgeColor(image: HTMLImageElement): string | null {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height || typeof document === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    const bandX = Math.min(10, width);
    const bandY = Math.min(10, height);
    const strips = [
      [0, 0, width, bandY],
      [0, height - bandY, width, bandY],
      [0, 0, bandX, height],
      [width - bandX, 0, bandX, height],
    ];
    const samples = strips.map(([x, y, w, h]) => {
      canvas.width = Math.min(w, 256);
      canvas.height = Math.min(h, 256);
      context.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    });
    return dominantEdgeColor(samples);
  } catch {
    // Some external images disallow canvas reads; leave their background white.
    return null;
  }
}
