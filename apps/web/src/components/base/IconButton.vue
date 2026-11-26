<script setup lang="ts">
// Botão só de ícone (48x48, ou 40x40 em modais), sempre com aria-label
withDefaults(defineProps<{ label: string; size?: 'md' | 'sm'; outlined?: boolean }>(), { size: 'md' })
</script>

<template>
  <button
    type="button" :aria-label="label" :title="label"
    class="relative inline-flex shrink-0 items-center justify-center rounded-md text-smoky transition-ui hover:bg-smoky/5"
    :class="[size === 'md' ? 'size-12' : 'size-10', outlined && 'border border-border-strong bg-white']"
  ><slot /></button>
</template>
