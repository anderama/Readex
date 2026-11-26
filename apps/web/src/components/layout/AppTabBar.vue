<script setup lang="ts">
// RX/Tab bar (mobile): 5 abas; a ativa tem fundo Smoky Black atrás do ícone e rótulo em SemiBold
import { RouterLink, useRoute } from 'vue-router'
import { tabItems } from './navItems'

const route = useRoute()
const active = (match: string[]) => match.includes(String(route.name))
</script>

<template>
  <nav aria-label="Navegação principal" class="fixed inset-x-0 bottom-0 z-40 border-t border-cloud bg-white pb-[env(safe-area-inset-bottom)]">
    <ul class="mx-auto flex h-[84px] max-w-xl items-start justify-around px-2 pt-2">
      <li v-for="item in tabItems" :key="item.to" class="flex-1">
        <RouterLink :to="item.to" :aria-current="active(item.match) ? 'page' : undefined" class="flex flex-col items-center gap-1 rounded-md py-1">
          <span class="flex h-8 w-14 items-center justify-center rounded-sm transition-ui" :class="active(item.match) ? 'bg-smoky text-white' : 'text-secondary'">
            <component :is="item.icon" :size="22" aria-hidden="true" />
          </span>
          <span class="text-body-12" :class="active(item.match) ? 'font-semibold text-smoky' : 'text-secondary'">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
