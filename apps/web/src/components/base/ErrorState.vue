<script setup lang="ts">
// Estado de erro com "Tentar de novo"
import { CloudOff } from 'lucide-vue-next'
import RxButton from './RxButton.vue'
defineProps<{ message?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-16 text-center" role="alert">
    <span class="flex size-14 items-center justify-center rounded-lg bg-chefs text-body"><CloudOff :size="26" aria-hidden="true" /></span>
    <div class="flex max-w-sm flex-col gap-1">
      <p class="text-body-18 font-semibold text-smoky">Não foi possível carregar</p>
      <p class="text-body-14 text-body">{{ message ?? 'Confira sua conexão e tente de novo.' }}</p>
    </div>
    <RxButton variant="secondary" @click="$emit('retry')">Tentar de novo</RxButton>
  </div>
</template>
