<script setup lang="ts">
const emit = defineEmits<{
    csv: [];
    png: [];
}>();
</script>

<template>
    <div class="control-group">
        <div class="section-title">导出工具</div>
        <p class="note">导出色名色号与标注图</p>
        <div class="button-col">
            <button class="primary" @click="emit('csv')">
                <span class="btn-icon">📊</span>
                <span>导出 CSV</span>
            </button>
            <button class="ghost" @click="emit('png')">
                <span class="btn-icon">🖼️</span>
                <span>导出 PNG</span>
            </button>
        </div>
    </div>
</template>
