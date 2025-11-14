import type { AuthResponse, User } from '@autoon/types'
import { apiFetch } from './http'

interface LoginPayload extends Record<string, unknown> {
  email: string
  password: string
}

interface RegisterPayload extends LoginPayload {
  name: string
  agreedToTerms: boolean
  agreedToPrivacy: boolean
}

export function loginRequest(payload: LoginPayload) {
  return apiFetch<AuthResponse>('auth/login', {
    method: 'POST',
    body: payload,
  })
}

export function registerRequest(payload: RegisterPayload) {
  return apiFetch<AuthResponse>('auth/register', {
    method: 'POST',
    body: payload,
  })
}

export function profileRequest(token: string) {
  return apiFetch<User>('auth/me', {
    token,
  })
}

export function refreshRequest(refreshToken: string) {
  return apiFetch<{ accessToken: string; refreshToken: string }>('auth/refresh', {
    method: 'POST',
    token: refreshToken,
  })
}
