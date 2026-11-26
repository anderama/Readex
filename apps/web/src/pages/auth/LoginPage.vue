<script setup lang="ts">
// Entrar: e-mail (ou usuário) e senha, "Manter conectado" (Lembrar-se) e "Esqueci minha senha"
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import InputField from '@/components/base/InputField.vue'
import RxButton from '@/components/base/RxButton.vue'
import RxCheckbox from '@/components/base/RxCheckbox.vue'
import FormAlert from '@/components/auth/FormAlert.vue'
import SocialButtons from '@/components/auth/SocialButtons.vue'
import { ApiError } from '@/services/http'
import { session } from '@/stores/session'
import { toast } from '@/stores/toast'
import { firstName } from '@/utils/format'

const router = useRouter()
const route = useRoute()
const form = reactive({ identifier: '', password: '', remember: true })
const errors = ref<Record<string, string>>({})
const alert = ref('')
const loading = ref(false)

function validate() {
  const e: Record<string, string> = {}
  if (!form.identifier.trim()) e.identifier = 'Digite seu e-mail ou nome de usuário.'
  if (!form.password) e.password = 'Digite sua senha.'
  errors.value = e
  return !Object.keys(e).length
}

async function submit() {
  alert.value = ''
  if (!validate()) return
  loading.value = true
  try {
    const user = await session.login(form.identifier, form.password, form.remember)
    toast.success(user.onboarded ? `Que bom ter você de volta, ${firstName(user.name)}.` : `Olá, ${firstName(user.name)}!`)
    router.replace((route.query.redirect as string) || '/')
  } catch (e) {
    if (e instanceof ApiError && e.data.needsVerification) {
      router.push({ name: 'verify', query: { email: String(e.data.email) }, state: { demoCode: e.data.demoCode as string } })
      toast.info('Confirme seu e-mail para entrar. Enviamos um novo código.')
    } else {
      alert.value = e instanceof ApiError ? e.message : 'Não foi possível entrar.'
    }
  } finally { loading.value = false }
}

function useDemo() {
  form.identifier = 'anderson@readex.com'
  form.password = 'readex123'
  errors.value = {}
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-title-48 font-bold text-smoky">Entrar</h1>
      <p class="text-body-16 text-body">Que bom ter você de volta.</p>
    </div>
    <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
      <FormAlert v-if="alert">{{ alert }} Confira e tente de novo.</FormAlert>
      <InputField v-model="form.identifier" label="E-mail ou nome de usuário" type="text" autocomplete="username" :error="errors.identifier" required />
      <InputField v-model="form.password" label="Senha" type="password" autocomplete="current-password" :error="errors.password" required />
      <div class="flex items-center justify-between gap-4">
        <RxCheckbox v-model="form.remember">Manter conectado</RxCheckbox>
        <RouterLink :to="{ name: 'forgot', query: form.identifier.includes('@') ? { email: form.identifier } : {} }" class="text-body-14 font-semibold text-sauce hover:underline">Esqueci minha senha</RouterLink>
      </div>
      <RxButton type="submit" block :loading="loading">Entrar</RxButton>
    </form>
    <SocialButtons />
    <p class="text-center text-body-14 text-body">Ainda não tem conta? <RouterLink to="/criar-conta" class="font-semibold text-sauce hover:underline">Criar conta</RouterLink></p>
    <button type="button" class="self-center rounded-md border border-dashed border-border-strong px-4 py-2 text-body-12 text-secondary hover:border-smoky hover:text-smoky" @click="useDemo">
      Usar conta de demonstração (anderson@readex.com)
    </button>
  </div>
</template>
