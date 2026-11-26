<script setup lang="ts">
// Layout logado: sidebar fixa (desktop ≥1024), menu recolhido em gaveta (tablet 768–1023) e barra de abas (celular <768)
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Menu } from 'lucide-vue-next'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTabBar from '@/components/layout/AppTabBar.vue'
import PageGradient from '@/components/layout/PageGradient.vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import UpdateProgressModal from '@/components/modals/UpdateProgressModal.vue'
import FinishBookModal from '@/components/modals/FinishBookModal.vue'
import PostComposer from '@/components/modals/PostComposer.vue'

const route = useRoute()
const drawer = ref(false)
watch(() => route.fullPath, () => { drawer.value = false })
</script>

<template>
  <div class="relative min-h-dvh isolate">
    <a href="#conteudo" class="sr-only z-[70] rounded-md bg-smoky px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Pular para o conteúdo</a>
    <PageGradient :height="(route.meta.gradient as number) ?? 640" />

    <!-- Desktop: sidebar fixa -->
    <div class="fixed inset-y-0 left-0 z-30 hidden lg:block"><AppSidebar /></div>

    <!-- Tablet: barra com botão de menu -->
    <div class="sticky top-0 z-30 hidden items-center justify-between border-b border-white/60 bg-white/55 px-6 py-3 backdrop-blur-[16px] md:flex lg:hidden">
      <BrandLogo size="sm" />
      <button type="button" class="flex size-12 items-center justify-center rounded-md text-smoky hover:bg-smoky/5" aria-label="Abrir menu" :aria-expanded="drawer" @click="drawer = true"><Menu :size="24" /></button>
    </div>
    <Transition name="fade"><div v-if="drawer" class="fixed inset-0 z-40 bg-smoky/48 lg:hidden" @click="drawer = false" /></Transition>
    <Transition name="panel">
      <div v-if="drawer" class="fixed inset-y-0 left-0 z-50 bg-white shadow-modal lg:hidden" role="dialog" aria-label="Menu" @keydown.esc="drawer = false">
        <AppSidebar @navigate="drawer = false" />
      </div>
    </Transition>

    <main id="conteudo" class="px-6 pb-[136px] pt-6 md:px-10 md:pb-16 md:pt-8 lg:ml-60 lg:pt-12 wide:px-20">
      <div class="mx-auto w-full max-w-[1520px]">
        <RouterView v-slot="{ Component }">
          <!-- Troca de aba (ex.: abas do livro e do perfil) não recria a página -->
          <component :is="Component" :key="`${String(route.name)}-${route.params.slug ?? route.params.username ?? route.params.id ?? ''}`" />
        </RouterView>
      </div>
    </main>

    <div class="md:hidden"><AppTabBar /></div>

    <UpdateProgressModal />
    <FinishBookModal />
    <PostComposer />
  </div>
</template>
