import unfake from "./unfake-js/index.js";

declare global {
  interface Window {
    UPNG?: {
      encode?: (
        buffers: ArrayBuffer[],
        width: number,
        height: number,
        depth: number,
      ) => ArrayBuffer;
    };
    cv?: unknown;
    DEBUG_UNFAKE?: boolean;
  }
}

type ProcessResult = {
  png?: Uint8Array;
  imageData?: ImageData;
  palette?: Array<{ r: number; g: number; b: number; a: number }>;
  manifest?: Record<string, unknown>;
};

let opencvLoadPromise: Promise<void> | null = null;
let upngLoadPromise: Promise<void> | null = null;

function ensureScript(src: string, check: () => boolean) {
  if (check()) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`脚本加载失败: ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`脚本加载失败: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureOpenCv() {
  if (!opencvLoadPromise) {
    opencvLoadPromise = ensureScript(
      "https://docs.opencv.org/4.11.0/opencv.js",
      () => typeof window !== "undefined" && typeof window.cv !== "undefined",
    );
  }
  return opencvLoadPromise;
}

async function ensureUpng() {
  if (!upngLoadPromise) {
    upngLoadPromise = ensureScript(
      "https://unpkg.com/upng-js@2.1.0/UPNG.js",
      () => typeof window !== "undefined" && typeof window.UPNG?.encode === "function",
    );
  }
  return upngLoadPromise;
}

function dataUrlToBlob(dataUrl: string) {
  const [meta, encoded] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function uint8ArrayToObjectUrl(png: Uint8Array) {
  const blob = new Blob([png], { type: "image/png" });
  return URL.createObjectURL(blob);
}

export async function runUnfakeEdgeCleanup(options: {
  enabled: boolean;
  source: string;
  maxColors?: number;
  fixedPalette?: Array<{ r: number; g: number; b: number; a: number }>;
}) {
  const { enabled, source, maxColors = 64, fixedPalette = null } = options;
  if (!enabled) {
    return { src: source, used: false, message: "未启用边缘清洗" };
  }

  try {
    await Promise.all([ensureOpenCv(), ensureUpng()]);

    const file = new File([dataUrlToBlob(source)], "upload.png", { type: "image/png" });
    const result = (await unfake.processImage({
      file,
      maxColors,
      fixedPalette,
      detectMethod: "auto",
      edgeDetectMethod: "tiled",
      downscaleMethod: "dominant",
      cleanup: { morph: true, jaggy: true },
      snapGrid: true,
      alphaThreshold: 128,
    })) as ProcessResult;

    if (result.png?.byteLength) {
      return {
        src: uint8ArrayToObjectUrl(result.png),
        used: true,
        message: "已执行本地 unfake.js 边缘清洗",
        manifest: result.manifest,
      };
    }

    return { src: source, used: false, message: "unfake.js 未返回 PNG，已回退原图" };
  } catch (error) {
    return {
      src: source,
      used: false,
      message: error instanceof Error ? `unfake.js 处理失败，已回退原图：${error.message}` : "unfake.js 处理失败，已回退原图",
    };
  }
}
