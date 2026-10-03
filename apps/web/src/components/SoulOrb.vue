<script setup lang="ts">
defineProps<{ compact?: boolean }>()
</script>

<template>
  <div class="soul-orb" :class="{ compact }" aria-hidden="true">
    <i v-for="index in 7" :key="index"></i>
    <span>✦</span>
  </div>
</template>
