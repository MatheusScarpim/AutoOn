import type { AuthResponse, User } from '@autoon/types'
import { defineStore } from 'pinia'
import { loginRequest, profileRequest, refreshRequest, registerRequest } from '@/services/auth'

const STORAGE_KEY = 'autoon:session'

interface LoginForm extends Record<string, unknown> {
  email: string
  password: string
}

interface RegisterForm extends LoginForm {
  name: string
  agreedToTerms: boolean
  agreedToPrivacy: boolean
}

interface SessionCache {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    accessToken: null as string | null,
    refreshToken: null as string | null,
    loading: false,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken),
    role: (state) => state.user?.role ?? null,
    initials: (state) =>
      state.user?.name
        ? state.user.name
            .split(' ')
            .map((chunk: string) => chunk[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : 'AA',
  },
  actions: {
    hydrate() {
      if (this.initialized || typeof window === 'undefined') return
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SessionCache
          this.user = parsed.user
          this.accessToken = parsed.accessToken
          this.refreshToken = parsed.refreshToken
        } catch {
          window.localStorage.removeItem(STORAGE_KEY)
        }
      }
      this.initialized = true
    },
    persistSession() {
      if (typeof window === 'undefined') return
      const payload: SessionCache = {
        user: this.user,
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    },
    setSession(payload: AuthResponse) {
      this.user = payload.user
      this.accessToken = payload.accessToken
      this.refreshToken = payload.refreshToken
      this.persistSession()
    },
    clearSession() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    },
    logout() {
      this.clearSession()
    },
    async login(credentials: LoginForm) {
      this.loading = true
      try {
        const response = await loginRequest(credentials)
        this.setSession(response)
      } finally {
        this.loading = false
      }
    },
    async register(payload: RegisterForm) {
      this.loading = true
      try {
        const response = await registerRequest(payload)
        this.setSession(response)
      } finally {
        this.loading = false
      }
    },
    async fetchProfile() {
      if (!this.accessToken) return null
      const profile = await profileRequest(this.accessToken)
      this.user = profile
      this.persistSession()
      return profile
    },
    async refreshTokens() {
      if (!this.refreshToken) return null
      const tokens = await refreshRequest(this.refreshToken)
      this.accessToken = tokens.accessToken
      this.refreshToken = tokens.refreshToken
      this.persistSession()
      return tokens.accessToken
    },
  },
})
