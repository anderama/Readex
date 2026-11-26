<script setup lang="ts">
// "Terminei o livro": marca como Concluído, mostra o andamento da meta e oferece avaliar/escrever a resenha
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import RxModal from '@/components/base/RxModal.vue'
import RxButton from '@/components/base/RxButton.vue'
import StarRating from '@/components/books/StarRating.vue'
import ProgressBar from '@/components/books/ProgressBar.vue'
import reading from '@/assets/mascot/reading.png'
import { api, ApiError } from '@/services/http'
import type { Goal } from '@/services/types'
import { bump, ui } from '@/stores/ui'
import { toast } from '@/stores/toast'
import { monthName } from '@/utils/format'

const router = useRouter()
const goal = ref<Goal | null>(null)
const rating = ref(0)
const saving = ref(false)
const book = computed(() => ui.finish?.book)

watch(book, async (b) => {
  if (!b) return
  goal.value = null; rating.value = 0
  try {
    await api.put(`/shelf/${b.id}`, { status: 'CONCLUIDO' })
    bump()
    goal.value = (await api.get<{ goal: Goal }>('/goals/current')).goal
  } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Não foi possível concluir o livro.'); ui.finish = null }
})

async function saveRating(v: number) {
  rating.value = v
  if (!book.value) return
  saving.value = true
  try {
    await api.put(`/books/${book.value.id}/review`, { rating: v })
    toast.success('Nota salva. A média do livro foi atualizada.')
  } catch { toast.error('Não foi possível salvar a nota.') } finally { saving.value = false }
}
function writeReview() {
  const slug = book.value?.slug
  ui.finish = null
  if (slug) router.push(`/livros/${slug}/escrever-resenha`)
}
</script>

<template>
  <RxModal :open="!!book" :title="goal?.achieved ? 'Meta atingida!' : 'Leitura concluída'" :description="book ? `${book.title} foi para Concluído.` : ''" @close="ui.finish = null">
    <div class="flex flex-col items-center gap-6 text-center">
      <img :src="reading" alt="" class="h-32 w-auto" />
      <div v-if="goal?.target" class="flex w-full flex-col gap-2 text-left">
        <div class="flex justify-between text-body-14"><span class="font-semibold text-smoky">Meta de {{ monthName(goal.month) }}</span><span class="text-body">{{ goal.done }} de {{ goal.target }} livros · {{ goal.percent }}%</span></div>
        <ProgressBar :value="goal.percent" thick label="Andamento da meta do mês" />
        <p class="text-body-14" :class="goal.achieved ? 'font-semibold text-success' : 'text-secondary'">{{ goal.achieved ? 'Meta atingida!' : goal.pace }}</p>
      </div>
      <div class="flex flex-col items-center gap-2">
        <p class="text-body-14 font-semibold text-smoky">Que nota você dá?</p>
        <StarRating :value="rating" :size="32" label="Nota do livro" @change="saveRating" />
      </div>
    </div>
    <template #footer>
      <RxButton variant="secondary" @click="ui.finish = null">Agora não</RxButton>
      <RxButton :loading="saving" @click="writeReview">Escrever resenha</RxButton>
    </template>
  </RxModal>
</template>
