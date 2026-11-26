<script setup lang="ts">
// Criar conta: nome, nome de usuário, e-mail, senha e confirmação, e aceite dos termos de uso
import { reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import InputField from '@/components/base/InputField.vue'
import RxButton from '@/components/base/RxButton.vue'
import RxCheckbox from '@/components/base/RxCheckbox.vue'
import RxModal from '@/components/base/RxModal.vue'
import FormAlert from '@/components/auth/FormAlert.vue'
import SocialButtons from '@/components/auth/SocialButtons.vue'
import { api, ApiError } from '@/services/http'

const router = useRouter()
const form = reactive({ name: '', username: '', email: '', password: '', confirm: '', acceptTerms: false })
const errors = ref<Record<string, string>>({})
const alert = ref('')
const loading = ref(false)
const terms = ref(false)

// Depois da primeira tentativa, revalida enquanto a pessoa corrige os campos
const tried = ref(false)
watch(form, () => { if (tried.value) validate() })

function validate() {
  const e: Record<string, string> = {}
  if (form.name.trim().length < 2) e.name = 'Digite seu nome.'
  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(form.username.trim())) e.username = 'Use de 3 a 20 letras, números, ponto ou _.'
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Digite um e-mail válido.'
  if (form.password.length < 8 || !/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password)) e.password = 'Use 8 ou mais caracteres, com letras e números.'
  if (!form.confirm) e.confirm = 'Repita a senha.'
  else if (form.confirm !== form.password) e.confirm = 'As senhas não são iguais.'
  if (!form.acceptTerms) e.acceptTerms = 'Aceite os termos de uso para continuar.'
  errors.value = e
  return !Object.keys(e).length
}

async function submit() {
  alert.value = ''
  tried.value = true
  if (!validate()) return
  loading.value = true
  try {
    const r = await api.post<{ email: string; demoCode?: string }>('/auth/register', {
      name: form.name, username: form.username, email: form.email, password: form.password, acceptTerms: form.acceptTerms,
    })
    router.push({ name: 'verify', query: { email: r.email }, state: { demoCode: r.demoCode } })
  } catch (e) {
    if (e instanceof ApiError) { errors.value = e.fields; if (!Object.keys(e.fields).length) alert.value = e.message }
  } finally { loading.value = false }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-title-48 font-bold text-smoky">Criar conta</h1>
      <p class="text-body-16 text-body">Leva menos de um minuto.</p>
    </div>
    <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
      <FormAlert v-if="alert">{{ alert }}</FormAlert>
      <div class="grid gap-5 sm:grid-cols-2">
        <InputField v-model="form.name" label="Nome" autocomplete="name" :error="errors.name" required />
        <InputField v-model="form.username" label="Nome de usuário" autocomplete="username" help="Aparece no seu perfil, como @voce." :error="errors.username" required />
      </div>
      <InputField v-model="form.email" label="E-mail" type="email" autocomplete="email" inputmode="email" :error="errors.email" required />
      <InputField v-model="form.password" label="Senha" type="password" autocomplete="new-password" help="Use 8 ou mais caracteres, com letras e números." :error="errors.password" required />
      <InputField v-model="form.confirm" label="Confirmar senha" type="password" autocomplete="new-password" :error="errors.confirm" required />
      <RxCheckbox v-model="form.acceptTerms" :error="errors.acceptTerms">
        Li e aceito os <button type="button" class="font-semibold text-sauce underline-offset-2 hover:underline" @click.prevent="terms = true">termos de uso</button>.
      </RxCheckbox>
      <RxButton type="submit" block :loading="loading">Criar conta</RxButton>
    </form>
    <SocialButtons />
    <p class="text-center text-body-14 text-body">Já tem conta? <RouterLink to="/entrar" class="font-semibold text-sauce hover:underline">Entrar</RouterLink></p>

    <RxModal :open="terms" title="Termos de uso" @close="terms = false">
      <div class="flex flex-col gap-3 text-body-14 text-body">
        <p>O Readex é um projeto acadêmico para organizar leituras pessoais. Ao criar uma conta, você concorda em:</p>
        <ul class="list-disc space-y-1 pl-5">
          <li>usar o app de forma respeitosa com outros leitores;</li>
          <li>não publicar conteúdo ofensivo ou que viole direitos de terceiros;</li>
          <li>marcar spoilers nas resenhas e discussões.</li>
        </ul>
        <p>Seus dados ficam guardados só para o funcionamento do app. Você pode baixar ou excluir tudo em Configurações › Privacidade e dados.</p>
      </div>
      <template #footer><RxButton @click="form.acceptTerms = true; terms = false">Aceitar termos</RxButton></template>
    </RxModal>
  </div>
</template>
