<script setup lang="ts">
// Publicação da Comunidade (discussão ou resenha): avatar, nome, atividade, trecho, livro e ações (curtir, comentar, compartilhar)
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { EyeOff, Heart, Link2, MessageCircle, MoreHorizontal, Share2, Trash2, User } from 'lucide-vue-next'
import AvatarCircle from '@/components/base/AvatarCircle.vue'
import BookCover from '@/components/books/BookCover.vue'
import StarRating from '@/components/books/StarRating.vue'
import { api } from '@/services/http'
import type { FeedItem } from '@/services/types'
import { toast } from '@/stores/toast'
import { bump } from '@/stores/ui'
import { timeAgo } from '@/utils/format'

const props = withDefaults(defineProps<{ item: FeedItem; linkToPost?: boolean; showBook?: boolean }>(), { linkToPost: true, showBook: true })
const emit = defineEmits<{ deleted: [] }>()
const router = useRouter()
const liked = ref(props.item.likedByMe)
const likes = ref(props.item.likes)
const revealed = ref(false)
const menu = ref(false)
const root = ref<HTMLElement>()

const isPost = computed(() => props.item.type === 'post')
const hidden = computed(() => !revealed.value && (props.item.type === 'post' ? !!props.item.spoilerPage && !props.item.mine : props.item.spoiler))
const postLink = computed(() => (props.item.type === 'post' ? `/comunidade/posts/${props.item.id}` : `/livros/${props.item.book.slug}/resenhas`))
// Destaca #hashtags em Sauce Piquante
const parts = computed(() => {
  const text = props.item.text ?? ''
  return text.split(/(#[\p{L}\d_]+)/gu).map((t) => ({ t, tag: t.startsWith('#') }))
})

async function like() {
  liked.value = !liked.value
  likes.value += liked.value ? 1 : -1
  try {
    const url = isPost.value ? `/posts/${props.item.id}/like` : `/reviews/${props.item.id}/like`
    const r = await api.post<{ liked: boolean; likes: number }>(url)
    liked.value = r.liked; likes.value = r.likes
  } catch { liked.value = !liked.value; likes.value += liked.value ? 1 : -1; toast.error('Não foi possível curtir agora.') }
}
async function share() {
  const url = `${window.location.origin}${postLink.value}`
  try { await navigator.clipboard.writeText(url); toast.success('Link copiado.') } catch { toast.info(url) }
  menu.value = false
}
async function remove() {
  menu.value = false
  if (!window.confirm('Excluir esta discussão? Essa ação não pode ser desfeita.')) return
  await api.del(`/posts/${props.item.id}`)
  toast.success('Discussão excluída.')
  bump()
  emit('deleted')
}
function onDoc(e: MouseEvent) { if (!root.value?.contains(e.target as Node)) menu.value = false }
document.addEventListener('click', onDoc)
onBeforeUnmount(() => document.removeEventListener('click', onDoc))
</script>

<template>
  <article class="flex gap-3 sm:gap-4">
    <RouterLink :to="`/leitores/${item.user.username}`" class="shrink-0"><AvatarCircle :name="item.user.name" :src="item.user.avatarUrl" /></RouterLink>
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <header class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 flex-col">
          <RouterLink :to="`/leitores/${item.user.username}`" class="truncate text-body-14 font-semibold text-smoky hover:underline">{{ item.user.name }}</RouterLink>
          <span class="text-body-12 text-secondary">
            <time :datetime="item.createdAt">{{ timeAgo(item.createdAt) }}</time> · {{ isPost ? 'Discussão' : item.type === 'review' && item.text ? 'Resenha' : 'Avaliação' }}
          </span>
        </div>
        <div ref="root" class="relative">
          <button type="button" class="-mr-2 flex size-10 items-center justify-center rounded-md text-body hover:bg-chefs" :aria-expanded="menu" aria-haspopup="menu" aria-label="Mais opções da publicação" @click.stop="menu = !menu"><MoreHorizontal :size="20" /></button>
          <Transition name="panel">
            <div v-if="menu" role="menu" class="absolute right-0 top-11 z-20 w-48 rounded-md border border-cloud bg-white py-2 shadow-menu">
              <button type="button" role="menuitem" class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-body-14 hover:bg-chefs" @click="router.push(`/leitores/${item.user.username}`)"><User :size="16" /> Ver perfil</button>
              <button type="button" role="menuitem" class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-body-14 hover:bg-chefs" @click="share"><Link2 :size="16" /> Copiar link</button>
              <button v-if="item.type === 'post' && item.mine" type="button" role="menuitem" class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-body-14 font-semibold text-burgundy hover:bg-negative-soft" @click="remove"><Trash2 :size="16" /> Excluir</button>
            </div>
          </Transition>
        </div>
      </header>

      <StarRating v-if="item.type === 'review'" :value="item.rating" readonly :size="14" />

      <div v-if="hidden" class="flex items-center justify-between gap-3 rounded-md bg-chefs px-4 py-3">
        <span class="flex items-center gap-2 text-body-14 text-body"><EyeOff :size="16" aria-hidden="true" />{{ item.type === 'post' && item.spoilerPage ? `Contém spoiler até a página ${item.spoilerPage}` : 'Contém spoiler' }}</span>
        <button type="button" class="text-body-14 font-semibold text-sauce hover:underline" @click="revealed = true">Mostrar</button>
      </div>
      <template v-else-if="item.text">
        <RouterLink v-if="linkToPost" :to="postLink" class="whitespace-pre-line text-body-14 text-smoky hover:opacity-80">
          <template v-for="(p, i) in parts" :key="i"><span v-if="p.tag" class="text-sauce">{{ p.t }}</span><template v-else>{{ p.t }}</template></template>
        </RouterLink>
        <p v-else class="whitespace-pre-line text-body-16 text-smoky">
          <template v-for="(p, i) in parts" :key="i"><span v-if="p.tag" class="text-sauce">{{ p.t }}</span><template v-else>{{ p.t }}</template></template>
        </p>
        <button v-if="revealed" type="button" class="self-start text-body-12 text-secondary hover:text-smoky" @click="revealed = false">Ocultar spoiler</button>
      </template>
      <p v-else class="text-body-14 italic text-secondary">Sem comentário</p>

      <RouterLink v-if="showBook" :to="`/livros/${item.book.slug}`" class="flex max-w-max items-center gap-3 rounded-sm border border-cloud px-3 py-2 transition-ui hover:border-border-strong">
        <BookCover :title="item.book.title" :src="item.book.coverUrl" :tone="item.book.coverTone" :width="24" />
        <span class="flex flex-col"><span class="text-body-12 font-semibold text-smoky">{{ item.book.title }}</span><span class="text-body-12 text-secondary">{{ item.book.author }}</span></span>
      </RouterLink>

      <footer class="flex items-center gap-6 text-body-14 text-body">
        <button type="button" class="flex items-center gap-1.5 rounded-sm hover:text-smoky" :aria-pressed="liked" :aria-label="`${liked ? 'Descurtir' : 'Curtir'}, ${likes} curtidas`" @click="like">
          <Heart :size="20" :class="liked && 'fill-sauce text-sauce'" aria-hidden="true" />{{ likes }}
        </button>
        <RouterLink v-if="item.type === 'post'" :to="postLink" class="flex items-center gap-1.5 rounded-sm hover:text-smoky" :aria-label="`${item.comments} respostas`">
          <MessageCircle :size="20" aria-hidden="true" />{{ item.comments }}
        </RouterLink>
        <button type="button" class="flex items-center gap-1.5 rounded-sm hover:text-smoky" @click="share"><Share2 :size="20" aria-hidden="true" /><span class="max-sm:sr-only">Compartilhar</span></button>
      </footer>
    </div>
  </article>
</template>
