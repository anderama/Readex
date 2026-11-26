<script setup lang="ts">
// Comunidade: feed de resenhas, avaliações e discussões de outros leitores, com filtros e "Em alta"
import { computed, ref, watch } from 'vue'
import { Flame, Hash, Plus } from 'lucide-vue-next'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxTabs from '@/components/base/RxTabs.vue'
import RxButton from '@/components/base/RxButton.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import PostCard from '@/components/community/PostCard.vue'
import { api } from '@/services/http'
import type { FeedItem } from '@/services/types'
import { useAsync } from '@/composables/useAsync'
import { ui } from '@/stores/ui'

const filter = ref('all')
const tag = ref<string | null>(null)
const { data, loading, error, load } = useAsync(() => api.get<{ items: FeedItem[]; trending: { tag: string; posts: number }[] }>('/feed', { filter: filter.value }))
watch(filter, () => load())
const items = computed(() => (data.value?.items ?? []).filter((i) => !tag.value || (i.type === 'post' && i.hashtags.includes(tag.value))))
const tabs = [
  { value: 'all', label: 'Todos' }, { value: 'following', label: 'Seguindo' },
  { value: 'reviews', label: 'Resenhas' }, { value: 'posts', label: 'Discussões' },
]
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppTopbar title="Comunidade" subtitle="Discussões e resenhas de outros leitores">
      <template #actions><RxButton class="max-sm:hidden" @click="ui.composer = {}">Nova discussão</RxButton></template>
    </AppTopbar>
    <div class="md:hidden"><RxTabs model-value="community" label="Explorar" :tabs="[{ value: 'books', label: 'Livros', to: '/explorar' }, { value: 'community', label: 'Comunidade', to: '/comunidade' }]" /></div>
    <RxTabs v-model="filter" :tabs="tabs" label="Filtrar publicações" />

    <div class="grid grid-cols-1 gap-10 wide:grid-cols-[minmax(0,1fr)_400px] wide:gap-16 full:grid-cols-[minmax(0,1fr)_480px]">
      <div class="min-w-0">
        <div v-if="tag" class="mb-6 flex items-center gap-3 text-body-14">
          <span class="text-body">Mostrando <strong class="font-semibold text-smoky">#{{ tag }}</strong></span>
          <button type="button" class="font-semibold text-sauce hover:underline" @click="tag = null">Limpar</button>
        </div>
        <ErrorState v-if="error" :message="error" @retry="load()" />
        <div v-else-if="loading" class="flex flex-col gap-8">
          <div v-for="i in 3" :key="i" class="flex gap-4"><SkeletonBlock w="40px" h="40px" rounded="999px" /><div class="flex flex-1 flex-col gap-2"><SkeletonBlock w="30%" /><SkeletonBlock /><SkeletonBlock w="70%" /></div></div>
        </div>
        <EmptyState v-else-if="!items.length" mascot="waving" :title="filter === 'following' ? 'Ninguém que você segue publicou ainda' : 'Nada por aqui ainda'" :text="filter === 'following' ? 'Visite o perfil de outros leitores e toque em Seguir.' : 'Comece uma discussão sobre o livro que está lendo.'">
          <RxButton @click="ui.composer = {}">Nova discussão</RxButton>
        </EmptyState>
        <ul v-else class="flex flex-col divide-y divide-cloud">
          <li v-for="i in items" :key="i.type + i.id" class="py-6 first:pt-0"><PostCard :item="i" @deleted="load(true)" /></li>
        </ul>
      </div>
      <aside class="flex flex-col gap-4">
        <h2 class="flex items-center gap-2 text-body-16 font-semibold text-smoky"><Flame :size="18" class="text-sauce" aria-hidden="true" /> Em alta</h2>
        <ul class="flex flex-col gap-3">
          <li v-for="t in data?.trending ?? []" :key="t.tag">
            <button type="button" class="flex items-center gap-2 text-body-14 hover:underline" :aria-pressed="tag === t.tag" @click="tag = tag === t.tag ? null : t.tag">
              <Hash :size="16" class="text-secondary" aria-hidden="true" /><span class="font-semibold text-smoky">#{{ t.tag }}</span>
              <span class="text-secondary">{{ t.posts }} {{ t.posts === 1 ? 'post' : 'posts' }}</span>
            </button>
          </li>
        </ul>
      </aside>
    </div>

    <!-- Botão flutuante no celular -->
    <button type="button" class="fixed bottom-28 right-6 z-30 flex size-14 items-center justify-center rounded-lg bg-fire text-smoky shadow-menu sm:hidden" aria-label="Nova discussão" @click="ui.composer = {}"><Plus :size="26" /></button>
  </div>
</template>
