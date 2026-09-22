# PixelForge — Local Image Optimization Studio

PixelForge is a privacy-first image compressor/converter built with React + TypeScript.

## What it does

- JPEG, PNG, WebP and AVIF input
- JPEG, PNG, WebP and AVIF output
- Batch processing
- Quality control
- Maximum width/height resizing
- Before/after preview
- Compression statistics
- Web Worker processing
- AVIF encoding with WebAssembly through `@jsquash/avif`
- No backend
- No image uploads
- No database
- No account required

## Architecture

```text
React UI
  |
  +-- Zustand state
  |
  +-- ImageWorkerClient
          |
          v
      Web Worker
          |
          +-- createImageBitmap / Canvas decode
          +-- @jsquash/resize
          +-- Canvas JPEG/PNG/WebP encoding
          +-- @jsquash/avif WASM encoding
```

The browser never sends the image to an application server.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL printed by Vite.

Build:

```bash
npm run build
```

## Important browser notes

AVIF support differs between browsers. PixelForge first attempts native browser decoding and falls back to the AVIF WASM decoder when necessary.

AVIF encoding is intentionally handled through WebAssembly because `OffscreenCanvas.convertToBlob("image/avif")` is not consistently supported.

Very large images can consume substantial browser memory because decoded RGBA images require roughly:

`width × height × 4 bytes`

For example, a 6000 × 4000 image is about 96 MB for one RGBA buffer before additional processing buffers are considered.

## Current limitations

- Static images only; animated GIF/WebP/AVIF are not preserved.
- Metadata is not copied to output files. This effectively strips EXIF from generated files.
- Browser memory limits still apply.
- AVIF encoding is slower than JPEG/WebP on many devices.
- "Download all" currently downloads individual files rather than creating a ZIP.
- Color-management and metadata behavior can vary by browser.

## Suggested v2

- Client-side ZIP download using JSZip
- Interactive original/optimized comparison slider
- PWA offline installation
- Persistent user presets with IndexedDB
- WebP/PNG/JPEG jSquash encoders for more deterministic codec behavior
- More advanced metadata inspection
- HEIC/HEIF support if a suitable browser/WASM codec is added
- Crop and rotate
- Sharpening
- Smart format recommendations
- Performance dashboard

## Portfolio talking points

1. Why no backend?
   - The product's privacy requirement makes client-side processing a deliberate architecture choice.
2. Why Web Worker?
   - Image decoding/encoding can block the main thread.
3. Why WebAssembly?
   - Codecs such as AVIF are computationally expensive and benefit from native/WASM implementations.
4. Why sequential batch processing?
   - It limits memory pressure when many large images are selected.
5. Why no database?
   - There is no account or cloud data requirement.

## License

This application code is provided for portfolio/learning use. Review the licenses of third-party dependencies before distributing a commercial product.
