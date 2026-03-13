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
  paintCells: [cells: Array<{ row: number; col: number }>];
}>();

const canvasWidth = computed(() => canvasSize.value.width);
const canvasHeight = computed(() => canvasSize.value.height);
const showAllUsage = ref(false);
const showColorName = ref(false);
const isPointerDown = ref(false);
const dragCells = ref<Array<{ row: number; col: number }>>([]);

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

function addDragCell(rowIndex: number, colIndex: number) {
  const key = `${rowIndex}:${colIndex}`;
  if (dragCells.value.some((cell) => `${cell.row}:${cell.col}` === key)) {
    return;
  }
  dragCells.value = [...dragCells.value, { row: rowIndex, col: colIndex }];
}

function beginPaint(rowIndex: number, colIndex: number) {
  if (!props.activeColorId) {
    return;
  }

  isPointerDown.value = true;
  dragCells.value = [{ row: rowIndex, col: colIndex }];
  emit("pixelClick", rowIndex, colIndex);
}

function extendPaint(rowIndex: number, colIndex: number) {
  if (!isPointerDown.value || !props.activeColorId) {
    return;
  }
  addDragCell(rowIndex, colIndex);
}

function finishPaint() {
  if (!isPointerDown.value) {
    return;
  }

  isPointerDown.value = false;
  if (dragCells.value.length > 1) {
    emit("paintCells", dragCells.value);
  }
  dragCells.value = [];
}
</script>

<template>
  <div class="canvas-section" @mouseup="finishPaint" @mouseleave="finishPaint">
    <div class="canvas-header">
      <div>
        <p class="eyebrow">画布</p>
        <h2>{{ canvasWidth }} × {{ canvasHeight }} 像素</h2>
        <p class="note">点击或拖拽即可上色；显示色号后更适合校对拼豆图纸。</p>
        <label class="show-color-label">
          <input v-model="showColorName" type="checkbox" class="show-color-checkbox" />
          显示色号
        </label>
      </div>
      <div class="usage" :class="{ collapsed: !showAllUsage }">
        <div class="chip" v-for="entry in colorUsage" :key="entry.id">
          <span class="dot" :style="{ background: entry.color?.hex }"></span>
          {{ entry.color?.name }} × {{ entry.count }}
        </div>
        <button class="usage-toggle" @click="showAllUsage = !showAllUsage">
          {{ showAllUsage ? "收起" : "展开" }}
        </button>
      </div>
    </div>

    <div class="grid-scroll">
      <div class="pixel-grid" :style="{ gridTemplateColumns: `repeat(${canvasWidth}, minmax(14px, 1fr))` }">
        <template v-for="(row, rowIndex) in pixels" :key="`row-${rowIndex}`">
          <button
            v-for="(cell, colIndex) in row"
            :key="`cell-${rowIndex}-${colIndex}`"
            type="button"
            class="pixel"
            :style="{ background: paletteMap.get(cell)?.hex || '#111827' }"
            :title="`${rowIndex + 1}, ${colIndex + 1} · ${paletteMap.get(cell)?.name || '未定义'}`"
            @mousedown.prevent="beginPaint(rowIndex, colIndex)"
            @mouseenter="extendPaint(rowIndex, colIndex)"
          >
            <span v-if="showColorName && paletteMap.get(cell)" class="pixel-label">
              {{ paletteMap.get(cell)?.name }}
            </span>
          </button>
        </template>
      </div>
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #7dd3fc;
  margin: 0 0 6px;
}

h2 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #e2e8f0;
}

.note {
  margin: 0 0 8px;
  color: #94a3b8;
  font-size: 14px;
}

.show-color-label {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: #cbd5e1;
  font-size: 13px;
}

.usage {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.usage.collapsed {
  max-height: 52px;
  overflow: hidden;
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
  font-size: 12px;
  font-weight: 600;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.usage-toggle {
  margin-left: auto;
  cursor: pointer;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
  color: #e2e8f0;
  padding: 8px 12px;
  font-weight: 700;
}

.grid-scroll {
  overflow: auto;
}

.pixel-grid {
  display: grid;
  gap: 1px;
  width: max-content;
  min-width: 100%;
  background: rgba(15, 23, 42, 0.8);
  padding: 8px;
  border-radius: 12px;
}

.pixel {
  width: 100%;
  min-width: 16px;
  aspect-ratio: 1;
  border: 1px solid rgba(15, 23, 42, 0.25);
  cursor: crosshair;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.pixel:hover {
  transform: scale(1.08);
  box-shadow: 0 0 0 2px rgba(125, 211, 252, 0.5);
  z-index: 1;
}

.pixel-label {
  font-size: 9px;
  line-height: 1;
  color: rgba(15, 23, 42, 0.9);
  background: rgba(255, 255, 255, 0.65);
  padding: 2px 3px;
  border-radius: 4px;
}
</style>
