<script setup lang="ts">
// Sino com contador (Bacchic Burgundy) e painel de 440px ancorado embaixo do sino (desktop). No mobile, abre a página.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Bell } from 'lucide-vue-next'
import RxSegmented from '@/components/base/RxSegmented.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import NotificationList from './NotificationList.vue'
import { api } from '@/services/http'
import type { Notification } from '@/services/types'
import { toast } from '@/stores/toast'
import { ui } from '@/stores/ui'

const router = useRouter()
const open = ref(false)
const loading = ref(false)
const failed = ref(false)
const items = ref<Notification[]>([])
const filter = ref('all')
const root = ref<HTMLElement>()
const shown = computed(() => (filter.value === 'unread' ? items.value.filter((n) => !n.read) : items.value))

async function refreshCount() {
  try { ui.unread = (await api.get<{ unread: number }>('/notifications/unread-count')).unread } catch { /* silencioso */ }
}
async function load() {
  loading.value = true; failed.value = false
  try {
    const r = await api.get<{ items: Notification[]; unread: number }>('/notifications', { limit: 20 })
    items.value = r.items; ui.unread = r.unread
  } catch { failed.value = true } finally { loading.value = false }
}
function toggle() {
  if (window.matchMedia('(max-width: 1023px)').matches) { router.push('/notificacoes'); return }
  open.value = !open.value
  if (open.value) load()
}
async function readAll() {
  const { ids } = await api.post<{ ids: string[] }>('/notifications/read-all')
  items.value.forEach((n) => { n.read = true })
  ui.unread = 0
  toast.success('Todas as notificações foram marcadas como lidas.', {
    label: 'Desfazer',
    run: async () => {
      await api.post('/notifications/mark-unread', { ids })
      items.value.forEach((n) => { if (ids.includes(n.id)) n.read = false })
      ui.unread = ids.length
    },
  })
}
function onDoc(e: MouseEvent) { if (open.value && !root.value?.contains(e.target as Node)) open.value = false }
function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && open.value) open.value = false }
onMounted(() => { refreshCount(); document.addEventListener('click', onDoc); document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey) })
watch(() => router.currentRoute.value.fullPath, () => { open.value = false; refreshCount() })
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button" class="relative flex size-12 items-center justify-center rounded-md text-smoky transition-ui hover:bg-smoky/5"
      :aria-label="ui.unread ? `Notificações, ${ui.unread} não lidas` : 'Notificações'" :aria-expanded="open" aria-haspopup="dialog" @click.stop="toggle"
    >
      <Bell :size="22" aria-hidden="true" />
      <span v-if="ui.unread" class="absolute right-2 top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-burgundy px-1 text-[10px] font-semibold leading-none text-white">{{ ui.unread > 9 ? '9+' : ui.unread }}</span>
    </button>
    <Transition name="panel">
      <div v-if="open" role="dialog" aria-label="Notificações" class="absolute right-0 top-14 z-40 flex max-h-[min(640px,calc(100vh-120px))] w-[440px] flex-col overflow-hidden rounded-lg border border-cloud bg-white shadow-menu">
        <div class="flex items-center justify-between px-6 pt-5">
          <h2 class="text-body-16 font-semibold text-smoky">Notificações</h2>
          <button v-if="ui.unread" type="button" class="text-body-14 font-semibold text-sauce hover:underline" @click="readAll">Marcar todas como lidas</button>
        </div>
        <div class="px-6 pt-4">
          <RxSegmented v-model="filter" label="Filtrar notificações" :options="[{ value: 'all', label: 'Todas' }, { value: 'unread', label: `Não lidas (${ui.unread})` }]" />
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto pb-2">
          <div v-if="loading" class="flex flex-col gap-4 p-6">
            <div v-for="i in 4" :key="i" class="flex gap-3"><SkeletonBlock w="40px" h="40px" rounded="999px" /><div class="flex flex-1 flex-col gap-2"><SkeletonBlock /><SkeletonBlock w="40%" h="12px" /></div></div>
          </div>
          <div v-else-if="failed" class="flex flex-col items-center gap-3 p-8 text-center">
            <p class="text-body-14 text-body">Não foi possível carregar as notificações.</p>
            <button type="button" class="text-body-14 font-semibold text-sauce hover:underline" @click="load">Tentar de novo</button>
          </div>
          <EmptyState v-else-if="!shown.length" compact mascot="waving" :title="filter === 'unread' ? 'Tudo em dia' : 'Nenhuma notificação ainda'" text="Quando alguém interagir com você, aparece aqui." />
          <NotificationList v-else :items="shown" @navigate="open = false" />
        </div>
        <RouterLink to="/notificacoes" class="border-t border-cloud py-4 text-center text-body-14 font-semibold text-sauce hover:underline" @click="open = false">Ver todas</RouterLink>
      </div>
    </Transition>
  </div>
</template>
