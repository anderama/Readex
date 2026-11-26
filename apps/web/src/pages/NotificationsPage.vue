<script setup lang="ts">
// Todas as notificações (página cheia; no celular é a única forma de ver)
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxSegmented from '@/components/base/RxSegmented.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import NotificationList from '@/components/layout/NotificationList.vue'
import { api } from '@/services/http'
import type { Notification } from '@/services/types'
import { useAsync } from '@/composables/useAsync'
import { toast } from '@/stores/toast'
import { ui } from '@/stores/ui'

const filter = ref('all')
const { data, loading, error, load } = useAsync(async () => {
  const r = await api.get<{ items: Notification[]; unread: number }>('/notifications', { limit: 100 })
  ui.unread = r.unread
  return r.items
})
const shown = computed(() => (filter.value === 'unread' ? (data.value ?? []).filter((n) => !n.read) : data.value ?? []))

async function readAll() {
  const { ids } = await api.post<{ ids: string[] }>('/notifications/read-all')
  data.value?.forEach((n) => { n.read = true })
  ui.unread = 0
  toast.success('Todas as notificações foram marcadas como lidas.', {
    label: 'Desfazer',
    run: async () => { await api.post('/notifications/mark-unread', { ids }); data.value?.forEach((n) => { if (ids.includes(n.id)) n.read = false }); ui.unread = ids.length },
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <AppTopbar title="Notificações" :bell="false">
      <template #actions><button v-if="ui.unread" type="button" class="text-body-14 font-semibold text-sauce hover:underline" @click="readAll">Marcar todas como lidas</button></template>
    </AppTopbar>
    <div class="max-w-[720px]"><RxSegmented v-model="filter" label="Filtrar notificações" :options="[{ value: 'all', label: 'Todas' }, { value: 'unread', label: `Não lidas (${ui.unread})` }]" /></div>
    <ErrorState v-if="error" :message="error" @retry="load()" />
    <SkeletonBlock v-else-if="loading" h="240px" />
    <EmptyState v-else-if="!shown.length" mascot="waving" :title="filter === 'unread' ? 'Tudo em dia' : 'Nenhuma notificação ainda'" text="Curtidas, respostas, novos seguidores e lembretes aparecem aqui." />
    <div v-else class="-mx-6 max-w-[768px]"><NotificationList :items="shown" /></div>
    <RouterLink to="/configuracoes/notificacoes" class="text-body-14 font-semibold text-sauce hover:underline">Preferências de notificação</RouterLink>
  </div>
</template>
