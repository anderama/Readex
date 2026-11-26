<script setup lang="ts">
// Minha Estante: livros agrupados por status (Lendo agora, Quero ler, Concluído). Um livro fica em um status por vez.
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxTabs from '@/components/base/RxTabs.vue'
import RxButton from '@/components/base/RxButton.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import BookCover from '@/components/books/BookCover.vue'
import ProgressBar from '@/components/books/ProgressBar.vue'
import ShelfStatusButton from '@/components/books/ShelfStatusButton.vue'
import { api } from '@/services/http'
import type { ShelfItem, ShelfStatus } from '@/services/types'
import { useAsync } from '@/composables/useAsync'
import { ui } from '@/stores/ui'
import { fmtDate, fmtNumber } from '@/utils/format'

type Shelf = { total: number } & Record<ShelfStatus, ShelfItem[]>
const { data, loading, error, load } = useAsync(() => api.get<Shelf>('/shelf'))
const tab = ref('all')

const groups = computed(() => {
  if (!data.value) return []
  const all: { key: ShelfStatus; label: string }[] = [
    { key: 'LENDO', label: 'Lendo agora' },
    { key: 'QUERO_LER', label: 'Quero ler' },
    { key: 'CONCLUIDO', label: 'Concluído' },
  ]
  return all.filter((g) => tab.value === 'all' || tab.value === g.key).map((g) => ({ ...g, items: data.value![g.key] }))
})
const tabs = computed(() => [
  { value: 'all', label: `Todos ${data.value?.total ?? ''}` },
  { value: 'LENDO', label: `Lendo ${data.value?.LENDO.length ?? ''}` },
  { value: 'QUERO_LER', label: `Quero ler ${data.value?.QUERO_LER.length ?? ''}` },
  { value: 'CONCLUIDO', label: `Concluídos ${data.value?.CONCLUIDO.length ?? ''}` },
])

function meta(i: ShelfItem) {
  if (i.status === 'LENDO') return i.progress.currentPage === 0 ? 'Você ainda não começou' : `Página ${fmtNumber(i.progress.currentPage)} de ${fmtNumber(i.progress.pages)} · ${i.progress.percent}%`
  if (i.status === 'CONCLUIDO') return i.finishedAt ? `Concluído em ${fmtDate(i.finishedAt)}` : 'Concluído'
  return `${fmtNumber(i.book.pages)} páginas`
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppTopbar title="Minha Estante" subtitle="Seus livros salvos, em leitura e concluídos" add-book />

    <ErrorState v-if="error" :message="error" @retry="load()" />
    <template v-else>
      <RxTabs v-if="loading || data?.total" v-model="tab" :tabs="tabs" label="Filtrar estante" />

      <div v-if="loading" class="flex flex-col gap-6">
        <div v-for="i in 4" :key="i" class="flex items-center gap-4"><SkeletonBlock w="64px" h="96px" /><div class="flex flex-1 flex-col gap-2"><SkeletonBlock w="40%" /><SkeletonBlock w="25%" h="12px" /></div></div>
      </div>

      <!-- Estante vazia (texto do documento de requisitos) -->
      <EmptyState v-else-if="!data?.total" title="Sua estante está vazia. Adicione um livro!" text="Busque pelo título, autor ou gênero e salve em Quero ler, Lendo agora ou Concluído." mascot="reading">
        <RxButton to="/explorar?adicionar=1">Adicionar livro</RxButton>
      </EmptyState>

      <div v-else class="grid grid-cols-1 gap-10 wide:grid-cols-[minmax(0,1fr)_400px] wide:gap-16 full:grid-cols-[minmax(0,1fr)_480px]">
        <div class="flex min-w-0 flex-col gap-8">
          <section v-for="g in groups" :key="g.key" class="flex flex-col" :aria-labelledby="`g-${g.key}`">
            <h2 :id="`g-${g.key}`" class="pb-2 text-body-16 font-semibold text-smoky">{{ g.label }} · {{ g.items.length }}</h2>
            <p v-if="!g.items.length" class="py-4 text-body-14 text-secondary">Nenhum livro aqui ainda.</p>
            <ul class="divide-y divide-cloud">
              <li v-for="i in g.items" :key="i.book.id" class="flex items-center gap-4 py-4">
                <RouterLink :to="`/livros/${i.book.slug}`" class="shrink-0 transition-transform hover:-translate-y-0.5" tabindex="-1" aria-hidden="true">
                  <BookCover :title="i.book.title" :author="i.book.author" :src="i.book.coverUrl" :tone="i.book.coverTone" :width="64" />
                </RouterLink>
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <RouterLink :to="`/livros/${i.book.slug}`" class="truncate text-body-16 font-semibold text-smoky hover:underline">{{ i.book.title }}</RouterLink>
                  <span class="truncate text-body-14 text-secondary">{{ i.book.author }}</span>
                  <span class="text-body-12 text-secondary">{{ meta(i) }}</span>
                  <div v-if="i.status === 'LENDO'" class="mt-1 flex max-w-[280px] items-center gap-3">
                    <ProgressBar :value="i.progress.percent" :label="`Progresso de ${i.book.title}`" />
                    <button type="button" class="shrink-0 text-body-12 font-semibold text-sauce hover:underline" @click="ui.progress = { book: i.book, progress: i.progress }">Atualizar</button>
                  </div>
                </div>
                <ShelfStatusButton :book="i.book" :status="i.status" />
              </li>
            </ul>
          </section>
        </div>
        <aside class="flex flex-col gap-2">
          <h2 class="text-body-16 font-semibold text-smoky">Como funciona</h2>
          <p class="text-body-14 text-body">“Quero ler” salva o livro na sua estante. Pela seta, você marca como Lendo agora ou Concluído, ou remove o livro. Ao registrar a última página, o livro vai sozinho para Concluído.</p>
        </aside>
      </div>
    </template>
  </div>
</template>
