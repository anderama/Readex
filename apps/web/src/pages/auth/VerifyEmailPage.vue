<script setup lang="ts">
// Confirmar e-mail com código de 6 dígitos. Depois de confirmar, volta ao Login (sem login automático).
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import OtpInput from '@/components/base/OtpInput.vue'
import RxButton from '@/components/base/RxButton.vue'
import FormAlert from '@/components/auth/FormAlert.vue'
import { api, ApiError } from '@/services/http'
import { toast } from '@/stores/toast'
import { useCountdown } from '@/composables/useCountdown'

const route = useRoute()
const router = useRouter()
const email = String(route.query.email ?? '')
const code = ref('')
const error = ref('')
const loading = ref(false)
const demoCode = ref<string | undefined>(window.history.state?.demoCode)
const { left, start } = useCountdown(45)

if (!email) router.replace('/criar-conta')

async function submit() {
  error.value = ''
  if (code.value.length < 6) { error.value = 'Digite os 6 números do código.'; return }
  loading.value = true
  try {
    await api.post('/auth/verify-email', { email, code: code.value })
    toast.success('E-mail confirmado. Agora é só entrar.')
    router.replace({ name: 'login' })
  } catch (e) { error.value = e instanceof ApiError ? e.message : 'Não foi possível confirmar.' } finally { loading.value = false }
}
async function resend() {
  try {
    const r = await api.post<{ demoCode?: string }>('/auth/resend-code', { email, purpose: 'VERIFY_EMAIL' })
    demoCode.value = r.demoCode
    code.value = ''
    start()
    toast.info('Enviamos um novo código.')
  } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Não foi possível reenviar.') }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-title-48 font-bold text-smoky">Confirme seu e-mail</h1>
      <p class="text-body-16 text-body">Enviamos um código de 6 dígitos para <strong class="font-semibold text-smoky">{{ email }}</strong>. Ele vale por 10 minutos.</p>
    </div>
    <FormAlert v-if="demoCode" tone="info">
      <strong class="font-semibold">Modo demonstração:</strong> não há envio real de e-mail. Seu código é <strong class="font-semibold tracking-widest">{{ demoCode }}</strong> (também aparece no terminal da API).
    </FormAlert>
    <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
      <div class="flex flex-col gap-2">
        <span class="text-body-14 font-semibold text-smoky">Código</span>
        <OtpInput v-model="code" :error="!!error" @complete="submit" />
        <p v-if="error" class="text-body-12 font-semibold text-burgundy" role="alert">{{ error }}</p>
      </div>
      <RxButton type="submit" block :loading="loading">Confirmar e-mail</RxButton>
    </form>
    <p class="text-center text-body-14 text-body">
      Não recebeu?
      <button v-if="!left" type="button" class="font-semibold text-sauce hover:underline" @click="resend">Reenviar código</button>
      <span v-else class="text-secondary">Reenviar em {{ left }} s</span>
    </p>
    <RouterLink to="/entrar" class="text-center text-body-14 font-semibold text-sauce hover:underline">Voltar para o login</RouterLink>
  </div>
</template>
