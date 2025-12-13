<script setup lang="ts">
import { computed } from "vue";
type PaletteColor = { id: string; name: string; hex: string };

const props = defineProps<{
    palette: Record<string, PaletteColor[]>;
    replaceFrom: string | null;
    replaceTo: string | null;
}>();

const emit = defineEmits<{
    'update:replaceFrom': [value: string | null];
    'update:replaceTo': [value: string | null];
    submit: [];
}>();

const allColors = computed(() => Object.values(props.palette).flat());
</script>

<template>
    <div class="control-group">
        <div class="section-title">批量换色</div>
        <div class="form-col">
            <label>从
                <select :value="props.replaceFrom"
                    @change="(e) => emit('update:replaceFrom', (e.target as HTMLSelectElement).value || null)">
                    <option :value="null">请选择</option>
                    <option v-for="c in allColors" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </label>
            <label>替换为
                <select :value="props.replaceTo"
                    @change="(e) => emit('update:replaceTo', (e.target as HTMLSelectElement).value || null)">
                    <option :value="null">请选择</option>
                    <option v-for="c in allColors" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </label>
        </div>
        <button class="primary" @click="emit('submit')" :disabled="!props.replaceFrom || !props.replaceTo">
            执行替换
        </button>
    </div>
</template>
