<script setup lang="ts">
// Perfil (o seu ou de outro leitor): estatísticas (livros lidos, avaliações, meta atual), seguir e abas Lendo, Lidos, Resenhas e Anotações
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Settings } from 'lucide-vue-next'
import NotificationBell from '@/components/layout/NotificationBell.vue'
import AvatarCircle from '@/components/base/AvatarCircle.vue'
import RxButton from '@/components/base/RxButton.vue'
import RxTabs from '@/components/base/RxTabs.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import BookCover from '@/components/books/BookCover.vue'
import BookCard from '@/components/books/BookCard.vue'
import BookGrid from '@/components/books/BookGrid.vue'
import ProgressBar from '@/components/books/ProgressBar.vue'
import StarRating from '@/components/books/StarRating.vue'
import ShelfStatusButton from '@/components/books/ShelfStatusButton.vue'
import NoteItem from '@/components/notes/NoteItem.vue'
import { api } from '@/services/http'
import type { Book, Note, Profile, Progress, ShelfStatus } from '@/services/types'
import { useAsync } from '@/composables/useAsync'
import { session } from '@/stores/session'
import { toast } from '@/stores/toast'
import { fmtNumber, timeAgo } from '@/utils/format'

type ProfileBook = { book: Book; progress: Progress; finishedAt: string | null; rating: number | null; myStatus: ShelfStatus | null }
type ProfileReview = { id: string; rating: number; text: string | null; spoiler: boolean; createdAt: string; likes: number; book: Book }

const route = useRoute()
const username = computed(() => String(route.params.username ?? session.user.value?.username))
const tab = computed(() => String(route.params.tab || 'lendo'))
const base = computed(() => (route.name === 'profile' ? '/perfil' : `/leitores/${username.value}`))
const { data: profile, loading, error, load } = useAsync(() => api.get<Profile>(`/users/${username.value}`))

const books = ref<ProfileBook[] | null>(null)
const reviews = ref<ProfileReview[] | null>(null)
const notes = ref<Note[] | null>(null)
const following = ref(false)
const followBusy = ref(false)

async function loadTab() {
  books.value = null; reviews.value = null; notes.value = null
  if (tab.value === 'lendo' || tab.value === 'lidos') books.value = (await api.get<{ results: ProfileBook[] }>(`/users/${username.value}/books`, { status: tab.value === 'lendo' ? 'LENDO' : 'CONCLUIDO' })).results
  if (tab.value === 'resenhas') reviews.value = (await api.get<{ results: ProfileReview[] }>(`/users/${username.value}/reviews`)).results
  if (tab.value === 'anotacoes') notes.value = (await api.get<{ results: Note[] }>(`/users/${username.value}/notes`)).results
}
watch(tab, loadTab, { immediate: true })
watch(profile, (p) => { if (p) following.value = p.isFollowing })

const tabs = computed(() => {
  const s = profile.value?.stats
  return [
    { value: 'lendo', label: `Lendo ${s?.reading ?? ''}`, to: base.value },
    { value: 'lidos', label: `Lidos ${s?.read ?? ''}`, to: `${base.value}/lidos` },
    { value: 'resenhas', label: `Resenhas ${s?.reviews ?? ''}`, to: `${base.value}/resenhas` },
    { value: 'anotacoes', label: `Anotações ${s?.notes ?? ''}`, to: `${base.value}/anotacoes` },
  ]
})
const first = computed(() => profile.value?.user.name.split(' ')[0] ?? '')

