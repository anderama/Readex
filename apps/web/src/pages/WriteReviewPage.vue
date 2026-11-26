<script setup lang="ts">
// Escrever resenha: nota de 1 a 5 (obrigatória), texto opcional até 1.000 caracteres, spoiler e tags.
// Rascunho salvo no navegador; aviso ao sair sem publicar. A média do livro é recalculada no back-end.
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { BookOpen, Check } from 'lucide-vue-next'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxButton from '@/components/base/RxButton.vue'
import RxSwitch from '@/components/base/RxSwitch.vue'
import RxModal from '@/components/base/RxModal.vue'
import ChipTag from '@/components/base/ChipTag.vue'
import InputField from '@/components/base/InputField.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import FormAlert from '@/components/auth/FormAlert.vue'
import StarRating from '@/components/books/StarRating.vue'
import { api, ApiError } from '@/services/http'
import type { BookDetails, Note } from '@/services/types'
import { useAsync } from '@/composables/useAsync'
import { toast } from '@/stores/toast'
import { bump } from '@/stores/ui'
import { fmtNumber } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const slug = String(route.params.slug)
const { data: book, loading, error, load } = useAsync(() => api.get<BookDetails>(`/books/${slug}`), { watchVersion: false })
const quotes = ref<Note[]>([])

const rating = ref(0)
const text = ref('')
const spoiler = ref(false)
const tags = ref<string[]>([])
const errors = ref<Record<string, string>>({})
const saving = ref(false)
const draftAt = ref<string | null>(null)
const dirty = ref(false)
const leave = ref<RouteLocationRaw | null>(null)
let initial = ''
const DRAFT_KEY = `readex.draft.${slug}`

const snapshot = () => JSON.stringify({ r: rating.value, t: text.value, s: spoiler.value, g: tags.value })
const suggestions = computed(() => (book.value?.genres ?? []).filter((g) => !tags.value.includes(g)).slice(0, 4))

watch(book, async (b) => {
  if (!b) return
  const r = b.myReview
  let draft: { r: number; t: string; s: boolean; g: string[]; at: string } | null = null
  try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') } catch { /* sem rascunho */ }
  rating.value = draft?.r ?? r?.rating ?? 0
  text.value = draft?.t ?? r?.text ?? ''
  spoiler.value = draft?.s ?? r?.spoiler ?? false
  tags.value = draft?.g ?? r?.tags ?? []
  if (draft) draftAt.value = draft.at
  initial = r ? JSON.stringify({ r: r.rating, t: r.text ?? '', s: r.spoiler, g: r.tags }) : JSON.stringify({ r: 0, t: '', s: false, g: [] })
  quotes.value = (await api.get<{ results: Note[] }>(`/books/${b.id}/notes`)).results.filter((n) => n.kind === 'CITACAO').slice(0, 4)
})
watch([rating, text, spoiler, tags], () => { dirty.value = snapshot() !== initial }, { deep: true })

function saveDraft() {
  const at = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ r: rating.value, t: text.value, s: spoiler.value, g: tags.value, at })) } catch { /* ignora */ }
  draftAt.value = at
  initial = snapshot(); dirty.value = false
  toast.success('Rascunho salvo neste navegador.')
}
function insertQuote(n: Note) {
  text.value = `${text.value}${text.value ? '\n\n' : ''}“${n.text}”${n.page ? ` (p. ${n.page})` : ''}`.slice(0, 1000)
}
function toggleTag(t: string) { tags.value = tags.value.includes(t) ? tags.value.filter((x) => x !== t) : [...tags.value, t].slice(0, 5) }

async function publish() {
  errors.value = {}
  if (!rating.value) errors.value.rating = 'Escolha uma nota de 1 a 5 estrelas.'
  if (text.value.length > 1000) errors.value.text = 'A resenha pode ter até 1.000 caracteres.'
  if (Object.keys(errors.value).length) return
  saving.value = true
  try {
    const r = await api.put<{ avgRating: number }>(`/books/${book.value!.id}/review`, { rating: rating.value, text: text.value.trim() || null, spoiler: spoiler.value, tags: tags.value })
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignora */ }
    dirty.value = false
    bump()
    toast.success(`${text.value.trim() ? 'Resenha publicada' : 'Avaliação salva'}. Nova média do livro: ${r.avgRating.toLocaleString('pt-BR')}.`)
    router.push(`/livros/${slug}/resenhas`)
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) errors.value.form = 'Sem conexão. Seu texto continua aqui; tente publicar de novo.'
    else if (e instanceof ApiError) errors.value = { form: e.message, ...e.fields }
  } finally { saving.value = false }
}

onBeforeRouteLeave((to) => {
  if (!dirty.value || leave.value) return true
  leave.value = to
  return false
})
function confirmLeave() { const to = leave.value!; dirty.value = false; router.push(to) }
onMounted(() => window.addEventListener('beforeunload', (e) => { if (dirty.value) e.preventDefault() }))
</script>

