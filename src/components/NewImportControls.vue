<script setup lang="ts">
const props = defineProps<{
  statusMessage?: string;
  paletteError?: string;
}>();

const emit = defineEmits<{
  initBlank: [];
  uploadImage: [event: Event];
}>();
</script>

<template>
  <div class="control-group">
    <div class="section-title">新建与导入</div>
    <div class="button-col">
      <button class="primary" @click="emit('initBlank')">
        <span class="btn-icon">✨</span>
        <span>新建画布</span>
      </button>
      <label class="upload-btn">
        <span class="btn-icon">📁</span>
        <span>上传图片</span>
        <input
          type="file"
          accept="image/*"
          @change="(e) => emit('uploadImage', e)"
        />
      </label>
    </div>
    <p v-if="props.statusMessage" class="status">{{ props.statusMessage }}</p>
    <p v-if="props.paletteError" class="error">{{ props.paletteError }}</p>
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
  margin: 0;
}

.button-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.primary {
  cursor: pointer;
  border-radius: 10px;
  border: none;
  padding: 10px 16px;
  font-weight: 700;
  font-size: 14px;
  transition: all 120ms ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  background: linear-gradient(135deg, #0ea5e9, #22d3ee);
  color: #0b1021;
}

.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

.upload-btn {
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  padding: 10px 16px;
  font-weight: 700;
  font-size: 14px;
  transition: all 120ms ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.upload-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.upload-btn input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.status {
  color: #67e8f9;
  margin: 0;
  font-size: 13px;
  padding: 8px 12px;
  background: rgba(103, 232, 249, 0.1);
  border-radius: 8px;
  border-left: 3px solid #67e8f9;
}

.error {
  color: #fca5a5;
  margin: 0;
  font-size: 13px;
  padding: 8px 12px;
  background: rgba(252, 165, 165, 0.1);
  border-radius: 8px;
  border-left: 3px solid #fca5a5;
}
</style>
