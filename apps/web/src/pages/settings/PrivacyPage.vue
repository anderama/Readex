<script setup lang="ts">
// Privacidade e dados: baixar meus dados (JSON) e excluir conta (só habilita com o texto EXCLUIR; exclusão imediata)
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Download, TriangleAlert } from 'lucide-vue-next'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxButton from '@/components/base/RxButton.vue'
import RxModal from '@/components/base/RxModal.vue'
import InputField from '@/components/base/InputField.vue'
import FormAlert from '@/components/auth/FormAlert.vue'
import { api, ApiError } from '@/services/http'
import { session } from '@/stores/session'
import { toast } from '@/stores/toast'

const router = useRouter()
const downloading = ref(false)
const open = ref(false)
const typed = ref('')
const deleting = ref(false)
const error = ref('')
const matches = computed(() => typed.value === 'EXCLUIR')

async function download() {
  downloading.value = true
  try {
    const data = await api.get<object>('/me/export')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'readex-meus-dados.json'
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('Seus dados foram baixados.')
  } catch { toast.error('Não foi possível preparar o arquivo.') } finally { downloading.value = false }
}

async function remove() {
  error.value = ''
  if (!matches.value) { error.value = 'Digite EXCLUIR, em letras maiúsculas, para confirmar.'; return }
  deleting.value = true
  try {
    await api.del('/me', { confirm: typed.value })
    session.logout()
    router.replace({ name: 'deleted' })
  } catch (e) { error.value = e instanceof ApiError ? e.message : 'Sem conexão. Sua conta não foi excluída; tente de novo.' } finally { deleting.value = false }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppTopbar title="Privacidade e dados" :crumbs="[{ label: 'Configurações', to: '/configuracoes' }, { label: 'Privacidade e dados' }]" />
    <div class="flex max-w-[720px] flex-col gap-10">
      <section class="flex flex-col gap-3">
        <h2 class="text-body-16 font-semibold text-smoky">Baixar meus dados</h2>
        <p class="text-body-14 text-body">Um arquivo JSON com seu perfil, estante, progresso, resenhas, anotações, metas e discussões.</p>
        <RxButton variant="secondary" class="self-start" :loading="downloading" @click="download"><Download :size="18" /> Baixar meus dados</RxButton>
      </section>
      <section class="flex flex-col gap-3 rounded-md border border-burgundy/30 p-6">
        <h2 class="flex items-center gap-2 text-body-16 font-semibold text-burgundy"><TriangleAlert :size="18" aria-hidden="true" /> Zona de perigo</h2>
        <p class="text-body-14 text-body">Excluir a conta apaga na hora seu perfil, estante, resenhas, anotações e discussões. Não dá para desfazer.</p>
        <RxButton variant="destructive" class="self-start" @click="open = true; typed = ''; error = ''">Excluir conta</RxButton>
      </section>
    </div>

    <RxModal :open="open" title="Excluir conta?" :description="`A conta @${session.user.value?.username} será apagada para sempre.`" @close="open = false">
      <form class="flex flex-col gap-5" novalidate @submit.prevent="remove">
        <FormAlert>Isso apaga todos os seus dados imediatamente e não pode ser desfeito.</FormAlert>
        <InputField v-model="typed" label="Para confirmar, digite EXCLUIR" autocomplete="off" :error="error" autofocus @update:model-value="error = ''" />
        <p v-if="matches" class="text-body-12 font-semibold text-burgundy">Texto confere. O botão está liberado.</p>
        <div class="flex flex-col-reverse gap-3 border-t border-cloud pt-6 sm:flex-row sm:justify-end">
          <RxButton variant="secondary" @click="open = false">Cancelar</RxButton>
          <RxButton type="submit" variant="destructive" :disabled="!matches" :loading="deleting">Excluir minha conta</RxButton>
        </div>
      </form>
    </RxModal>
  </div>
</template>
