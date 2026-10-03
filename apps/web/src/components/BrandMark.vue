<script setup lang="ts">
defineProps<{ size?: number }>()
</script>

<template>
  <svg class="brand-mark" :width="size || 38" :height="size || 38" viewBox="0 0 40 40" aria-hidden="true">
    <defs>
      <linearGradient id="bm-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ff2ff" /><stop offset="1" stop-color="#7d7bff" /></linearGradient>
      <linearGradient id="bm-left" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b5cff" /><stop offset="1" stop-color="#8a2cff" /></linearGradient>
      <linearGradient id="bm-right" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ae8" /><stop offset="1" stop-color="#a13cff" /></linearGradient>
    </defs>
    <path d="M20 3 35 11.5 20 20 5 11.5Z" fill="url(#bm-top)" />
    <path d="M5 11.5 20 20v17L5 28.5Z" fill="url(#bm-left)" />
    <path d="M35 11.5 20 20v17l15-8.5Z" fill="url(#bm-right)" />
    <path d="M20 3 35 11.5v17L20 37 5 28.5v-17Z" fill="none" stroke="rgba(255,255,255,.45)" stroke-width=".8" />
    <path d="M20 20v17M5 11.5 20 20l15-8.5" stroke="rgba(255,255,255,.35)" stroke-width=".7" fill="none" />
  </svg>
</template>
