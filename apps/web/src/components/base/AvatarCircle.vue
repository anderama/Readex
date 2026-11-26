<script setup lang="ts">
// RX/Avatar: foto ou iniciais sobre Drifting Cloud
import { computed } from 'vue'
import { initials } from '@/utils/format'

const props = withDefaults(defineProps<{ name: string; src?: string | null; size?: number }>(), { size: 40 })
const text = computed(() => initials(props.name))
const fontSize = computed(() => (props.size >= 96 ? 32 : props.size >= 64 ? 22 : props.size >= 40 ? 14 : 12))
</script>

<template>
  <span class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-cloud font-semibold text-smoky" :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${fontSize}px` }">
    <img v-if="src" :src="src" :alt="`Foto de ${name}`" class="size-full object-cover" />
    <span v-else aria-hidden="true">{{ text }}</span>
  </span>
</template>
