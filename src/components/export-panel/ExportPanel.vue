<script setup lang="ts">
import { computed } from "vue";

type PaletteColor = {
  id: string;
  name: string;
  hex: string;
};

const canvasSize = defineModel<{ width: number; height: number }>({
  default: () => ({ width: 60, height: 60 }),
});

const props = defineProps<{
  pixels: string[][];
  paletteMap: Map<string, PaletteColor>;
  sourceImageName?: string;
}>();

const canvasWidth = computed(() => canvasSize.value.width);
const canvasHeight = computed(() => canvasSize.value.height);

const colorUsage = computed(() => {
  const counts = new Map<string, number>();
  props.pixels.forEach((row) => {
    row.forEach((cell) => {
      if (!cell) {
        return;
      }
      counts.set(cell, (counts.get(cell) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([id, count]) => ({ id, count, color: props.paletteMap.get(id) }))
    .sort((left, right) => right.count - left.count);
});

function contrastColor(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 150 ? "#0f172a" : "#f8fafc";
}

function baseFileName(extension: string) {
  const sourceName = props.sourceImageName?.replace(/\.[^.]+$/, "") || "beads-pattern";
  return `${sourceName}-${canvasWidth.value}x${canvasHeight.value}.${extension}`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadCsv() {
  if (!props.pixels.length) {
    return;
  }

  const rows = props.pixels.map((row) =>
    row
      .map((cell) => {
        const color = props.paletteMap.get(cell);
        return color ? `${color.name}(${color.hex})` : "";
      })
      .join(","),
  );

  downloadBlob(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" }), baseFileName("csv"));
}

function downloadJson() {
  const payload = {
    sourceImageName: props.sourceImageName || "",
    size: { width: canvasWidth.value, height: canvasHeight.value },
    usage: colorUsage.value.map((entry) => ({
      id: entry.id,
      name: entry.color?.name || entry.id,
      hex: entry.color?.hex || "",
      count: entry.count,
    })),
    pixels: props.pixels.map((row) =>
      row.map((cell) => {
        const color = props.paletteMap.get(cell);
        return {
          id: cell,
          name: color?.name || cell,
          hex: color?.hex || "",
        };
      }),
    ),
  };

  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" }),
    baseFileName("json"),
  );
}

function downloadPng() {
  if (!props.pixels.length) {
    return;
  }

  const pad = 24;
  const cell = Math.max(16, Math.min(42, Math.floor(1080 / Math.max(canvasWidth.value, canvasHeight.value))));
  const innerGridWidth = canvasWidth.value * cell;
  const innerGridHeight = canvasHeight.value * cell;
  const gridWidth = innerGridWidth + cell * 2;
  const gridHeight = innerGridHeight + cell * 2;
  const axisColor = "#F5F5DC";
  const legendCols = Math.min(8, Math.max(4, colorUsage.value.length || 4));
  const legendGap = 8;
  const legendItemHeight = 54;
  const legendItemWidth = Math.floor((gridWidth - (legendCols - 1) * legendGap) / legendCols);
  const legendRows = Math.ceil(colorUsage.value.length / legendCols);
  const legendHeight = legendRows * legendItemHeight + 12;
  const dpi = Math.min(4, Math.max(1, Math.floor(window.devicePixelRatio || 1)));

  const canvas = document.createElement("canvas");
  const logicalWidth = gridWidth + pad * 2;
  const logicalHeight = pad + 44 + gridHeight + pad + legendHeight + pad;
  canvas.width = logicalWidth * dpi;
  canvas.height = logicalHeight * dpi;
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.setTransform(dpi, 0, 0, dpi, 0, 0);
  context.imageSmoothingEnabled = false;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, logicalWidth, logicalHeight);

  context.fillStyle = "#0f172a";
  context.font = "16px 'Monaco', 'Segoe UI', sans-serif";
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillText(`图纸尺寸: ${canvasWidth.value} × ${canvasHeight.value}`, pad, pad);
  context.fillText(`颜色数: ${colorUsage.value.length}`, pad, pad + 20);

  const gridX = pad;
  const gridY = pad + 44;
  context.fillStyle = "#0b1021";
  context.fillRect(gridX, gridY, gridWidth, gridHeight);

  for (let col = 0; col < canvasWidth.value + 2; col += 1) {
    const x = gridX + col * cell;
    context.fillStyle = axisColor;
    context.fillRect(x, gridY, cell, cell);
    context.fillRect(x, gridY + (canvasHeight.value + 1) * cell, cell, cell);
    if (col >= 1 && col <= canvasWidth.value) {
      context.fillStyle = "#0f172a";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `${Math.max(10, Math.floor(cell * 0.38))}px 'Monaco', 'Segoe UI', sans-serif`;
      context.fillText(String(col), x + cell / 2, gridY + cell / 2);
      context.fillText(String(col), x + cell / 2, gridY + (canvasHeight.value + 1.5) * cell);
    }
  }

  for (let row = 1; row <= canvasHeight.value; row += 1) {
    const y = gridY + row * cell;
    context.fillStyle = axisColor;
    context.fillRect(gridX, y, cell, cell);
    context.fillRect(gridX + (canvasWidth.value + 1) * cell, y, cell, cell);
    context.fillStyle = "#0f172a";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${Math.max(10, Math.floor(cell * 0.38))}px 'Monaco', 'Segoe UI', sans-serif`;
    context.fillText(String(row), gridX + cell / 2, y + cell / 2);
    context.fillText(String(row), gridX + (canvasWidth.value + 1.5) * cell, y + cell / 2);
  }

  for (let y = 0; y < canvasHeight.value; y += 1) {
    for (let x = 0; x < canvasWidth.value; x += 1) {
      const color = props.paletteMap.get(props.pixels[y][x]);
      const drawX = gridX + (x + 1) * cell;
      const drawY = gridY + (y + 1) * cell;
      context.fillStyle = color?.hex || "#1f2937";
      context.fillRect(drawX, drawY, cell, cell);
      context.strokeStyle = "rgba(15,23,42,0.45)";
      context.strokeRect(drawX, drawY, cell, cell);

      if (color) {
        context.fillStyle = contrastColor(color.hex);
        context.font = `${Math.max(8, Math.floor(cell * 0.28))}px 'Monaco', 'Segoe UI', sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(color.name, drawX + cell / 2, drawY + cell / 2, Math.floor(cell * 0.74));
      }
    }
  }

  const thick = Math.max(2, Math.floor(cell * 0.1));
  context.strokeStyle = "rgba(15,23,42,0.85)";
  context.lineWidth = thick;
  for (let col = 10; col < canvasWidth.value; col += 10) {
    const x = gridX + (col + 1) * cell;
    context.beginPath();
    context.moveTo(x, gridY + cell);
    context.lineTo(x, gridY + cell + canvasHeight.value * cell);
    context.stroke();
  }
  for (let row = 10; row < canvasHeight.value; row += 10) {
    const y = gridY + (row + 1) * cell;
    context.beginPath();
    context.moveTo(gridX + cell, y);
    context.lineTo(gridX + cell + canvasWidth.value * cell, y);
    context.stroke();
  }

  const legendTop = gridY + gridHeight + pad;
  context.fillStyle = "#ffffff";
  context.fillRect(gridX, legendTop, gridWidth, legendHeight);

  colorUsage.value.forEach((entry, index) => {
    if (!entry.color) {
      return;
    }

    const col = index % legendCols;
    const row = Math.floor(index / legendCols);
    const itemX = gridX + col * (legendItemWidth + legendGap);
    const itemY = legendTop + row * legendItemHeight;
    const itemHeight = legendItemHeight - 10;
    const radius = 10;

    context.fillStyle = entry.color.hex;
    context.beginPath();
    context.moveTo(itemX + radius, itemY);
    context.lineTo(itemX + legendItemWidth - radius, itemY);
    context.quadraticCurveTo(itemX + legendItemWidth, itemY, itemX + legendItemWidth, itemY + radius);
    context.lineTo(itemX + legendItemWidth, itemY + itemHeight - radius);
    context.quadraticCurveTo(itemX + legendItemWidth, itemY + itemHeight, itemX + legendItemWidth - radius, itemY + itemHeight);
    context.lineTo(itemX + radius, itemY + itemHeight);
    context.quadraticCurveTo(itemX, itemY + itemHeight, itemX, itemY + itemHeight - radius);
    context.lineTo(itemX, itemY + radius);
    context.quadraticCurveTo(itemX, itemY, itemX + radius, itemY);
    context.closePath();
    context.fill();

    context.fillStyle = contrastColor(entry.color.hex);
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    context.font = "700 14px 'Spline Sans Mono', 'Segoe UI', sans-serif";
    context.fillText(`${entry.count}`, itemX + legendItemWidth / 2, itemY + 22);
    context.textBaseline = "top";
    context.font = "12px 'Spline Sans Mono', 'Segoe UI', sans-serif";
    context.fillText(entry.color.name, itemX + legendItemWidth / 2, itemY + 28, legendItemWidth - 10);
  });

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }
    downloadBlob(blob, baseFileName("png"));
  }, "image/png");
}
</script>

