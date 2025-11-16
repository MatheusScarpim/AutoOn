import type {
  CreateSubscriptionDto,
  PaginatedResponse,
  Subscription,
  UpdateSubscriptionDto,
} from '@autoon/types'
import { apiFetch } from './http'

export function listSubscriptions(token: string, page = 1, pageSize = 20) {
  return apiFetch<PaginatedResponse<Subscription>>('subscriptions', {
    token,
    query: { page, pageSize },
  })
}

export function createSubscription(token: string, payload: CreateSubscriptionDto) {
  return apiFetch<Subscription>('subscriptions', {
    method: 'POST',
    token,
    body: payload,
  })
}

export function activateSubscription(token: string, userId: string) {
  return apiFetch<Subscription>(`subscriptions/${userId}/activate`, {
    method: 'POST',
    token,
  })
}

export function updateSubscription(
  token: string,
  userId: string,
  payload: UpdateSubscriptionDto,
) {
  return apiFetch<Subscription>(`subscriptions/${userId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}
