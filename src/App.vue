<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type PaletteColor = {
  id: string;
  name: string;
  hex: string;
};

const palette = ref<PaletteColor[]>([]);
const paletteError = ref("");
const paletteLoading = ref(false);
const selectedColorIds = ref<string[]>([]);
const activeColorId = ref<string | null>(null);

const canvasWidth = ref(16);
const canvasHeight = ref(16);
const pixels = ref<string[][]>([]);
const sourceImageName = ref<string>("");
const replaceFrom = ref<string | null>(null);
const replaceTo = ref<string | null>(null);
const statusMessage = ref<string>("准备好生成像素画");

const selectedColors = computed(() =>
  palette.value.filter((c) => selectedColorIds.value.includes(c.id))
);

const paletteMap = computed(() => {
  const map = new Map<string, PaletteColor>();
  palette.value.forEach((c) => map.set(c.id, c));
  return map;
});

const colorUsage = computed(() => {
  const counts = new Map<string, number>();
  pixels.value.forEach((row) => {
    row.forEach((cell) => {
      if (!cell) return;
      counts.set(cell, (counts.get(cell) ?? 0) + 1);
    });
  });
  const summary = [...counts.entries()].map(([id, count]) => ({
    id,
    count,
    color: paletteMap.value.get(id),
  }));
  return summary.sort((a, b) => b.count - a.count);
});

onMounted(async () => {
  try {
    paletteLoading.value = true;
    const res = await fetch("/palette.json");
    if (!res.ok) throw new Error("无法加载色板数据");
    const data: PaletteColor[] = await res.json();
    palette.value = data;
    selectedColorIds.value = data.map((c) => c.id);
    activeColorId.value = data[0]?.id ?? null;
    initBlankCanvas();
  } catch (err) {
    paletteError.value = err instanceof Error ? err.message : "加载色板失败";
  } finally {
    paletteLoading.value = false;
  }
});

function initBlankCanvas() {
  const fallbackColor = selectedColorIds.value[0] ?? palette.value[0]?.id ?? "";
  const rows: string[][] = [];
  for (let y = 0; y < canvasHeight.value; y += 1) {
    const row: string[] = [];
    for (let x = 0; x < canvasWidth.value; x += 1) {
      row.push(fallbackColor);
    }
    rows.push(row);
  }
  pixels.value = rows;
  statusMessage.value = `创建了 ${canvasWidth.value} x ${canvasHeight.value} 的空白画布`;
}

function setActive(colorId: string) {
  activeColorId.value = colorId;
}

function toggleSelection(id: string) {
  if (selectedColorIds.value.includes(id)) {
    selectedColorIds.value = selectedColorIds.value.filter((v) => v !== id);
  } else {
    selectedColorIds.value = [...selectedColorIds.value, id];
  }
  if (!selectedColorIds.value.length) {
    activeColorId.value = null;
  } else if (activeColorId.value === null) {
    activeColorId.value = selectedColorIds.value[0];
  }
}

function handleCanvasSizeChange() {
  initBlankCanvas();
}

function handlePixelClick(rowIndex: number, colIndex: number) {
  if (!activeColorId.value) return;
  const next = pixels.value.map((row, r) =>
    row.map((cell, c) => (r === rowIndex && c === colIndex ? activeColorId.value! : cell))
  );
  pixels.value = next;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const int = parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function colorDistance(a: PaletteColor, r: number, g: number, b: number) {
  const ca = hexToRgb(a.hex);
  const dr = ca.r - r;
  const dg = ca.g - g;
  const db = ca.b - b;
  return dr * dr + dg * dg + db * db;
}

function findNearestColor(r: number, g: number, b: number): string {
  const candidates = selectedColors.value.length ? selectedColors.value : palette.value;
  if (!candidates.length) return "";
  let bestId = candidates[0].id;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const c of candidates) {
    const d = colorDistance(c, r, g, b);
    if (d < bestScore) {
      bestScore = d;
      bestId = c.id;
    }
  }
  return bestId;
}

function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    sourceImageName.value = file.name;
    quantizeImage(img);
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(file);
}

