<script setup lang="ts">
// RX/Chip (selecionável) e RX/Tag (rótulo com tom). Raio 8, nunca pílula.
const props = withDefaults(defineProps<{
  as?: 'chip' | 'tag'
  selected?: boolean
  tone?: 'neutral' | 'brand' | 'success' | 'info' | 'warning' | 'error'
}>(), { as: 'chip', tone: 'neutral' })
defineEmits<{ click: [] }>()

const tones = {
  neutral: 'bg-chefs text-body',
  brand: 'bg-fire-light text-smoky',
  success: 'bg-success-soft text-[#1c6b3a]',
  info: 'bg-info-soft text-[#1d4f9e]',
  warning: 'bg-warning-soft text-smoky',
  error: 'bg-negative-soft text-burgundy',
}
void props
</script>

<template>
  <button
    v-if="as === 'chip'" type="button" :aria-pressed="selected"
    class="inline-flex h-10 items-center gap-2 rounded-sm border px-4 text-body-14 font-semibold transition-ui"
    :class="selected ? 'border-smoky bg-smoky text-white' : 'border-border-strong bg-white text-body hover:border-smoky hover:text-smoky'"
    @click="$emit('click')"
  ><slot /></button>
  <span v-else class="inline-flex h-6 items-center gap-1 rounded-sm px-2 text-body-12 font-semibold" :class="tones[tone]"><slot /></span>
</template>
