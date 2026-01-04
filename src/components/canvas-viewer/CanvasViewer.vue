<script setup lang="ts">
import { computed, ref } from "vue";

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
  activeColorId: string | null;
}>();

const emit = defineEmits<{
  pixelClick: [rowIndex: number, colIndex: number];
}>();

const canvasWidth = computed(() => canvasSize.value.width);
const canvasHeight = computed(() => canvasSize.value.height);

const showAllUsage = ref(false);
const showColorName = ref(false);

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

function handlePixelClick(rowIndex: number, colIndex: number) {
  if (!props.activeColorId) return;
  emit("pixelClick", rowIndex, colIndex);
}
</script>

<template>
  <div class="canvas-section">
    <div class="canvas-header">
      <div>
        <p class="eyebrow">画布</p>
        <h2>{{ canvasWidth }} × {{ canvasHeight }} 像素</h2>
        <p class="note">点击单格编辑；上方色板选择画笔色。</p>
        <label class="show-color-label">
          <input
            type="checkbox"
            v-model="showColorName"
            class="show-color-checkbox"
          />
          显示色号
        </label>
      </div>
      <div class="usage" :class="{ collapsed: !showAllUsage }">
        <div class="chip" v-for="entry in colorUsage" :key="entry.id">
          <span class="dot" :style="{ background: entry.color?.hex }"></span>
          {{ entry.color?.name }} × {{ entry.count }}
        </div>
        <button class="usage-toggle" @click="showAllUsage = !showAllUsage">
          <span class="icon" aria-hidden="true">
            <svg
              v-if="!showAllUsage"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 15l-6-6-6 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span>{{ showAllUsage ? "收起" : "展开" }}</span>
        </button>
      </div>
    </div>
    <div
      class="pixel-grid"
      :style="{ gridTemplateColumns: `repeat(${canvasWidth}, 1fr)` }"
    >
      <template v-for="(row, r) in pixels" :key="`row-${r}`">
        <span
          v-for="(cell, c) in row"
          :key="`cell-${r}-${c}`"
          class="pixel"
          :style="{
            background: paletteMap.get(cell)?.hex || '#111827',
            position: 'relative',
          }"
          @click="handlePixelClick(r, c)"
        >
          <template v-if="showColorName && paletteMap.get(cell)">
            <span class="pixel-label">{{ paletteMap.get(cell)?.name }}</span>
          </template>
          <span v-if="paletteMap.get(cell)" class="pixel-tooltip">
            {{ paletteMap.get(cell)?.name }}
          </span>
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.canvas-section {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.canvas-header {
  width: 100%;
  display: flex;
  align-items: start;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #7dd3fc;
  margin-bottom: 6px;
}

h2 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #e2e8f0;
}

.note {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
}

.usage {
  width: 100%;
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
  padding: 8px; /* 右侧为按钮预留空间 */
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.usage.collapsed {
  /* 仅显示一行颜色条目 */
  max-height: 52px;
  overflow: hidden;
}

.chip {
  width: 120px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 600;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.pixel-grid {
  width: 100%;
  display: grid;
  max-width: 100%;
  background: #0b1021;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.pixel {
  ruby-span: 1;
  aspect-ratio: 1 / 1;
  border: 1px solid rgba(0, 0, 0, 0.35);
  transition: transform 120ms ease, box-shadow 120ms ease;
  cursor: pointer;
  position: relative;
  /* 让tooltip定位于像素格 */
  overflow: visible;
}
.pixel-tooltip {
  display: none;
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, -110%);
  background: rgba(30, 41, 59, 0.98);
  color: #fff;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  pointer-events: none;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.15s;
}
.pixel:hover .pixel-tooltip {
  display: block;
  opacity: 1;
}

.pixel-label {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  text-shadow: 0 1px 2px #000, 0 0 2px #000;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  /* 字号自适应，纵向约占1/3，横向留边距 */
  font-size: min(33%, 0.9em, 3vw);
  line-height: 1;
  padding: 0 2px;
}

/* 显示色号按钮样式 */
.show-color-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 14px;
  color: #e2e8f0;
  user-select: none;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 8px;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid #0ea5e9;
  transition: background 0.15s;
}
.show-color-label:hover {
  background: rgba(14, 165, 233, 0.18);
}
.show-color-checkbox {
  accent-color: #0ea5e9;
  width: 18px;
  height: 18px;
  margin: 0;
}

.pixel:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.usage-toggle {
  position: absolute;
  right: 10px;
  top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease;
}

.usage-toggle:hover {
  background: rgba(255, 255, 255, 0.16);
  transform: translateY(-1px);
}

.usage-toggle .icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 720px) {
  .canvas-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
