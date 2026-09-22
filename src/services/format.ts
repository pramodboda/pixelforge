import type { ImageFormat } from "../types/image";

export const mimeFor = (format: ImageFormat): string => {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
  }
};

export const extensionFor = (format: ImageFormat): string => {
  return format === "jpeg" ? "jpg" : format;
};

export const formatLabel = (format: ImageFormat): string => {
  return format.toUpperCase();
};

export const isSupportedImage = (file: File): boolean => {
  return ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type.toLowerCase());
};