<script setup lang="ts">
// Discussão aberta: post, "N respostas" com ordenação e campo de resposta fixo no rodapé
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Send } from 'lucide-vue-next'
import AvatarCircle from '@/components/base/AvatarCircle.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import NotificationBell from '@/components/layout/NotificationBell.vue'
import PostCard from '@/components/community/PostCard.vue'
import LoadingSpinner from '@/components/base/LoadingSpinner.vue'
import { api, ApiError } from '@/services/http'
import type { Post, Reply } from '@/services/types'
import { useAsync } from '@/composables/useAsync'
import { session } from '@/stores/session'
import { toast } from '@/stores/toast'
import { timeAgo } from '@/utils/format'

const route = useRoute()
const sort = ref<'recent' | 'likes'>('recent')
const { data, loading, error, load } = useAsync(() => api.get<{ post: Post & { replies: Reply[] } }>(`/posts/${route.params.id}`, { sort: sort.value }).then((r) => r.post), { watchVersion: false })
watch(sort, () => load(true))
const text = ref('')
const sending = ref(false)
const me = computed(() => session.user.value)

async function send() {
  if (!text.value.trim() || !data.value) return
  sending.value = true
  try {
    const { reply } = await api.post<{ reply: Reply }>(`/posts/${data.value.id}/comments`, { text: text.value })
    if (sort.value === 'recent') data.value.replies.unshift(reply)
    else data.value.replies.push(reply)
    data.value.comments++
    text.value = ''
    toast.success('Resposta publicada.')
  } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Não foi possível responder.') } finally { sending.value = false }
}
</script>

<template>
  <div class="flex flex-col gap-8 pb-24">
    <header class="flex items-center justify-between">
      <RouterLink to="/comunidade" class="flex items-center gap-2 rounded-md text-body-14 font-semibold text-smoky hover:underline"><ArrowLeft :size="18" aria-hidden="true" /> Comunidade</RouterLink>
      <NotificationBell />
    </header>
    <h1 class="sr-only">Discussão</h1>
    <ErrorState v-if="error" :message="error" @retry="load()" />
    <SkeletonBlock v-else-if="loading || !data" h="200px" />
    <div v-else class="max-w-[800px]">
      <PostCard :item="data" :link-to-post="false" />
      <section class="mt-10 flex flex-col gap-6" aria-labelledby="respostas">
        <div class="flex items-center justify-between border-b border-cloud pb-3">
          <h2 id="respostas" class="text-body-16 font-semibold text-smoky">{{ data.comments }} {{ data.comments === 1 ? 'resposta' : 'respostas' }}</h2>
          <label class="flex items-center gap-2 text-body-14 text-body">Ordenar
            <select v-model="sort" class="h-10 rounded-md border border-border-strong bg-white px-3 text-body-14 text-smoky">
              <option value="recent">Mais recentes</option>
              <option value="likes">Mais antigas</option>
            </select>
          </label>
        </div>
        <p v-if="!data.replies.length" class="text-body-14 text-secondary">Nenhuma resposta ainda. Comece a conversa.</p>
        <ul class="flex flex-col gap-6">
          <li v-for="r in data.replies" :key="r.id" class="flex gap-3">
            <RouterLink :to="`/leitores/${r.user.username}`" class="shrink-0"><AvatarCircle :name="r.user.name" :src="r.user.avatarUrl" :size="36" /></RouterLink>
            <div class="flex min-w-0 flex-col gap-1">
              <p class="text-body-14"><RouterLink :to="`/leitores/${r.user.username}`" class="font-semibold text-smoky hover:underline">{{ r.user.name }}</RouterLink> <span class="text-body-12 text-secondary">· {{ timeAgo(r.createdAt) }}</span></p>
              <p class="whitespace-pre-line text-body-14 text-smoky">{{ r.text }}</p>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <!-- Campo de resposta fixo -->
    <form v-if="data" class="fixed inset-x-0 bottom-[84px] z-30 border-t border-cloud bg-white px-6 py-3 md:bottom-0 lg:left-60" @submit.prevent="send">
      <div class="mx-auto flex max-w-[800px] items-center gap-3 wide:ml-20">
        <AvatarCircle v-if="me" :name="me.name" :src="me.avatarUrl" :size="36" class="max-sm:hidden" />
        <label for="reply" class="sr-only">Escreva uma resposta</label>
        <input id="reply" v-model="text" maxlength="2000" placeholder="Escreva uma resposta" class="h-12 min-w-0 flex-1 rounded-md border border-border-strong px-4 text-body-14 outline-none focus:border-2 focus:border-sauce focus:px-[15px]" />
        <button type="submit" class="flex size-12 shrink-0 items-center justify-center rounded-md bg-fire text-smoky transition-ui hover:bg-fire-hover disabled:bg-chefs disabled:text-disabled" :disabled="!text.trim() || sending" aria-label="Enviar resposta">
          <LoadingSpinner v-if="sending" :size="18" /><Send v-else :size="20" />
        </button>
      </div>
    </form>
  </div>
</template>
