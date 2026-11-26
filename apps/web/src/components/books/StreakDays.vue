<script setup lang="ts">
// Sequência: 7 marcadores de 32px (dia cumprido em Sauce com check; hoje contornado)
import { Check } from 'lucide-vue-next'
import type { Streak } from '@/services/types'

defineProps<{ streak: Streak }>()
const names: Record<string, string> = { D: 'domingo', S: 'dia', T: 'terça', Q: 'dia' }
void names
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <p class="text-body-16 font-semibold text-smoky">{{ streak.current }} {{ streak.current === 1 ? 'dia seguido' : 'dias seguidos' }}</p>
      <p class="text-body-14 text-secondary">Recorde: {{ streak.record }}</p>
    </div>
    <ol class="flex items-start justify-between">
      <li v-for="d in streak.week" :key="d.date" class="flex flex-col items-center gap-2">
        <span
          class="flex size-8 items-center justify-center rounded-sm"
          :class="d.done ? 'bg-sauce text-white' : d.today ? 'border-2 border-sauce' : 'border border-cloud bg-chefs'"
          role="img" :aria-label="`${d.today ? 'Hoje' : d.date}: ${d.done ? 'meta cumprida' : 'meta não cumprida'}`"
        ><Check v-if="d.done" :size="14" :stroke-width="3" aria-hidden="true" /></span>
        <span class="text-body-12" :class="d.today ? 'font-semibold text-smoky' : 'text-secondary'" aria-hidden="true">{{ d.label }}</span>
      </li>
    </ol>
    <p class="text-body-14 text-secondary">Hoje: {{ streak.daily.todayMinutes }} de {{ streak.daily.goalMinutes }} minutos</p>
  </div>
</template>
