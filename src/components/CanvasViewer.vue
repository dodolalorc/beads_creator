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
  activeColorId: string | null;
}>();

const emit = defineEmits<{
  pixelClick: [rowIndex: number, colIndex: number];
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

function handlePixelClick(rowIndex: number, colIndex: number) {
  if (!props.activeColorId) return;
  emit("pixelClick", rowIndex, colIndex);
}
</script>

<template>
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
    <div class="pixel-grid" :style="{ gridTemplateColumns: `repeat(${canvasWidth}, 1fr)` }">
      <template v-for="(row, r) in pixels" :key="`row-${r}`">
        <button v-for="(cell, c) in row" :key="`cell-${r}-${c}`" class="pixel"
          :style="{ background: paletteMap.get(cell)?.hex || '#111827' }" @click="handlePixelClick(r, c)"></button>
      </template>
    </div>
  </section>
</template>

<style scoped>
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}

.chip {
  width: 80px;
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
  display: grid;
  gap: 2px;
  max-width: 100%;
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
  cursor: pointer;
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
}
</style>
