# PixelForge Architecture Notes

## Main thread

The React application owns:
- UI
- settings
- selected files
- progress display
- download actions

## Worker thread

The worker owns:
- image decoding
- resize
- encoding
- performance timing

## Data movement

Files are converted to ArrayBuffer and transferred to the worker with the
structured-clone transfer list. This avoids copying the original binary data.

The worker returns another transferred ArrayBuffer containing the encoded output.

## Privacy

There is intentionally no `fetch()` call that sends the selected image to an
application server. Object URLs are only used locally for previews/downloads.

## Why this architecture is portfolio-friendly

It demonstrates:
- React component design
- TypeScript
- state management
- browser File/Blob APIs
- ArrayBuffer and transferable objects
- Web Workers
- WebAssembly
- responsive UI
- performance-aware batch processing
- client-side privacy architecture
