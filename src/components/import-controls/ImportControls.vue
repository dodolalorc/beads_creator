<script setup lang="ts">
const props = defineProps<{
  statusMessage?: string;
  paletteError?: string;
  processing?: boolean;
  sourceImageName?: string;
}>();

const emit = defineEmits<{
  initBlank: [];
  uploadImage: [file: File];
}>();

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  emit("uploadImage", file);
  input.value = "";
}
</script>

<template>
  <div class="control-group">
    <div class="section-title">图片转拼豆图</div>

    <div class="button-col">
      <button class="primary" :disabled="processing" @click="emit('initBlank')">
        <span class="btn-icon">+</span>
        <span>新建画布</span>
      </button>
      <label class="upload-btn">
        <span class="btn-icon">图</span>
        <span>{{ processing ? "处理中..." : "上传照片生成图纸" }}</span>
        <input type="file" accept="image/*" :disabled="processing" @change="handleFileChange" />
      </label>
    </div>

    <p v-if="sourceImageName" class="note">当前源图：{{ sourceImageName }}</p>
    <p class="note">上传图片后会直接在本地完成缩放、采样和固定色板映射，不再经过任何 AI 处理。</p>
    <p v-if="props.statusMessage" class="status">{{ props.statusMessage }}</p>
    <p v-if="props.paletteError" class="error">{{ props.paletteError }}</p>
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
  gap: 12px;
  box-shadow: var(--paper-shadow-soft);
  backdrop-filter: blur(6px);
}

.section-title {
  font-weight: 700;
  font-size: 14px;
  color: var(--paper-accent-strong);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.button-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.primary {
  cursor: pointer;
  border-radius: 12px;
  border: none;
  padding: 9px 14px;
  font-weight: 700;
  font-size: 13px;
  transition: all 120ms ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  background: linear-gradient(135deg, #b88757, #93633d);
  color: var(--paper-button-text);
  box-shadow: 0 10px 20px rgba(125, 84, 48, 0.18);
}

.primary:hover:not(:disabled),
.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(125, 84, 48, 0.18);
}

.primary:disabled,
.upload-btn:has(input:disabled) {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 14px;
  line-height: 1;
}

.upload-btn {
  cursor: pointer;
  border-radius: 12px;
  border: 1px solid var(--paper-line);
  background: var(--paper-bg-strong);
  color: var(--paper-text);
  padding: 9px 14px;
  font-weight: 700;
  font-size: 13px;
  transition: all 120ms ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.upload-btn input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.note {
  margin: 0;
  color: var(--paper-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.status {
  color: var(--paper-accent-strong);
  margin: 0;
  font-size: 13px;
  padding: 8px 12px;
  background: rgba(184, 135, 87, 0.12);
  border-radius: 10px;
  border-left: 3px solid var(--paper-accent);
}

.error {
  color: #b24f42;
  margin: 0;
  font-size: 13px;
  padding: 8px 12px;
  background: rgba(178, 79, 66, 0.08);
  border-radius: 10px;
  border-left: 3px solid #b24f42;
}
</style>
