<script setup lang="ts">
import waving from '@/assets/mascot/waving.png'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import RxButton from '@/components/base/RxButton.vue'
</script>

<template>
  <main class="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
    <BrandLogo />
    <img :src="waving" alt="" class="h-48 w-auto" />
    <div class="flex max-w-md flex-col gap-2">
      <h1 class="text-title-40 font-bold text-smoky">Sua conta foi excluída</h1>
      <p class="text-body-16 text-body">Apagamos seus dados. Obrigado por ler com a gente. Se quiser voltar, é só criar uma conta nova.</p>
    </div>
    <div class="flex flex-wrap justify-center gap-3">
      <RxButton to="/criar-conta">Criar nova conta</RxButton>
      <RxButton variant="secondary" to="/entrar">Ir para o login</RxButton>
    </div>
  </main>
</template>
