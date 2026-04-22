<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import HeaderBar from "./components/header-bar/HeaderBar.vue";
import PaletteSelector from "./components/palette-selector/PaletteSelector.vue";
import CanvasViewer from "./components/canvas-viewer/CanvasViewer.vue";
import ImportControls from "./components/import-controls/ImportControls.vue";
import CanvasSizeControls from "./components/canvas-size-controls/CanvasSizeControls.vue";
import BatchReplaceControls from "./components/batch-replace-controls/BatchReplaceControls.vue";
import ExportPanel from "./components/export-panel/ExportPanel.vue";
import {
  DEFAULT_DOUBAO_BASE_URL,  createBlankPixels,
  flattenPalette,
  loadImageFromUrl,
  readFileAsDataUrl,
  renderImageToPixels,
  resizePixels,
  type ImportSettings,
  type PaletteColor,
  type PaletteColorMap,
} from "./lib/pixel-art";
import { invokeDoubaoImageEdit, isTauriEnvironment } from "./lib/doubao";

const palette = ref<PaletteColorMap>({
  A: [],
  B: [],
  C: [],
  D: [],
  E: [],
  F: [],
  G: [],
  H: [],
  M: [],
});
const paletteError = ref("");
const paletteLoading = ref(false);
const processingImage = ref(false);

const selectedColorIds = ref<string[]>([]);
const activeColorId = ref<string | null>(null);
const canvasSize = ref({ width: 60, height: 60 });
const pixels = ref<string[][]>([]);
const sourceImageName = ref("");
const replaceFrom = ref<string | null>(null);
const replaceTo = ref<string | null>(null);
const statusMessage = ref("准备好制作拼豆图纸");

const importSettings = ref<ImportSettings>({
  mode: "default",
  style: "bead-contrast",
  prompt: "",
  doubaoApiKey: "",
  doubaoModel: "doubao-seededit-3-0-i2i-250628",
  doubaoBaseUrl: DEFAULT_DOUBAO_BASE_URL,
  doubaoGuidanceScale: 5.5,
  doubaoSize: "adaptive",
});

const allColors = computed(() => flattenPalette(palette.value));

const selectedColors = computed(() => {
  const allowed = new Set(selectedColorIds.value);
  return allColors.value.filter((color) => allowed.has(color.id));
});

const paletteMap = computed(() => {
  const map = new Map<string, PaletteColor>();
  for (const color of allColors.value) {
    map.set(color.id, color);
  }
  return map;
});

const fallbackColorId = computed(() => {
  return selectedColorIds.value[0] ?? allColors.value[0]?.id ?? "";
});

watch(
  canvasSize,
  (next, previous) => {
    if (!previous) {
      return;
    }

    if (next.width === previous.width && next.height === previous.height) {
      return;
    }

    if (!pixels.value.length) {
      pixels.value = createBlankPixels(next, fallbackColorId.value);
    } else {
      pixels.value = resizePixels(pixels.value, next, fallbackColorId.value);
    }

    statusMessage.value = `画布已调整为 ${next.width} × ${next.height}`;
  },
  { deep: true },
);

watch(selectedColorIds, (nextIds) => {
  if (!nextIds.length && allColors.value.length) {
    selectedColorIds.value = allColors.value.map((color) => color.id);
    return;
  }

  if (!activeColorId.value || !nextIds.includes(activeColorId.value)) {
    activeColorId.value = nextIds[0] ?? allColors.value[0]?.id ?? null;
  }
});

onMounted(async () => {
  try {
    paletteLoading.value = true;
    const response = await fetch("/palette.json");
    if (!response.ok) {
      throw new Error("无法加载色板数据");
    }

    const data = (await response.json()) as PaletteColorMap;
    palette.value = data;
    selectedColorIds.value = flattenPalette(data).map((color) => color.id);
    activeColorId.value = flattenPalette(data)[0]?.id ?? null;
    pixels.value = createBlankPixels(canvasSize.value, fallbackColorId.value);
    statusMessage.value = `已载入 ${flattenPalette(data).length} 个拼豆色号`;
  } catch (error) {
    paletteError.value = error instanceof Error ? error.message : "加载色板失败";
  } finally {
    paletteLoading.value = false;
  }
});

