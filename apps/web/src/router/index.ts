// Rotas do Readex. Rotas privadas exigem login (guarda de navegação); visitantes logados não veem o acesso.
import { createRouter, createWebHistory } from 'vue-router'
import { session } from '@/stores/session'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  routes: [
    {
      // Layout das telas de acesso. O caminho próprio evita que "/" caia aqui com a tela vazia;
      // os filhos usam caminhos absolutos (/entrar, /criar-conta...).
      path: '/acesso',
      component: AuthLayout,
      meta: { guest: true },
      children: [
        { path: '/entrar', name: 'login', component: () => import('@/pages/auth/LoginPage.vue'), meta: { title: 'Entrar', mascot: 'waving' } },
        { path: '/criar-conta', name: 'register', component: () => import('@/pages/auth/RegisterPage.vue'), meta: { title: 'Criar conta', mascot: 'running' } },
        { path: '/confirmar-email', name: 'verify', component: () => import('@/pages/auth/VerifyEmailPage.vue'), meta: { title: 'Confirmar e-mail', mascot: 'reading' } },
        { path: '/esqueci-senha', name: 'forgot', component: () => import('@/pages/auth/ForgotPasswordPage.vue'), meta: { title: 'Redefinir senha', mascot: 'reading' } },
        { path: '/redefinir-senha', name: 'reset', component: () => import('@/pages/auth/ResetPasswordPage.vue'), meta: { title: 'Redefinir senha', mascot: 'reading' } },
        { path: '', redirect: '/entrar' },
      ],
    },
    { path: '/boas-vindas', name: 'onboarding', component: () => import('@/pages/OnboardingPage.vue'), meta: { auth: true, title: 'Boas-vindas' } },
    { path: '/conta-excluida', name: 'deleted', component: () => import('@/pages/AccountDeletedPage.vue'), meta: { title: 'Conta excluída' } },
    {
      path: '/',
      component: AppLayout,
      meta: { auth: true },
      children: [
        { path: '', name: 'home', component: () => import('@/pages/HomePage.vue'), meta: { title: 'Início' } },
        { path: 'estante', name: 'shelf', component: () => import('@/pages/ShelfPage.vue'), meta: { title: 'Minha Estante', gradient: 380 } },
        { path: 'explorar', name: 'explore', component: () => import('@/pages/ExplorePage.vue'), meta: { title: 'Explorar', gradient: 380 } },
        { path: 'livros/:slug/escrever-resenha', name: 'review', component: () => import('@/pages/WriteReviewPage.vue'), meta: { title: 'Escrever resenha', gradient: 380 } },
        { path: 'livros/:slug/:tab(detalhes|anotacoes|discussoes|resenhas)?', name: 'book', component: () => import('@/pages/BookPage.vue'), meta: { title: 'Livro' } },
        { path: 'comunidade', name: 'community', component: () => import('@/pages/CommunityPage.vue'), meta: { title: 'Comunidade', gradient: 380 } },
        { path: 'comunidade/posts/:id', name: 'post', component: () => import('@/pages/PostPage.vue'), meta: { title: 'Discussão', gradient: 380 } },
        { path: 'progresso', name: 'progress', component: () => import('@/pages/ProgressPage.vue'), meta: { title: 'Metas', gradient: 380 } },
        { path: 'progresso/estatisticas', name: 'stats', component: () => import('@/pages/StatsPage.vue'), meta: { title: 'Estatísticas', gradient: 380 } },
        { path: 'perfil/editar', name: 'profile-edit', component: () => import('@/pages/EditProfilePage.vue'), meta: { title: 'Editar perfil', gradient: 380 } },
        { path: 'perfil/:tab(lendo|lidos|resenhas|anotacoes)?', name: 'profile', component: () => import('@/pages/ProfilePage.vue'), meta: { title: 'Perfil', gradient: 380 } },
        { path: 'leitores/:username/seguindo', name: 'following', component: () => import('@/pages/FollowingPage.vue'), meta: { title: 'Seguindo', gradient: 380 } },
        { path: 'leitores/:username/:tab(lendo|lidos|resenhas|anotacoes)?', name: 'reader', component: () => import('@/pages/ProfilePage.vue'), meta: { title: 'Leitor', gradient: 380 } },
        { path: 'notificacoes', name: 'notifications', component: () => import('@/pages/NotificationsPage.vue'), meta: { title: 'Notificações', gradient: 380 } },
        { path: 'configuracoes', name: 'settings', component: () => import('@/pages/settings/SettingsPage.vue'), meta: { title: 'Configurações', gradient: 380 } },
        { path: 'configuracoes/seguranca', name: 'settings-security', component: () => import('@/pages/settings/SecurityPage.vue'), meta: { title: 'Senha e segurança', gradient: 380 } },
        { path: 'configuracoes/privacidade', name: 'settings-privacy', component: () => import('@/pages/settings/PrivacyPage.vue'), meta: { title: 'Privacidade e dados', gradient: 380 } },
        { path: 'configuracoes/notificacoes', name: 'settings-notifications', component: () => import('@/pages/settings/NotificationPrefsPage.vue'), meta: { title: 'Notificações', gradient: 380 } },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue'), meta: { title: 'Página não encontrada' } },
  ],
})

router.beforeEach(async (to) => {
  await session.restore()
  const logged = session.isLoggedIn.value
  if (to.matched.some((r) => r.meta.auth) && !logged) return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  if (to.matched.some((r) => r.meta.guest) && logged) return { name: 'home' }
  if (logged && !session.user.value?.onboarded && to.name !== 'onboarding') return { name: 'onboarding' }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Readex` : 'Readex'
})

export default router
