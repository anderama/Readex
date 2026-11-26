<script setup lang="ts">
// Gradiente de topo (opção A do Figma) com esmaecer até o branco a 68% da altura
import gradient from '@/assets/brand/gradient-header.svg'
withDefaults(defineProps<{ height?: number }>(), { height: 640 })
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden" :style="{ height: `${height}px` }" aria-hidden="true">
    <img :src="gradient" alt="" class="absolute inset-0 size-full object-fill" />
    <div class="absolute inset-0" style="background: linear-gradient(180deg, rgb(255 255 255 / 0) 0%, rgb(255 255 255 / 0.1) 42%, #fff 68%, #fff 100%)" />
  </div>
</template>
