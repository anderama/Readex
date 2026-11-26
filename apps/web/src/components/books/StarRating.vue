<script setup lang="ts">
// StarRating: exibição (somente leitura) ou escolha de nota de 1 a 5 (grupo de rádio acessível)
import { ref } from 'vue'
import { Star } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ value?: number; readonly?: boolean; size?: number; label?: string }>(), { value: 0, size: 16 })
const emit = defineEmits<{ change: [value: number] }>()
const hover = ref(0)

function onKey(e: KeyboardEvent) {
  if (props.readonly) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); emit('change', Math.min(5, (props.value || 0) + 1)) }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); emit('change', Math.max(1, (props.value || 1) - 1)) }
}
</script>

<template>
  <span v-if="readonly" class="inline-flex items-center gap-0.5" role="img" :aria-label="`${value} de 5 estrelas`">
    <Star v-for="i in 5" :key="i" :size="size" :stroke-width="2" :class="i <= Math.round(value) ? 'fill-sauce text-sauce' : 'text-sauce'" aria-hidden="true" />
  </span>
  <div v-else role="radiogroup" :aria-label="label ?? 'Sua nota'" class="inline-flex items-center gap-1" @keydown="onKey" @mouseleave="hover = 0">
    <button
      v-for="i in 5" :key="i" type="button" role="radio" :aria-checked="value === i" :aria-label="`${i} ${i === 1 ? 'estrela' : 'estrelas'}`"
      :tabindex="(value || 1) === i ? 0 : -1" class="rounded-sm p-0.5 transition-transform hover:scale-110"
      @click="emit('change', i)" @mouseenter="hover = i"
    >
      <Star :size="size" :stroke-width="2" :class="i <= (hover || value) ? 'fill-sauce text-sauce' : 'text-border-strong'" />
    </button>
  </div>
</template>
