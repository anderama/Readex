<script setup lang="ts">
import logo from '@/assets/brand/logo-mark.svg'
withDefaults(defineProps<{ size?: 'md' | 'sm' }>(), { size: 'md' })
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <img :src="logo" alt="" :class="size === 'md' ? 'size-9' : 'size-8'" />
    <span class="font-semibold text-sauce" :class="size === 'md' ? 'text-subtitle' : 'text-[20px]'">Readex</span>
  </span>
</template>