<template>
  <div class="flex flex-col gap-8">
    <ErrorState v-if="error" :message="error" @retry="load()" />
    <template v-else>
      <AppTopbar
        title="Escrever resenha" :subtitle="book ? `${book.title}, ${book.author}` : undefined"
        :crumbs="[{ label: 'Minha Estante', to: '/estante' }, { label: book?.title ?? '…', to: `/livros/${slug}` }]"
      />
      <SkeletonBlock v-if="loading" h="320px" />
      <div v-else-if="book" class="grid grid-cols-1 gap-10 wide:grid-cols-[minmax(0,1fr)_400px] wide:gap-16 full:grid-cols-[minmax(0,1fr)_480px]">
        <form class="flex min-w-0 flex-col gap-6" novalidate @submit.prevent="publish">
          <div v-if="book.shelf?.status === 'LENDO'" class="flex items-center gap-3 rounded-md bg-chefs px-4 py-3 text-body-14 text-body">
            <BookOpen :size="18" class="shrink-0 text-sauce" aria-hidden="true" />
            Você está na página {{ fmtNumber(book.shelf.progress.currentPage) }} ({{ book.shelf.progress.percent }}%). Publique agora e atualize quando terminar.
          </div>
          <FormAlert v-if="errors.form">{{ errors.form }}</FormAlert>

          <fieldset class="flex flex-col gap-2">
            <legend class="mb-2 text-body-14 font-semibold text-smoky">Sua nota</legend>
            <div class="flex items-center gap-3">
              <StarRating :value="rating" :size="28" @change="rating = $event; errors.rating = ''" />
              <span class="text-body-14 text-body">{{ rating ? `${rating} de 5` : 'Escolha de 1 a 5' }}</span>
            </div>
            <p v-if="errors.rating" class="text-body-12 font-semibold text-burgundy" role="alert">{{ errors.rating }}</p>
          </fieldset>

          <div class="flex flex-col gap-1">
            <InputField v-model="text" label="Sua resenha (opcional)" multiline :rows="7" :maxlength="1000" counter placeholder="O que achou do livro? Sem texto, sua avaliação aparece como “Sem comentário”." :error="errors.text" />
            <p v-if="draftAt" class="flex items-center gap-1 text-body-12 text-secondary"><Check :size="14" aria-hidden="true" /> Rascunho salvo às {{ draftAt }}</p>
          </div>

          <RxSwitch v-model="spoiler" label="Contém spoiler" description="O texto fica oculto até a pessoa escolher “Mostrar”." />

          <div class="flex flex-col gap-2">
            <span class="text-body-14 font-semibold text-smoky">Tags <span class="font-normal text-secondary">opcional</span></span>
            <div class="flex flex-wrap items-center gap-2">
              <ChipTag v-for="t in tags" :key="t" selected @click="toggleTag(t)">{{ t }}</ChipTag>
              <span v-if="suggestions.length" class="text-body-12 text-secondary">Sugestões:</span>
              <ChipTag v-for="t in suggestions" :key="t" @click="toggleTag(t)">{{ t }}</ChipTag>
            </div>
          </div>

          <div class="flex flex-col-reverse gap-3 border-t border-cloud pt-6 sm:flex-row sm:justify-end">
            <RxButton variant="secondary" @click="saveDraft">Salvar rascunho</RxButton>
            <RxButton type="submit" :loading="saving">Publicar</RxButton>
          </div>
        </form>

        <aside class="flex flex-col gap-4">
          <h2 class="text-body-16 font-semibold text-smoky">Suas anotações</h2>
          <p class="text-body-14 text-body">{{ book.counts.notes }} {{ book.counts.notes === 1 ? 'anotação' : 'anotações' }} neste livro.<template v-if="quotes.length"> Insira uma citação na resenha:</template></p>
          <ul class="flex flex-col gap-4">
            <li v-for="q in quotes" :key="q.id" class="flex flex-col gap-1">
              <p class="text-body-14 text-smoky">“{{ q.text }}”</p>
              <div class="flex items-center justify-between text-body-12"><span class="text-secondary">{{ q.page ? `p. ${q.page}` : '' }}</span><button type="button" class="font-semibold text-sauce hover:underline" @click="insertQuote(q)">Inserir citação</button></div>
            </li>
          </ul>
        </aside>
      </div>
    </template>

    <RxModal :open="!!leave" title="Sair sem publicar?" description="Sua resenha ainda não foi publicada." @close="leave = null">
      <p class="text-body-14 text-body">Se sair agora, as mudanças que não estão no rascunho serão perdidas.</p>
      <template #footer>
        <RxButton variant="secondary" @click="saveDraft(); confirmLeave()">Salvar rascunho e sair</RxButton>
        <RxButton variant="destructive" @click="confirmLeave">Sair sem salvar</RxButton>
      </template>
    </RxModal>
  </div>
</template>
