export type ImageFormat = "jpeg" | "png" | "webp" | "avif";

export type ProcessingStatus = "queued" | "processing" | "completed" | "error";

export interface OptimizationSettings {
  outputFormat: ImageFormat;
  quality: number;
  maxWidth: number | null;
  maxHeight: number | null;
  stripMetadata: boolean;
}

export interface ImageAsset {
  id: string;
  file: File;
  name: string;
  inputFormat: ImageFormat;
  originalSize: number;
  width: number;
  height: number;
  outputBlob?: Blob;
  outputSize?: number;
  outputWidth?: number;
  outputHeight?: number;
  outputFormat?: ImageFormat;
  status: ProcessingStatus;
  progress: number;
  processingMs?: number;
  error?: string;
}

export interface WorkerRequest {
  type: "process";
  id: string;
  buffer: ArrayBuffer;
  inputType: string;
  settings: OptimizationSettings;
}

export interface WorkerResponse {
  type: "progress" | "success" | "error";
  id: string;
  progress?: number;
  message?: string;
  buffer?: ArrayBuffer;
  width?: number;
  height?: number;
  processingMs?: number;
  outputMime?: string;
}