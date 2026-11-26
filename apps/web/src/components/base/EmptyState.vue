<script setup lang="ts">
// Estado vazio ilustrado com o mascote (estante vazia, busca sem resultados, leitura não iniciada)
import reading from '@/assets/mascot/reading.png'
import waving from '@/assets/mascot/waving.png'
import running from '@/assets/mascot/running.png'

withDefaults(defineProps<{ title: string; text?: string; mascot?: 'reading' | 'waving' | 'running' | 'none'; compact?: boolean }>(), { mascot: 'reading' })
const images = { reading, waving, running }
</script>

<template>
  <div class="flex flex-col items-center gap-4 text-center" :class="compact ? 'py-6' : 'py-12'">
    <img v-if="mascot !== 'none'" :src="images[mascot]" alt="" class="h-auto object-contain" :class="compact ? 'w-24' : 'w-36'" />
    <div class="flex max-w-sm flex-col gap-1">
      <p class="text-body-18 font-semibold text-smoky">{{ title }}</p>
      <p v-if="text" class="text-body-14 text-body">{{ text }}</p>
    </div>
    <div v-if="$slots.default" class="mt-2 flex flex-wrap justify-center gap-3"><slot /></div>
  </div>
</template>
