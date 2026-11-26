<script setup lang="ts">
// Detalhes do livro: nota média, gêneros, sinopse, ficha técnica e resenhas; abas Anotações, Discussões e Resenhas.
// Daqui o usuário adiciona à estante, atualiza o progresso ou avalia o livro.
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Plus, Star } from 'lucide-vue-next'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxTabs from '@/components/base/RxTabs.vue'
import RxButton from '@/components/base/RxButton.vue'
import ChipTag from '@/components/base/ChipTag.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import SectionHeader from '@/components/base/SectionHeader.vue'
import BookCover from '@/components/books/BookCover.vue'
import ProgressBar from '@/components/books/ProgressBar.vue'
import StarRating from '@/components/books/StarRating.vue'
import ReviewCard from '@/components/books/ReviewCard.vue'
import ShelfStatusButton from '@/components/books/ShelfStatusButton.vue'
import PostCard from '@/components/community/PostCard.vue'
import NoteItem from '@/components/notes/NoteItem.vue'
import NoteModal from '@/components/modals/NoteModal.vue'
import { api } from '@/services/http'
import type { BookDetails, Note, Post, Review } from '@/services/types'
import { useAsync } from '@/composables/useAsync'
import { toast } from '@/stores/toast'
import { ui } from '@/stores/ui'
import { fmtDate, fmtNumber, fmtRating, statusLabel } from '@/utils/format'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const tab = computed(() => String(route.params.tab || 'detalhes'))
const { data: book, loading, error, load } = useAsync(() => api.get<BookDetails>(`/books/${slug.value}`))

// Abas carregadas sob demanda
const notes = ref<Note[] | null>(null)
const posts = ref<Post[] | null>(null)
const allReviews = ref<Review[] | null>(null)
const noteModal = ref<{ note?: Note | null } | null>(null)

async function loadTab() {
  if (!book.value) return
  if (tab.value === 'anotacoes') notes.value = (await api.get<{ results: Note[] }>(`/books/${book.value.id}/notes`)).results
  if (tab.value === 'discussoes') posts.value = (await api.get<{ results: Post[] }>(`/books/${book.value.id}/posts`)).results
  if (tab.value === 'resenhas') allReviews.value = (await api.get<{ results: Review[] }>(`/books/${book.value.id}/reviews`)).results
}
watch([tab, book, () => ui.version], loadTab)
watch(book, (b) => { if (b) document.title = `${b.title} · Readex` })

const tabs = computed(() => {
  const b = book.value
  const base = `/livros/${slug.value}`
  return [
    { value: 'detalhes', label: 'Detalhes', to: base },
    { value: 'anotacoes', label: `Anotações${b ? ` (${b.counts.notes})` : ''}`, to: `${base}/anotacoes` },
    { value: 'discussoes', label: `Discussões${b ? ` (${b.counts.posts})` : ''}`, to: `${base}/discussoes` },
    { value: 'resenhas', label: `Resenhas${b ? ` (${b.counts.reviews})` : ''}`, to: `${base}/resenhas` },
  ]
})
const status = computed(() => book.value?.shelf?.status ?? null)
const otherReviews = computed(() => (book.value?.reviews ?? []).filter((r) => r.id !== book.value?.myReview?.id))

