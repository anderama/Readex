<script setup lang="ts">
// Nova/editar anotação: Citação ou Nota, página, texto, comentário e "Mostrar no meu perfil" (começa privada)
import { ref, watch } from 'vue'
import RxModal from '@/components/base/RxModal.vue'
import RxButton from '@/components/base/RxButton.vue'
import RxSegmented from '@/components/base/RxSegmented.vue'
import RxSwitch from '@/components/base/RxSwitch.vue'
import InputField from '@/components/base/InputField.vue'
import { api, ApiError } from '@/services/http'
import type { Book, Note } from '@/services/types'
import { toast } from '@/stores/toast'

const props = defineProps<{ open: boolean; book: Pick<Book, 'id' | 'title' | 'pages'>; note?: Note | null; currentPage?: number }>()
const emit = defineEmits<{ close: []; saved: [note: Note] }>()
const kind = ref('NOTA')
const page = ref<string | number>('')
const text = ref('')
const comment = ref('')
const isPublic = ref(false)
const errors = ref<Record<string, string>>({})
const saving = ref(false)

watch(() => props.open, (o) => {
  if (!o) return
  const n = props.note
  kind.value = n?.kind ?? 'NOTA'
  page.value = n?.page ?? (props.currentPage || '')
  text.value = n?.text ?? ''
  comment.value = n?.comment ?? ''
  isPublic.value = n?.isPublic ?? false
  errors.value = {}
})

async function save() {
  errors.value = {}
  if (!text.value.trim()) errors.value.text = kind.value === 'CITACAO' ? 'Digite o trecho do livro.' : 'Escreva a anotação.'
  const p = page.value === '' ? null : Number(page.value)
  if (p !== null && (Number.isNaN(p) || p < 1 || p > props.book.pages)) errors.value.page = `Digite uma página entre 1 e ${props.book.pages}.`
  if (Object.keys(errors.value).length) return
  saving.value = true
  const body = { kind: kind.value, page: p, text: text.value, comment: comment.value || null, isPublic: isPublic.value }
  try {
    const { note } = props.note
      ? await api.patch<{ note: Note }>(`/notes/${props.note.id}`, body)
      : await api.post<{ note: Note }>(`/books/${props.book.id}/notes`, body)
    toast.success(props.note ? 'Anotação atualizada.' : isPublic.value ? 'Anotação salva e visível no seu perfil.' : 'Anotação salva. Só você pode ver.')
    emit('saved', note)
    emit('close')
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) toast.error('Sem conexão. Sua anotação não foi salva; tente de novo.')
    else if (e instanceof ApiError) errors.value = { text: e.message, ...e.fields }
  } finally { saving.value = false }
}
</script>

<template>
  <RxModal :open="open" :title="note ? 'Editar anotação' : 'Nova anotação'" :description="book.title" @close="emit('close')">
    <form class="flex flex-col gap-5" novalidate @submit.prevent="save">
      <RxSegmented v-model="kind" label="Tipo de anotação" :options="[{ value: 'NOTA', label: 'Nota' }, { value: 'CITACAO', label: 'Citação' }]" />
      <InputField v-model="page" label="Página (opcional)" inputmode="numeric" :suffix="`de ${book.pages}`" :error="errors.page" />
      <InputField v-model="text" :label="kind === 'CITACAO' ? 'Trecho do livro' : 'Sua nota'" multiline :rows="4" :maxlength="2000" :error="errors.text" autofocus />
      <InputField v-if="kind === 'CITACAO'" v-model="comment" label="Comentário (opcional)" multiline :rows="2" :maxlength="500" />
      <RxSwitch v-model="isPublic" label="Mostrar no meu perfil" description="Desligado, só você vê esta anotação." />
      <div class="flex flex-col-reverse gap-3 border-t border-cloud pt-6 sm:flex-row sm:justify-end">
        <RxButton variant="secondary" @click="emit('close')">Cancelar</RxButton>
        <RxButton type="submit" :loading="saving">Salvar anotação</RxButton>
      </div>
    </form>
  </RxModal>
</template>
