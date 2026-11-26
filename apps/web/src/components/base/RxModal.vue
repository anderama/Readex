<script setup lang="ts">
// Modal no desktop / gaveta no mobile. Prende o foco, fecha com Esc e devolve o foco ao sair.
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ open: boolean; title: string; description?: string; width?: number; dismissible?: boolean }>(), { width: 520, dismissible: true })
const emit = defineEmits<{ close: [] }>()
const panel = ref<HTMLElement>()
const id = useId()
let lastFocus: HTMLElement | null = null

const focusables = () => [...(panel.value?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),textarea,select,[tabindex]:not([tabindex="-1"])') ?? [])]

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.dismissible) { e.stopPropagation(); emit('close') }
  if (e.key !== 'Tab') return
  const els = focusables()
  if (!els.length) return
  const first = els[0]
  const last = els[els.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

watch(() => props.open, async (open) => {
  if (open) {
    lastFocus = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'
    await nextTick()
    const auto = panel.value?.querySelector<HTMLElement>('[autofocus] input,[autofocus] textarea,input[autofocus]')
      ?? panel.value?.querySelector<HTMLElement>('input:not([type=file]),textarea')
    ;(auto ?? focusables()[0])?.focus()
  } else {
    document.body.style.overflow = ''
    lastFocus?.focus?.()
  }
}, { immediate: true })
onBeforeUnmount(() => { document.body.style.overflow = '' })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 bg-smoky/48" aria-hidden="true" @click="dismissible && emit('close')" />
    </Transition>
    <Transition name="modal">
      <div
        v-if="open" class="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
        @keydown="onKey"
      >
        <div
          ref="panel" role="dialog" aria-modal="true" :aria-labelledby="`${id}-t`" :aria-describedby="description ? `${id}-d` : undefined"
          class="pointer-events-auto flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-lg bg-white p-6 pb-8 shadow-modal sm:rounded-lg sm:p-8"
          :style="{ maxWidth: `${width}px` }"
        >
          <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-cloud sm:hidden" aria-hidden="true" />
          <div class="mb-6 flex items-start justify-between gap-4">
            <slot name="leading" />
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <h2 :id="`${id}-t`" class="text-subtitle font-bold text-smoky">{{ title }}</h2>
              <p v-if="description" :id="`${id}-d`" class="text-body-14 text-body">{{ description }}</p>
            </div>
            <button
              v-if="dismissible" type="button" aria-label="Fechar"
              class="-mr-2 -mt-1 flex size-10 shrink-0 items-center justify-center rounded-md text-smoky transition-ui hover:bg-chefs"
              @click="emit('close')"
            ><X :size="20" /></button>
          </div>
          <slot />
          <div v-if="$slots.footer" class="mt-8 flex flex-col-reverse gap-3 border-t border-cloud pt-6 sm:flex-row sm:items-center sm:justify-end">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
