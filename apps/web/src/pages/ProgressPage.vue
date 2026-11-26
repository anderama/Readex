<script setup lang="ts">
// Metas: meta do mês (livros, quantidade e %; "Meta atingida!"), meta diária (minutos) e meta do ano (opcional)
import { computed, ref } from 'vue'
import { Flame } from 'lucide-vue-next'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxButton from '@/components/base/RxButton.vue'
import RxModal from '@/components/base/RxModal.vue'
import InputField from '@/components/base/InputField.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import SectionHeader from '@/components/base/SectionHeader.vue'
import GoalCovers from '@/components/books/GoalCovers.vue'
import ProgressBar from '@/components/books/ProgressBar.vue'
import StreakDays from '@/components/books/StreakDays.vue'
import { api, ApiError } from '@/services/http'
import type { Goal, Streak, YearGoal } from '@/services/types'
import { useAsync } from '@/composables/useAsync'
import { toast } from '@/stores/toast'
import { monthName } from '@/utils/format'

const { data, loading, error, load } = useAsync(() => api.get<{ goal: Goal; year: YearGoal; streak: Streak }>('/goals/current'))
const edit = ref<null | 'month' | 'daily' | 'year'>(null)
const value = ref<string | number>('')
const fieldError = ref('')
const saving = ref(false)

const titles = { month: 'Meta do mês', daily: 'Meta diária', year: 'Meta do ano' }
const labels = { month: 'Livros por mês', daily: 'Minutos por dia', year: 'Livros no ano' }
const suffixes = { month: 'livros', daily: 'min', year: 'livros' }
const dailyPct = computed(() => (data.value ? Math.min(100, Math.round((data.value.streak.daily.todayMinutes / data.value.streak.daily.goalMinutes) * 100)) : 0))

