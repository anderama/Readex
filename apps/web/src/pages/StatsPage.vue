<script setup lang="ts">
// Estatísticas: Semana, Mês e Ano, com totais e gráfico de barras (valores sempre também em texto)
import { computed, ref, watch } from 'vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxSegmented from '@/components/base/RxSegmented.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import { api } from '@/services/http'
import type { Stats } from '@/services/types'
import { useAsync } from '@/composables/useAsync'
import { fmtMinutes, fmtNumber } from '@/utils/format'

const period = ref('month')
const selected = ref<number | null>(null)
const { data, loading, error, load } = useAsync(() => api.get<Stats>('/stats', { period: period.value }))
watch(period, () => { selected.value = null; load() })

const max = computed(() => Math.max(1, ...(data.value?.chart.bars.map((b) => b.value ?? 0) ?? [1])))
const empty = computed(() => !!data.value && data.value.chart.bars.every((b) => !b.value))
const detail = computed(() => (selected.value !== null ? data.value?.chart.bars[selected.value]?.detail : null))
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppTopbar title="Estatísticas" :crumbs="[{ label: 'Progresso', to: '/progresso' }, { label: 'Estatísticas' }]" :bell="false">
      <template #actions>
        <div class="hidden w-[360px] sm:block"><RxSegmented v-model="period" label="Período" :options="[{ value: 'week', label: 'Semana' }, { value: 'month', label: 'Mês' }, { value: 'year', label: 'Ano' }]" /></div>
      </template>
    </AppTopbar>
    <div class="sm:hidden"><RxSegmented v-model="period" label="Período" :options="[{ value: 'week', label: 'Semana' }, { value: 'month', label: 'Mês' }, { value: 'year', label: 'Ano' }]" /></div>

    <ErrorState v-if="error" :message="error" @retry="load()" />
    <template v-else>
      <div class="grid grid-cols-1 gap-10 wide:grid-cols-[minmax(0,1fr)_400px] wide:gap-16 full:grid-cols-[minmax(0,1fr)_480px]">
        <div class="flex min-w-0 flex-col gap-8">
          <section class="flex flex-col gap-6">
            <h2 class="text-body-16 font-semibold text-smoky">{{ data?.title ?? '…' }}</h2>
            <dl v-if="!loading && data" class="grid grid-cols-2 gap-6 whitespace-nowrap sm:grid-cols-4 [&_dd]:text-[32px] [&_dd]:leading-tight full:[&_dd]:text-title-40">
              <div class="flex flex-col"><dd class="order-1 text-title-40 text-smoky">{{ fmtNumber(data.totals.finished) }}</dd><dt class="order-2 text-body-14 text-body">{{ data.totals.finished === 1 ? 'livro terminado' : 'livros terminados' }}</dt></div>
              <div class="flex flex-col"><dd class="order-1 text-title-40 text-smoky">{{ fmtNumber(data.totals.pages) }}</dd><dt class="order-2 text-body-14 text-body">páginas</dt></div>
              <div class="flex flex-col"><dd class="order-1 text-title-40 text-smoky">{{ fmtMinutes(data.totals.minutes) }}</dd><dt class="order-2 text-body-14 text-body">de leitura</dt></div>
              <div class="flex flex-col"><dd class="order-1 text-title-40 text-smoky">{{ fmtNumber(data.totals.notes) }}</dd><dt class="order-2 text-body-14 text-body">anotações</dt></div>
            </dl>
            <SkeletonBlock v-else h="72px" />
          </section>
          <hr class="border-cloud" />
          <section class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
              <h2 class="text-body-16 font-semibold text-smoky">{{ data?.chart.title ?? 'Gráfico' }}</h2>
              <p class="text-body-14 text-body" aria-live="polite">{{ detail ?? 'Selecione uma barra para ver detalhes' }}</p>
            </div>
            <SkeletonBlock v-if="loading" h="200px" />
            <EmptyState v-else-if="empty && period === 'week'" compact title="Nenhuma leitura nesta semana" text="Registre seu progresso para ver o gráfico crescer." />
            <div v-else-if="data" class="flex h-[220px] items-end gap-2 pb-1 sm:gap-4" :class="period === 'year' ? 'sm:gap-3' : 'wide:gap-6'" role="group" :aria-label="data.chart.title">
              <button
                v-for="(b, i) in data.chart.bars" :key="b.label" type="button"
                class="group flex h-full min-w-0 max-w-16 flex-1 flex-col items-center justify-end gap-2 rounded-sm"
                :aria-pressed="selected === i" :aria-label="b.detail" :disabled="b.value === null" @click="selected = selected === i ? null : i"
              >
                <span class="text-body-14 font-semibold text-smoky">{{ b.value === null ? '' : fmtNumber(b.value) }}</span>
                <span v-if="b.value === null" class="h-0.5 w-full rounded-full bg-cloud" />
                <span
                  v-else class="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-85"
                  :class="selected === i ? 'bg-smoky' : b.current ? 'bg-sauce' : 'bg-cloud'"
                  :style="{ height: `${Math.max(4, (b.value / max) * 150)}px` }"
                />
                <span class="text-body-12" :class="b.current ? 'font-semibold text-smoky' : 'text-body'">{{ b.label }}</span>
              </button>
            </div>
            <p class="flex items-center gap-2 text-body-12 text-body"><span class="size-3 rounded-[2px] bg-sauce" aria-hidden="true" /> {{ period === 'week' ? 'Hoje' : 'Mês atual' }}</p>
          </section>
        </div>
        <aside class="flex flex-col gap-3">
          <h2 class="text-body-16 font-semibold text-smoky">Seu {{ new Date().getFullYear() }} até agora</h2>
          <p class="text-body-14 text-body">{{ data ? `${data.yearFinished} ${data.yearFinished === 1 ? 'livro concluído' : 'livros concluídos'} neste ano.` : '' }} As estatísticas usam os seus registros de progresso e os livros concluídos.</p>
        </aside>
      </div>
    </template>
  </div>
</template>
