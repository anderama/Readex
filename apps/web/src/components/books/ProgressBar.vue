<script setup lang="ts">
// Barra de progresso: 6px no destaque, 4px em listas. Trilho branco sobre o gradiente, Drifting Cloud no branco.
withDefaults(defineProps<{ value: number; preview?: number; thick?: boolean; onGradient?: boolean; label?: string }>(), {})
</script>

<template>
  <div
    role="progressbar" :aria-valuenow="Math.round(value)" aria-valuemin="0" aria-valuemax="100" :aria-label="label ?? 'Progresso'"
    class="relative w-full overflow-hidden rounded-full" :class="[thick ? 'h-1.5' : 'h-1', onGradient ? 'bg-white' : 'bg-cloud']"
  >
    <div v-if="preview !== undefined && preview > value" class="absolute inset-y-0 left-0 rounded-full bg-sauce/45 transition-[width] duration-300" :style="{ width: `${Math.min(100, preview)}%` }" />
    <div class="absolute inset-y-0 left-0 rounded-full bg-sauce transition-[width] duration-300" :style="{ width: `${Math.min(100, Math.max(0, value))}%` }" />
  </div>
</template>
