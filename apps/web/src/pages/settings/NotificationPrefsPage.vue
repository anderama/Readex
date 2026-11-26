<script setup lang="ts">
// Preferências de notificação: 6 categorias × canais No app e Push (sem e-mail)
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxSwitch from '@/components/base/RxSwitch.vue'
import RxButton from '@/components/base/RxButton.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import FormAlert from '@/components/auth/FormAlert.vue'
import { ref } from 'vue'
import { api } from '@/services/http'
import type { NotificationPrefs } from '@/services/types'
import { useAsync } from '@/composables/useAsync'
import { toast } from '@/stores/toast'

const { data, loading, error, load } = useAsync(() => api.get<{ prefs: NotificationPrefs }>('/me/notification-prefs').then((r) => r.prefs), { watchVersion: false })
const saving = ref(false)
const rows = [
  { key: 'social', label: 'Atividade social', hint: 'Curtidas, comentários e respostas' },
  { key: 'followers', label: 'Novos seguidores', hint: 'Quando alguém começa a seguir você' },
  { key: 'reminder', label: 'Lembrete de leitura', hint: 'Aviso diário para cumprir a meta' },
  { key: 'goals', label: 'Metas e conquistas', hint: 'Sequência em risco e meta batida' },
  { key: 'recommendations', label: 'Recomendações', hint: 'Livros parecidos com os que você lê' },
  { key: 'weekly', label: 'Resumo semanal', hint: 'Seus números da semana' },
]
async function save() {
  saving.value = true
  try { await api.put('/me/notification-prefs', data.value); toast.success('Preferências salvas.') } catch { toast.error('Não foi possível salvar.') } finally { saving.value = false }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppTopbar title="Notificações" :crumbs="[{ label: 'Configurações', to: '/configuracoes' }, { label: 'Notificações' }]" />
    <ErrorState v-if="error" :message="error" @retry="load()" />
    <SkeletonBlock v-else-if="loading || !data" h="320px" />
    <div v-else class="flex max-w-[720px] flex-col gap-6">
      <FormAlert tone="info">“No app” controla o que aparece no sino. “Push” fica salvo na sua conta, mas o envio para o celular é simulado nesta versão.</FormAlert>
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-cloud text-body-12 text-secondary"><th scope="col" class="pb-3 font-semibold">Categoria</th><th scope="col" class="w-20 pb-3 text-center font-semibold">No app</th><th scope="col" class="w-20 pb-3 text-center font-semibold">Push</th></tr>
        </thead>
        <tbody class="divide-y divide-cloud">
          <tr v-for="r in rows" :key="r.key">
            <th scope="row" class="py-4 pr-4 font-normal"><span class="block text-body-14 font-semibold text-smoky">{{ r.label }}</span><span class="text-body-12 text-secondary">{{ r.hint }}</span></th>
            <td class="py-4"><div class="flex justify-center"><RxSwitch v-model="data[r.key].inApp" hide-label :label="`${r.label} no app`" /></div></td>
            <td class="py-4"><div class="flex justify-center"><RxSwitch v-model="data[r.key].push" hide-label :label="`${r.label} por push`" /></div></td>
          </tr>
        </tbody>
      </table>
      <div class="flex justify-end border-t border-cloud pt-6"><RxButton :loading="saving" @click="save">Salvar preferências</RxButton></div>
    </div>
  </div>
</template>
