<script setup lang="ts">
// SearchBar: campo de busca de 48 (compacto no cabeçalho) ou 56 (página Explorar), com botão de limpar
import { ref } from 'vue'
import { Search, X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ placeholder?: string; large?: boolean; glass?: boolean; label?: string }>(), { placeholder: 'Buscar livros e autores', label: 'Buscar' })
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ submit: [q: string]; focus: [] }>()
const input = ref<HTMLInputElement>()
defineExpose({ focus: () => input.value?.focus() })
void props
</script>

<template>
  <form role="search" class="relative w-full" @submit.prevent="emit('submit', model)">
    <label class="sr-only" :for="`search-${label}`">{{ label }}</label>
    <div
      class="flex w-full items-center gap-2 rounded-md border px-4 transition-ui focus-within:border-2 focus-within:border-sauce focus-within:px-[15px]"
      :class="[large ? 'h-14' : 'h-12', glass ? 'border-border-strong bg-white/70 backdrop-blur-sm' : 'border-border-strong bg-white']"
    >
      <Search :size="18" class="shrink-0 text-smoky" aria-hidden="true" />
      <input
        :id="`search-${label}`" ref="input" v-model="model" type="search" :placeholder="placeholder" autocomplete="off"
        class="h-full min-w-0 flex-1 bg-transparent text-body-14 text-smoky outline-none placeholder:text-secondary [&::-webkit-search-cancel-button]:hidden"
        :class="large && 'text-body-16'" @focus="emit('focus')"
      />
      <button v-if="model" type="button" aria-label="Limpar busca" class="flex size-8 items-center justify-center rounded-sm text-secondary hover:text-smoky" @click="model = ''; input?.focus()">
        <X :size="16" />
      </button>
    </div>
  </form>
</template>
