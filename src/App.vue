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
import { runUnfakeEdgeCleanup } from "./lib/unfake";
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
  useUnfake: true,
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
    const fixedPalette = (selectedColors.value.length ? selectedColors.value : allColors.value).map((color) => {
      const normalized = color.hex.replace("#", "");
      const int = Number.parseInt(normalized, 16);
      return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
        a: 255,
      };
    });

    const unfakeResult = await runUnfakeEdgeCleanup({
      enabled: importSettings.value.useUnfake,
      source: fileDataUrl,
      maxColors: Math.min(64, fixedPalette.length || 64),
      fixedPalette,
    });

    let imageSourceForQuantization = unfakeResult.src;
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
          imageDataUrl: unfakeResult.src,
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

    statusMessage.value = `${file.name} 已生成 ${canvasSize.value.width} × ${canvasSize.value.height} 图纸；${unfakeResult.message}；${aiHint}`;
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
@import url("https://fonts.googleapis.com/css2?family=Spline+Sans+Mono:ital,wght@0,300..700;1,300..700&display=swap");

:root {
  font-family: "Spline Sans Mono", "Segoe UI", sans-serif;
  background: linear-gradient(90deg, rgba(96, 165, 250, 0.08) 1px, transparent 1px),
    linear-gradient(rgba(96, 165, 250, 0.08) 1px, transparent 1px),
    radial-gradient(circle at 50% 0%, #1e3a8a 0%, #1e40af 10%, #1e3a8a 20%, transparent 35%),
    #0f172a;
  background-size: 20px 20px, 20px 20px, 100% 100%, 100% 100%;
  color: #e2e8f0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}
</style>

<style scoped>
.page {
  width: min(1440px, 96vw);
  margin: 0 auto;
  padding: 32px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.canvas-workspace {
  width: 100%;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.left-controls,
.right-controls {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 20px;
}

.canvas-container {
  min-width: 0;
  flex: 1;
}

@media (max-width: 1200px) {
  .canvas-workspace {
    flex-direction: column;
  }

  .left-controls,
  .right-controls {
    width: 100%;
    position: static;
  }
}
</style>
