<script setup lang="ts">
// Início (dashboard): Lendo agora, Também lendo, Da comunidade, Meta do mês, sequência e Sugerido para você
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxButton from '@/components/base/RxButton.vue'
import SectionHeader from '@/components/base/SectionHeader.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import BookCover from '@/components/books/BookCover.vue'
import ProgressBar from '@/components/books/ProgressBar.vue'
import GoalCovers from '@/components/books/GoalCovers.vue'
import StreakDays from '@/components/books/StreakDays.vue'
import BookListItem from '@/components/books/BookListItem.vue'
import ActivityItem from '@/components/community/ActivityItem.vue'
import { api } from '@/services/http'
import type { Dashboard } from '@/services/types'
import { useAsync } from '@/composables/useAsync'
import { session } from '@/stores/session'
import { ui } from '@/stores/ui'
import { firstName, fmtLongDate, fmtNumber, greeting, lastReadLabel, monthName } from '@/utils/format'

const { data, loading, error, load } = useAsync(() => api.get<Dashboard>('/dashboard'))
const now = computed(() => data.value?.readingNow)
const name = computed(() => firstName(session.user.value?.name ?? ''))
const readLine = computed(() => {
  const r = now.value
  if (!r) return ''
  if (r.progress.currentPage === 0) return 'Você ainda não começou. Registre a primeira página quando abrir o livro.'
  const last = lastReadLabel(data.value?.lastReadAt ?? null)
  return `${last ? `Última leitura ${last}. ` : ''}Faltam ${fmtNumber(r.progress.remaining)} páginas.`
})
</script>