async function toggleFollow() {
  if (!profile.value) return
  followBusy.value = true
  const name = profile.value.user.name
  try {
    if (following.value) {
      await api.del(`/users/${username.value}/follow`)
      following.value = false
      profile.value.stats.followers--
    } else {
      await api.post(`/users/${username.value}/follow`)
      following.value = true
      profile.value.stats.followers++
      toast.success(`Você está seguindo ${name}.`, { label: 'Desfazer', run: () => toggleFollow() })
    }
  } finally { followBusy.value = false }
}
async function toggleNote(n: Note) {
  const { note } = await api.patch<{ note: Note }>(`/notes/${n.id}`, { isPublic: !n.isPublic })
  Object.assign(n, note)
  toast.success(note.isPublic ? 'Anotação visível no seu perfil.' : 'Anotação agora é privada.', { label: 'Desfazer', run: () => toggleNote(n) })
}
async function removeNote(n: Note) {
  await api.del(`/notes/${n.id}`)
  notes.value = notes.value?.filter((x) => x.id !== n.id) ?? null
  toast.success('Anotação excluída.')
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <ErrorState v-if="error" :message="error" @retry="load()" />
    <template v-else>
      <section v-if="loading || !profile" class="flex items-center gap-6"><SkeletonBlock w="96px" h="96px" rounded="999px" /><div class="flex flex-1 flex-col gap-3"><SkeletonBlock w="240px" h="28px" /><SkeletonBlock w="160px" /></div></section>
      <section v-else class="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <AvatarCircle :name="profile.user.name" :src="profile.user.avatarUrl" :size="96" />
          <div class="flex flex-col gap-1">
            <h1 class="text-subtitle font-bold text-smoky">{{ profile.user.name }}</h1>
            <p class="text-body-14 text-body">@{{ profile.user.username }}</p>
            <p v-if="profile.user.bio" class="max-w-[60ch] text-body-14 text-smoky">{{ profile.user.bio }}</p>
            <dl class="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-body-14">
              <div class="flex gap-1"><dd class="font-semibold text-smoky">{{ fmtNumber(profile.stats.read) }}</dd><dt class="text-body">livros lidos</dt></div>
              <div class="flex gap-1"><dd class="font-semibold text-smoky">{{ fmtNumber(profile.stats.reviews) }}</dd><dt class="text-body">avaliações</dt></div>
              <div class="flex gap-1"><dd class="font-semibold text-smoky">{{ profile.stats.goal.target ? `${profile.stats.goal.done} de ${profile.stats.goal.target}` : 'Sem' }}</dd><dt class="text-body">{{ profile.stats.goal.target ? `na meta do mês (${profile.stats.goal.percent}%)` : 'meta este mês' }}</dt></div>
              <RouterLink :to="`/leitores/${profile.user.username}/seguindo`" class="flex gap-1 hover:underline"><dd class="font-semibold text-smoky">{{ fmtNumber(profile.stats.following) }}</dd><dt class="text-body">seguindo</dt></RouterLink>
              <div class="flex gap-1"><dd class="font-semibold text-smoky">{{ fmtNumber(profile.stats.followers) }}</dd><dt class="text-body">seguidores</dt></div>
            </dl>
          </div>
        </div>
        <div class="flex shrink-0 items-center justify-end gap-2">
          <RxButton v-if="profile.isMe" variant="secondary" to="/perfil/editar">Editar perfil</RxButton>
          <RxButton v-else :variant="following ? 'secondary' : 'primary'" :loading="followBusy" :aria-pressed="following" @click="toggleFollow">{{ following ? 'Seguindo' : 'Seguir' }}</RxButton>
          <RouterLink v-if="profile.isMe" to="/configuracoes" class="flex size-12 items-center justify-center rounded-md text-smoky hover:bg-smoky/5 lg:hidden" aria-label="Configurações"><Settings :size="22" /></RouterLink>
          <NotificationBell />
        </div>
      </section>

      <RxTabs :model-value="tab" :tabs="tabs" label="Seções do perfil" />

      <div class="grid grid-cols-1 gap-10 wide:grid-cols-[minmax(0,1fr)_400px] wide:gap-16 full:grid-cols-[minmax(0,1fr)_480px]">
        <div class="min-w-0">
          <!-- Lendo -->
          <template v-if="tab === 'lendo'">
            <SkeletonBlock v-if="!books" h="120px" />
            <EmptyState v-else-if="!books.length" compact :title="profile?.isMe ? 'Você não está lendo nenhum livro' : `${first} não está lendo nenhum livro agora`" />
            <ul v-else class="flex flex-col divide-y divide-cloud">
              <li v-for="b in books" :key="b.book.id" class="flex items-center gap-4 py-4 first:pt-0">
                <RouterLink :to="`/livros/${b.book.slug}`" class="shrink-0"><BookCover :title="b.book.title" :src="b.book.coverUrl" :tone="b.book.coverTone" :width="56" /></RouterLink>
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <RouterLink :to="`/livros/${b.book.slug}`" class="truncate text-body-16 font-semibold text-smoky hover:underline">{{ b.book.title }}</RouterLink>
                  <span class="truncate text-body-14 text-secondary">{{ b.book.author }}</span>
                  <div class="flex max-w-[280px] items-center gap-3"><ProgressBar :value="b.progress.percent" :label="`Progresso em ${b.book.title}`" /><span class="text-body-12 font-semibold">{{ b.progress.percent }}%</span></div>
                </div>
                <ShelfStatusButton v-if="!profile?.isMe" :book="b.book" :status="b.myStatus" @change="b.myStatus = $event" />
              </li>
            </ul>
          </template>

          <!-- Lidos -->
          <template v-else-if="tab === 'lidos'">
            <BookGrid :loading="!books">
              <li v-for="b in books ?? []" :key="b.book.id"><BookCard :book="b.book" :rating="b.rating" /></li>
            </BookGrid>
            <EmptyState v-if="books && !books.length" compact title="Nenhum livro concluído ainda" />
          </template>

          <!-- Resenhas -->
          <template v-else-if="tab === 'resenhas'">
            <SkeletonBlock v-if="!reviews" h="120px" />
            <EmptyState v-else-if="!reviews.length" compact title="Nenhuma resenha ainda" />
            <ul v-else class="flex flex-col divide-y divide-cloud">
              <li v-for="r in reviews" :key="r.id" class="flex gap-4 py-5 first:pt-0">
                <RouterLink :to="`/livros/${r.book.slug}/resenhas`" class="shrink-0"><BookCover :title="r.book.title" :src="r.book.coverUrl" :tone="r.book.coverTone" :width="48" /></RouterLink>
                <div class="flex min-w-0 flex-col gap-1">
                  <RouterLink :to="`/livros/${r.book.slug}/resenhas`" class="text-body-16 font-semibold text-smoky hover:underline">{{ r.book.title }}</RouterLink>
                  <div class="flex items-center gap-2"><StarRating :value="r.rating" readonly :size="14" /><span class="text-body-12 text-secondary">{{ timeAgo(r.createdAt) }}</span></div>
                  <p class="line-clamp-3 text-body-14" :class="r.text ? 'text-smoky' : 'italic text-secondary'">{{ r.spoiler ? 'Resenha com spoiler. Abra para ler.' : r.text || 'Sem comentário' }}</p>
                </div>
              </li>
            </ul>
          </template>

          <!-- Anotações -->
          <template v-else>
            <SkeletonBlock v-if="!notes" h="120px" />
            <EmptyState v-else-if="!notes.length" compact :title="profile?.isMe ? 'Nenhuma anotação ainda' : `${first} ainda não tem anotações públicas`" :text="profile?.isMe ? 'Crie anotações na página de cada livro.' : undefined" />
            <ul v-else class="flex flex-col divide-y divide-cloud">
              <li v-for="n in notes" :key="n.id" class="py-5 first:pt-0"><NoteItem :note="n" show-book :editable="profile?.isMe" @toggle="toggleNote(n)" @remove="removeNote(n)" @edit="$router.push(`/livros/${n.book!.slug}/anotacoes`)" /></li>
            </ul>
          </template>
        </div>
        <aside v-if="tab === 'anotacoes' && profile?.isMe" class="flex flex-col gap-2">
          <h2 class="text-body-16 font-semibold text-smoky">Como funciona</h2>
          <p class="text-body-14 text-body">Toda anotação começa privada. Para mostrar aqui para outros leitores, ligue “Mostrar no meu perfil” ao criar ou editar a anotação no livro.</p>
        </aside>
      </div>
    </template>
  </div>
</template>
