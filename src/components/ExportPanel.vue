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
  const cell = Math.max(16, Math.min(48, Math.floor(1200 / Math.max(props.canvasWidth, props.canvasHeight))));
  const legendLines = colorUsage.value.length + 1;
  const legendHeight = legendLines * 26 + 24;
  const canvas = document.createElement("canvas");
  canvas.width = props.canvasWidth * cell;
  canvas.height = props.canvasHeight * cell + legendHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#0b1021";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < props.canvasHeight; y += 1) {
    for (let x = 0; x < props.canvasWidth; x += 1) {
      const color = props.paletteMap.get(props.pixels[y][x]);
      ctx.fillStyle = color?.hex ?? "#1f2937";
      ctx.fillRect(x * cell, y * cell, cell, cell);
      ctx.strokeStyle = "rgba(15,23,42,0.4)";
      ctx.strokeRect(x * cell, y * cell, cell, cell);
      if (color) {
        ctx.fillStyle = contrastColor(color.hex);
        ctx.font = `${Math.max(10, Math.floor(cell * 0.32))}px 'Space Grotesk', 'Segoe UI', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(color.hex, x * cell + cell / 2, y * cell + cell / 2);
      }
    }
  }

  ctx.fillStyle = "#0b1021";
  ctx.fillRect(0, props.canvasHeight * cell, canvas.width, legendHeight);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "16px 'Space Grotesk', 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(
    `总共 ${colorUsage.value.length} 种颜色，像素 ${props.canvasWidth}x${props.canvasHeight}`,
    12,
    props.canvasHeight * cell + 8
  );
  colorUsage.value.forEach((entry, idx) => {
    if (!entry.color) return;
    ctx.fillStyle = entry.color.hex;
    const y = props.canvasHeight * cell + 32 + idx * 26;
    ctx.fillRect(12, y, 18, 18);
    ctx.strokeStyle = "#0f172a";
    ctx.strokeRect(12, y, 18, 18);
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "left";
    ctx.fillText(`${entry.color.name} ${entry.color.hex} × ${entry.count}`, 40, y + 2);
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