function quantizeImage(img: HTMLImageElement) {
  if (!canvasWidth.value || !canvasHeight.value) return;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth.value;
  canvas.height = canvasHeight.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const rows: string[][] = [];
  for (let y = 0; y < canvas.height; y += 1) {
    const row: string[] = [];
    for (let x = 0; x < canvas.width; x += 1) {
      const idx = (y * canvas.width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      row.push(findNearestColor(r, g, b));
    }
    rows.push(row);
  }
  pixels.value = rows;
  statusMessage.value = `已量化 ${sourceImageName.value || "图片"} 为 ${canvasWidth.value} x ${canvasHeight.value}`;
}

function replaceColorBatch() {
  if (!replaceFrom.value || !replaceTo.value) return;
  const next = pixels.value.map((row) =>
    row.map((cell) => (cell === replaceFrom.value ? replaceTo.value! : cell))
  );
  pixels.value = next;
}

function downloadCsv() {
  if (!pixels.value.length) return;
  const rows = pixels.value.map((row) =>
    row
      .map((cell) => {
        const color = paletteMap.value.get(cell);
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
  link.download = `pixel-art-${canvasWidth.value}x${canvasHeight.value}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function contrastColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#f8fafc";
}

function downloadPng() {
  if (!pixels.value.length) return;
  const cell = Math.max(16, Math.min(48, Math.floor(1200 / Math.max(canvasWidth.value, canvasHeight.value))));
  const legendLines = colorUsage.value.length + 1;
  const legendHeight = legendLines * 26 + 24;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth.value * cell;
  canvas.height = canvasHeight.value * cell + legendHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#0b1021";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvasHeight.value; y += 1) {
    for (let x = 0; x < canvasWidth.value; x += 1) {
      const color = paletteMap.value.get(pixels.value[y][x]);
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
  ctx.fillRect(0, canvasHeight.value * cell, canvas.width, legendHeight);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "16px 'Space Grotesk', 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(
    `总共 ${colorUsage.value.length} 种颜色，像素 ${canvasWidth.value}x${canvasHeight.value}`,
    12,
    canvasHeight.value * cell + 8
  );
  colorUsage.value.forEach((entry, idx) => {
    if (!entry.color) return;
    ctx.fillStyle = entry.color.hex;
    const y = canvasHeight.value * cell + 32 + idx * 26;
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
  link.download = `pixel-art-${canvasWidth.value}x${canvasHeight.value}.png`;
  link.click();
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">像素画工作台</p>
        <h1>用自定义色板，把图片变成颗粒像素画</h1>
        <p class="lede">
          选择固定色彩、设定画布尺寸，上传图片后自动量化；支持手工修正、换色、CSV 导出，以及带色号标注的 PNG。
        </p>
        <div class="hero-actions">
          <button class="primary" @click="initBlankCanvas">新建空白画布</button>
          <label class="ghost file">上传图片
            <input type="file" accept="image/*" @change="handleImageUpload" />
          </label>
        </div>
        <p class="status">{{ statusMessage }}</p>
        <p v-if="paletteError" class="error">{{ paletteError }}</p>
      </div>
    </header>

    <section class="controls">
      <div class="panel">
        <div class="panel-title">色板选择</div>
        <p class="note">从静态 JSON 读取的预设色板，默认全选，可点击色块设为当前画笔。</p>
        <div class="palette-actions">
          <button class="ghost" @click="selectedColorIds = palette.map((c) => c.id)">全选</button>
          <button class="ghost" @click="selectedColorIds = []">清空</button>
        </div>
        <div class="palette-grid">
          <label
            v-for="color in palette"
            :key="color.id"
            class="swatch"
            :style="{ background: color.hex, borderColor: activeColorId === color.id ? '#0ea5e9' : 'transparent' }"
          >
            <input
              type="checkbox"
              :checked="selectedColorIds.includes(color.id)"
              @change="toggleSelection(color.id)"
            />
            <button type="button" class="swatch-btn" @click="setActive(color.id)"></button>
            <span class="swatch-label">{{ color.name }}</span>
          </label>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">画布与图片</div>
        <div class="form-row">
          <label>宽度
            <input type="number" min="1" max="200" v-model.number="canvasWidth" @change="handleCanvasSizeChange" />
          </label>
          <label>高度
            <input type="number" min="1" max="200" v-model.number="canvasHeight" @change="handleCanvasSizeChange" />
          </label>
        </div>
        <div class="form-row">
          <label class="ghost file full">重新上传图片
            <input type="file" accept="image/*" @change="handleImageUpload" />
          </label>
        </div>
        <p class="note">上传后按设定尺寸缩放，再按选中颜色量化。</p>
      </div>

      <div class="panel">
        <div class="panel-title">编辑与换色</div>
        <p class="note">左侧色块可设为画笔，点击画布像素即可上色。下方可批量替换。</p>
        <div class="form-row">
          <label>当前画笔
            <div class="chip" :style="{ background: paletteMap.get(activeColorId || '')?.hex || '#0f172a' }">
              {{ paletteMap.get(activeColorId || '')?.name || '未选择' }}
            </div>
          </label>
        </div>
        <div class="form-row">
          <label>从
            <select v-model="replaceFrom">
              <option :value="null">请选择</option>
              <option v-for="c in palette" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label>替换为
            <select v-model="replaceTo">
              <option :value="null">请选择</option>
              <option v-for="c in palette" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <button class="primary" @click="replaceColorBatch">执行替换</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">导出</div>
        <p class="note">CSV 将按当前像素网格导出色名与色号；PNG 会在每格标注色号并在底部汇总颜色用量。</p>
        <div class="export-actions">
          <button class="primary" @click="downloadCsv">导出 CSV</button>
          <button class="ghost" @click="downloadPng">导出 PNG</button>
        </div>
      </div>
    </section>

    <section class="canvas-section">
      <div class="canvas-header">
        <div>
          <p class="eyebrow">画布</p>
          <h2>{{ canvasWidth }} × {{ canvasHeight }} 像素</h2>
          <p class="note">点击单格编辑；上方色板选择画笔色。</p>
        </div>
        <div class="usage">
          <div class="chip" v-for="entry in colorUsage" :key="entry.id">
            <span class="dot" :style="{ background: entry.color?.hex }"></span>
            {{ entry.color?.name }} × {{ entry.count }}
          </div>
        </div>
      </div>
      <div
        class="pixel-grid"
        :style="{ gridTemplateColumns: `repeat(${canvasWidth}, minmax(10px, 1fr))` }"
      >
        <template v-for="(row, r) in pixels" :key="`row-${r}`">
          <button
            v-for="(cell, c) in row"
            :key="`cell-${r}-${c}`"
            class="pixel"
            :style="{ background: paletteMap.get(cell)?.hex || '#111827' }"
            @click="handlePixelClick(r, c)"
          ></button>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap");

:global(:root) {
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  background: radial-gradient(circle at 10% 20%, #0ea5e9 0, transparent 18%),
    radial-gradient(circle at 90% 10%, #22d3ee 0, transparent 20%),
    #0b1021;
  color: #e5e7eb;
}

.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px 64px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 16px 60px rgba(15, 23, 42, 0.6);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #7dd3fc;
  margin-bottom: 6px;
}

h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

.lede {
  margin: 0 0 16px;
  color: #cbd5e1;
  max-width: 760px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

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
  display: flex;
  align-items: center;
  gap: 6px;
}

.note {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
}

.palette-actions {
  display: flex;
  gap: 8px;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.swatch {
  position: relative;
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #0b1021;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.swatch input {
  width: 16px;
  height: 16px;
}

.swatch-btn {
  flex: 1;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.swatch-label {
  background: rgba(0, 0, 0, 0.35);
  color: #f8fafc;
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 12px;
}

.form-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
}

input,
select {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px;
  color: #e2e8f0;
}

button {
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 10px 14px;
  font-weight: 700;
  color: #0b1021;
}

.primary {
  background: linear-gradient(135deg, #0ea5e9, #22d3ee);
  color: #0b1021;
  border: none;
}

.ghost {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.file {
  position: relative;
  overflow: hidden;
}

.file input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.file.full {
  width: 100%;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.export-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status {
  color: #67e8f9;
  margin: 8px 0 0;
}

.error {
  color: #fca5a5;
}

.canvas-section {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.usage {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.pixel-grid {
  display: grid;
  gap: 2px;
  width: 100%;
  background: #0b1021;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.pixel {
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid rgba(0, 0, 0, 0.35);
  border-radius: 4px;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.pixel:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

@media (max-width: 720px) {
  .canvas-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .controls {
    grid-template-columns: 1fr;
  }
}
</style>