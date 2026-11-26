import { BookOpen, ChartNoAxesColumn, House, Search, SlidersHorizontal, User, Users } from 'lucide-vue-next'

// Itens do menu lateral (desktop) e da barra de abas (mobile)
export const sidebarItems = [
  { to: '/', label: 'Início', icon: House, match: ['home'] },
  { to: '/estante', label: 'Minha Estante', icon: BookOpen, match: ['shelf', 'book', 'review'] },
  { to: '/explorar', label: 'Explorar', icon: Search, match: ['explore'] },
  { to: '/comunidade', label: 'Comunidade', icon: Users, match: ['community', 'post'] },
  { to: '/progresso', label: 'Progresso', icon: ChartNoAxesColumn, match: ['progress', 'stats'] },
  { to: '/perfil', label: 'Perfil', icon: User, match: ['profile', 'profile-edit', 'reader', 'following'] },
]
export const settingsItem = { to: '/configuracoes', label: 'Configurações', icon: SlidersHorizontal, match: ['settings', 'settings-security', 'settings-privacy', 'settings-notifications', 'notifications'] }

// Mobile: Comunidade fica dentro de Explorar; Configurações fica dentro de Perfil
export const tabItems = [
  { to: '/', label: 'Início', icon: House, match: ['home'] },
  { to: '/estante', label: 'Estante', icon: BookOpen, match: ['shelf', 'book', 'review'] },
  { to: '/explorar', label: 'Explorar', icon: Search, match: ['explore', 'community', 'post'] },
  { to: '/progresso', label: 'Progresso', icon: ChartNoAxesColumn, match: ['progress', 'stats'] },
  { to: '/perfil', label: 'Perfil', icon: User, match: ['profile', 'profile-edit', 'reader', 'following', 'settings', 'settings-security', 'settings-privacy', 'settings-notifications', 'notifications'] },
]
