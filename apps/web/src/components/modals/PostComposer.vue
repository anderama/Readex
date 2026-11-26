<script setup lang="ts">
// Nova discussão: livro obrigatório, texto com #hashtags e aviso de spoiler "até a página X" (padrão = página atual).
// Se der erro, o texto e o spoiler ficam mantidos.
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { EyeOff, Hash } from 'lucide-vue-next'
import RxModal from '@/components/base/RxModal.vue'
import RxButton from '@/components/base/RxButton.vue'
import InputField from '@/components/base/InputField.vue'
import BookPicker from '@/components/books/BookPicker.vue'
import { api, ApiError } from '@/services/http'
import type { Book, BookDetails, Post } from '@/services/types'
import { bump, ui } from '@/stores/ui'
import { toast } from '@/stores/toast'

const router = useRouter()
const book = ref<Book | null>(null)
const text = ref('')
const spoiler = ref(false)
const spoilerPage = ref<string | number>('')
const errors = ref<Record<string, string>>({})
const saving = ref(false)
const open = computed(() => !!ui.composer)

watch(open, async (o) => {
  if (!o) return
  book.value = ui.composer?.book ?? null
  text.value = ''; spoiler.value = false; spoilerPage.value = ''; errors.value = {}
})
watch([book, spoiler], async () => {
  if (!spoiler.value || !book.value || spoilerPage.value) return
  try {
    const d = await api.get<BookDetails>(`/books/${book.value.id}`)
    spoilerPage.value = d.shelf?.progress.currentPage || ''
  } catch { /* opcional */ }
})

function addHash() { text.value = `${text.value}${text.value && !text.value.endsWith(' ') ? ' ' : ''}#` }

async function publish() {
  errors.value = {}
  if (!book.value) errors.value.bookId = 'Escolha o livro da discussão.'
  if (!text.value.trim()) errors.value.text = 'Escreva alguma coisa para publicar.'
  if (Object.keys(errors.value).length) return
  saving.value = true
  try {
    const { post } = await api.post<{ post: Post }>('/posts', {
      bookId: book.value!.id, text: text.value, spoilerPage: spoiler.value && spoilerPage.value ? Number(spoilerPage.value) : null,
    })
    ui.composer = null
    bump()
    toast.success('Discussão publicada.', { label: 'Ver', run: () => router.push(`/comunidade/posts/${post.id}`) })
  } catch (e) {
    if (e instanceof ApiError) { errors.value = e.fields; if (!Object.keys(e.fields).length) toast.error(e.message) }
  } finally { saving.value = false }
}
</script>

<template>
  <RxModal :open="open" title="Nova discussão" description="Converse com outros leitores sobre um livro." :width="640" @close="ui.composer = null">
    <form class="flex flex-col gap-6" novalidate @submit.prevent="publish">
      <BookPicker v-model="book" :error="errors.bookId" />
      <InputField v-model="text" label="Sua mensagem" multiline :rows="5" placeholder="O que você quer discutir? Use #hashtags para encontrar outros leitores." :error="errors.text" />
      <div class="flex flex-wrap gap-2">
        <button type="button" class="inline-flex h-10 items-center gap-2 rounded-sm border px-4 text-body-14 font-semibold transition-ui" :class="spoiler ? 'border-smoky bg-smoky text-white' : 'border-border-strong text-smoky hover:border-smoky'" :aria-pressed="spoiler" @click="spoiler = !spoiler">
          <EyeOff :size="18" aria-hidden="true" /> Spoiler
        </button>
        <button type="button" class="inline-flex h-10 items-center gap-2 rounded-sm border border-border-strong px-4 text-body-14 font-semibold text-smoky hover:border-smoky" @click="addHash">
          <Hash :size="18" aria-hidden="true" /> Hashtag
        </button>
      </div>
      <InputField v-if="spoiler" v-model="spoilerPage" label="Contém spoiler até a página" inputmode="numeric" help="O texto fica oculto para quem ainda não chegou nessa página." :suffix="book ? `de ${book.pages}` : undefined" :error="errors.spoilerPage" />
      <div class="flex flex-col-reverse gap-3 border-t border-cloud pt-6 sm:flex-row sm:justify-end">
        <RxButton variant="secondary" @click="ui.composer = null">Cancelar</RxButton>
        <RxButton type="submit" :loading="saving">Publicar</RxButton>
      </div>
    </form>
  </RxModal>
</template>
