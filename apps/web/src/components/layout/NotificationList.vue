<script setup lang="ts">
// Lista de notificações agrupada por Hoje / Ontem / Anteriores (usada no painel do sino e na página)
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { BellRing, BookOpen, Sparkles, Target, Newspaper } from 'lucide-vue-next'
import AvatarCircle from '@/components/base/AvatarCircle.vue'
import { api } from '@/services/http'
import { timeAgo } from '@/utils/format'
import type { Notification } from '@/services/types'
import { ui } from '@/stores/ui'

const props = defineProps<{ items: Notification[] }>()
const emit = defineEmits<{ navigate: [] }>()
const router = useRouter()

const icons: Record<string, unknown> = { reminder: BellRing, goals: Target, recommendations: BookOpen, weekly: Newspaper }
const groups = computed(() => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today.getTime() - 86400000)
  const g: { label: string; items: Notification[] }[] = [{ label: 'Hoje', items: [] }, { label: 'Ontem', items: [] }, { label: 'Anteriores', items: [] }]
  props.items.forEach((n) => {
    const d = new Date(n.createdAt)
    g[d >= today ? 0 : d >= yesterday ? 1 : 2].items.push(n)
  })
  return g.filter((x) => x.items.length)
})

async function open(n: Notification) {
  if (!n.read) {
    n.read = true
    ui.unread = Math.max(0, ui.unread - 1)
    api.post(`/notifications/${n.id}/read`).catch(() => {})
  }
  emit('navigate')
  if (n.link) router.push(n.link)
}
</script>

<template>
  <div class="flex flex-col">
    <section v-for="g in groups" :key="g.label" class="flex flex-col">
      <h3 class="px-6 pb-2 pt-4 text-body-12 font-semibold text-secondary">{{ g.label }}</h3>
      <ul>
        <li v-for="n in g.items" :key="n.id">
          <button type="button" class="flex w-full items-start gap-3 px-6 py-3 text-left transition-ui hover:bg-chefs" :class="!n.read && 'bg-warning-soft/55'" @click="open(n)">
            <AvatarCircle v-if="n.actor" :name="n.actor.name" :src="n.actor.avatarUrl" :size="40" />
            <span v-else class="flex size-10 shrink-0 items-center justify-center rounded-md bg-chefs text-sauce">
              <component :is="icons[n.category] ?? Sparkles" :size="18" aria-hidden="true" />
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="text-body-14 text-smoky">{{ n.text }}</span>
              <span class="text-body-12 text-secondary">{{ timeAgo(n.createdAt) }}</span>
            </span>
            <span v-if="!n.read" class="mt-2 size-2 shrink-0 rounded-full bg-sauce" aria-label="Não lida" />
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
