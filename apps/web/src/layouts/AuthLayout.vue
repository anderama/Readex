<script setup lang="ts">
// Tela dividida do acesso: gradiente + mascote à esquerda e formulário de até 560px à direita.
// No celular: mascote pequeno e logo no topo.
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import panel from '@/assets/brand/gradient-panel.svg'
import waving from '@/assets/mascot/waving.png'
import running from '@/assets/mascot/running.png'
import reading from '@/assets/mascot/reading.png'
import BrandLogo from '@/components/layout/BrandLogo.vue'

const route = useRoute()
const mascots = { waving, running, reading }
const mascot = computed(() => mascots[(route.meta.mascot as keyof typeof mascots) ?? 'waving'])
</script>

<template>
  <div class="grid min-h-dvh lg:grid-cols-2">
    <div class="relative hidden overflow-hidden lg:block" aria-hidden="true">
      <img :src="panel" alt="" class="absolute inset-0 size-full object-cover" />
      <div class="relative flex h-full items-center justify-center p-16">
        <img :src="mascot" alt="" class="h-auto max-h-[60vh] w-auto max-w-[70%] object-contain" />
      </div>
    </div>
    <div class="relative flex flex-col px-6 pb-12 pt-8 sm:px-12 lg:px-16 lg:pt-14">
      <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden lg:hidden" aria-hidden="true">
        <img :src="panel" alt="" class="absolute inset-0 size-full object-cover" />
        <div class="absolute inset-0" style="background: linear-gradient(180deg, rgb(255 255 255 / 0) 0%, rgb(255 255 255 / 0.1) 42%, #fff 68%)" />
      </div>
      <div class="mx-auto flex w-full max-w-[560px] flex-1 flex-col">
        <BrandLogo size="sm" />
        <img :src="mascot" alt="" class="mx-auto mt-6 h-32 w-auto object-contain lg:hidden" aria-hidden="true" />
        <main class="flex flex-1 flex-col justify-center py-8 lg:py-12">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
