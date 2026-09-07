export const MEDIA_SOURCE_MAX_BYTES = 20 * 1024 * 1024;
export const MEDIA_FINAL_MAX_BYTES = 3 * 1024 * 1024;
export const MEDIA_MAX_DIMENSION = 8192;
export const MEDIA_MAX_PIXELS = 40_000_000;
export const MEDIA_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type MediaPreparation =
  | { status: 'ready'; file: File; mode: 'original' | 'lossless' }
  | { status: 'needs-lossy-consent'; file: File; width: number; height: number };

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error('Struktur gambar tidak valid atau tidak dapat dibaca browser.');
  }
}

function validateDimensions(width: number, height: number) {
  if (width <= 0 || height <= 0 || width > MEDIA_MAX_DIMENSION || height > MEDIA_MAX_DIMENSION || width * height > MEDIA_MAX_PIXELS) {
    throw new Error('Dimensi gambar melampaui batas aman 8.192 px atau 40 megapiksel.');
  }
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Browser gagal memproses gambar.')), type, quality);
  });
}

function outputName(originalName: string, mimeType: string) {
  const extension = mimeType === 'image/webp' ? '.webp' : mimeType === 'image/jpeg' ? '.jpg' : '.png';
  const stem = originalName.replace(/\.[^.]+$/, '').trim() || 'media';
  return `${stem}${extension}`;
}

function renderBitmap(bitmap: ImageBitmap, width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('Browser tidak menyediakan pemrosesan gambar.');
  context.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

export async function prepareMediaUpload(file: File): Promise<MediaPreparation> {
  if (!MEDIA_ACCEPTED_TYPES.includes(file.type as (typeof MEDIA_ACCEPTED_TYPES)[number])) {
    throw new Error('Format harus JPG, PNG, atau WebP.');
  }
  if (file.size <= 0 || file.size > MEDIA_SOURCE_MAX_BYTES) {
    throw new Error('Ukuran sumber gambar harus lebih dari 0 byte dan maksimal 20 MiB.');
  }

  const bitmap = await loadBitmap(file);
  try {
    validateDimensions(bitmap.width, bitmap.height);
    if (file.size <= MEDIA_FINAL_MAX_BYTES) return { status: 'ready', file, mode: 'original' };

    // PERFORMANCE: PNG dicoba ulang secara pixel-lossless sebelum menawarkan
    // perubahan kualitas atau resolusi kepada operator.
    if (file.type === 'image/png') {
      const lossless = await canvasBlob(renderBitmap(bitmap, bitmap.width, bitmap.height), 'image/png');
      if (lossless.size <= MEDIA_FINAL_MAX_BYTES) {
        return {
          status: 'ready',
          file: new File([lossless], outputName(file.name, 'image/png'), { type: 'image/png', lastModified: Date.now() }),
          mode: 'lossless',
        };
      }
    }
    return { status: 'needs-lossy-consent', file, width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

export async function compressMediaWithConsent(source: File): Promise<File> {
  const bitmap = await loadBitmap(source);
  try {
    validateDimensions(bitmap.width, bitmap.height);
    let scale = 1;
    for (let pass = 0; pass < 6; pass += 1) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = renderBitmap(bitmap, width, height);
      for (const quality of [0.92, 0.88, 0.84, 0.8]) {
        const compressed = await canvasBlob(canvas, 'image/webp', quality);
        if (compressed.size <= MEDIA_FINAL_MAX_BYTES) {
          return new File([compressed], outputName(source.name, 'image/webp'), {
            type: 'image/webp',
            lastModified: Date.now(),
          });
        }
      }
      scale *= 0.82;
    }
    throw new Error('Gambar belum dapat dipadatkan hingga 3 MiB. Pilih gambar dengan dimensi lebih kecil.');
  } finally {
    bitmap.close();
  }
}
