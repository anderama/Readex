// Sessão do usuário: token JWT no localStorage e dados do usuário logado
import { computed, reactive } from 'vue'
import { api, tokenStore } from '@/services/http'
import type { User } from '@/services/types'

const state = reactive({ user: null as User | null, ready: false })

export const session = {
  state,
  isLoggedIn: computed(() => !!state.user),
  user: computed(() => state.user),

  // Restaura a sessão ao recarregar a página, enquanto o token for válido
  async restore() {
    if (state.ready) return
    if (tokenStore.get()) {
      try {
        const { user } = await api.get<{ user: User }>('/auth/me')
        state.user = user
      } catch {
        tokenStore.clear()
      }
    }
    state.ready = true
  },

  async login(identifier: string, password: string, remember: boolean) {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', { identifier, password, remember })
    tokenStore.set(token)
    state.user = user
    return user
  },

  setUser(user: User) { state.user = user },

  logout() {
    tokenStore.clear()
    state.user = null
  },
}
