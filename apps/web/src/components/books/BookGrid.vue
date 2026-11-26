<script setup lang="ts">
// Grade responsiva de livros (colunas de 120px com 24px de espaço)
withDefaults(defineProps<{ loading?: boolean; skeletons?: number }>(), { skeletons: 6 })
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
</script>

<template>
  <ul class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-x-6 gap-y-8">
    <template v-if="loading">
      <li v-for="i in skeletons" :key="i" class="flex flex-col gap-3">
        <SkeletonBlock w="120px" h="180px" />
        <SkeletonBlock w="100px" h="14px" />
        <SkeletonBlock w="70px" h="12px" />
      </li>
    </template>
    <slot v-else />
  </ul>
</template>
