<script setup lang="ts">
// Abas com sublinhado de 2px (ativa em SemiBold Smoky Black). Podem ser links (RouterLink) ou botões.
import { RouterLink } from 'vue-router'

defineProps<{ tabs: { value: string; label: string; to?: string }[]; label: string }>()
const model = defineModel<string>()
</script>

<template>
  <div role="tablist" :aria-label="label" class="scrollbar-none flex gap-6 overflow-x-auto border-b border-cloud sm:gap-8">
    <template v-for="t in tabs" :key="t.value">
      <RouterLink
        v-if="t.to" :to="t.to" role="tab" :aria-selected="model === t.value" replace
        class="-mb-px shrink-0 border-b-2 pb-3 pt-1 text-body-14 transition-ui"
        :class="model === t.value ? 'border-smoky font-semibold text-smoky' : 'border-transparent text-body hover:text-smoky'"
      >{{ t.label }}</RouterLink>
      <button
        v-else type="button" role="tab" :aria-selected="model === t.value"
        class="-mb-px shrink-0 border-b-2 pb-3 pt-1 text-body-14 transition-ui"
        :class="model === t.value ? 'border-smoky font-semibold text-smoky' : 'border-transparent text-body hover:text-smoky'"
        @click="model = t.value"
      >{{ t.label }}</button>
    </template>
  </div>
</template>
