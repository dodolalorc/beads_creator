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
                <input type="file" accept="image/*" @change="(e) => emit('uploadImage', e)" />
            </label>
        </div>
        <p v-if="props.statusMessage" class="status">{{ props.statusMessage }}</p>
        <p v-if="props.paletteError" class="error">{{ props.paletteError }}</p>
    </div>
</template>
