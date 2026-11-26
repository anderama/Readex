<script setup lang="ts">
// RX/Button (BtnPrimary / BtnSecondary): Primary, Secondary, Ghost e Destrutivo · estados Default, Disabled e Loading
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import LoadingSpinner from './LoadingSpinner.vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'md' | 'sm'
  loading?: boolean
  disabled?: boolean
  block?: boolean
  to?: string
  type?: 'button' | 'submit'
}>(), { variant: 'primary', size: 'md', type: 'button' })

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-ui select-none',
  props.size === 'md' ? 'h-12 px-6 text-body-16' : 'h-10 px-4 text-body-14',
  props.block && 'w-full',
  {
    primary: 'bg-fire text-smoky hover:bg-fire-hover active:translate-y-px disabled:bg-chefs disabled:text-disabled',
    secondary: 'border-[1.5px] border-smoky text-smoky hover:bg-smoky/5 active:translate-y-px disabled:border-disabled disabled:text-disabled disabled:hover:bg-transparent',
    ghost: 'text-sauce hover:bg-fire-light/60 disabled:text-disabled',
    destructive: 'bg-burgundy text-white hover:bg-[#7d0f25] active:translate-y-px disabled:bg-chefs disabled:text-disabled',
  }[props.variant],
  props.loading && 'pointer-events-none',
])
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes"><slot /></RouterLink>
  <button v-else :type="type" :class="classes" :disabled="disabled && !loading" :aria-disabled="loading || undefined" :aria-busy="loading || undefined">
    <LoadingSpinner v-if="loading" :size="18" />
    <slot />
  </button>
</template>
