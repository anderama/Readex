<script setup lang="ts">
// Skeleton loading enquanto os dados da API carregam
withDefaults(defineProps<{ w?: string; h?: string; rounded?: string }>(), { w: '100%', h: '16px', rounded: '6px' })
</script>

<template>
  <span class="skeleton block" :style="{ width: w, height: h, borderRadius: rounded }" aria-hidden="true" />
</template>
