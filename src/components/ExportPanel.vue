<script setup lang="ts">
import { computed } from "vue";

type PaletteColor = {
  id: string;
  name: string;
  hex: string;
};

const props = defineProps<{
  canvasWidth: number;
  canvasHeight: number;
  pixels: string[][];
  paletteMap: Map<string, PaletteColor>;
}>();

const colorUsage = computed(() => {
  const counts = new Map<string, number>();
  props.pixels.forEach((row) => {
    row.forEach((cell) => {
      if (!cell) return;
      counts.set(cell, (counts.get(cell) ?? 0) + 1);
    });
  });
  const summary = [...counts.entries()].map(([id, count]) => ({
    id,
    count,
    color: props.paletteMap.get(id),
  }));
  return summary.sort((a, b) => b.count - a.count);
});

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const int = parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function contrastColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#f8fafc";
}

function downloadCsv() {
  if (!props.pixels.length) return;
  const rows = props.pixels.map((row) =>
    row
      .map((cell) => {
        const color = props.paletteMap.get(cell);
        if (!color) return "";
        return `${color.name} (${color.hex})`;
      })
      .join(",")
  );
  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pixel-art-${props.canvasWidth}x${props.canvasHeight}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadPng() {
  if (!props.pixels.length) return;
  const pad = 24; // 外层白色留白
  const cell = Math.max(16, Math.min(48, Math.floor(1200 / Math.max(props.canvasWidth, props.canvasHeight))));
  const gridWidth = props.canvasWidth * cell;
  const gridHeight = props.canvasHeight * cell;

  // 底部色号图例布局：多列自适应
  const legendItemWidth = 200;
  const legendItemHeight = 44;
  const legendCols = Math.max(1, Math.floor(gridWidth / legendItemWidth));
  const legendRows = Math.ceil(colorUsage.value.length / legendCols);
  const legendHeight = legendRows * legendItemHeight + 12;

  const canvas = document.createElement("canvas");
  canvas.width = gridWidth + pad * 2;
  canvas.height = pad + 32 + gridHeight + pad + legendHeight + pad;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 白色留白背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 顶部信息（尺寸、颜色数）
  ctx.fillStyle = "#0f172a";
  ctx.font = "16px 'Space Grotesk', 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`尺寸: ${props.canvasWidth} x ${props.canvasHeight}`, pad, pad);
  ctx.fillText(`颜色数: ${colorUsage.value.length}`, pad, pad + 20);

  // 绘制网格背景
  const gridX = pad;
  const gridY = pad + 32;
  ctx.fillStyle = "#0b1021";
  ctx.fillRect(gridX, gridY, gridWidth, gridHeight);

  for (let y = 0; y < props.canvasHeight; y += 1) {
    for (let x = 0; x < props.canvasWidth; x += 1) {
      const color = props.paletteMap.get(props.pixels[y][x]);
      ctx.fillStyle = color?.hex ?? "#1f2937";
      ctx.fillRect(gridX + x * cell, gridY + y * cell, cell, cell);
      ctx.strokeStyle = "rgba(15,23,42,0.4)";
      ctx.strokeRect(gridX + x * cell, gridY + y * cell, cell, cell);
      if (color) {
        ctx.fillStyle = contrastColor(color.hex);
        ctx.font = `${Math.max(10, Math.floor(cell * 0.32))}px 'Space Grotesk', 'Segoe UI', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(color.name, gridX + x * cell + cell / 2, gridY + y * cell + cell / 2);
      }
    }
  }

  // 底部图例背景
  const legendTop = gridY + gridHeight + pad;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(gridX, legendTop, gridWidth, legendHeight);

  // 绘制图例：数量在上，名称在下，多列排布
  colorUsage.value.forEach((entry, idx) => {
    if (!entry.color) return;
    const col = idx % legendCols;
    const row = Math.floor(idx / legendCols);
    const itemX = gridX + col * (gridWidth / legendCols);
    const itemY = legendTop + row * legendItemHeight;

    ctx.fillStyle = entry.color.hex;
    ctx.fillRect(itemX + 6, itemY + 10, 24, 24);
    ctx.strokeStyle = "#0f172a";
    ctx.strokeRect(itemX + 6, itemY + 10, 24, 24);

    ctx.fillStyle = "#0f172a";
    ctx.font = "14px 'Space Grotesk', 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${entry.count}`, itemX + 40, itemY + 8);

    ctx.font = "13px 'Space Grotesk', 'Segoe UI', sans-serif";
    ctx.textBaseline = "bottom";
    ctx.fillText(entry.color.name, itemX + 40, itemY + legendItemHeight - 6);
  });

  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = `pixel-art-${props.canvasWidth}x${props.canvasHeight}.png`;
  link.click();
}
</script>

<template>
  <div class="panel">
    <div class="panel-title">导出</div>
    <p class="note">
      CSV 将按当前像素网格导出色名与色号；PNG 会在每格标注色号并在底部汇总颜色用量。
    </p>
    <div class="export-actions">
      <button class="primary" @click="downloadCsv">📊 导出 CSV</button>
      <button class="ghost" @click="downloadPng">🖼️ 导出 PNG</button>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-title {
  font-weight: 700;
  font-size: 16px;
  color: #e2e8f0;
}

.note {
  margin: 0;
  color: #94a3b8;
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
  color: #0b1021;
  transition: all 120ms ease;
  font-size: 14px;
}

.primary {
  background: linear-gradient(135deg, #0ea5e9, #22d3ee);
  color: #0b1021;
}

.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.ghost {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
