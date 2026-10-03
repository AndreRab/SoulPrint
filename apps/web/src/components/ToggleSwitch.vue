<script setup lang="ts">
defineProps<{ modelValue: boolean; label: string; tone?: 'cyan' | 'violet' }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    class="toggle"
    :class="[tone || 'violet', { on: modelValue }]"
    :aria-checked="modelValue"
    :aria-label="label"
    @click="$emit('update:modelValue', !modelValue)"
  ><i></i></button>
</template>
