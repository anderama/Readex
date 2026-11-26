<script setup lang="ts">
// Livro em grade (estante, perfil): capa com hover, título, autor e progresso opcional
import { RouterLink } from 'vue-router'
import BookCover from './BookCover.vue'
import ProgressBar from './ProgressBar.vue'
import StarRating from './StarRating.vue'
import type { Book } from '@/services/types'

defineProps<{ book: Book; percent?: number; rating?: number | null; caption?: string }>()
</script>

<template>
  <RouterLink :to="`/livros/${book.slug}`" class="group flex min-w-0 flex-col gap-3 rounded-md">
    <span class="block transition-transform duration-150 group-hover:-translate-y-1 group-focus-visible:-translate-y-1">
      <BookCover :title="book.title" :author="book.author" :src="book.coverUrl" :tone="book.coverTone" :width="120" />
    </span>
    <span class="flex w-[120px] flex-col gap-1">
      <span class="line-clamp-2 text-body-14 font-semibold text-smoky group-hover:underline">{{ book.title }}</span>
      <span class="truncate text-body-12 text-secondary">{{ book.author }}</span>
      <span v-if="percent !== undefined" class="mt-1 flex items-center gap-2">
        <ProgressBar :value="percent" :label="`Progresso de ${book.title}`" />
        <span class="text-body-12 font-semibold text-smoky">{{ percent }}%</span>
      </span>
      <StarRating v-if="rating" :value="rating" readonly :size="12" />
      <span v-if="caption" class="text-body-12 text-secondary">{{ caption }}</span>
    </span>
  </RouterLink>
</template>
