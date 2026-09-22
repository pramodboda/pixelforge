import type { OptimizationSettings, WorkerRequest, WorkerResponse } from "../types/image";
import { mimeFor } from "../services/format";

const send = (message: WorkerResponse) => self.postMessage(message);

/**
 * PixelForge worker
 *
 * Why a worker?
 * Image decoding, resizing and WASM encoding can be CPU and memory intensive.
 * Keeping those operations off the main thread prevents the React UI from
 * freezing while a large image is being processed.
 */

async function decodeToImageData(buffer: ArrayBuffer, inputType: string): Promise<ImageData> {
  try {
    // Modern Chromium/Firefox/Safari builds can decode the common formats
    // directly through createImageBitmap. This is the fastest path.
    const blob = new Blob([buffer], { type: inputType || "application/octet-stream" });
    const bitmap = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) throw new Error("Canvas 2D context is unavailable.");

    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    return context.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    // AVIF decoding is not equally available in every browser.
    // jSquash gives us a WebAssembly fallback for AVIF.
    if (inputType === "image/avif") {
      const { decode } = await import("@jsquash/avif");
      return await decode(buffer);
    }

    throw new Error(
      "The browser could not decode this image. Try a modern Chromium, Firefox or Safari browser.",
    );
  }
}

function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number | null,
  maxHeight: number | null,
): { width: number; height: number } {
  if (!maxWidth && !maxHeight) return { width, height };

  const widthRatio = maxWidth ? maxWidth / width : Number.POSITIVE_INFINITY;
  const heightRatio = maxHeight ? maxHeight / height : Number.POSITIVE_INFINITY;
  const ratio = Math.min(1, widthRatio, heightRatio);

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function resizeImageData(image: ImageData, width: number, height: number): Promise<ImageData> {
  if (image.width === width && image.height === height) return image;

  // jSquash resize uses a high-quality WASM implementation. We dynamically
  // import it so the resize WASM is only loaded when a resize is requested.
  const resize = (await import("@jsquash/resize")).default;

  return resize(image, {
    width,
    height,
    method: "lanczos3",
    fitMethod: "stretch",
    premultiply: true,
    linearRGB: true,
  });
}

async function encode(
  image: ImageData,
  format: OptimizationSettings["outputFormat"],
  quality: number,
): Promise<ArrayBuffer> {
  if (format === "avif") {
    // AVIF uses libavif through WebAssembly. cqLevel is inversely related to
    // quality: lower values preserve more quality. The mapping below gives
    // a simple 1-100 UI without exposing codec-specific values to users.
    const { encode } = await import("@jsquash/avif");
    const cqLevel = Math.max(0, Math.min(63, Math.round(63 - quality * 0.63)));

    return encode(image, {
      cqLevel,
      cqAlphaLevel: cqLevel,
      speed: 6,
      subsample: 1,
      sharpness: 0,
    });
  }

  // Canvas encoding is widely supported for JPEG/PNG/WebP and keeps this
  // worker lightweight. AVIF uses the dedicated WASM encoder above because
  // canvas.toBlob("image/avif") is not consistently implemented.
  const canvas = new OffscreenCanvas(image.width, image.height);
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Canvas 2D context is unavailable.");

  context.putImageData(image, 0, 0);

  const mime = mimeFor(format);
  const blob = await canvas.convertToBlob({
    type: mime,
    quality: format === "png" ? undefined : quality / 100,
  });

  return blob.arrayBuffer();
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  if (request.type !== "process") return;

  const started = performance.now();

  try {
    send({ type: "progress", id: request.id, progress: 10 });

    const decoded = await decodeToImageData(request.buffer, request.inputType);

    send({ type: "progress", id: request.id, progress: 35 });

    const dimensions = calculateDimensions(
      decoded.width,
      decoded.height,
      request.settings.maxWidth,
      request.settings.maxHeight,
    );

    const resized = await resizeImageData(decoded, dimensions.width, dimensions.height);

    send({ type: "progress", id: request.id, progress: 65 });

    const encoded = await encode(
      resized,
      request.settings.outputFormat,
      request.settings.quality,
    );

    send({ type: "progress", id: request.id, progress: 95 });

    const outputMime = mimeFor(request.settings.outputFormat);
    const elapsed = Math.round(performance.now() - started);

    // Transfer the encoded buffer to the main thread without cloning it.
    send({
      type: "success",
      id: request.id,
      buffer: encoded,
      width: resized.width,
      height: resized.height,
      processingMs: elapsed,
      outputMime,
    });

    // Note: metadata is not copied into the newly encoded image. This means
    // EXIF is effectively stripped by this pixel-based processing pipeline.
  } catch (error) {
    send({
      type: "error",
      id: request.id,
      message: error instanceof Error ? error.message : "Unknown image processing error.",
    });
  }
};