<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PaletteSelector from "./components/PaletteSelector.vue";
import CanvasViewer from "./components/CanvasViewer.vue";
import NewImportControls from "./components/NewImportControls.vue";
import CanvasSizeControls from "./components/CanvasSizeControls.vue";
import BatchReplaceControls from "./components/BatchReplaceControls.vue";
import ExportPanel from "./components/ExportPanel.vue";

type PaletteColor = {
  id: string;
  name: string;
  hex: string;
};

type PaletteColorMap = {
  'A': PaletteColor[];
  'B': PaletteColor[];
  'C': PaletteColor[];
  'D': PaletteColor[];
  'E': PaletteColor[];
  'F': PaletteColor[];
  'G': PaletteColor[];
  'H': PaletteColor[];
  'M': PaletteColor[];
};

const palette = ref<PaletteColorMap>({
  'A': [],
  'B': [],
  'C': [],
  'D': [],
  'E': [],
  'F': [],
  'G': [],
  'H': [],
  'M': []
});

const paletteError = ref("");
const paletteLoading = ref(false);
const selectedColorIds = ref<string[]>([]);
const activeColorId = ref<string | null>(null);

const canvasWidth = ref(30);
const canvasHeight = ref(30);
const pixels = ref<string[][]>([]);
const sourceImageName = ref<string>("");
const replaceFrom = ref<string | null>(null);
const replaceTo = ref<string | null>(null);
const statusMessage = ref<string>("准备好生成像素画");

const selectedColors = computed(() =>
  Object.values(palette.value).flat().filter((c) => selectedColorIds.value.includes(c.id))
);

const paletteMap = computed(() => {
  const map = new Map<string, PaletteColor>();
  Object.values(palette.value).flat().forEach((c) => map.set(c.id, c));
  return map;
});

onMounted(async () => {
  try {
    paletteLoading.value = true;
    const res = await fetch("/palette.json");
    if (!res.ok) throw new Error("无法加载色板数据");
    const data: PaletteColorMap = await res.json();
    palette.value = data;
    selectedColorIds.value = Object.values(data).flat().map((c) => c.id);
    activeColorId.value = Object.values(data).flat()[0]?.id ?? null;
    initBlankCanvas();
  } catch (err) {
    paletteError.value = err instanceof Error ? err.message : "加载色板失败";
  } finally {
    paletteLoading.value = false;
  }
});

function initBlankCanvas() {
  const fallbackColor = selectedColorIds.value[0] ?? Object.values(palette.value).flat()[0]?.id ?? "";
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
  const candidates = selectedColors.value.length ? selectedColors.value : Object.values(palette.value).flat();
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

// 导出已移入 ExportPanel 组件
</script>

<template>
  <div class="page">
    <!-- 顶部标题区 -->
    <header class="hero">
      <div>
        <p class="eyebrow">像素画工作台</p>
        <h1>用自定义色板，把图片变成颗粒像素画</h1>
        <p class="lede">
          选择固定色彩、设定画布尺寸，上传图片后自动量化；支持手工修正、换色、CSV 导出，以及带色号标注的 PNG。
        </p>
      </div>
    </header>

    <!-- 色板选择 - 独占一行 -->
    <PaletteSelector :palette="palette" :selected-color-ids="selectedColorIds" :active-color-id="activeColorId"
      @update="(ids) => selectedColorIds = ids" @set-active="(id) => activeColorId = id" />

    <!-- 画布与控制区 - 左右布局 -->
    <div class="canvas-workspace">
      <!-- 左侧控制区 -->
      <aside class="left-controls">
        <NewImportControls :status-message="statusMessage" :palette-error="paletteError" @init-blank="initBlankCanvas"
          @upload-image="handleImageUpload" />
        <CanvasSizeControls :width="canvasWidth" :height="canvasHeight" @update:width="(v) => (canvasWidth = v)"
          @update:height="(v) => (canvasHeight = v)" @apply="initBlankCanvas" />
      </aside>

      <!-- 中间画布区 -->
      <div class="canvas-container">
        <CanvasViewer :canvas-width="canvasWidth" :canvas-height="canvasHeight" :pixels="pixels"
          :palette-map="paletteMap" :active-color-id="activeColorId" @pixel-click="(r, c) => {
            if (!activeColorId) return;
            const next = pixels.map((row, ri) =>
              row.map((cell, ci) => (ri === r && ci === c ? activeColorId! : cell))
            );
            pixels = next;
          }" />
      </div>

      <!-- 右侧控制区 -->
      <aside class="right-controls">
        <BatchReplaceControls :palette="palette" :replace-from="replaceFrom" :replace-to="replaceTo"
          @update:replaceFrom="(v) => (replaceFrom = v)" @update:replaceTo="(v) => (replaceTo = v)"
          @submit="replaceColorBatch" />
        <ExportPanel :canvas-width="canvasWidth" :canvas-height="canvasHeight" :pixels="pixels"
          :palette-map="paletteMap" />
      </aside>
    </div>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap");

