<script setup lang="ts">
// Editar perfil: avatar (imagem reduzida para 256px no navegador), nome, nome de usuário e bio (até 160)
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Camera } from 'lucide-vue-next'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import AvatarCircle from '@/components/base/AvatarCircle.vue'
import InputField from '@/components/base/InputField.vue'
import RxButton from '@/components/base/RxButton.vue'
import { api, ApiError } from '@/services/http'
import type { User } from '@/services/types'
import { session } from '@/stores/session'
import { toast } from '@/stores/toast'

const router = useRouter()
const u = session.user.value!
const form = reactive({ name: u.name, username: u.username, bio: u.bio, avatarUrl: u.avatarUrl as string | null })
const errors = ref<Record<string, string>>({})
const saving = ref(false)
const file = ref<HTMLInputElement>()

// Reduz a imagem para 256×256 (JPEG) antes de enviar
function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (!f.type.startsWith('image/')) { toast.error('Escolha um arquivo de imagem.'); return }
  const img = new Image()
  img.onload = () => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = size; c.height = size
    const ctx = c.getContext('2d')!
    const s = Math.min(img.width, img.height)
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
    form.avatarUrl = c.toDataURL('image/jpeg', 0.85)
    URL.revokeObjectURL(img.src)
  }
  img.src = URL.createObjectURL(f)
}

async function save() {
  errors.value = {}
  if (form.name.trim().length < 2) errors.value.name = 'Digite seu nome.'
  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(form.username)) errors.value.username = 'Use de 3 a 20 letras, números, ponto ou _.'
  if (form.bio.length > 160) errors.value.bio = 'A bio pode ter até 160 caracteres.'
  if (Object.keys(errors.value).length) return
  saving.value = true
  try {
    const { user } = await api.patch<{ user: User }>('/me', form)
    session.setUser(user)
    toast.success('Perfil atualizado.')
    router.push('/perfil')
  } catch (e) { if (e instanceof ApiError) errors.value = { name: e.message, ...e.fields } } finally { saving.value = false }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppTopbar title="Editar perfil" :crumbs="[{ label: 'Perfil', to: '/perfil' }, { label: 'Editar perfil' }]" />
    <form class="flex max-w-[600px] flex-col gap-6" novalidate @submit.prevent="save">
      <div class="flex items-center gap-6">
        <AvatarCircle :name="form.name || u.name" :src="form.avatarUrl" :size="96" />
        <div class="flex flex-col items-start gap-2">
          <input ref="file" type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" id="avatar" @change="onFile" />
          <RxButton variant="secondary" size="sm" @click="file?.click()"><Camera :size="16" /> Trocar foto</RxButton>
          <button v-if="form.avatarUrl" type="button" class="text-body-14 font-semibold text-sauce hover:underline" @click="form.avatarUrl = null">Remover foto</button>
        </div>
      </div>
      <InputField v-model="form.name" label="Nome" autocomplete="name" :error="errors.name" />
      <InputField v-model="form.username" label="Nome de usuário" help="Seu perfil fica em /leitores/seu-usuario." :error="errors.username" />
      <InputField v-model="form.bio" label="Bio" multiline :rows="3" :maxlength="160" counter :error="errors.bio" />
      <div class="flex flex-col-reverse gap-3 border-t border-cloud pt-6 sm:flex-row sm:justify-end">
        <RxButton variant="secondary" to="/perfil">Cancelar</RxButton>
        <RxButton type="submit" :loading="saving">Salvar perfil</RxButton>
      </div>
    </form>
  </div>
</template>
