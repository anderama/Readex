<script setup lang="ts">
// RX/Capa foto com lazy loading; se a imagem faltar ou falhar, usa a RX/Capa tipográfica (fallback)
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  author?: string
  src?: string | null
  tone?: string
  /** largura em px; a altura segue a proporção 2:3 */
  width?: number
  eager?: boolean
}>(), { width: 40, tone: 'ambar' })

const failed = ref(false)
const showImage = computed(() => !!props.src && !failed.value)
const height = computed(() => Math.round(props.width * 1.5))
const radius = computed(() => (props.width >= 100 ? 6 : props.width >= 56 ? 4 : 3))
const shadow = computed(() => (props.width >= 100 ? 'shadow-cover' : 'shadow-cover-sm'))
const tones: Record<string, string> = {
  ambar: 'bg-fire text-smoky',
  marinho: 'bg-smoky text-white',
  creme: 'bg-fire-light text-smoky',
  areia: 'bg-cloud text-smoky',
}
// Capa tipográfica desenhada em 120×180 e reduzida por escala, para o texto não quebrar
const scale = computed(() => props.width / 120)
</script>

<template>
  <span
    class="relative block shrink-0 overflow-hidden border border-black/10 bg-chefs"
    :class="shadow" :style="{ width: `${width}px`, height: `${height}px`, borderRadius: `${radius}px` }"
  >
    <img
      v-if="showImage" :src="src!" :alt="`Capa de ${title}`" :loading="eager ? 'eager' : 'lazy'" decoding="async"
      class="absolute inset-0 size-full object-cover" @error="failed = true"
    />
    <span v-else role="img" :aria-label="`Capa de ${title}`" class="absolute left-0 top-0 block origin-top-left" :style="{ width: '120px', height: '180px', transform: `scale(${scale})` }">
      <span class="flex size-full flex-col justify-between p-3" :class="tones[tone] ?? tones.ambar">
        <span class="flex flex-col gap-2">
          <span class="line-clamp-4 text-[13px] font-semibold leading-tight">{{ title }}</span>
          <span class="block h-px w-6 bg-current opacity-60" />
        </span>
        <span v-if="author" class="line-clamp-2 text-[10px] leading-tight opacity-80">{{ author }}</span>
      </span>
    </span>
    <!-- Lombada -->
    <span class="pointer-events-none absolute inset-y-0 left-0 w-[5px] bg-gradient-to-r from-black/20 to-transparent" aria-hidden="true" />
  </span>
</template>
