<script setup lang="ts">
// "Esqueci minha senha": pede o e-mail e envia um código (nunca link)
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import InputField from '@/components/base/InputField.vue'
import RxButton from '@/components/base/RxButton.vue'
import { api, ApiError } from '@/services/http'

const route = useRoute()
const router = useRouter()
const email = ref(String(route.query.email ?? ''))
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = /^\S+@\S+\.\S+$/.test(email.value.trim()) ? '' : 'Digite um e-mail válido.'
  if (error.value) return
  loading.value = true
  try {
    const r = await api.post<{ demoCode?: string }>('/auth/forgot-password', { email: email.value.trim() })
    router.push({ name: 'reset', query: { email: email.value.trim() }, state: { demoCode: r.demoCode } })
  } catch (e) { error.value = e instanceof ApiError ? e.message : 'Não foi possível enviar.' } finally { loading.value = false }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-title-48 font-bold text-smoky">Redefinir senha</h1>
      <p class="text-body-16 text-body">Digite o e-mail da sua conta. Vamos enviar um código para você criar uma senha nova.</p>
    </div>
    <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
      <InputField v-model="email" label="E-mail" type="email" inputmode="email" autocomplete="email" :error="error" required />
      <RxButton type="submit" block :loading="loading">Enviar código</RxButton>
    </form>
    <RouterLink to="/entrar" class="text-center text-body-14 font-semibold text-sauce hover:underline">Voltar para o login</RouterLink>
  </div>
</template>
