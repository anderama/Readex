<script setup lang="ts">
// Explorar / Adicionar livro: busca por título, autor, gênero ou ISBN, filtro por gênero, estado vazio com orientação
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Clock, X } from 'lucide-vue-next'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxTabs from '@/components/base/RxTabs.vue'
import RxButton from '@/components/base/RxButton.vue'
import ChipTag from '@/components/base/ChipTag.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import SectionHeader from '@/components/base/SectionHeader.vue'
import SearchBar from '@/components/books/SearchBar.vue'
import GenreFilter from '@/components/books/GenreFilter.vue'
import BookListItem from '@/components/books/BookListItem.vue'
import { api } from '@/services/http'
import type { Book } from '@/services/types'
import { ui } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const adding = computed(() => route.query.adicionar === '1')
const q = ref(String(route.query.q ?? ''))
const genres = ref<string[]>([].concat((route.query.genero as never) ?? []))
const short = ref(route.query.curtos === '1')
const allGenres = ref<string[]>([])
const results = ref<Book[] | null>(null)
const suggestions = ref<Book[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref<InstanceType<typeof SearchBar>>()
const RECENT_KEY = 'readex.recent-searches'
const recent = ref<string[]>(readRecent())

function readRecent(): string[] { try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] } }
function saveRecent(term: string) {
  recent.value = [term, ...recent.value.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 5)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value)) } catch { /* ignora */ }
}
function removeRecent(term: string) {
  recent.value = recent.value.filter((t) => t !== term)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value)) } catch { /* ignora */ }
}

const active = computed(() => !!q.value.trim() || genres.value.length > 0 || short.value)

let timer: ReturnType<typeof setTimeout>
async function run() {
  router.replace({ query: { ...(adding.value ? { adicionar: '1' } : {}), ...(q.value ? { q: q.value } : {}), ...(genres.value.length ? { genero: genres.value } : {}), ...(short.value ? { curtos: '1' } : {}) } })
  if (!active.value) { results.value = null; return }
  loading.value = true; error.value = null
  try {
    results.value = (await api.get<{ results: Book[] }>('/books', { q: q.value.trim(), genre: genres.value, maxPages: short.value ? 350 : undefined })).results
  } catch { error.value = 'Não foi possível buscar agora.' } finally { loading.value = false }
}
watch(q, () => { clearTimeout(timer); timer = setTimeout(run, 300) })
watch([genres, short], run, { deep: true })
watch(() => ui.version, () => { if (active.value) run() })

onMounted(async () => {
  const [g, s] = await Promise.all([api.get<{ genres: string[] }>('/books/genres'), api.get<{ results: Book[] }>('/books/suggestions')])
  allGenres.value = g.genres.slice(0, 8)
  suggestions.value = s.results
  if (active.value) run()
  if (adding.value) search.value?.focus()
})

