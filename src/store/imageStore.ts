import { create } from "zustand";
import type { ImageAsset, OptimizationSettings } from "../types/image";

interface ImageStore {
  images: ImageAsset[];
  settings: OptimizationSettings;
  selectedId: string | null;
  addFiles: (files: File[]) => void;
  removeImage: (id: string) => void;
  clear: () => void;
  updateImage: (id: string, patch: Partial<ImageAsset>) => void;
  select: (id: string | null) => void;
  setSettings: (patch: Partial<OptimizationSettings>) => void;
}

const defaultSettings: OptimizationSettings = {
  outputFormat: "webp",
  quality: 82,
  maxWidth: null,
  maxHeight: null,
  stripMetadata: true,
};

const detectFormat = (file: File): ImageAsset["inputFormat"] => {
  const value = file.type.toLowerCase();
  if (value.includes("png")) return "png";
  if (value.includes("webp")) return "webp";
  if (value.includes("avif")) return "avif";
  return "jpeg";
};

export const useImageStore = create<ImageStore>((set) => ({
  images: [],
  settings: defaultSettings,
  selectedId: null,

  addFiles: (files) =>
    set((state) => {
      const additions: ImageAsset[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        inputFormat: detectFormat(file),
        originalSize: file.size,
        width: 0,
        height: 0,
        status: "queued",
        progress: 0,
      }));

      return {
        images: [...state.images, ...additions],
        selectedId: state.selectedId ?? additions[0]?.id ?? null,
      };
    }),

  removeImage: (id) =>
    set((state) => {
      const next = state.images.filter((image) => image.id !== id);
      return {
        images: next,
        selectedId: state.selectedId === id ? (next[0]?.id ?? null) : state.selectedId,
      };
    }),

  clear: () => set({ images: [], selectedId: null }),

  updateImage: (id, patch) =>
    set((state) => ({
      images: state.images.map((image) => (image.id === id ? { ...image, ...patch } : image)),
    })),

  select: (id) => set({ selectedId: id }),

  setSettings: (patch) =>
    set((state) => ({
      settings: { ...state.settings, ...patch },
    })),
}));