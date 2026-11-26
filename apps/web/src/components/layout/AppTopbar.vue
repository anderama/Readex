<script setup lang="ts">
// Topbar: título da página (ou saudação), trilha opcional e ações (Adicionar livro, busca e sino)
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ChevronRight, Plus } from 'lucide-vue-next'
import RxButton from '@/components/base/RxButton.vue'
import SearchBar from '@/components/books/SearchBar.vue'
import NotificationBell from './NotificationBell.vue'

withDefaults(defineProps<{
  title: string
  subtitle?: string
  crumbs?: { label: string; to?: string }[]
  search?: boolean
  addBook?: boolean
  bell?: boolean
}>(), { bell: true })

const router = useRouter()
const q = ref('')
const go = (term: string) => router.push({ path: '/explorar', query: term ? { q: term } : {} })
</script>

<template>
  <header class="flex items-start justify-between gap-4">
    <div class="flex min-w-0 flex-col gap-1">
      <nav v-if="crumbs?.length" aria-label="Trilha" class="mb-1">
        <ol class="flex flex-wrap items-center gap-1 text-body-14">
          <li v-for="(c, i) in crumbs" :key="i" class="flex items-center gap-1">
            <RouterLink v-if="c.to" :to="c.to" class="font-semibold text-smoky hover:underline">{{ c.label }}</RouterLink>
            <span v-else class="text-body" aria-current="page">{{ c.label }}</span>
            <ChevronRight v-if="i < crumbs.length - 1" :size="14" class="text-secondary" aria-hidden="true" />
          </li>
        </ol>
      </nav>
      <h1 class="text-subtitle font-bold text-smoky">{{ title }}</h1>
      <p v-if="subtitle" class="text-body-14 text-body">{{ subtitle }}</p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
      <template v-if="addBook">
        <RxButton variant="secondary" to="/explorar?adicionar=1" class="max-md:hidden">Adicionar livro</RxButton>
        <RouterLink to="/explorar?adicionar=1" aria-label="Adicionar livro" class="flex size-12 items-center justify-center rounded-md border-[1.5px] border-smoky text-smoky md:hidden"><Plus :size="22" /></RouterLink>
      </template>
      <div v-if="search" class="hidden w-[280px] xl:block"><SearchBar v-model="q" glass label="Buscar livros e autores" @submit="go" /></div>
      <NotificationBell v-if="bell" />
    </div>
  </header>
</template>
