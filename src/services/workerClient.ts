import type { ImageAsset, OptimizationSettings, WorkerResponse } from "../types/image";

type ProgressHandler = (progress: number) => void;

export class ImageWorkerClient {
  private worker: Worker;
  private pending = new Map<
    string,
    { resolve: (value: WorkerResponse) => void; reject: (reason: Error) => void; onProgress?: ProgressHandler }
  >();

  constructor() {
    this.worker = new Worker(new URL("../workers/image.worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const job = this.pending.get(response.id);
      if (!job) return;

      if (response.type === "progress") {
        job.onProgress?.(response.progress ?? 0);
        return;
      }

      this.pending.delete(response.id);

      if (response.type === "error") {
        job.reject(new Error(response.message ?? "Image processing failed."));
      } else {
        job.resolve(response);
      }
    };
  }

  async process(
    image: ImageAsset,
    settings: OptimizationSettings,
    onProgress?: ProgressHandler,
  ): Promise<WorkerResponse> {
    const buffer = await image.file.arrayBuffer();

    return new Promise<WorkerResponse>((resolve, reject) => {
      this.pending.set(image.id, { resolve, reject, onProgress });

      // Transfer the ArrayBuffer instead of cloning it. This avoids an additional
      // copy of a potentially very large image in the main thread.
      this.worker.postMessage(
        {
          type: "process",
          id: image.id,
          buffer,
          inputType: image.file.type,
          settings,
        },
        [buffer],
      );
    });
  }

  terminate(): void {
    this.worker.terminate();
    this.pending.clear();
  }
}