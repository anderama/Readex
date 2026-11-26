<script setup lang="ts">
// Código de verificação de 6 dígitos (aceita colar o código inteiro)
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{ error?: boolean; disabled?: boolean }>()
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ complete: [code: string] }>()
const digits = ref<string[]>(Array.from({ length: 6 }, (_, i) => model.value[i] ?? ''))
const inputs = ref<HTMLInputElement[]>([])

watch(model, (v) => { if (v !== digits.value.join('')) digits.value = Array.from({ length: 6 }, (_, i) => v[i] ?? '') })

function sync() {
  // Usa o valor calculado aqui: o defineModel só reflete o novo valor depois que o pai atualiza
  const code = digits.value.join('')
  model.value = code
  if (code.length === 6) emit('complete', code)
}
function onInput(i: number, e: Event) {
  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  if (v.length > 1) return fill(v, i)
  digits.value[i] = v
  sync()
  if (v && i < 5) inputs.value[i + 1]?.focus()
}
function fill(text: string, start = 0) {
  const nums = text.replace(/\D/g, '').slice(0, 6 - start).split('')
  nums.forEach((n, k) => { digits.value[start + k] = n })
  sync()
  nextTick(() => inputs.value[Math.min(5, start + nums.length)]?.focus())
}
function onKey(i: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) inputs.value[i - 1]?.focus()
  if (e.key === 'ArrowLeft' && i > 0) inputs.value[i - 1]?.focus()
  if (e.key === 'ArrowRight' && i < 5) inputs.value[i + 1]?.focus()
}
function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  fill(e.clipboardData?.getData('text') ?? '')
}
defineExpose({ focus: () => inputs.value[0]?.focus() })
void props
</script>

<template>
  <div class="flex gap-2 sm:gap-3" role="group" aria-label="Código de 6 dígitos">
    <input
      v-for="(_, i) in digits" :key="i" ref="inputs" :value="digits[i]" inputmode="numeric" autocomplete="one-time-code" maxlength="6"
      :aria-label="`Dígito ${i + 1}`" :disabled="disabled" :aria-invalid="error"
      class="h-14 w-12 rounded-md border bg-white text-center text-subtitle font-bold text-smoky outline-none transition-ui focus:border-2 focus:border-sauce sm:w-14"
      :class="error ? 'border-2 border-burgundy' : 'border-border-strong'"
      @input="onInput(i, $event)" @keydown="onKey(i, $event)" @paste="onPaste"
    />
  </div>
</template>