function onNoteSaved(n: Note) {
  if (!notes.value) return
  const i = notes.value.findIndex((x) => x.id === n.id)
  if (i >= 0) notes.value[i] = n
  else { notes.value.unshift(n); if (book.value) book.value.counts.notes++ }
}
async function toggleNote(n: Note) {
  const { note } = await api.patch<{ note: Note }>(`/notes/${n.id}`, { isPublic: !n.isPublic })
  onNoteSaved(note)
  toast.success(note.isPublic ? 'Anotação visível no seu perfil.' : 'Anotação agora é privada.')
}
async function removeNote(n: Note) {
  await api.del(`/notes/${n.id}`)
  notes.value = notes.value?.filter((x) => x.id !== n.id) ?? null
  if (book.value) book.value.counts.notes--
  toast.success('Anotação excluída.', {
    label: 'Desfazer',
    run: async () => {
      const { note } = await api.post<{ note: Note }>(`/books/${book.value!.id}/notes`, { kind: n.kind, page: n.page, text: n.text, comment: n.comment, isPublic: n.isPublic })
      onNoteSaved(note)
    },
  })
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <ErrorState v-if="error" :message="error" @retry="load()" />
    <template v-else>
      <AppTopbar :title="book?.title ?? 'Livro'" :crumbs="[{ label: 'Minha Estante', to: '/estante' }, { label: book?.title ?? '…' }]" class="[&_h1]:sr-only" />

      <!-- Destaque do livro -->
      <section v-if="loading || !book" class="flex gap-8"><SkeletonBlock w="160px" h="240px" /><div class="flex flex-1 flex-col gap-4"><SkeletonBlock w="50%" h="40px" /><SkeletonBlock w="30%" /><SkeletonBlock w="60%" /></div></section>
      <section v-else class="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
        <BookCover :title="book.title" :author="book.author" :src="book.coverUrl" :tone="book.coverTone" :width="160" eager class="max-sm:mx-auto" />
        <div class="flex min-w-0 flex-1 flex-col gap-4">
          <div class="flex flex-col gap-1">
            <h2 class="text-subtitle font-bold text-smoky sm:text-title-40 sm:font-normal">{{ book.title }}</h2>
            <p class="text-body-16 text-body">{{ book.author }}</p>
          </div>
          <p class="flex flex-wrap items-center gap-1.5 text-body-14 text-body">
            <Star :size="16" class="fill-sauce text-sauce" aria-hidden="true" />
            <template v-if="book.ratingsCount">{{ fmtRating(book.avgRating) }} média da comunidade ({{ fmtNumber(book.ratingsCount) }} {{ book.ratingsCount === 1 ? 'avaliação' : 'avaliações' }})</template>
            <template v-else>Ainda sem avaliações</template>
            · {{ fmtNumber(book.pages) }} págs.
          </p>
          <div v-if="book.shelf?.status === 'LENDO'" class="flex w-full max-w-[600px] flex-col gap-2">
            <div class="flex justify-between text-body-14 font-semibold text-smoky">
              <span>{{ book.shelf.progress.currentPage ? `Lendo · página ${fmtNumber(book.shelf.progress.currentPage)} de ${fmtNumber(book.pages)}` : 'Você ainda não começou' }}</span>
              <span>{{ book.shelf.progress.percent }}%</span>
            </div>
            <ProgressBar :value="book.shelf.progress.percent" thick on-gradient :label="`Progresso de ${book.title}`" />
            <p class="text-body-12 text-body">{{ book.shelf.progress.remaining ? `Faltam ${fmtNumber(book.shelf.progress.remaining)} páginas.` : '' }}</p>
          </div>
          <p v-else-if="book.shelf?.status === 'CONCLUIDO'" class="text-body-14 font-semibold text-success">Concluído em {{ fmtDate(book.shelf.finishedAt ?? book.shelf.updatedAt) }} · 100%</p>
          <div class="flex flex-wrap items-center gap-3">
            <RxButton v-if="book.shelf?.status === 'LENDO'" @click="ui.progress = { book, progress: book.shelf!.progress }">Atualizar progresso</RxButton>
            <RxButton v-else-if="!book.shelf" @click="ui.progress = { book, progress: { currentPage: 0, pages: book.pages, remaining: book.pages, percent: 0 } }">Começar a ler</RxButton>
            <RxButton :variant="book.shelf?.status === 'CONCLUIDO' ? 'primary' : 'secondary'" :to="`/livros/${book.slug}/escrever-resenha`">{{ book.myReview ? 'Editar avaliação' : book.shelf?.status === 'CONCLUIDO' ? 'Avaliar e escrever resenha' : 'Avaliar' }}</RxButton>
            <ShelfStatusButton :book="book" :status="status" @change="load(true)" />
          </div>
        </div>
      </section>

      <RxTabs :model-value="tab" :tabs="tabs" label="Seções do livro" />

      <div v-if="book" class="grid grid-cols-1 gap-10 wide:grid-cols-[minmax(0,1fr)_400px] wide:gap-16 full:grid-cols-[minmax(0,1fr)_480px]">
        <div class="flex min-w-0 flex-col gap-10">
          <!-- Detalhes -->
          <template v-if="tab === 'detalhes'">
            <section class="flex flex-col gap-4" aria-labelledby="sobre">
              <h2 id="sobre" class="text-body-16 font-semibold text-smoky">Sobre o livro</h2>
              <p class="max-w-[72ch] text-body-16 text-body">{{ book.synopsis }}</p>
              <div class="flex flex-wrap gap-2"><ChipTag v-for="g in book.genres" :key="g" as="tag">{{ g }}</ChipTag></div>
              <dl class="grid max-w-[600px] grid-cols-2 gap-x-6 gap-y-3 border-t border-cloud pt-4 text-body-14 sm:grid-cols-4">
                <div><dt class="text-secondary">Editora</dt><dd class="font-semibold text-smoky">{{ book.publisher }}</dd></div>
                <div><dt class="text-secondary">Ano</dt><dd class="font-semibold text-smoky">{{ book.year }}</dd></div>
                <div><dt class="text-secondary">Páginas</dt><dd class="font-semibold text-smoky">{{ fmtNumber(book.pages) }}</dd></div>
                <div v-if="book.isbn"><dt class="text-secondary">ISBN</dt><dd class="font-semibold text-smoky">{{ book.isbn }}</dd></div>
              </dl>
            </section>
            <section class="flex flex-col gap-4">
              <SectionHeader title="Resenhas da comunidade" :link="book.counts.reviews > 3 ? `/livros/${book.slug}/resenhas` : undefined" :link-label="`Ver todas (${fmtNumber(book.counts.reviews)})`" />
              <p v-if="!otherReviews.length" class="text-body-14 text-secondary">Ninguém avaliou este livro ainda. Que tal ser a primeira pessoa?</p>
              <ul class="flex flex-col gap-6"><li v-for="r in otherReviews.slice(0, 3)" :key="r.id"><ReviewCard :review="r" /></li></ul>
            </section>
          </template>

          <!-- Anotações -->
          <section v-else-if="tab === 'anotacoes'" class="flex flex-col gap-6">
            <SectionHeader :title="`Suas anotações · ${book.counts.notes}`">
              <RxButton size="sm" variant="secondary" @click="noteModal = {}"><Plus :size="16" /> Nova anotação</RxButton>
            </SectionHeader>
            <SkeletonBlock v-if="!notes" h="80px" />
            <EmptyState v-else-if="!notes.length" compact title="Nenhuma anotação neste livro" text="Guarde citações e ideias enquanto lê. Elas começam privadas.">
              <RxButton @click="noteModal = {}">Nova anotação</RxButton>
            </EmptyState>
            <ul v-else class="flex flex-col divide-y divide-cloud">
              <li v-for="n in notes" :key="n.id" class="py-5 first:pt-0"><NoteItem :note="n" editable @edit="noteModal = { note: n }" @toggle="toggleNote(n)" @remove="removeNote(n)" /></li>
            </ul>
          </section>

          <!-- Discussões -->
          <section v-else-if="tab === 'discussoes'" class="flex flex-col gap-6">
            <SectionHeader :title="`Discussões · ${book.counts.posts}`">
              <RxButton size="sm" variant="secondary" @click="ui.composer = { book }"><Plus :size="16" /> Nova discussão</RxButton>
            </SectionHeader>
            <SkeletonBlock v-if="!posts" h="120px" />
            <EmptyState v-else-if="!posts.length" compact mascot="waving" title="Nenhuma discussão ainda" text="Comece uma conversa sobre este livro.">
              <RxButton @click="ui.composer = { book }">Nova discussão</RxButton>
            </EmptyState>
            <ul v-else class="flex flex-col divide-y divide-cloud">
              <li v-for="p in posts" :key="p.id" class="py-6 first:pt-0"><PostCard :item="p" :show-book="false" @deleted="loadTab" /></li>
            </ul>
          </section>

          <!-- Resenhas -->
          <section v-else class="flex flex-col gap-6">
            <SectionHeader :title="`Resenhas · ${book.counts.reviews}`">
              <RxButton size="sm" variant="secondary" :to="`/livros/${book.slug}/escrever-resenha`">{{ book.myReview ? 'Editar a sua' : 'Escrever resenha' }}</RxButton>
            </SectionHeader>
            <SkeletonBlock v-if="!allReviews" h="120px" />
            <EmptyState v-else-if="!allReviews.length" compact title="Nenhuma resenha ainda" text="Seja a primeira pessoa a avaliar este livro." />
            <ul v-else class="flex flex-col gap-6"><li v-for="r in allReviews" :key="r.id"><ReviewCard :review="r" :mine="r.id === book.myReview?.id" /></li></ul>
          </section>
        </div>

        <aside class="flex flex-col gap-6">
          <section class="flex flex-col gap-2">
            <h2 class="text-body-16 font-semibold text-smoky">Sua leitura</h2>
            <p v-if="!book.shelf" class="text-body-14 text-body">Este livro não está na sua estante. Use “Quero ler” para salvar.</p>
            <p v-else class="text-body-14 text-body">
              {{ statusLabel[book.shelf.status] }}<template v-if="book.shelf.startedAt">. Começou em {{ fmtDate(book.shelf.startedAt) }}</template>.
              {{ book.counts.notes }} {{ book.counts.notes === 1 ? 'anotação' : 'anotações' }} neste livro.
            </p>
          </section>
          <section v-if="book.myReview" class="flex flex-col gap-2">
            <h2 class="text-body-16 font-semibold text-smoky">Sua avaliação</h2>
            <StarRating :value="book.myReview.rating" readonly :size="18" />
            <p class="line-clamp-3 text-body-14 text-body">{{ book.myReview.text || 'Sem comentário' }}</p>
            <RouterLink :to="`/livros/${book.slug}/escrever-resenha`" class="text-body-14 font-semibold text-sauce hover:underline">Editar</RouterLink>
          </section>
          <p v-if="book.readersNow" class="text-body-14 text-secondary">{{ book.readersNow }} {{ book.readersNow === 1 ? 'pessoa está lendo' : 'pessoas estão lendo' }} agora.</p>
        </aside>
      </div>
    </template>

    <NoteModal v-if="book" :open="!!noteModal" :book="book" :note="noteModal?.note" :current-page="book.shelf?.progress.currentPage" @close="noteModal = null" @saved="onNoteSaved" />
  </div>
</template>
