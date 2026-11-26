<script setup lang="ts">
// RX/Botão de status: botão dividido de 40px. A parte principal salva em "Quero ler"; a seta abre Quero ler, Lendo, Concluído e Remover.
import { computed, nextTick, onBeforeUnmount, ref, useId } from 'vue'
import { Bookmark, BookOpen, Check, ChevronDown, Trash2 } from 'lucide-vue-next'
import LoadingSpinner from '@/components/base/LoadingSpinner.vue'
import { useShelf } from '@/composables/useShelf'
import type { Book, ShelfStatus } from '@/services/types'

const props = defineProps<{ book: Pick<Book, 'id' | 'title'>; status: ShelfStatus | null }>()
const emit = defineEmits<{ change: [status: ShelfStatus | null] }>()
const { setStatus, remove } = useShelf()
const open = ref(false)
const saving = ref(false)
const menu = ref<HTMLElement>()
const root = ref<HTMLElement>()
const id = useId()

const look = computed(() => {
  switch (props.status) {
    case 'QUERO_LER': return { label: 'Salvo', icon: Bookmark, filled: true, cls: 'bg-white border-smoky text-smoky' }
    case 'LENDO': return { label: 'Lendo', icon: BookOpen, filled: false, cls: 'bg-fire-light border-fire-light text-smoky' }
    case 'CONCLUIDO': return { label: 'Concluído', icon: Check, filled: false, cls: 'bg-chefs border-chefs text-smoky' }
    default: return { label: 'Quero ler', icon: Bookmark, filled: false, cls: 'bg-white border-border-strong text-smoky' }
  }
})

async function apply(status: ShelfStatus) {
  open.value = false
  if (status === props.status) return
  saving.value = true
  const item = await setStatus(props.book, status, props.status)
  saving.value = false
  if (item) emit('change', status)
}
async function onMain() {
  if (props.status) { toggle(); return }
  await apply('QUERO_LER')
}
async function onRemove() {
  open.value = false
  saving.value = true
  const ok = await remove(props.book)
  saving.value = false
  if (ok) emit('change', null)
}
function onDocClick(e: MouseEvent) { if (!root.value?.contains(e.target as Node)) close() }
function close() { open.value = false; document.removeEventListener('click', onDocClick) }
async function toggle() {
  open.value = !open.value
  if (open.value) {
    document.addEventListener('click', onDocClick)
    await nextTick()
    menu.value?.querySelector<HTMLElement>('[role=menuitem]')?.focus()
  } else close()
}
function onMenuKey(e: KeyboardEvent) {
  const items = [...(menu.value?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])]
  const i = items.indexOf(document.activeElement as HTMLElement)
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus() }
  if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus() }
  if (e.key === 'Escape' || e.key === 'Tab') { close(); (root.value?.querySelector('[aria-haspopup]') as HTMLElement)?.focus() }
}
onBeforeUnmount(close)

const options: { value: ShelfStatus; label: string }[] = [
  { value: 'QUERO_LER', label: 'Quero ler' },
  { value: 'LENDO', label: 'Lendo agora' },
  { value: 'CONCLUIDO', label: 'Concluído' },
]
</script>

<template>
  <div ref="root" class="relative inline-flex">
    <div class="inline-flex h-10 overflow-hidden rounded-md border transition-ui" :class="look.cls">
      <button
        type="button" class="flex items-center gap-2 pl-3 pr-3 text-body-14 font-semibold hover:bg-smoky/5"
        :aria-label="status ? `Status: ${look.label}. Alterar` : `Salvar ${book.title} em Quero ler`" @click.stop="onMain"
      >
        <LoadingSpinner v-if="saving" :size="16" />
        <component :is="look.icon" v-else :size="16" :class="[look.filled && 'fill-smoky', status === 'CONCLUIDO' && 'text-success']" aria-hidden="true" />
        {{ look.label }}
      </button>
      <span class="w-px self-stretch bg-current opacity-20" aria-hidden="true" />
      <button
        type="button" class="flex w-9 items-center justify-center hover:bg-smoky/5" aria-haspopup="menu" :aria-expanded="open" :aria-controls="id"
        :aria-label="`Mais opções para ${book.title}`" @click.stop="toggle"
      ><ChevronDown :size="16" aria-hidden="true" /></button>
    </div>
    <Transition name="panel">
      <div
        v-if="open" :id="id" ref="menu" role="menu" class="absolute right-0 top-12 z-30 w-52 rounded-md border border-cloud bg-white py-2 shadow-menu" @keydown="onMenuKey"
      >
        <button
          v-for="o in options" :key="o.value" type="button" role="menuitem"
          class="flex w-full items-center justify-between px-4 py-2.5 text-left text-body-14 hover:bg-chefs focus:bg-chefs focus:outline-none"
          :class="status === o.value ? 'font-semibold text-smoky' : 'text-body'" @click="apply(o.value)"
        >{{ o.label }}<Check v-if="status === o.value" :size="16" aria-hidden="true" /></button>
        <template v-if="status">
          <div class="my-2 h-px bg-cloud" />
          <button type="button" role="menuitem" class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-body-14 font-semibold text-burgundy hover:bg-negative-soft focus:bg-negative-soft focus:outline-none" @click="onRemove">
            <Trash2 :size="16" aria-hidden="true" /> Remover da estante
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>
