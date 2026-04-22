export type PaletteColor = {
  id: string;
  name: string;
  hex: string;
};

export type PaletteColorMap = {
  A: PaletteColor[];
  B: PaletteColor[];
  C: PaletteColor[];
  D: PaletteColor[];
  E: PaletteColor[];
  F: PaletteColor[];
  G: PaletteColor[];
  H: PaletteColor[];
  M: PaletteColor[];
};

export type CanvasSize = {
  width: number;
  height: number;
};

export function flattenPalette(palette: PaletteColorMap): PaletteColor[] {
  return Object.values(palette).flat();
}

export function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const int = Number.parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

export function colorDistance(color: PaletteColor, r: number, g: number, b: number) {
  const current = hexToRgb(color.hex);
  const dr = current.r - r;
  const dg = current.g - g;
  const db = current.b - b;
  return dr * dr + dg * dg + db * db;
}

export function findNearestColorId(
  palette: PaletteColor[],
  r: number,
  g: number,
  b: number,
) {
  if (!palette.length) {
    return "";
  }

  let nearestId = palette[0].id;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const color of palette) {
    const score = colorDistance(color, r, g, b);
    if (score < bestScore) {
      bestScore = score;
      nearestId = color.id;
    }
  }

  return nearestId;
}

export function createBlankPixels(size: CanvasSize, fillColorId: string) {
  return Array.from({ length: size.height }, () =>
    Array.from({ length: size.width }, () => fillColorId),
  );
}

export function resizePixels(
  pixels: string[][],
  size: CanvasSize,
  fillColorId: string,
) {
  return Array.from({ length: size.height }, (_, rowIndex) =>
    Array.from(
      { length: size.width },
      (_, colIndex) => pixels[rowIndex]?.[colIndex] ?? fillColorId,
    ),
  );
}

export function loadImageFromUrl(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片加载失败"));
    image.src = src;
  });
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("无法读取图片文件"));
    };
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

export function renderImageToPixels(options: {
  image: HTMLImageElement;
  size: CanvasSize;
  palette: PaletteColor[];
}) {
  const { image, size, palette } = options;
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("浏览器不支持像素处理");
  }

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, size.width, size.height);
  context.drawImage(image, 0, 0, size.width, size.height);

  const imageData = context.getImageData(0, 0, size.width, size.height);

  const rows: string[][] = [];
  for (let y = 0; y < size.height; y += 1) {
    const row: string[] = [];
    for (let x = 0; x < size.width; x += 1) {
      const offset = (y * size.width + x) * 4;
      row.push(
        findNearestColorId(
          palette,
          imageData.data[offset],
          imageData.data[offset + 1],
          imageData.data[offset + 2],
        ),
      );
    }
    rows.push(row);
  }

  return rows;
}