function open(kind: 'month' | 'daily' | 'year') {
  edit.value = kind
  fieldError.value = ''
  value.value = kind === 'month' ? data.value?.goal.target ?? 8 : kind === 'daily' ? data.value?.streak.daily.goalMinutes ?? 30 : data.value?.year.target ?? 40
}
async function save() {
  const n = Number(value.value)
  if (!Number.isInteger(n) || n < 1) { fieldError.value = 'Digite um número inteiro maior que zero.'; return }
  saving.value = true
  try {
    if (edit.value === 'month') await api.put('/goals/current', { target: n })
    if (edit.value === 'daily') await api.put('/goals/daily', { minutes: n })
    if (edit.value === 'year') await api.put('/goals/year', { target: n })
    toast.success(`${titles[edit.value!]} salva.`)
    edit.value = null
    load(true)
  } catch (e) { fieldError.value = e instanceof ApiError ? e.message : 'Não foi possível salvar.' } finally { saving.value = false }
}
async function removeYear() {
  await api.put('/goals/year', { target: null })
  edit.value = null
  toast.success('Meta do ano removida.')
  load(true)
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppTopbar title="Metas" :crumbs="[{ label: 'Progresso', to: '/progresso' }, { label: 'Metas' }]">
      <template #actions><RxButton variant="secondary" to="/progresso/estatisticas" class="max-sm:hidden">Ver estatísticas</RxButton></template>
    </AppTopbar>
    <RxButton variant="secondary" to="/progresso/estatisticas" class="sm:hidden">Ver estatísticas</RxButton>

    <ErrorState v-if="error" :message="error" @retry="load()" />
    <SkeletonBlock v-else-if="loading || !data" h="400px" />
    <div v-else class="grid grid-cols-1 gap-10 wide:grid-cols-[minmax(0,1fr)_400px] wide:gap-16 full:grid-cols-[minmax(0,1fr)_480px]">
      <div class="flex min-w-0 flex-col gap-8">
        <!-- Meta do mês -->
        <section class="flex flex-col gap-4">
          <SectionHeader :title="`Meta de ${monthName(data.goal.month)}`"><RxButton variant="secondary" size="sm" @click="open('month')">{{ data.goal.target ? 'Editar meta' : 'Definir meta' }}</RxButton></SectionHeader>
          <template v-if="data.goal.target">
            <p class="flex items-baseline gap-2"><span class="text-title-40 font-bold text-smoky">{{ data.goal.done }}</span><span class="text-body-16 font-semibold text-body">de {{ data.goal.target }} livros · {{ data.goal.percent }}%</span></p>
            <GoalCovers :goal="data.goal" :width="64" />
            <ProgressBar :value="data.goal.percent" thick :label="`Meta de ${monthName(data.goal.month)}`" class="max-w-[600px]" />
            <p v-if="data.goal.achieved" class="text-body-16 font-semibold text-success">Meta atingida!</p>
            <p v-else class="text-body-14 text-secondary">{{ data.goal.pace }}</p>
          </template>
          <p v-else class="text-body-14 text-secondary">Defina quantos livros quer terminar em {{ monthName(data.goal.month) }}. Os livros concluídos no mês contam automaticamente.</p>
        </section>
        <hr class="border-cloud" />

        <!-- Meta diária -->
        <section class="flex flex-col gap-4">
          <SectionHeader title="Meta diária"><RxButton variant="secondary" size="sm" @click="open('daily')">Editar meta</RxButton></SectionHeader>
          <p class="flex items-baseline gap-2"><span class="text-title-40 font-bold text-smoky">{{ data.streak.daily.todayMinutes }}</span><span class="text-body-16 font-semibold text-body">de {{ data.streak.daily.goalMinutes }} min hoje</span></p>
          <ProgressBar :value="dailyPct" thick label="Minutos de leitura hoje" class="max-w-[600px]" />
          <p class="flex items-center gap-2 text-body-14 text-secondary"><Flame :size="16" class="text-sauce" aria-hidden="true" /> {{ data.streak.current }} {{ data.streak.current === 1 ? 'dia seguido' : 'dias seguidos' }}. Os minutos vêm dos registros de progresso.</p>
        </section>
        <hr class="border-cloud" />

        <!-- Meta do ano -->
        <section class="flex flex-col gap-3">
          <h2 class="text-body-16 font-semibold text-smoky">Meta do ano <span class="text-body-12 font-normal text-secondary">opcional</span></h2>
          <template v-if="data.year.target">
            <p class="text-body-14 text-body">{{ data.year.done }} de {{ data.year.target }} livros em {{ data.year.year }} · {{ data.year.percent }}%</p>
            <ProgressBar :value="data.year.percent" label="Meta do ano" class="max-w-[600px]" />
            <RxButton variant="secondary" size="sm" class="self-start" @click="open('year')">Editar meta anual</RxButton>
          </template>
          <template v-else>
            <p class="text-body-14 font-semibold text-smoky">Sem meta anual</p>
            <p class="text-body-14 text-body">Você já leu {{ data.year.done }} {{ data.year.done === 1 ? 'livro' : 'livros' }} em {{ data.year.year }}.</p>
            <RxButton variant="secondary" class="self-start" @click="open('year')">Criar meta anual</RxButton>
          </template>
        </section>
      </div>
      <aside class="flex flex-col gap-8">
        <section class="flex flex-col gap-2">
          <h2 class="text-body-16 font-semibold text-smoky">Como funcionam</h2>
          <p class="text-body-14 text-body">A meta do mês conta livros terminados. A meta diária conta minutos de leitura. A meta do ano é opcional e não substitui as outras.</p>
        </section>
        <hr class="border-cloud" />
        <StreakDays :streak="data.streak" />
      </aside>
    </div>

    <RxModal :open="!!edit" :title="edit ? titles[edit] : ''" @close="edit = null">
      <form class="flex flex-col gap-6" novalidate @submit.prevent="save">
        <InputField v-if="edit" v-model="value" :label="labels[edit]" inputmode="numeric" :suffix="suffixes[edit]" :error="fieldError" autofocus />
        <div class="flex flex-col-reverse gap-3 border-t border-cloud pt-6 sm:flex-row sm:items-center sm:justify-end">
          <RxButton v-if="edit === 'year' && data?.year.target" variant="ghost" class="sm:mr-auto sm:-ml-6" @click="removeYear">Remover meta anual</RxButton>
          <RxButton variant="secondary" @click="edit = null">Cancelar</RxButton>
          <RxButton type="submit" :loading="saving">Salvar meta</RxButton>
        </div>
      </form>
    </RxModal>
  </div>
</template>
