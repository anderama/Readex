<script setup lang="ts">
// RX/Toast: fundo Smoky Black, ícone por tipo e ação opcional em fogo claro ("Desfazer")
import { CircleAlert, CircleCheck, Info, X } from 'lucide-vue-next'
import { toast } from '@/stores/toast'

const icons = { success: CircleCheck, error: CircleAlert, info: Info }
const iconColor = { success: 'text-[#5fd68b]', error: 'text-[#ff8a9f]', info: 'text-[#8fb6ff]' }
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="t in toast.state.items" :key="t.id" :role="t.type === 'error' ? 'alert' : 'status'"
        class="pointer-events-auto flex min-h-12 w-full max-w-[480px] items-center gap-3 rounded-md bg-smoky py-3 pl-4 pr-2 text-body-14 text-white shadow-menu"
      >
        <component :is="icons[t.type]" :size="20" class="shrink-0" :class="iconColor[t.type]" aria-hidden="true" />
        <span class="flex-1">{{ t.message }}</span>
        <button
          v-if="t.action" type="button" class="shrink-0 rounded-sm px-2 py-1 font-semibold text-fire-light underline-offset-2 hover:underline"
          @click="t.action.run(); toast.dismiss(t.id)"
        >{{ t.action.label }}</button>
        <button type="button" aria-label="Fechar aviso" class="flex size-8 shrink-0 items-center justify-center rounded-sm text-white/80 hover:text-white" @click="toast.dismiss(t.id)">
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
