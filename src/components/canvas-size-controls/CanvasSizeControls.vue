<script setup lang="ts">
import { ref, watch } from "vue";

const model = defineModel<{ width: number; height: number }>({
  default: () => ({ width: 60, height: 60 }),
});

const tempWidth = ref(model.value.width);
const tempHeight = ref(model.value.height);

function onWidthInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isNaN(value)) {
    tempWidth.value = Math.max(1, Math.min(200, Math.floor(value)));
  }
}

function onHeightInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isNaN(value)) {
    tempHeight.value = Math.max(1, Math.min(200, Math.floor(value)));
  }
}

function applyChanges() {
  model.value = { width: tempWidth.value, height: tempHeight.value };
}

function resetChanges() {
  tempWidth.value = model.value.width;
  tempHeight.value = model.value.height;
}

watch(
  () => model.value,
  (next) => {
    tempWidth.value = next.width;
    tempHeight.value = next.height;
  },
  { deep: true },
);
</script>

<template>
  <div class="control-group">
    <div class="section-title">画布尺寸</div>
    <div class="form-col">
      <label>
        横向像素
        <input type="number" min="1" max="200" step="1" :value="tempWidth" @input="onWidthInput" />
      </label>
      <label>
        纵向像素
        <input type="number" min="1" max="200" step="1" :value="tempHeight" @input="onHeightInput" />
      </label>
    </div>
    <div class="button-row">
      <button class="primary" @click="applyChanges">应用尺寸</button>
      <button class="ghost" @click="resetChanges">重置</button>
    </div>
    <p class="note">尺寸变更后会尽量保留已有画面，新增区域用当前首个色板色填充。</p>
  </div>
</template>

<style scoped>
.control-group {
  background: var(--paper-bg);
  border: 1px solid var(--paper-line);
  border-radius: 18px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--paper-shadow-soft);
  backdrop-filter: blur(6px);
}

.section-title {
  font-weight: 700;
  font-size: 14px;
  color: var(--paper-accent-strong);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-weight: 600;
  font-size: 13px;
  color: var(--paper-text);
}

input[type="number"] {
  background: var(--paper-bg-strong);
  border: 1px solid var(--paper-line);
  border-radius: 12px;
  padding: 9px 10px;
  color: var(--paper-text);
  font-size: 13px;
}

input[type="number"]:focus {
  outline: none;
  border-color: var(--paper-accent);
  box-shadow: 0 0 0 3px rgba(157, 109, 60, 0.12);
}

.button-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

button {
  cursor: pointer;
  border-radius: 12px;
  border: 1px solid transparent;
  padding: 9px 14px;
  font-weight: 700;
  font-size: 13px;
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

.note {
  margin: 0;
  color: var(--paper-text-muted);
  font-size: 12px;
  line-height: 1.5;
}
</style>
