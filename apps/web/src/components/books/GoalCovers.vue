<script setup lang="ts">
// Meta do mês em capas: uma capa por livro terminado e vagas vazias até a meta
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BookCover from './BookCover.vue'
import type { Goal } from '@/services/types'

const props = withDefaults(defineProps<{ goal: Goal; width?: number; max?: number }>(), { width: 36, max: 12 })
const empty = computed(() => Math.max(0, Math.min(props.max, (props.goal.target ?? 0)) - props.goal.books.length))
const shown = computed(() => props.goal.books.slice(0, props.max))
</script>

<template>
  <ul class="flex flex-wrap gap-2" :aria-label="`${goal.done} de ${goal.target ?? 0} livros da meta`">
    <li v-for="b in shown" :key="b.id">
      <RouterLink :to="`/livros/${b.slug}`" class="block transition-transform hover:-translate-y-0.5" :title="b.title">
        <BookCover :title="b.title" :author="b.author" :src="b.coverUrl" :tone="b.coverTone" :width="width" />
      </RouterLink>
    </li>
    <li v-for="i in empty" :key="`v${i}`" aria-hidden="true">
      <span class="block rounded-[3px] border border-cloud bg-chefs" :style="{ width: `${width}px`, height: `${width * 1.5}px` }" />
    </li>
  </ul>
</template>
