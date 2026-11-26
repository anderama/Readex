<script setup lang="ts">
// Interruptor (role="switch") com rótulo e descrição opcional
import { useId } from 'vue'

defineProps<{ label: string; description?: string; hideLabel?: boolean }>()
const model = defineModel<boolean>({ default: false })
const id = useId()
</script>

<template>
  <div class="flex items-start gap-4">
    <button
      :id="id" type="button" role="switch" :aria-checked="model" :aria-label="hideLabel ? label : undefined"
      :aria-describedby="description ? `${id}-d` : undefined"
      class="relative mt-0.5 h-6 w-10 shrink-0 rounded-full border-[1.5px] transition-ui"
      :class="model ? 'border-smoky bg-smoky' : 'border-border-strong bg-chefs'"
      @click="model = !model"
    >
      <span class="absolute top-1/2 size-4 -translate-y-1/2 rounded-full transition-all duration-150" :class="model ? 'left-[19px] bg-white' : 'left-[3px] bg-border-strong'" />
    </button>
    <label v-if="!hideLabel" :for="id" class="flex cursor-pointer flex-col">
      <span class="text-body-14 font-semibold text-smoky">{{ label }}</span>
      <span v-if="description" :id="`${id}-d`" class="text-body-12 text-secondary">{{ description }}</span>
    </label>
  </div>
</template>
