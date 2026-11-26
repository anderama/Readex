<script setup lang="ts">
import reading from '@/assets/mascot/reading.png'
import RxButton from '@/components/base/RxButton.vue'
</script>

<template>
  <main class="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
    <img :src="reading" alt="" class="h-40 w-auto" />
    <h1 class="text-title-40 font-bold text-smoky">Página não encontrada</h1>
    <p class="max-w-md text-body-16 text-body">Esse endereço não existe ou mudou de lugar.</p>
    <RxButton to="/">Voltar ao Início</RxButton>
  </main>
</template>
