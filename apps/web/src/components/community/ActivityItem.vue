<script setup lang="ts">
// Atividade resumida da comunidade (Início): avatar, "Nome resenhou Livro", trecho e capa
import { RouterLink } from 'vue-router'
import AvatarCircle from '@/components/base/AvatarCircle.vue'
import BookCover from '@/components/books/BookCover.vue'
import type { FeedItem } from '@/services/types'

defineProps<{ item: FeedItem }>()
const short = (name: string) => { const [a, b] = name.split(' '); return b ? `${a} ${b[0]}.` : a }
</script>

<template>
  <div class="flex items-center gap-4">
    <RouterLink :to="`/leitores/${item.user.username}`" class="shrink-0"><AvatarCircle :name="item.user.name" :src="item.user.avatarUrl" /></RouterLink>
    <RouterLink :to="item.type === 'post' ? `/comunidade/posts/${item.id}` : `/livros/${item.book.slug}/resenhas`" class="group flex min-w-0 flex-1 flex-col gap-1">
      <p class="text-body-14 text-secondary">
        <span class="font-semibold text-smoky">{{ short(item.user.name) }}</span>
        {{ item.type === 'post' ? 'comentou sobre' : item.activity }} {{ item.book.title }}
      </p>
      <p class="line-clamp-1 text-body-14 text-smoky group-hover:underline">
        <template v-if="item.type === 'post'">“{{ item.text }}”</template>
        <template v-else-if="item.text && !item.spoiler">“{{ item.text }}”</template>
        <template v-else-if="item.text">Resenha com spoiler</template>
        <template v-else>Deu {{ item.rating }} {{ item.rating === 1 ? 'estrela' : 'estrelas' }}. Sem comentário.</template>
      </p>
    </RouterLink>
    <RouterLink :to="`/livros/${item.book.slug}`" class="shrink-0" tabindex="-1" aria-hidden="true">
      <BookCover :title="item.book.title" :src="item.book.coverUrl" :tone="item.book.coverTone" :width="32" />
    </RouterLink>
  </div>
</template>
