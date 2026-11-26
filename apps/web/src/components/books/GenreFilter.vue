<script setup lang="ts">
// GenreFilter: chips de gênero (seleção múltipla) e filtro opcional "Até 350 págs."
import ChipTag from '@/components/base/ChipTag.vue'

defineProps<{ genres: string[]; withPages?: boolean }>()
const selected = defineModel<string[]>({ default: () => [] })
const short = defineModel<boolean>('short', { default: false })

function toggle(g: string) {
  selected.value = selected.value.includes(g) ? selected.value.filter((x) => x !== g) : [...selected.value, g]
}
</script>

<template>
  <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por gênero">
    <ChipTag v-for="g in genres" :key="g" :selected="selected.includes(g)" @click="toggle(g)">{{ g }}</ChipTag>
    <ChipTag v-if="withPages" :selected="short" @click="short = !short">Até 350 págs.</ChipTag>
  </div>
</template>
