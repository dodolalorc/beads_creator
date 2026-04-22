<script setup lang="ts">
import { computed, ref } from "vue";

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
}>();

const emit = defineEmits<{
  confirm: [ids: string[]];
  close: [];
}>();

const selectedColorIds = ref<string[]>([...props.selectedColorIds]);

const seriesInfo = [
  { key: 'A', label: 'A系列 (26个) - 黄色系' },
  { key: 'B', label: 'B系列 (32个) - 黄绿系' },
  { key: 'C', label: 'C系列 (29个) - 绿色系' },
  { key: 'D', label: 'D系列 (26个) - 青绿系' },
  { key: 'E', label: 'E系列 (24个) - 青色系' },
  { key: 'F', label: 'F系列 (25个) - 蓝色系' },
  { key: 'G', label: 'G系列 (21个) - 紫色系' },
  { key: 'H', label: 'H系列 (23个) - 红紫系' },
  { key: 'M', label: 'M系列 (15个) - 灰度系' },
];

const allColors = computed(() => Object.values(props.palette).flat());

const colorsInSeries = (seriesKey: string): PaletteColor[] => {
  return props.palette[seriesKey as keyof PaletteColorMap] || [];
};

const isSeriesSelected = (seriesKey: string): boolean => {
  const colors = colorsInSeries(seriesKey);
  return colors.every((c) => selectedColorIds.value.includes(c.id));
};

const isSeriesPartiallySelected = (seriesKey: string): boolean => {
  const colors = colorsInSeries(seriesKey);
  const selected = colors.filter((c) => selectedColorIds.value.includes(c.id));
  return selected.length > 0 && selected.length < colors.length;
};

function toggleSeries(seriesKey: string) {
  const colors = colorsInSeries(seriesKey);
  const isSelected = isSeriesSelected(seriesKey);

  if (isSelected) {
    // 取消全部
    selectedColorIds.value = selectedColorIds.value.filter(
      (id) => !colors.some((c) => c.id === id)
    );
  } else {
    // 选中全部
    const newIds = colors.map((c) => c.id);
    selectedColorIds.value = [
      ...selectedColorIds.value,
      ...newIds.filter((id) => !selectedColorIds.value.includes(id)),
    ];
  }
}

function toggleColor(colorId: string) {
  if (selectedColorIds.value.includes(colorId)) {
    selectedColorIds.value = selectedColorIds.value.filter((id) => id !== colorId);
  } else {
    selectedColorIds.value = [...selectedColorIds.value, colorId];
  }
}

function selectAll() {
  selectedColorIds.value = allColors.value.map((c) => c.id);
}

function clearAll() {
  selectedColorIds.value = [];
}

function confirm() {
  emit("confirm", selectedColorIds.value);
}
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>编辑色板</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <!-- 系列选择 -->
        <div class="series-section">
          <div class="section-title">按系列选择</div>
          <div class="series-controls">
            <button class="ghost-small" @click="selectAll">全选</button>
            <button class="ghost-small" @click="clearAll">清空</button>
          </div>
          <div class="series-list">
            <label v-for="series in seriesInfo" :key="series.key" class="series-item">
              <input type="checkbox" :checked="isSeriesSelected(series.key)"
                :indeterminate="isSeriesPartiallySelected(series.key)" @change="toggleSeries(series.key)" />
              <span class="series-name">{{ series.label }}</span>
            </label>
          </div>
        </div>

        <!-- 单个颜色选择 -->
        <div class="colors-section">
          <div class="section-title">或单个选择颜色</div>
          <div class="colors-grid">
            <label v-for="color in allColors" :key="color.id" class="color-item" :style="{ background: color.hex }">
              <input type="checkbox" :checked="selectedColorIds.includes(color.id)" @change="toggleColor(color.id)" />
              <span class="color-label">{{ color.name }}</span>
            </label>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats">
          已选择 <strong>{{ selectedColorIds.length }}</strong> 个颜色
        </div>
      </div>

      <div class="modal-footer">
        <button class="ghost" @click="$emit('close')">取消</button>
        <button class="primary" @click="confirm">确认</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--paper-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: linear-gradient(180deg, rgba(255, 250, 241, 0.98), rgba(244, 233, 214, 0.96));
  border: 1px solid var(--paper-line);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  max-width: 600px;
  width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--paper-shadow);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--paper-line);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--paper-text);
}

.close-btn {
  background: none;
  border: none;
  color: var(--paper-text-soft);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--paper-text);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.series-section,
.colors-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-weight: 600;
  color: var(--paper-text);
  font-size: 14px;
}

.series-controls {
  display: flex;
  gap: 8px;
}

.ghost-small {
  background: var(--paper-bg-strong);
  color: var(--paper-text);
  border: 1px solid var(--paper-line);
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.ghost-small:hover {
  background: var(--paper-bg-soft);
}

.series-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.series-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background: rgba(233, 221, 202, 0.45);
  cursor: pointer;
  transition: background 120ms ease;
}

.series-item:hover {
  background: rgba(228, 209, 181, 0.64);
}

.series-item input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.series-name {
  color: var(--paper-text-muted);
}

.colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.color-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px solid rgba(126, 98, 67, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 120ms ease;
}

.color-item input {
  position: absolute;
  width: 16px;
  height: 16px;
  opacity: 0;
  cursor: pointer;
}

.color-item:has(input:checked) {
  border-color: var(--paper-accent);
  box-shadow: 0 0 0 3px rgba(157, 109, 60, 0.14);
}

.color-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(67, 53, 42, 0.58);
  color: #fffaf0;
  padding: 4px;
  font-size: 11px;
  text-align: center;
  font-weight: 600;
}

.stats {
  padding: 8px 12px;
  background: var(--paper-bg-soft);
  border-radius: 8px;
  font-size: 12px;
  color: var(--paper-text-muted);
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--paper-line);
  justify-content: flex-end;
}

button {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-weight: 600;
  cursor: pointer;
  transition: all 120ms ease;
}

.primary {
  background: linear-gradient(135deg, #b88757, #93633d);
  color: var(--paper-button-text);
}

.ghost {
  background: var(--paper-bg-strong);
  color: var(--paper-text);
  border: 1px solid var(--paper-line);
}

.ghost:hover {
  background: var(--paper-bg-soft);
}

/* 美化 checkbox */
input[type="checkbox"] {
  accent-color: var(--paper-accent);
}
</style>