<template>
  <div class="panel">
    <div class="panel-title">导出图纸</div>
    <p class="note">PNG 导出带坐标、色号和颜色统计；CSV 便于表格整理；JSON 便于后续再次导入或接 AI。</p>
    <div class="export-actions">
      <button class="primary" @click="downloadPng">🖼️ 导出 PNG</button>
      <button class="ghost" @click="downloadCsv">📊 导出 CSV</button>
      <button class="ghost" @click="downloadJson">🧩 导出 JSON</button>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: var(--paper-bg);
  border: 1px solid var(--paper-line);
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--paper-shadow-soft);
  backdrop-filter: blur(6px);
}

.panel-title {
  font-weight: 700;
  font-size: 16px;
  color: var(--paper-text);
}

.note {
  margin: 0;
  color: var(--paper-text-muted);
  font-size: 14px;
  line-height: 1.5;
}

.export-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

button {
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 10px 14px;
  font-weight: 700;
  transition: all 120ms ease;
  font-size: 14px;
}

.primary {
  background: linear-gradient(135deg, #b88757, #93633d);
  color: var(--paper-button-text);
}

.primary:hover,
.ghost:hover {
  transform: translateY(-2px);
}

.ghost {
  background: var(--paper-bg-strong);
  color: var(--paper-text);
  border: 1px solid var(--paper-line);
}
</style>
