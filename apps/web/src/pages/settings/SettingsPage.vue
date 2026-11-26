<script setup lang="ts">
// Configurações da conta, com a opção de sair (logout)
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Bell, ChevronRight, KeyRound, LogOut, ShieldCheck, UserPen } from 'lucide-vue-next'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import RxButton from '@/components/base/RxButton.vue'
import RxModal from '@/components/base/RxModal.vue'
import UserCard from '@/components/base/UserCard.vue'
import { session } from '@/stores/session'
import { toast } from '@/stores/toast'

const router = useRouter()
const confirm = ref(false)
const groups = [
  { title: 'Conta', items: [
    { to: '/perfil/editar', label: 'Editar perfil', hint: 'Nome, nome de usuário, bio e foto', icon: UserPen },
    { to: '/configuracoes/seguranca', label: 'Senha e segurança', hint: 'Trocar sua senha', icon: KeyRound },
  ] },
  { title: 'Preferências', items: [
    { to: '/configuracoes/notificacoes', label: 'Notificações', hint: 'O que avisar no app e no celular', icon: Bell },
  ] },
  { title: 'Privacidade', items: [
    { to: '/configuracoes/privacidade', label: 'Privacidade e dados', hint: 'Baixar seus dados ou excluir a conta', icon: ShieldCheck },
  ] },
]

// Logout: remove o token e volta para o login
function logout() {
  session.logout()
  confirm.value = false
  toast.info('Você saiu da sua conta.')
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <AppTopbar title="Configurações" />
    <div class="flex max-w-[720px] flex-col gap-8">
      <UserCard v-if="session.user.value" :user="session.user.value" :size="56" to="/perfil" />
      <section v-for="g in groups" :key="g.title" class="flex flex-col gap-2">
        <h2 class="text-body-14 font-semibold text-body">{{ g.title }}</h2>
        <ul class="flex flex-col divide-y divide-cloud border-y border-cloud">
          <li v-for="i in g.items" :key="i.to">
            <RouterLink :to="i.to" class="flex items-center gap-4 py-4 transition-ui hover:bg-chefs/60">
              <span class="flex size-10 items-center justify-center rounded-md bg-chefs text-smoky"><component :is="i.icon" :size="20" aria-hidden="true" /></span>
              <span class="flex flex-1 flex-col"><span class="text-body-16 font-semibold text-smoky">{{ i.label }}</span><span class="text-body-14 text-secondary">{{ i.hint }}</span></span>
              <ChevronRight :size="18" class="text-smoky" aria-hidden="true" />
            </RouterLink>
          </li>
        </ul>
      </section>
      <button type="button" class="flex items-center gap-4 self-start rounded-md py-2 text-body-16 font-semibold text-burgundy hover:underline" @click="confirm = true">
        <LogOut :size="20" aria-hidden="true" /> Sair da conta
      </button>
    </div>

    <RxModal :open="confirm" title="Sair da conta?" description="Você vai precisar entrar de novo com e-mail e senha." @close="confirm = false">
      <template #footer>
        <RxButton variant="secondary" @click="confirm = false">Cancelar</RxButton>
        <RxButton @click="logout">Sair</RxButton>
      </template>
    </RxModal>
  </div>
</template>
