import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './services/http'
import { session } from './stores/session'
import { toast } from './stores/toast'
// Fonte Poppins local (sem depender de CDN)
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import './styles/main.css'

// Token expirado ou inválido: encerra a sessão e volta ao login
setUnauthorizedHandler(() => {
  if (!session.isLoggedIn.value) return
  session.logout()
  toast.info('Sua sessão expirou. Entre de novo.')
  router.push({ name: 'login' })
})

createApp(App).use(router).mount('#app')
