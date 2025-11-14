import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const auth = useAuthStore(pinia)
auth.hydrate()
if (auth.isAuthenticated) {
  auth.fetchProfile().catch(() => auth.clearSession())
}

app.mount('#app')
