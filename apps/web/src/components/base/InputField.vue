<script setup lang="ts">
// RX/Input: rótulo acima, valor dentro, sufixo à direita, ajuda abaixo. Foco 2px Sauce; erro em Burgundy.
import { computed, ref, useId } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  type?: string
  placeholder?: string
  help?: string
  error?: string
  suffix?: string
  autocomplete?: string
  inputmode?: 'text' | 'numeric' | 'email' | 'decimal' | 'search'
  disabled?: boolean
  required?: boolean
  maxlength?: number
  counter?: boolean
  multiline?: boolean
  rows?: number
  hideLabel?: boolean
}>(), { type: 'text', rows: 4 })

const model = defineModel<string | number>({ default: '' })
const id = useId()
const show = ref(false)
const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value && show.value ? 'text' : props.type))
const length = computed(() => String(model.value ?? '').length)
const box = computed(() => [
  'flex w-full items-center gap-2 rounded-md border bg-white px-4 transition-ui',
  props.multiline ? 'py-3' : 'h-14',
  props.error ? 'border-2 border-burgundy px-[15px]' : 'border-border-strong focus-within:border-2 focus-within:border-sauce focus-within:px-[15px]',
  props.disabled && 'bg-chefs border-cloud',
])
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="text-body-14 font-semibold text-smoky" :class="hideLabel && 'sr-only'">
      {{ label }}<span v-if="required" class="sr-only"> (obrigatório)</span>
    </label>
    <div :class="box">
      <textarea
        v-if="multiline" :id="id" v-model="model" :rows="rows" :placeholder="placeholder" :maxlength="maxlength" :disabled="disabled"
        :aria-invalid="!!error" :aria-describedby="error || help ? `${id}-help` : undefined"
        class="w-full resize-y bg-transparent text-body-16 text-smoky outline-none placeholder:text-secondary"
      />
      <input
        v-else :id="id" v-model="model" :type="inputType" :placeholder="placeholder" :autocomplete="autocomplete" :inputmode="inputmode"
        :maxlength="maxlength" :disabled="disabled" :required="required" :aria-invalid="!!error" :aria-describedby="error || help ? `${id}-help` : undefined"
        class="h-full min-w-0 flex-1 bg-transparent text-body-16 text-smoky outline-none placeholder:text-secondary disabled:text-secondary"
      />
      <span v-if="suffix" class="shrink-0 text-body-14 text-secondary">{{ suffix }}</span>
      <button
        v-if="isPassword" type="button" class="shrink-0 rounded-sm text-body-14 text-secondary hover:text-smoky"
        :aria-pressed="show" @click="show = !show"
      >{{ show ? 'Ocultar' : 'Mostrar' }}</button>
    </div>
    <div v-if="error || help || counter" class="flex justify-between gap-4 text-body-12">
      <p :id="`${id}-help`" :class="error ? 'text-burgundy font-semibold' : 'text-secondary'" :role="error ? 'alert' : undefined">{{ error || help }}</p>
      <span v-if="counter && maxlength" class="shrink-0 text-secondary">{{ length.toLocaleString('pt-BR') }} / {{ maxlength.toLocaleString('pt-BR') }}</span>
    </div>
  </div>
</template>
