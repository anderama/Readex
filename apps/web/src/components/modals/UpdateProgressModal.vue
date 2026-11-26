<script setup lang="ts">
// Atualizar progresso: por página ou porcentagem, prévia "antes → hoje" na barra e comentário opcional.
// Ao chegar em 100%, o livro vai para Concluído e o modal oferece escrever a resenha.
import { computed, ref, watch } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import RxModal from '@/components/base/RxModal.vue'
import RxButton from '@/components/base/RxButton.vue'
import RxSegmented from '@/components/base/RxSegmented.vue'
import InputField from '@/components/base/InputField.vue'
import BookCover from '@/components/books/BookCover.vue'
import ProgressBar from '@/components/books/ProgressBar.vue'
import { api, ApiError } from '@/services/http'
import type { Goal, ShelfItem } from '@/services/types'
import { bump, ui } from '@/stores/ui'
import { toast } from '@/stores/toast'
import { fmtNumber } from '@/utils/format'

const mode = ref('page')
const value = ref<string | number>('')
const comment = ref('')
const error = ref('')
const saving = ref(false)

const data = computed(() => ui.progress)
const pages = computed(() => data.value?.book.pages ?? 0)
const before = computed(() => data.value?.progress.currentPage ?? 0)
const beforePct = computed(() => data.value?.progress.percent ?? 0)

watch(data, (d) => {
  if (!d) return
  mode.value = 'page'; value.value = ''; comment.value = ''; error.value = ''
})
watch(mode, () => { value.value = ''; error.value = '' })

const newPage = computed(() => {
  const n = Number(String(value.value).replace(',', '.'))
  if (value.value === '' || Number.isNaN(n)) return null
  return mode.value === 'page' ? Math.round(n) : Math.round((n / 100) * pages.value)
})
const newPct = computed(() => (newPage.value === null || !pages.value ? beforePct.value : Math.min(100, Math.round((newPage.value / pages.value) * 100))))
const delta = computed(() => (newPage.value === null ? 0 : newPage.value - before.value))
const hint = computed(() => {
  if (newPage.value === null) return `Você está na página ${fmtNumber(before.value)}.`
  if (newPage.value > pages.value) return ''
  if (newPage.value >= pages.value) return 'Você vai concluir o livro.'
  if (delta.value > 0) return `+${fmtNumber(delta.value)} ${delta.value === 1 ? 'página' : 'páginas'} hoje. Faltam ${fmtNumber(pages.value - newPage.value)}.`
  if (delta.value < 0) return `Você vai voltar ${fmtNumber(-delta.value)} páginas.`
  return 'Mesma página de antes.'
})

function validate() {
  if (newPage.value === null) return mode.value === 'page' ? 'Digite a página em que você parou.' : 'Digite a porcentagem lida.'
  if (mode.value === 'page' && newPage.value > pages.value) return `O livro tem ${pages.value} páginas. Digite um número até ${pages.value}.`
  if (mode.value === 'percent' && Number(value.value) > 100) return 'Digite um valor entre 0 e 100.'
  if (newPage.value < 0) return 'Digite um número válido.'
  return ''
}

async function save() {
  error.value = validate()
  if (error.value || !data.value) return
  saving.value = true
  const book = data.value.book
  try {
    const body = mode.value === 'page' ? { page: newPage.value, comment: comment.value || undefined } : { percent: Number(value.value), comment: comment.value || undefined }
    const r = await api.post<{ item: ShelfItem; pagesRead: number; completed: boolean; goal: Goal }>(`/shelf/${book.id}/progress`, body)
    ui.progress = null
    bump()
    if (r.completed) {
      ui.finish = { book }
      toast.success(r.goal.achieved ? `Meta atingida! ${book.title} concluído.` : `${book.title} concluído. Parabéns!`)
    } else {
      toast.success(`Progresso salvo: página ${fmtNumber(r.item.progress.currentPage)} (${r.item.progress.percent}%).`)
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) {
      toast.error('Sem conexão. Tente salvar de novo quando a internet voltar.')
    } else error.value = e instanceof ApiError ? e.message : 'Não foi possível salvar.'
  } finally { saving.value = false }
}

function finish() {
  if (!data.value) return
  const book = data.value.book
  ui.progress = null
  ui.finish = { book }
}
</script>

<template>
  <RxModal :open="!!data" title="Atualizar progresso" :description="data ? `${data.book.title}, ${data.book.author}` : ''" @close="ui.progress = null">
    <template #leading>
      <BookCover v-if="data" :title="data.book.title" :src="data.book.coverUrl" :tone="data.book.coverTone" :width="32" />
    </template>
    <form v-if="data" class="flex flex-col gap-6" novalidate @submit.prevent="save">
      <RxSegmented v-model="mode" label="Atualizar por" :options="[{ value: 'page', label: 'Página' }, { value: 'percent', label: 'Porcentagem' }]" />
      <InputField
        v-model="value" :label="mode === 'page' ? 'Página atual' : 'Porcentagem lida'" inputmode="numeric" autofocus
        :suffix="mode === 'page' ? `de ${fmtNumber(pages)}` : '%'" :error="error" @update:model-value="error = ''"
      />
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-body-12 text-body">
          <span>Novo progresso</span>
          <span class="flex items-center gap-1">{{ beforePct }}% <ChevronRight :size="12" aria-hidden="true" /> <strong class="font-semibold text-smoky">{{ newPct }}%</strong></span>
        </div>
        <ProgressBar :value="Math.min(beforePct, newPct)" :preview="newPct" label="Prévia do novo progresso" />
        <p class="text-body-12 text-body" aria-live="polite">{{ hint }}</p>
      </div>
      <InputField v-model="comment" label="Comentário (opcional)" multiline :rows="3" placeholder="O que achou deste trecho?" :maxlength="280" />
      <div class="flex flex-col-reverse gap-3 border-t border-cloud pt-6 sm:flex-row sm:items-center sm:justify-between">
        <RxButton variant="ghost" class="sm:-ml-6" @click="finish">Terminei o livro</RxButton>
        <RxButton type="submit" :loading="saving">Salvar progresso</RxButton>
      </div>
    </form>
  </RxModal>
</template>
