<script setup lang="ts">
import { ref, watch } from "vue";

const model = defineModel<{ width: number; height: number }>({
  default: () => ({ width: 60, height: 60 }),
});

const tempWidth = ref(model.value.width);
const tempHeight = ref(model.value.height);

function onWidthInput(e: Event) {
  let v = Number((e.target as HTMLInputElement).value);
  if (!isNaN(v)) {
    tempWidth.value = Math.max(1, Math.min(200, Math.floor(v)));
  }
}

function onHeightInput(e: Event) {
  let v = Number((e.target as HTMLInputElement).value);
  if (!isNaN(v)) {
    tempHeight.value = Math.max(1, Math.min(200, Math.floor(v)));
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
  { deep: true }
);
</script>

<template>
  <div class="control-group">
    <div class="section-title">画布尺寸</div>
    <div class="form-col">
      <label>
        宽度
        <input
          type="number"
          min="1"
          max="200"
          step="1"
          :value="tempWidth"
          @input="onWidthInput"
        />
      </label>
      <label>
        高度
        <input
          type="number"
          min="1"
          max="200"
          step="1"
          :value="tempHeight"
          @input="onHeightInput"
        />
      </label>
    </div>
    <div class="button-row">
      <button class="primary" @click="applyChanges">应用尺寸</button>
      <button class="ghost" @click="resetChanges">重置</button>
    </div>
    <p class="note">修改后点击"应用尺寸"将重置画布为空白</p>
  </div>
</template>

<style scoped>
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
  color: #e2e8f0;
}

input[type="number"] {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px;
  color: #e2e8f0;
  font-size: 14px;
}

input[type="number"]:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.button-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

.primary {
  background: linear-gradient(135deg, #0ea5e9, #22d3ee);
  color: #0b1021;
  border: none;
}

.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.ghost {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}

.note {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .button-row {
    flex-direction: column;
  }
}
</style>
