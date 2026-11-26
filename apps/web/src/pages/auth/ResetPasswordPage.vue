<script setup lang="ts">
// Redefinir senha em 2 passos: código de 6 dígitos (vale 10 min, reenvio após 45 s) e nova senha
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import OtpInput from '@/components/base/OtpInput.vue'
import InputField from '@/components/base/InputField.vue'
import RxButton from '@/components/base/RxButton.vue'
import FormAlert from '@/components/auth/FormAlert.vue'
import { api, ApiError } from '@/services/http'
import { toast } from '@/stores/toast'
import { useCountdown } from '@/composables/useCountdown'

const route = useRoute()
const router = useRouter()
const email = String(route.query.email ?? '')
const step = ref<'code' | 'password'>('code')
const code = ref('')
const password = ref('')
const confirm = ref('')
const errors = ref<Record<string, string>>({})
const loading = ref(false)
const demoCode = ref<string | undefined>(window.history.state?.demoCode)
const { left, start } = useCountdown(45)

if (!email) router.replace('/esqueci-senha')

async function checkCode() {
  errors.value = {}
  if (code.value.length < 6) { errors.value.code = 'Digite os 6 números do código.'; return }
  loading.value = true
  try {
    await api.post('/auth/verify-reset-code', { email, code: code.value })
    step.value = 'password'
  } catch (e) { errors.value.code = e instanceof ApiError ? e.message : 'Código inválido.' } finally { loading.value = false }
}
async function save() {
  errors.value = {}
  if (password.value.length < 8 || !/[a-zA-Z]/.test(password.value) || !/\d/.test(password.value)) errors.value.password = 'Use 8 ou mais caracteres, com letras e números.'
  if (confirm.value !== password.value) errors.value.confirm = 'As senhas não são iguais.'
  if (Object.keys(errors.value).length) return
  loading.value = true
  try {
    await api.post('/auth/reset-password', { email, code: code.value, password: password.value })
    toast.success('Senha alterada. Entre com a senha nova.')
    router.replace({ name: 'login' })
  } catch (e) {
    if (e instanceof ApiError && e.fields.code) { step.value = 'code'; errors.value.code = e.fields.code }
    else if (e instanceof ApiError) errors.value = { password: e.message, ...e.fields }
  } finally { loading.value = false }
}
async function resend() {
  try {
    const r = await api.post<{ demoCode?: string }>('/auth/forgot-password', { email })
    demoCode.value = r.demoCode; code.value = ''; start()
    toast.info('Enviamos um novo código.')
  } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Não foi possível reenviar.') }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <template v-if="step === 'code'">
      <div class="flex flex-col gap-2">
        <h1 class="text-title-48 font-bold text-smoky">Digite o código</h1>
        <p class="text-body-16 text-body">Se existir uma conta com <strong class="font-semibold text-smoky">{{ email }}</strong>, enviamos um código de 6 dígitos. Ele vale por 10 minutos.</p>
      </div>
      <FormAlert v-if="demoCode" tone="info"><strong class="font-semibold">Modo demonstração:</strong> seu código é <strong class="font-semibold tracking-widest">{{ demoCode }}</strong>.</FormAlert>
      <form class="flex flex-col gap-6" novalidate @submit.prevent="checkCode">
        <div class="flex flex-col gap-2">
          <span class="text-body-14 font-semibold text-smoky">Código</span>
          <OtpInput v-model="code" :error="!!errors.code" @complete="checkCode" />
          <p v-if="errors.code" class="text-body-12 font-semibold text-burgundy" role="alert">{{ errors.code }}</p>
        </div>
        <RxButton type="submit" block :loading="loading">Continuar</RxButton>
      </form>
      <p class="text-center text-body-14 text-body">
        Não recebeu?
        <button v-if="!left" type="button" class="font-semibold text-sauce hover:underline" @click="resend">Reenviar código</button>
        <span v-else class="text-secondary">Reenviar em {{ left }} s</span>
      </p>
    </template>
    <template v-else>
      <div class="flex flex-col gap-2">
        <h1 class="text-title-48 font-bold text-smoky">Nova senha</h1>
        <p class="text-body-16 text-body">Escolha uma senha que você não usa em outros sites.</p>
      </div>
      <form class="flex flex-col gap-6" novalidate @submit.prevent="save">
        <InputField v-model="password" label="Nova senha" type="password" autocomplete="new-password" help="Use 8 ou mais caracteres, com letras e números." :error="errors.password" required />
        <InputField v-model="confirm" label="Confirmar nova senha" type="password" autocomplete="new-password" :error="errors.confirm" required />
        <RxButton type="submit" block :loading="loading">Salvar nova senha</RxButton>
      </form>
    </template>
    <RouterLink to="/entrar" class="text-center text-body-14 font-semibold text-sauce hover:underline">Voltar para o login</RouterLink>
  </div>
</template>
