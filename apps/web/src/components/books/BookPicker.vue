<script setup lang="ts">
// Seletor de livro com busca (usado no compositor de discussão)
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import BookCover from './BookCover.vue'
import SearchBar from './SearchBar.vue'
import { api } from '@/services/http'
import type { Book } from '@/services/types'

const props = defineProps<{ error?: string }>()
const model = defineModel<Book | null>({ default: null })
const q = ref('')
const results = ref<Book[]>([])
let timer: ReturnType<typeof setTimeout>

watch(q, (v) => {
  clearTimeout(timer)
  if (!v.trim()) { results.value = []; return }
  timer = setTimeout(async () => {
    results.value = (await api.get<{ results: Book[] }>('/books', { q: v })).results.slice(0, 5)
  }, 200)
})
void props
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-body-14 font-semibold text-smoky">Livro da discussão</span>
    <div v-if="model" class="flex items-center gap-3 rounded-md border border-border-strong p-3">
      <BookCover :title="model.title" :src="model.coverUrl" :tone="model.coverTone" :width="32" />
      <span class="flex min-w-0 flex-1 flex-col"><span class="truncate text-body-14 font-semibold">{{ model.title }}</span><span class="truncate text-body-12 text-secondary">{{ model.author }}</span></span>
      <button type="button" class="flex size-10 items-center justify-center rounded-md hover:bg-chefs" aria-label="Trocar livro" @click="model = null"><X :size="18" /></button>
    </div>
    <template v-else>
      <SearchBar v-model="q" placeholder="Busque pelo título ou autor" label="Buscar livro da discussão" />
      <ul v-if="results.length" class="flex flex-col rounded-md border border-cloud" role="listbox" aria-label="Livros encontrados">
        <li v-for="b in results" :key="b.id">
          <button type="button" role="option" :aria-selected="false" class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-chefs" @click="model = b; q = ''">
            <BookCover :title="b.title" :src="b.coverUrl" :tone="b.coverTone" :width="24" />
            <span class="flex min-w-0 flex-col"><span class="truncate text-body-14 font-semibold">{{ b.title }}</span><span class="truncate text-body-12 text-secondary">{{ b.author }}</span></span>
          </button>
        </li>
      </ul>
      <p v-if="error" class="text-body-12 font-semibold text-burgundy" role="alert">{{ error }}</p>
    </template>
  </div>
</template>
