declare const unfake: {
  processImage(options: {
    file: File | Blob;
    maxColors?: number;
    autoColorCount?: boolean;
    manualScale?: number | number[] | null;
    detectMethod?: "auto" | "runs" | "edge";
    edgeDetectMethod?: "tiled" | "legacy";
    downscaleMethod?: "dominant" | "median" | "mode" | "mean" | "nearest" | "content-adaptive";
    domMeanThreshold?: number;
    cleanup?: { morph?: boolean; jaggy?: boolean };
    fixedPalette?: Array<{ r: number; g: number; b: number; a: number }> | null;
    alphaThreshold?: number | null;
    snapGrid?: boolean;
  }): Promise<{
    png?: Uint8Array;
    imageData?: ImageData;
    palette?: Array<{ r: number; g: number; b: number; a: number }>;
    manifest?: Record<string, unknown>;
  }>;
};

export default unfake;