function submit(term: string) { if (term.trim()) saveRecent(term.trim()); run() }
function clearAll() { q.value = ''; genres.value = []; short.value = false }
function onStatus(b: Book, s: Book['myStatus']) { b.myStatus = s; if (q.value.trim()) saveRecent(q.value.trim()) }
const summary = computed(() => {
  const n = results.value?.length ?? 0
  const what = q.value.trim() ? ` para “${q.value.trim()}”` : ''
  return `${n} ${n === 1 ? 'resultado' : 'resultados'}${what}`
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppTopbar :title="adding ? 'Adicionar livro' : 'Encontre seu próximo livro'" :subtitle="adding ? 'Busque um livro e salve na sua estante' : undefined" />
    <!-- No celular, Comunidade fica dentro de Explorar -->
    <div class="md:hidden"><RxTabs model-value="books" label="Explorar" :tabs="[{ value: 'books', label: 'Livros', to: '/explorar' }, { value: 'community', label: 'Comunidade', to: '/comunidade' }]" /></div>

    <SearchBar ref="search" v-model="q" large placeholder="Título, autor, gênero ou ISBN" label="Buscar livros" @submit="submit" />

    <div class="grid grid-cols-1 gap-10 wide:grid-cols-[minmax(0,1fr)_400px] wide:gap-16 full:grid-cols-[minmax(0,1fr)_480px]">
      <div class="flex min-w-0 flex-col gap-6">
        <template v-if="!active">
          <section v-if="recent.length" class="flex flex-col gap-3">
            <SectionHeader title="Buscas recentes" />
            <ul class="flex flex-col">
              <li v-for="t in recent" :key="t" class="flex items-center gap-3 py-2">
                <Clock :size="18" class="text-secondary" aria-hidden="true" />
                <button type="button" class="flex-1 text-left text-body-14 text-smoky hover:underline" @click="q = t">{{ t }}</button>
                <button type="button" class="flex size-8 items-center justify-center rounded-sm text-secondary hover:text-smoky" :aria-label="`Remover ${t} das buscas recentes`" @click="removeRecent(t)"><X :size="16" /></button>
              </li>
            </ul>
          </section>
          <section class="flex flex-col gap-3">
            <SectionHeader title="Explorar por gênero" />
            <div class="flex flex-wrap gap-2">
              <ChipTag v-for="g in allGenres" :key="g" @click="genres = [g]">{{ g }}</ChipTag>
            </div>
          </section>
          <section v-if="suggestions.length" class="flex flex-col gap-4">
            <SectionHeader title="Sugerido para você" />
            <ul class="flex flex-col divide-y divide-cloud">
              <li v-for="b in suggestions" :key="b.id" class="py-4"><BookListItem :book="b" :cover-width="56" :note="b.reason" @status="onStatus(b, $event)" /></li>
            </ul>
          </section>
        </template>

        <template v-else>
          <p class="text-body-14 text-body" aria-live="polite">{{ loading ? 'Buscando…' : summary }}</p>
          <ErrorState v-if="error" :message="error" @retry="run" />
          <div v-else-if="loading && !results" class="flex flex-col gap-6">
            <div v-for="i in 4" :key="i" class="flex items-center gap-4"><SkeletonBlock w="56px" h="84px" /><div class="flex flex-1 flex-col gap-2"><SkeletonBlock w="45%" /><SkeletonBlock w="30%" h="12px" /></div><SkeletonBlock w="100px" h="40px" rounded="12px" /></div>
          </div>
          <EmptyState v-else-if="results && !results.length" mascot="reading" :title="q.trim() ? `Nenhum livro encontrado para “${q.trim()}”` : 'Nenhum livro com esses filtros'" text="Confira a ortografia, busque pelo nome do autor ou tire alguns filtros de gênero.">
            <RxButton variant="secondary" @click="clearAll">Limpar busca e filtros</RxButton>
          </EmptyState>
          <ul v-else class="flex flex-col divide-y divide-cloud" :class="loading && 'opacity-60'">
            <li v-for="b in results" :key="b.id" class="py-4"><BookListItem :book="b" :cover-width="56" @status="onStatus(b, $event)" /></li>
          </ul>
        </template>
      </div>

      <aside class="flex flex-col gap-6">
        <section class="flex flex-col gap-3">
          <h2 class="text-body-16 font-semibold text-smoky">Filtrar por gênero</h2>
          <GenreFilter v-model="genres" v-model:short="short" :genres="allGenres" with-pages />
          <button v-if="genres.length || short" type="button" class="self-start text-body-14 font-semibold text-sauce hover:underline" @click="genres = []; short = false">Limpar filtros</button>
        </section>
        <hr class="border-cloud" />
        <section class="flex flex-col gap-2">
          <h2 class="text-body-16 font-semibold text-smoky">Como funciona</h2>
          <p class="text-body-14 text-body">“Quero ler” salva o livro na sua estante. Pela seta, você marca como Lendo agora ou Concluído, ou remove o livro. Também dá para buscar pelo ISBN, os 13 números no verso do livro.</p>
        </section>
      </aside>
    </div>
  </div>
</template>
