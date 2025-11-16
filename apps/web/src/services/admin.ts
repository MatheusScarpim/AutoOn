import type { PaginatedResponse, Subscription, User, UserRole } from '@autoon/types'
import { apiFetch } from './http'

export interface AdminUser extends Omit<User, 'passwordHash'> {
  _count: {
    enrollments: number
    createdCourses: number
  }
  subscription?: Subscription | null
}

export function listAdminUsers(
  token: string,
  params?: {
    page?: number
    pageSize?: number
    query?: string
    role?: UserRole
  },
) {
  return apiFetch<PaginatedResponse<AdminUser>>('admin/users', {
    token,
    query: params,
  })
}
