<script setup lang="ts">
// Título de seção (16 SemiBold) com link opcional à direita (14 SemiBold, Sauce Piquante)
import { RouterLink } from 'vue-router'
defineProps<{ title: string; link?: string; linkLabel?: string; as?: 'h2' | 'h3' }>()
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <component :is="as ?? 'h2'" class="text-body-16 font-semibold text-smoky">{{ title }}</component>
    <slot>
      <RouterLink v-if="link" :to="link" class="text-body-14 font-semibold text-sauce hover:underline">{{ linkLabel }}</RouterLink>
    </slot>
  </div>
</template>
