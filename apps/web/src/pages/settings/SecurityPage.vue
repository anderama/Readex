<script setup lang="ts">
// Senha e segurança: troca de senha (pede a senha atual)
import { reactive, ref } from 'vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import InputField from '@/components/base/InputField.vue'
import RxButton from '@/components/base/RxButton.vue'
import { api, ApiError } from '@/services/http'
import { toast } from '@/stores/toast'

const form = reactive({ current: '', password: '', confirm: '' })
const errors = ref<Record<string, string>>({})
const saving = ref(false)

async function save() {
  errors.value = {}
  if (!form.current) errors.value.current = 'Digite sua senha atual.'
  if (form.password.length < 8 || !/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password)) errors.value.password = 'Use 8 ou mais caracteres, com letras e números.'
  if (form.confirm !== form.password) errors.value.confirm = 'As senhas não são iguais.'
  if (Object.keys(errors.value).length) return
  saving.value = true
  try {
    await api.put('/me/password', { current: form.current, password: form.password })
    Object.assign(form, { current: '', password: '', confirm: '' })
    toast.success('Senha alterada.')
  } catch (e) { if (e instanceof ApiError) errors.value = Object.keys(e.fields).length ? e.fields : { current: e.message } } finally { saving.value = false }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppTopbar title="Senha e segurança" :crumbs="[{ label: 'Configurações', to: '/configuracoes' }, { label: 'Senha e segurança' }]" />
    <form class="flex max-w-[600px] flex-col gap-6" novalidate @submit.prevent="save">
      <InputField v-model="form.current" label="Senha atual" type="password" autocomplete="current-password" :error="errors.current" />
      <InputField v-model="form.password" label="Nova senha" type="password" autocomplete="new-password" help="Use 8 ou mais caracteres, com letras e números." :error="errors.password" />
      <InputField v-model="form.confirm" label="Confirmar nova senha" type="password" autocomplete="new-password" :error="errors.confirm" />
      <div class="flex justify-end border-t border-cloud pt-6"><RxButton type="submit" :loading="saving">Salvar nova senha</RxButton></div>
    </form>
    <section class="flex max-w-[600px] flex-col gap-2">
      <h2 class="text-body-16 font-semibold text-smoky">Sessão</h2>
      <p class="text-body-14 text-body">Você continua conectado neste navegador enquanto o token de acesso for válido (1 dia, ou 30 dias com “Manter conectado”). Para encerrar, use “Sair da conta” em Configurações.</p>
    </section>
  </div>
</template>
