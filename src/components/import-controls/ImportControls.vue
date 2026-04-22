<script setup lang="ts">
import type { ImportSettings } from "../../lib/pixel-art";

const model = defineModel<ImportSettings>({ required: true });

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
        <span class="btn-icon">✨</span>
        <span>新建画布</span>
      </button>
      <label class="upload-btn">
        <span class="btn-icon">📁</span>
        <span>{{ processing ? "处理中..." : "上传照片生成图纸" }}</span>
        <input type="file" accept="image/*" :disabled="processing" @change="handleFileChange" />
      </label>
    </div>

    <div class="form-col">
      <label>
        生成方式
        <select v-model="model.mode">
          <option value="default">默认量化</option>
          <option value="ai">AI 辅助</option>
        </select>
      </label>

      <label>
        风格
        <select v-model="model.style">
          <option value="bead-contrast">拼豆高对比</option>
          <option value="anime">动漫描边</option>
          <option value="retro">复古像素</option>
          <option value="soft">柔和插画</option>
        </select>
      </label>

      <label>
        用户 Prompt
        <textarea
          v-model="model.prompt"
          rows="3"
          placeholder="例如：保留人物轮廓，减少背景细节，适合拼豆制作"
        ></textarea>
      </label>

      <label>
        豆包 Token
        <input v-model="model.doubaoApiKey" type="password" placeholder="桌面端可留空，改用 ARK_API_KEY 环境变量" />
      </label>

      <label>
        豆包模型名
        <input v-model="model.doubaoModel" type="text" placeholder="doubao-seededit-3-0-i2i-250628" />
      </label>

      <label>
        豆包 API Base URL
        <input v-model="model.doubaoBaseUrl" type="text" placeholder="https://ark.cn-beijing.volces.com/api/v3" />
      </label>

      <label>
        Guidance Scale
        <input v-model.number="model.doubaoGuidanceScale" type="number" min="1" max="10" step="0.1" />
      </label>

      <label>
        豆包输出尺寸
        <select v-model="model.doubaoSize">
          <option value="adaptive">adaptive</option>
          <option value="1024x1024">1024x1024</option>
          <option value="2048x2048">2048x2048</option>
        </select>
      </label>
    </div>

    <p v-if="sourceImageName" class="note">当前源图：{{ sourceImageName }}</p>
    <p class="note">默认模式直接做像素采样和固定色板映射；AI 辅助优先走 Tauri 桌面端的豆包 SeedEdit，失败时自动回退到本地风格增强。</p>
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

.button-col,
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

input,
select,
textarea {
  width: 100%;
  background: var(--paper-bg-strong);
  border: 1px solid var(--paper-line);
  border-radius: 12px;
  padding: 9px 10px;
  color: var(--paper-text);
  font-size: 13px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

textarea {
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--paper-accent);
  box-shadow: 0 0 0 3px rgba(157, 109, 60, 0.12);
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