:root {
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  background: radial-gradient(circle at 10% 20%, #0ea5e9 0, transparent 18%),
    radial-gradient(circle at 90% 10%, #22d3ee 0, transparent 20%),
    #0b1021;
  color: #e5e7eb;
  box-sizing: border-box;
}

.page {
  width: 100%;
  width: fit-content;
  margin: 0 auto;
  padding: 32px 20px 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

/* 顶部标题区 */
.hero {
  width: 100%;
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
  color: #e2e8f0;
}

.lede {
  margin: 0;
  color: #cbd5e1;
  max-width: 100%;
  line-height: 1.6;
}

/* 画布工作区 - 左中右布局 */
.canvas-workspace {
  width: 100%;
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 20px;
  align-items: start;
}

.left-controls,
.right-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 20px;
}

.canvas-container {
  display: block;
  min-height: 400px;
}

.control-group {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-weight: 700;
  font-size: 14px;
  color: #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.button-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.button-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  flex: 1;
  min-width: 0;
}

.form-row label {
  min-width: 120px;
}

input[type="number"],
select {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px;
  color: #e2e8f0;
  font-size: 14px;
}

input:focus,
select:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

button {
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 10px 16px;
  font-weight: 700;
  font-size: 14px;
  transition: all 120ms ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

.primary {
  background: linear-gradient(135deg, #0ea5e9, #22d3ee);
  color: #0b1021;
  border: none;
}

.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ghost {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 上传按钮样式 */
.upload-btn {
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  padding: 10px 16px;
  font-weight: 700;
  font-size: 14px;
  transition: all 120ms ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.upload-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.upload-btn input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.chip-display {
  display: inline-flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  font-weight: 600;
  font-size: 14px;
  justify-content: center;
}

.note {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}

.status {
  color: #67e8f9;
  margin: 0;
  font-size: 13px;
  padding: 8px 12px;
  background: rgba(103, 232, 249, 0.1);
  border-radius: 8px;
  border-left: 3px solid #67e8f9;
}

.error {
  color: #fca5a5;
  margin: 0;
  font-size: 13px;
  padding: 8px 12px;
  background: rgba(252, 165, 165, 0.1);
  border-radius: 8px;
  border-left: 3px solid #fca5a5;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .canvas-workspace {
    grid-template-columns: 240px 1fr 240px;
    gap: 16px;
  }
}

@media (max-width: 1024px) {
  .canvas-workspace {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .left-controls,
  .right-controls {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 768px) {

  .left-controls,
  .right-controls {
    grid-template-columns: 1fr;
  }

  .control-group {
    padding: 14px;
  }

  .section-title {
    font-size: 13px;
  }

  .button-col button,
  .button-col label {
    font-size: 13px;
    padding: 9px 14px;
  }
}
</style>