<template>
  <div class="flex flex-col gap-8 lg:gap-10">
    <AppTopbar :title="`${greeting()}, ${name}`" :subtitle="fmtLongDate()" add-book search />

    <ErrorState v-if="error" :message="error" @retry="load()" />

    <template v-else>
      <!-- Lendo agora -->
      <section aria-labelledby="lendo-agora">
        <h2 id="lendo-agora" class="sr-only">Lendo agora</h2>
        <div v-if="loading" class="flex items-center gap-6 sm:gap-10">
          <SkeletonBlock w="144px" h="216px" />
          <div class="flex flex-1 flex-col gap-4"><SkeletonBlock w="60%" h="40px" /><SkeletonBlock w="30%" /><SkeletonBlock w="100%" h="6px" /><SkeletonBlock w="240px" h="48px" rounded="12px" /></div>
        </div>
        <div v-else-if="now" class="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
          <div class="flex items-center gap-6 sm:contents">
            <RouterLink :to="`/livros/${now.book.slug}`" class="shrink-0 transition-transform hover:-translate-y-1">
              <BookCover :title="now.book.title" :author="now.book.author" :src="now.book.coverUrl" :tone="now.book.coverTone" :width="144" eager class="max-sm:hidden" />
              <BookCover :title="now.book.title" :author="now.book.author" :src="now.book.coverUrl" :tone="now.book.coverTone" :width="120" eager class="sm:hidden" />
            </RouterLink>
            <RouterLink :to="`/livros/${now.book.slug}`" class="flex min-w-0 flex-col gap-1 sm:hidden">
              <span class="text-subtitle font-bold text-smoky">{{ now.book.title }}</span>
              <span class="text-body-16 text-body">{{ now.book.author }}</span>
            </RouterLink>
          </div>
          <div class="flex min-w-0 flex-1 flex-col gap-6">
            <RouterLink :to="`/livros/${now.book.slug}`" class="hidden flex-col gap-1 hover:underline sm:flex">
              <span class="text-title-40 text-smoky">{{ now.book.title }}</span>
              <span class="text-body-16 text-body">{{ now.book.author }}</span>
            </RouterLink>
            <div class="flex w-full max-w-[600px] flex-col gap-2">
              <div class="flex justify-between text-body-14 font-semibold text-smoky">
                <span>Página {{ fmtNumber(now.progress.currentPage) }} de {{ fmtNumber(now.progress.pages) }}</span>
                <span>{{ now.progress.percent }}%</span>
              </div>
              <ProgressBar :value="now.progress.percent" thick on-gradient :label="`Progresso de ${now.book.title}`" />
              <p class="text-body-14 text-body">{{ readLine }}</p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <RxButton @click="ui.progress = { book: now.book, progress: now.progress }">Atualizar progresso</RxButton>
              <RxButton variant="secondary" @click="ui.finish = { book: now.book }">Terminei o livro</RxButton>
            </div>
          </div>
        </div>
        <EmptyState v-else title="Nenhum livro em andamento" text="Escolha um livro da sua estante ou encontre um novo para começar." mascot="reading">
          <RxButton to="/explorar?adicionar=1">Adicionar livro</RxButton>
          <RxButton variant="secondary" to="/estante">Ver minha estante</RxButton>
        </EmptyState>
      </section>

      <hr class="border-cloud" />

      <div class="grid grid-cols-1 gap-10 wide:grid-cols-[minmax(0,1fr)_400px] wide:gap-16 full:grid-cols-[minmax(0,1fr)_480px]">
        <div class="flex min-w-0 flex-col gap-10">
          <!-- Também lendo -->
          <section v-if="loading || data?.alsoReading.length" class="flex flex-col gap-4">
            <SectionHeader title="Também lendo" link="/estante" link-label="Ver estante" />
            <SkeletonBlock v-if="loading" h="60px" />
            <ul v-else class="flex flex-col gap-4">
              <li v-for="r in data!.alsoReading" :key="r.book.id">
                <RouterLink :to="`/livros/${r.book.slug}`" class="group flex items-center gap-4 rounded-md">
                  <BookCover :title="r.book.title" :src="r.book.coverUrl" :tone="r.book.coverTone" :width="40" />
                  <span class="flex min-w-0 flex-1 flex-col gap-1">
                    <span class="truncate text-body-16 font-semibold text-smoky group-hover:underline">{{ r.book.title }}</span>
                    <span class="truncate text-body-14 text-secondary">{{ r.book.author }}</span>
                  </span>
                  <span class="hidden w-[120px] sm:block"><ProgressBar :value="r.progress.percent" :label="`Progresso de ${r.book.title}`" /></span>
                  <span class="text-body-14 font-semibold text-smoky">{{ r.progress.percent }}%</span>
                  <ChevronRight :size="18" class="text-smoky" aria-hidden="true" />
                </RouterLink>
              </li>
            </ul>
          </section>

          <!-- Da comunidade -->
          <section class="flex flex-col gap-4">
            <SectionHeader title="Da comunidade" link="/comunidade" link-label="Ver tudo" />
            <div v-if="loading" class="flex flex-col gap-4"><SkeletonBlock v-for="i in 3" :key="i" h="48px" /></div>
            <p v-else-if="!data?.community.length" class="text-body-14 text-secondary">Siga outros leitores para ver o que eles estão lendo.</p>
            <ul v-else class="flex flex-col gap-4">
              <li v-for="a in data.community" :key="a.type + a.id"><ActivityItem :item="a" /></li>
            </ul>
          </section>
        </div>

        <aside class="flex flex-col gap-8" aria-label="Metas e sugestões">
          <!-- Meta do mês -->
          <section class="flex flex-col gap-4">
            <template v-if="loading"><SkeletonBlock h="24px" /><SkeletonBlock h="54px" /></template>
            <template v-else-if="data">
              <SectionHeader :title="`Meta de ${monthName(data.goal.month)}`">
                <span v-if="data.goal.target" class="text-body-14 font-semibold text-smoky">{{ data.goal.done }} de {{ data.goal.target }} livros</span>
              </SectionHeader>
              <template v-if="data.goal.target">
                <GoalCovers :goal="data.goal" />
                <div class="flex items-center gap-3">
                  <ProgressBar :value="data.goal.percent" label="Andamento da meta do mês" />
                  <span class="text-body-14 font-semibold text-smoky">{{ data.goal.percent }}%</span>
                </div>
                <p class="text-body-14" :class="data.goal.achieved ? 'font-semibold text-success' : 'text-secondary'">{{ data.goal.achieved ? 'Meta atingida!' : data.goal.pace }}</p>
              </template>
              <div v-else class="flex flex-col items-start gap-3">
                <p class="text-body-14 text-secondary">Você ainda não definiu quantos livros quer ler este mês.</p>
                <RxButton variant="secondary" size="sm" to="/progresso">Definir meta</RxButton>
              </div>
            </template>
          </section>

          <hr class="border-cloud" />
          <SkeletonBlock v-if="loading" h="120px" />
          <StreakDays v-else-if="data" :streak="data.streak" />

          <!-- Sugerido para você -->
          <template v-if="loading || data?.suggestions.length">
            <hr class="border-cloud" />
            <section class="flex flex-col gap-4">
              <SectionHeader title="Sugerido para você" link="/explorar" link-label="Explorar" />
              <div v-if="loading" class="flex flex-col gap-4"><SkeletonBlock v-for="i in 3" :key="i" h="60px" /></div>
              <ul v-else class="flex flex-col gap-5">
                <li v-for="b in data!.suggestions" :key="b.id"><BookListItem :book="b" :note="b.reason" /></li>
              </ul>
            </section>
          </template>
        </aside>
      </div>
    </template>
  </div>
</template>
