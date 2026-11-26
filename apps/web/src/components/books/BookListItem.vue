<script setup lang="ts">
// Livro em lista (resultado de busca, sugestões): capa, título, autor, nota média e botão de status
import { RouterLink } from 'vue-router'
import { Star } from 'lucide-vue-next'
import BookCover from './BookCover.vue'
import ShelfStatusButton from './ShelfStatusButton.vue'
import { fmtNumber, fmtRating } from '@/utils/format'
import type { Book, ShelfStatus } from '@/services/types'

const props = withDefaults(defineProps<{ book: Book; coverWidth?: number; showStatus?: boolean; note?: string }>(), { coverWidth: 40, showStatus: true })
const emit = defineEmits<{ status: [s: ShelfStatus | null] }>()
void props
</script>

<template>
  <div class="group flex items-center gap-4">
    <RouterLink :to="`/livros/${book.slug}`" class="shrink-0 transition-transform duration-150 group-hover:-translate-y-0.5" tabindex="-1" aria-hidden="true">
      <BookCover :title="book.title" :author="book.author" :src="book.coverUrl" :tone="book.coverTone" :width="coverWidth" />
    </RouterLink>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <RouterLink :to="`/livros/${book.slug}`" class="truncate text-body-16 font-semibold text-smoky hover:underline">{{ book.title }}</RouterLink>
      <span class="truncate text-body-14 text-secondary">{{ book.author }}</span>
      <span class="flex flex-wrap items-center gap-1 text-body-12 text-secondary">
        <Star :size="14" class="text-sauce" :class="book.ratingsCount ? 'fill-sauce' : ''" aria-hidden="true" />
        <template v-if="book.ratingsCount">{{ fmtRating(book.avgRating) }} média da comunidade</template>
        <template v-else>Sem avaliações</template>
        · {{ fmtNumber(book.pages) }} págs.
      </span>
      <span v-if="note" class="text-body-12 text-secondary">{{ note }}</span>
    </div>
    <slot>
      <ShelfStatusButton v-if="showStatus" :book="book" :status="book.myStatus ?? null" @change="emit('status', $event)" />
    </slot>
  </div>
</template>
