<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { useId } from 'vue'

defineProps<{ error?: string }>()
const model = defineModel<boolean>({ default: false })
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1">
    <label :for="id" class="flex cursor-pointer items-start gap-2 text-body-14 text-body">
      <span class="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input :id="id" v-model="model" type="checkbox" class="peer absolute inset-0 cursor-pointer opacity-0" :aria-invalid="!!error" />
        <span
          class="flex size-5 items-center justify-center rounded-[4px] border-[1.5px] transition-ui peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sauce"
          :class="model ? 'border-smoky bg-smoky text-white' : error ? 'border-burgundy bg-white' : 'border-border-strong bg-white'"
        ><Check v-if="model" :size="14" :stroke-width="3" /></span>
      </span>
      <span><slot /></span>
    </label>
    <p v-if="error" class="pl-7 text-body-12 font-semibold text-burgundy" role="alert">{{ error }}</p>
  </div>
</template>
