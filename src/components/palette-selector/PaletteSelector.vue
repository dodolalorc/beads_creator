<script setup lang="ts">
import { computed, ref } from "vue";
import ColorEditorModal from "@/components/color-editor/ColorEditor.vue";

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

const props = defineProps<{
  palette: PaletteColorMap;
  selectedColorIds: string[];
  activeColorId: string | null;
}>();

const emit = defineEmits<{
  update: [ids: string[]];
  setActive: [id: string];
}>();

const isExpanded = ref(false);
const showModal = ref(false);

const allColors = computed(() => Object.values(props.palette).flat());

const selectedColors = computed(() => {
  return allColors.value.filter((c) => props.selectedColorIds.includes(c.id));
});

const activeColor = computed(() => {
  return allColors.value.find((c) => c.id === props.activeColorId);
});

function toggleSelection(id: string) {
  const newIds = props.selectedColorIds.includes(id)
    ? props.selectedColorIds.filter((v) => v !== id)
    : [...props.selectedColorIds, id];

  emit("update", newIds);

  if (!newIds.length) {
    emit("setActive", "");
  } else if (props.activeColorId === null || !newIds.includes(props.activeColorId)) {
    emit("setActive", newIds[0]);
  }
}

function setActive(colorId: string) {
  emit("setActive", colorId);
}

function handleModalConfirm(selectedIds: string[]) {
  emit("update", selectedIds);
  if (selectedIds.length && !selectedIds.includes(props.activeColorId || "")) {
    emit("setActive", selectedIds[0]);
  }
  showModal.value = false;
}
</script>

<template>
  <div class="palette-panel">
    <div class="palette-header">
      <div class="title-section">
        <div class="panel-title">色板选择</div>
        <p class="note">已选 {{ selectedColors.length }} 个颜色 · 点击色块设为画笔
          <span v-if="!isExpanded && selectedColors.length > 30" class="expand-hint">· 还有 {{
            selectedColors.length - 30 }} 个未显示</span>
        </p>
      </div>
      <div class="palette-toolbar">
        <div v-if="activeColor" class="current-brush">
          <span class="brush-label">当前画笔:</span>
          <div class="brush-chip" :style="{ background: activeColor.hex }">
            {{ activeColor.name }}
          </div>
        </div>
        <button class="ghost-small" @click="$emit('update', Object.values(palette).flat().map((c) => c.id))">全选</button>
        <button class="ghost-small" @click="$emit('update', [])">清空</button>
        <button class="primary-small" @click="showModal = true">🎨 编辑</button>
      </div>
    </div>

    <!-- 色块网格 - 自适应布局 -->
    <div v-if="!isExpanded" class="palette-grid-compact">
      <label v-for="color in selectedColors.slice(0, 30)" :key="color.id" class="swatch" :style="{
        background: color.hex,
        borderColor: activeColorId === color.id ? '#0ea5e9' : 'transparent'
      }" :title="`${color.name} - ${color.hex}`">
        <input type="checkbox" :checked="selectedColorIds.includes(color.id)" @change="toggleSelection(color.id)" />
        <button type="button" class="swatch-btn" @click="setActive(color.id)"></button>
      </label>

      <button v-if="selectedColors.length > 30" class="expand-card" @click="isExpanded = true" title="展开查看更多">
        <span class="expand-icon">▼</span>
      </button>
    </div>

    <!-- 展开后的完整网格 -->
    <div v-else class="palette-grid-full">
      <label v-for="color in selectedColors" :key="color.id" class="swatch" :style="{
        background: color.hex,
        borderColor: activeColorId === color.id ? '#0ea5e9' : 'transparent'
      }" :title="`${color.name} - ${color.hex}`">
        <input type="checkbox" :checked="selectedColorIds.includes(color.id)" @change="toggleSelection(color.id)" />
        <button type="button" class="swatch-btn" @click="setActive(color.id)"></button>
      </label>

      <button class="collapse-card" @click="isExpanded = false" title="收起">
        <span class="expand-icon">▲</span>
      </button>
    </div>

    <!-- 颜色编辑弹窗 -->
    <ColorEditorModal v-if="showModal" :palette="palette" :selected-color-ids="selectedColorIds"
      @confirm="handleModalConfirm" @close="showModal = false" />
  </div>
</template>

<style scoped>
.palette-panel {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.palette-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.title-section {
  flex: 1;
  min-width: 200px;
}

.panel-title {
  font-weight: 700;
  font-size: 16px;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.note {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.expand-hint {
  color: #7dd3fc;
  font-weight: 600;
}

.palette-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.current-brush {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 8px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

.brush-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.brush-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  color: #e2e8f0;
  font-weight: 600;
  font-size: 12px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 紧凑网格 - 显示前30个 */
.palette-grid-compact {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
  gap: 8px;
  max-width: 100%;
}

/* 完整网格 - 展开后 */
.palette-grid-full {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
  gap: 8px;
  max-width: 100%;
}

.swatch {
  position: relative;
  aspect-ratio: 1;
  border: 3px solid transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  transition: all 120ms ease;
  cursor: pointer;
}

.swatch:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.swatch input {
  position: absolute;
  width: 16px;
  height: 16px;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.swatch-btn {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 5px;
}

/* 展开/收起卡片 */
.expand-card,
.collapse-card {
  aspect-ratio: 1;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 120ms ease;
  padding: 0;
}

.expand-card:hover,
.collapse-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.expand-icon {
  font-size: 20px;
  color: #7dd3fc;
}

/* 按钮样式 */
button {
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid transparent;
  font-weight: 600;
  transition: all 120ms ease;
}

.primary-small {
  background: linear-gradient(135deg, #0ea5e9, #22d3ee);
  color: #0b1021;
  border: none;
  padding: 8px 14px;
  font-size: 13px;
}

.primary-small:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.ghost-small {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px 14px;
  font-size: 13px;
}

.ghost-small:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 720px) {

  .palette-grid-compact,
  .palette-grid-full {
    grid-template-columns: repeat(auto-fill, minmax(28px, 1fr));
  }

  .palette-header {
    flex-direction: column;
    align-items: stretch;
  }

  .palette-toolbar {
    justify-content: flex-start;
  }

  .current-brush {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
