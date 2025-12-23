<script setup lang="ts">
import { computed, ref } from "vue";
type PaletteColor = { id: string; name: string; hex: string };

const props = defineProps<{ palette: Record<string, PaletteColor[]> }>();

const replaceFrom = defineModel<string | null>("replaceFrom", {
  default: null,
});
const replaceTo = defineModel<string | null>("replaceTo", { default: null });

const emit = defineEmits<{ submit: [] }>();

const allColors = computed(() => Object.values(props.palette).flat());

const selectedFromColor = computed(() =>
  allColors.value.find((c) => c.id === replaceFrom.value)
);

const selectedToColor = computed(() =>
  allColors.value.find((c) => c.id === replaceTo.value)
);

const fromDropdownOpen = ref(false);
const toDropdownOpen = ref(false);

function selectFromColor(colorId: string) {
  replaceFrom.value = colorId;
  fromDropdownOpen.value = false;
}

function selectToColor(colorId: string) {
  replaceTo.value = colorId;
  toDropdownOpen.value = false;
}
</script>

<template>
  <div class="control-group">
    <div class="section-title">批量换色</div>
    <div class="form-col">
      <label>
        从
        <div
          class="custom-select"
          @click="fromDropdownOpen = !fromDropdownOpen"
        >
          <div class="select-display">
            <span
              v-if="selectedFromColor"
              class="color-dot"
              :style="{ background: selectedFromColor.hex }"
            ></span>
            <span class="select-text">
              {{ selectedFromColor ? selectedFromColor.name : "请选择" }}
            </span>
          </div>
          <div v-if="fromDropdownOpen" class="dropdown-menu">
            <div
              class="dropdown-item"
              @click.stop="selectFromColor(c.id)"
              v-for="c in allColors"
              :key="c.id"
              :class="{ active: replaceFrom === c.id }"
            >
              <span class="color-dot" :style="{ background: c.hex }"></span>
              <span>{{ c.name }}</span>
            </div>
          </div>
        </div>
      </label>
      <label>
        替换为
        <div class="custom-select" @click="toDropdownOpen = !toDropdownOpen">
          <div class="select-display">
            <span
              v-if="selectedToColor"
              class="color-dot"
              :style="{ background: selectedToColor.hex }"
            ></span>
            <span class="select-text">
              {{ selectedToColor ? selectedToColor.name : "请选择" }}
            </span>
          </div>
          <div v-if="toDropdownOpen" class="dropdown-menu">
            <div
              class="dropdown-item"
              @click.stop="selectToColor(c.id)"
              v-for="c in allColors"
              :key="c.id"
              :class="{ active: replaceTo === c.id }"
            >
              <span class="color-dot" :style="{ background: c.hex }"></span>
              <span>{{ c.name }}</span>
            </div>
          </div>
        </div>
      </label>
    </div>
    <button
      class="primary"
      @click="emit('submit')"
      :disabled="!replaceFrom || !replaceTo"
    >
      执行替换
    </button>
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
  flex-direction: row;
  gap: 10px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  color: #e2e8f0;
  flex: 1;
}

.custom-select {
  position: relative;
  cursor: pointer;
}

.select-display {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
  color: #e2e8f0;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 120ms ease;
}

.custom-select:hover .select-display {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
}

.select-text {
  flex: 1;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.dropdown-item {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 120ms ease;
  color: #e2e8f0;
  font-size: 14px;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.dropdown-item.active {
  background: rgba(14, 165, 233, 0.15);
  color: #67e8f9;
}

.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

select {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 10px 10px 40px;
  color: #e2e8f0;
  font-size: 14px;
  width: 100%;
  cursor: pointer;
  transition: all 120ms ease;
}

select:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
}

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

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  button {
    width: 100%;
  }
}
</style>
