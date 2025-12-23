<script setup lang="ts">
import { computed } from "vue";
type PaletteColor = { id: string; name: string; hex: string };

const props = defineProps<{ palette: Record<string, PaletteColor[]> }>();

const replaceFrom = defineModel<string | null>("replaceFrom", {
  default: null,
});
const replaceTo = defineModel<string | null>("replaceTo", { default: null });

const emit = defineEmits<{ submit: [] }>();

const allColors = computed(() => Object.values(props.palette).flat());
</script>

<template>
  <div class="control-group">
    <div class="section-title">批量换色</div>
    <div class="form-col">
      <label
        >从
        <select v-model="replaceFrom">
          <option :value="null">请选择</option>
          <option v-for="c in allColors" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </label>
      <label
        >替换为
        <select v-model="replaceTo">
          <option :value="null">请选择</option>
          <option v-for="c in allColors" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
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

select {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px;
  color: #e2e8f0;
  font-size: 14px;
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
