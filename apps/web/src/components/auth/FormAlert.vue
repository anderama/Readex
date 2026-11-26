<script setup lang="ts">
// Alerta em linha (erro, sucesso ou informação) acima de formulários
import { CircleAlert, CircleCheck, Info } from 'lucide-vue-next'
withDefaults(defineProps<{ tone?: 'error' | 'success' | 'info' }>(), { tone: 'error' })
</script>

<template>
  <div
    :role="tone === 'error' ? 'alert' : 'status'" class="flex items-start gap-3 rounded-md px-4 py-3 text-body-14"
    :class="{ error: 'bg-negative-soft text-burgundy', success: 'bg-success-soft text-[#1c6b3a]', info: 'bg-info-soft text-[#1d4f9e]' }[tone]"
  >
    <component :is="{ error: CircleAlert, success: CircleCheck, info: Info }[tone]" :size="18" class="mt-0.5 shrink-0" aria-hidden="true" />
    <div class="flex-1"><slot /></div>
  </div>
</template>
