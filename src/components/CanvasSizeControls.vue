<script setup lang="ts">
const props = defineProps<{
    width: number;
    height: number;
}>();

const emit = defineEmits<{
    'update:width': [value: number];
    'update:height': [value: number];
    apply: [];
}>();

function onWidthInput(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    emit('update:width', v);
}

function onHeightInput(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    emit('update:height', v);
}
</script>

<template>
    <div class="control-group">
        <div class="section-title">画布尺寸</div>
        <div class="form-col">
            <label>宽度
                <input type="number" min="1" max="200" :value="props.width" @input="onWidthInput"
                    @change="emit('apply')" />
            </label>
            <label>高度
                <input type="number" min="1" max="200" :value="props.height" @input="onHeightInput"
                    @change="emit('apply')" />
            </label>
        </div>
        <p class="note">修改后将重置画布为空白</p>
    </div>
</template>
