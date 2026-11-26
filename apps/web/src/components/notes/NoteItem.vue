<script setup lang="ts">
// Anotação na lista: tipo (Citação/Nota), página, texto, visibilidade (Privada/Pública) e menu de ações
import { onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
import ChipTag from '@/components/base/ChipTag.vue'
import BookCover from '@/components/books/BookCover.vue'
import type { Note } from '@/services/types'
import { timeAgo } from '@/utils/format'

const props = defineProps<{ note: Note; editable?: boolean; showBook?: boolean }>()
const emit = defineEmits<{ edit: []; remove: []; toggle: [] }>()
const menu = ref(false)
const root = ref<HTMLElement>()
function onDoc(e: MouseEvent) { if (!root.value?.contains(e.target as Node)) menu.value = false }
document.addEventListener('click', onDoc)
onBeforeUnmount(() => document.removeEventListener('click', onDoc))
void props
</script>

<template>
  <article class="flex gap-4">
    <RouterLink v-if="showBook && note.book" :to="`/livros/${note.book.slug}/anotacoes`" class="shrink-0" tabindex="-1" aria-hidden="true">
      <BookCover :title="note.book.title" :src="note.book.coverUrl" :tone="note.book.coverTone" :width="40" />
    </RouterLink>
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-col">
          <RouterLink v-if="showBook && note.book" :to="`/livros/${note.book.slug}`" class="truncate text-body-16 font-semibold text-smoky hover:underline">{{ note.book.title }}</RouterLink>
          <span class="text-body-12 text-secondary">
            <template v-if="showBook && note.book">{{ note.book.author }}<template v-if="note.page">, </template></template>
            <template v-if="note.page">p. {{ note.page }}</template>
            <template v-if="!showBook"> · {{ timeAgo(note.createdAt) }}</template>
          </span>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <ChipTag as="tag" :tone="note.kind === 'CITACAO' ? 'brand' : 'neutral'">{{ note.kind === 'CITACAO' ? 'Citação' : 'Nota' }}</ChipTag>
          <ChipTag v-if="editable" as="tag" :tone="note.isPublic ? 'info' : 'neutral'">{{ note.isPublic ? 'Pública' : 'Privada' }}</ChipTag>
          <div v-if="editable" ref="root" class="relative">
            <button type="button" class="flex size-10 items-center justify-center rounded-md text-body hover:bg-chefs" aria-haspopup="menu" :aria-expanded="menu" aria-label="Opções da anotação" @click.stop="menu = !menu"><MoreHorizontal :size="20" /></button>
            <Transition name="panel">
              <div v-if="menu" role="menu" class="absolute right-0 top-11 z-20 w-56 rounded-md border border-cloud bg-white py-2 shadow-menu">
                <button type="button" role="menuitem" class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-body-14 hover:bg-chefs" @click="menu = false; emit('edit')"><Pencil :size="16" /> Editar</button>
                <button type="button" role="menuitem" class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-body-14 hover:bg-chefs" @click="menu = false; emit('toggle')">
                  <component :is="note.isPublic ? EyeOff : Eye" :size="16" /> {{ note.isPublic ? 'Tornar privada' : 'Mostrar no meu perfil' }}
                </button>
                <button type="button" role="menuitem" class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-body-14 font-semibold text-burgundy hover:bg-negative-soft" @click="menu = false; emit('remove')"><Trash2 :size="16" /> Excluir</button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
      <blockquote v-if="note.kind === 'CITACAO'" class="text-body-16 text-smoky">“{{ note.text }}”</blockquote>
      <p v-else class="whitespace-pre-line text-body-14 text-smoky">{{ note.text }}</p>
      <p v-if="note.comment" class="text-body-14 text-body">{{ note.comment }}</p>
      <span v-if="showBook" class="text-body-12 text-secondary">{{ timeAgo(note.createdAt) }}</span>
    </div>
  </article>
</template>
