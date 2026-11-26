<script setup lang="ts">
// ReviewCard: avatar e nome, data, nota em estrelas e texto. Sem texto: "Sem comentário". Spoiler oculto até "Mostrar".
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { EyeOff, Heart } from 'lucide-vue-next'
import AvatarCircle from '@/components/base/AvatarCircle.vue'
import StarRating from './StarRating.vue'
import { api } from '@/services/http'
import { fmtDate } from '@/utils/format'
import type { Review } from '@/services/types'

const props = defineProps<{ review: Review; mine?: boolean }>()
const revealed = ref(false)
const liked = ref(props.review.likedByMe)
const likes = ref(props.review.likes)

async function like() {
  liked.value = !liked.value
  likes.value += liked.value ? 1 : -1
  try {
    const r = await api.post<{ liked: boolean; likes: number }>(`/reviews/${props.review.id}/like`)
    liked.value = r.liked; likes.value = r.likes
  } catch { liked.value = !liked.value; likes.value += liked.value ? 1 : -1 }
}
</script>

<template>
  <article class="flex gap-3">
    <RouterLink :to="`/leitores/${review.user.username}`" class="shrink-0"><AvatarCircle :name="review.user.name" :src="review.user.avatarUrl" /></RouterLink>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <RouterLink :to="`/leitores/${review.user.username}`" class="text-body-14 font-semibold text-smoky hover:underline">{{ review.user.name }}</RouterLink>
        <StarRating :value="review.rating" readonly :size="14" />
        <time :datetime="review.createdAt" class="text-body-12 text-secondary">{{ fmtDate(review.createdAt) }}</time>
      </div>
      <p v-if="!review.text" class="text-body-14 italic text-secondary">Sem comentário</p>
      <div v-else-if="review.spoiler && !revealed" class="flex items-center justify-between gap-3 rounded-md bg-chefs px-4 py-3">
        <span class="flex items-center gap-2 text-body-14 text-body"><EyeOff :size="16" aria-hidden="true" /> Contém spoiler</span>
        <button type="button" class="text-body-14 font-semibold text-sauce hover:underline" @click="revealed = true">Mostrar</button>
      </div>
      <p v-else class="whitespace-pre-line text-body-14 text-smoky">{{ review.text }}</p>
      <div v-if="!mine" class="mt-1 flex items-center gap-4">
        <button type="button" class="flex items-center gap-1 rounded-sm text-body-12 text-body hover:text-smoky" :aria-pressed="liked" :aria-label="liked ? 'Descurtir resenha' : 'Curtir resenha'" @click="like">
          <Heart :size="16" :class="liked && 'fill-sauce text-sauce'" aria-hidden="true" /> {{ likes }}
        </button>
        <button v-if="review.spoiler && revealed" type="button" class="text-body-12 text-secondary hover:text-smoky" @click="revealed = false">Ocultar spoiler</button>
      </div>
    </div>
  </article>
</template>
