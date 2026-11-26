<script setup lang="ts">
// RX/Segmented: fundo Chef's Hat, opções de largura igual, ativa em branco. Aceita N opções.
const props = defineProps<{ options: { value: string; label: string }[]; label: string }>()
const model = defineModel<string>({ required: true })

function onKey(e: KeyboardEvent, i: number) {
  const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!dir) return
  const next = props.options[(i + dir + props.options.length) % props.options.length]
  model.value = next.value
  ;((e.currentTarget as HTMLElement).parentElement?.children[(i + dir + props.options.length) % props.options.length] as HTMLElement)?.focus()
}
</script>

<template>
  <div role="tablist" :aria-label="label" class="flex h-12 rounded-md bg-chefs p-1">
    <button
      v-for="(o, i) in options" :key="o.value" type="button" role="tab" :aria-selected="model === o.value" :tabindex="model === o.value ? 0 : -1"
      class="h-10 flex-1 rounded-sm px-4 text-body-14 transition-ui"
      :class="model === o.value ? 'bg-white font-semibold text-smoky shadow-cover-sm' : 'text-body hover:text-smoky'"
      @click="model = o.value" @keydown="onKey($event, i)"
    >{{ o.label }}</button>
  </div>
</template>