function initBlankCanvas() {
  pixels.value = createBlankPixels(canvasSize.value, fallbackColorId.value);
  sourceImageName.value = "";
  statusMessage.value = `创建了 ${canvasSize.value.width} × ${canvasSize.value.height} 的空白拼豆画布`;
}

async function handleImageUpload(file: File) {
  if (!file) {
    return;
  }

  try {
    processingImage.value = true;
    paletteError.value = "";
    sourceImageName.value = file.name;
    statusMessage.value = `正在处理 ${file.name}...`;

    const fileDataUrl = await readFileAsDataUrl(file);
    let imageSourceForQuantization = fileDataUrl;
    let aiHint = "使用默认量化模式";

    if (importSettings.value.mode === "ai") {
      const aiPrompt = importSettings.value.prompt.trim() || "保留主体轮廓，强化边缘、简化背景，并适合拼豆像素化制作";
      try {
        if (!(await isTauriEnvironment())) {
          throw new Error("当前不是 Tauri 桌面环境，无法安全调用豆包代理");
        }

        const edited = await invokeDoubaoImageEdit({
          apiKey: importSettings.value.doubaoApiKey.trim(),
          baseUrl: importSettings.value.doubaoBaseUrl.trim(),
          model: importSettings.value.doubaoModel.trim(),
          prompt: `${aiPrompt}；风格偏好：${importSettings.value.style}`,
          imageDataUrl: fileDataUrl,
          size: importSettings.value.doubaoSize,
          guidanceScale: importSettings.value.doubaoGuidanceScale,
          watermark: true,
        });

        imageSourceForQuantization = edited.imageDataUrl;
        aiHint = edited.revisedPrompt
          ? `豆包 SeedEdit 已优化：${edited.revisedPrompt}`
          : "豆包 SeedEdit 已返回优化结果";
      } catch (error) {
        aiHint = error instanceof Error
          ? `豆包调用失败，已回退本地增强：${error.message}`
          : "豆包调用失败，已回退本地增强";
      }
    }

    const image = await loadImageFromUrl(imageSourceForQuantization);
    const paletteForQuantization = selectedColors.value.length
      ? selectedColors.value
      : allColors.value;

    pixels.value = renderImageToPixels({
      image,
      size: canvasSize.value,
      palette: paletteForQuantization,
      mode: importSettings.value.mode,
      style: importSettings.value.style,
      prompt: importSettings.value.prompt,
    });

    statusMessage.value = `${file.name} 已生成 ${canvasSize.value.width} × ${canvasSize.value.height} 图纸；${aiHint}`;
  } catch (error) {
    paletteError.value = error instanceof Error ? error.message : "图片处理失败";
    statusMessage.value = "图片处理失败，请重试";
  } finally {
    processingImage.value = false;
  }
}

function paintPixel(rowIndex: number, colIndex: number) {
  if (!activeColorId.value) {
    return;
  }

  const next = pixels.value.map((row, currentRowIndex) =>
    row.map((cell, currentColIndex) => {
      if (currentRowIndex !== rowIndex || currentColIndex !== colIndex) {
        return cell;
      }
      return activeColorId.value ?? cell;
    }),
  );

  pixels.value = next;
}

function paintPixels(cells: Array<{ row: number; col: number }>) {
  if (!activeColorId.value || !cells.length) {
    return;
  }

  const cellMap = new Set(cells.map(({ row, col }) => `${row}:${col}`));
  pixels.value = pixels.value.map((row, rowIndex) =>
    row.map((cell, colIndex) =>
      cellMap.has(`${rowIndex}:${colIndex}`) ? activeColorId.value ?? cell : cell,
    ),
  );
}

function replaceColorBatch() {
  if (!replaceFrom.value || !replaceTo.value || replaceFrom.value === replaceTo.value) {
    return;
  }

  pixels.value = pixels.value.map((row) =>
    row.map((cell) => (cell === replaceFrom.value ? replaceTo.value ?? cell : cell)),
  );
  statusMessage.value = `已将 ${replaceFrom.value} 批量替换为 ${replaceTo.value}`;
}
</script>

<template>
  <div class="page">
    <HeaderBar />

    <PaletteSelector
      :palette="palette"
      :selected-color-ids="selectedColorIds"
      :active-color-id="activeColorId"
      @update="selectedColorIds = $event"
      @set-active="activeColorId = $event || null"
    />

    <div class="canvas-workspace">
      <aside class="left-controls">
        <ImportControls
          v-model="importSettings"
          :status-message="statusMessage"
          :palette-error="paletteError"
          :processing="processingImage || paletteLoading"
          :source-image-name="sourceImageName"
          @init-blank="initBlankCanvas"
          @upload-image="handleImageUpload"
        />
        <CanvasSizeControls v-model="canvasSize" />
      </aside>

      <div class="canvas-container">
        <CanvasViewer
          v-model="canvasSize"
          :pixels="pixels"
          :palette-map="paletteMap"
          :active-color-id="activeColorId"
          @pixel-click="paintPixel"
          @paint-cells="paintPixels"
        />
      </div>

      <aside class="right-controls">
        <BatchReplaceControls
          :palette="palette"
          v-model:replace-from="replaceFrom"
          v-model:replace-to="replaceTo"
          @submit="replaceColorBatch"
        />
        <ExportPanel
          v-model="canvasSize"
          :pixels="pixels"
          :palette-map="paletteMap"
          :source-image-name="sourceImageName"
        />
      </aside>
    </div>
  </div>
</template>

<style>
:root {
  font-family: "Avenir Next", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif;
  color: #43352a;
  background:
    radial-gradient(circle at top left, rgba(214, 193, 160, 0.35), transparent 34%),
    radial-gradient(circle at right 18%, rgba(201, 175, 131, 0.16), transparent 22%),
    linear-gradient(180deg, rgba(255, 252, 244, 0.94), rgba(244, 236, 221, 0.96)),
    #efe4cf;
  --paper-bg: rgba(255, 250, 241, 0.82);
  --paper-bg-strong: rgba(252, 247, 238, 0.96);
  --paper-bg-soft: rgba(245, 236, 220, 0.78);
  --paper-line: rgba(126, 98, 67, 0.16);
  --paper-line-strong: rgba(126, 98, 67, 0.28);
  --paper-shadow: 0 18px 50px rgba(92, 69, 43, 0.12);
  --paper-shadow-soft: 0 10px 24px rgba(92, 69, 43, 0.08);
  --paper-text: #43352a;
  --paper-text-muted: #6f5a46;
  --paper-text-soft: #8c7763;
  --paper-accent: #9d6d3c;
  --paper-accent-strong: #7d5430;
  --paper-accent-soft: #e4d1b5;
  --paper-button-text: #fffaf0;
  --paper-overlay: rgba(68, 50, 31, 0.34);
  --paper-scrollbar: rgba(140, 119, 99, 0.35);
}

* {
  box-sizing: border-box;
}

html {
  background: #efe4cf;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--paper-text);
  background:
    linear-gradient(rgba(146, 118, 84, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(146, 118, 84, 0.03) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255, 250, 241, 0.86), rgba(239, 228, 207, 0.92));
  background-size: 100% 32px, 32px 100%, 100% 100%;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.38), transparent 18%),
    radial-gradient(circle at 82% 12%, rgba(186, 149, 100, 0.12), transparent 16%);
  opacity: 0.9;
}

button,
input,
select,
textarea {
  font: inherit;
}

#app {
  position: relative;
  z-index: 1;
}
</style>

<style scoped>
.page {
  width: min(1580px, 98vw);
  margin: 0 auto;
  padding: 24px 18px 40px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.canvas-workspace {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(248px, 272px) minmax(0, 1fr) minmax(248px, 272px);
  gap: 16px;
  align-items: start;
}

.left-controls,
.right-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 16px;
  min-width: 0;
}

.canvas-container {
  min-width: 0;
  width: 100%;
}

@media (max-width: 1200px) {
  .canvas-workspace {
    grid-template-columns: minmax(0, 1fr);
  }

  .left-controls,
  .right-controls {
    position: static;
  }
}
</style>
