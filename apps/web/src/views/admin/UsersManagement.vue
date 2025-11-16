<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b">
      <div class="container mx-auto px-6 py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm uppercase tracking-[0.25em] text-slate-400">Admin</p>
          <h1 class="text-2xl font-bold text-slate-900">Gestão de assinaturas</h1>
          <p class="text-sm text-slate-500">Monitore e controle as assinaturas dos usuários</p>
        </div>
        <div class="flex items-center gap-3">
          <p class="text-sm text-slate-600">Logado como {{ authStore.user?.name }}</p>
          <router-link to="/admin" class="text-sm text-indigo-600 hover:underline">Voltar ao painel</router-link>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-6 py-8">
      <div
        v-if="notification"
        :class="[
          'p-4 rounded-2xl mb-6 border',
          notification.type === 'success'
            ? 'bg-lime-50 border-lime-200 text-lime-700'
            : 'bg-rose-50 border-rose-200 text-rose-700',
        ]"
        role="status"
        aria-live="polite"
      >
        {{ notification.message }}
      </div>

      <section class="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-6">
        <div class="grid gap-4 md:grid-cols-3">
          <label class="flex flex-col text-sm text-slate-500">
            <span class="font-semibold text-slate-600 mb-1">Buscar</span>
            <input
              v-model="searchQuery"
              @keyup.enter="loadUsers({ page: 1 })"
              type="search"
              placeholder="nome ou e-mail"
              class="input-field"
            />
          </label>
          <label class="flex flex-col text-sm text-slate-500">
            <span class="font-semibold text-slate-600 mb-1">Papel</span>
            <select v-model="roleFilter" class="input-field">
              <option v-for="option in roleOptions" :key="option.label" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <div class="flex items-end">
            <button
              @click="loadUsers({ page: 1 })"
              class="w-full rounded-2xl bg-indigo-600 text-white px-5 py-3 text-sm font-semibold shadow-lg hover:bg-indigo-500 transition"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-wide text-slate-500">
          <span>Total de usuários: <strong class="text-slate-900">{{ pagination.total }}</strong></span>
          <span>Com assinatura: <strong class="text-slate-900">{{ usersWithSubscription }}</strong></span>
          <span>Páginas: <strong class="text-slate-900">{{ pagination.totalPages }}</strong></span>
        </div>
      </section>

      <section>
        <div v-if="loadingUsers" class="p-12 text-center text-slate-500">
          <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-300 border-t-transparent"></div>
          <p class="mt-4">Carregando usuários e assinaturas...</p>
        </div>
        <div v-else-if="users.length === 0" class="p-12 text-center text-slate-500">
          Nenhum usuário encontrado para os filtros selecionados.
        </div>
        <div v-else class="space-y-4">
          <article
            v-for="user in users"
            :key="user.id"
            class="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5"
          >
            <header class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-lg font-semibold text-slate-900">{{ user.name }}</p>
                <p class="text-sm text-slate-500">{{ user.email }}</p>
                <p class="text-xs text-slate-400">Criado {{ formatDate(user.createdAt) }}</p>
              </div>
              <div class="text-right">
                <span
                  :class="[
                    'inline-flex px-3 py-1 rounded-full text-xs font-semibold tracking-wide',
                    badgeClass(user.subscription?.status),
                  ]"
                >
                  {{ user.subscription?.status ?? 'SEM ASSINATURA' }}
                </span>
                <p class="text-xs text-slate-500 mt-1">Papel: {{ user.role }}</p>
              </div>
            </header>

            <div class="grid gap-4 md:grid-cols-3">
              <div>
                <p class="text-xs text-slate-400 uppercase">Plano</p>
                <p class="text-sm font-semibold text-slate-900">
                  {{ user.subscription?.planName ?? 'Sem plano registrado' }}
                </p>
                <p class="text-xs text-slate-500">ID: {{ user.subscription?.planId ?? '—' }}</p>
                <p class="text-sm text-slate-700">{{ formatCurrency(user.subscription?.planPrice) }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase">Período</p>
                <p class="text-sm font-semibold text-slate-900">
                  {{ formatDate(user.subscription?.startDate) }} → {{ formatDate(user.subscription?.endDate) }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ user.subscription ? 'Vigência mensal' : 'Nenhuma assinatura ativa' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase">Renovação automática</p>
                <p class="text-sm font-semibold text-slate-900">
                  {{ user.subscription?.autoRenew ? 'Ativa' : 'Desativada' }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ user.subscription ? 'Pode ser alternada abaixo' : 'Usuário ainda não assinou' }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-4 text-sm text-slate-600">
              <div>Cursos criados: <strong>{{ user._count.createdCourses }}</strong></div>
              <div>Matrículas: <strong>{{ user._count.enrollments }}</strong></div>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                v-if="user.subscription && user.subscription.status !== SubscriptionStatus.ACTIVE"
                @click="handleActivate(user)"
                :disabled="isActionLoading(user.id, 'activate')"
                class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
              >
                <span v-if="isActionLoading(user.id, 'activate')" class="inline-flex items-center gap-2">
                  <span class="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                  Ativando...
                </span>
                <span v-else>Ativar assinatura</span>
              </button>
              <button
                v-if="user.subscription?.status === SubscriptionStatus.ACTIVE"
                @click="handleCancel(user)"
                :disabled="isActionLoading(user.id, 'cancel')"
                class="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
              >
                <span v-if="isActionLoading(user.id, 'cancel')" class="inline-flex items-center gap-2">
                  <span class="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                  Cancelando...
                </span>
                <span v-else>Cancelar assinatura</span>
              </button>
              <button
                v-if="user.subscription"
                @click="toggleAutoRenew(user)"
                :disabled="isActionLoading(user.id, 'auto')"
                class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                <span v-if="isActionLoading(user.id, 'auto')" class="inline-flex items-center gap-2">
                  <span class="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                  Atualizando...
                </span>
                <span v-else>Renovação {{ user.subscription.autoRenew ? 'ON' : 'OFF' }}</span>
              </button>
              <button
                v-else
                @click="toggleSubscriptionForm(user.id)"
                class="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
              >
                {{ formTargetUser === user.id ? 'Fechar formulário' : 'Dar assinatura' }}
              </button>
            </div>

            <div v-if="formTargetUser === user.id" class="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
              <p class="text-sm font-semibold text-indigo-700">Criar nova assinatura</p>
              <div class="grid gap-3 md:grid-cols-2">
                <label class="text-sm text-slate-600">
                  ID do plano
                  <input v-model="subscriptionForm.planId" class="input-field mt-1 w-full" placeholder="ID do plano" />
                </label>
                <label class="text-sm text-slate-600">
                  Nome do plano
                  <input
                    v-model="subscriptionForm.planName"
                    class="input-field mt-1 w-full"
                    placeholder="Plano Premium AutoOn"
                  />
                </label>
                <label class="text-sm text-slate-600">
                  Valor (BRL)
                  <input
                    v-model.number="subscriptionForm.planPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input-field mt-1 w-full"
                  />
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" class="h-4 w-4 accent-indigo-600" v-model="subscriptionForm.autoRenew" />
                  Renovação automática
                </label>
              </div>
              <div class="flex flex-wrap gap-3 justify-end">
                <button
                  @click="createSubscriptionForUser(user.id)"
                  :disabled="isActionLoading(user.id, 'create')"
                  class="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  <span v-if="isActionLoading(user.id, 'create')" class="inline-flex items-center gap-2">
                    <span class="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
                    Criando...
                  </span>
                  <span v-else>Confirmar assinatura</span>
                </button>
                <button
                  @click="toggleSubscriptionForm(user.id)"
                  class="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="mt-8 flex items-center justify-between">
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page <= 1"
          class="rounded-2xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 disabled:opacity-50"
        >
          Anterior
        </button>
        <p class="text-sm text-slate-500">
          Página <strong class="text-slate-900">{{ pagination.page }}</strong> de
          <strong class="text-slate-900">{{ pagination.totalPages }}</strong>
        </p>
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page >= pagination.totalPages"
          class="rounded-2xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 disabled:opacity-50"
        >
          Próxima
        </button>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { SubscriptionStatus, UserRole } from '@autoon/types'
import { isApiError } from '@/services/http'
import { listAdminUsers, type AdminUser } from '@/services/admin'
import { activateSubscription, createSubscription, updateSubscription } from '@/services/subscriptions'
import { useAuthStore } from '@/stores/auth'

type Notification = { type: 'success' | 'error'; message: string }
type PaginationMeta = { total: number; page: number; pageSize: number; totalPages: number }

const authStore = useAuthStore()
const PAGE_SIZE = 8
const pagination = ref<PaginationMeta>({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1 })
const users = ref<AdminUser[]>([])
const loadingUsers = ref(false)
const searchQuery = ref('')
const roleFilter = ref<UserRole | ''>('')
const notification = ref<Notification | null>(null)
const subscriptionForm = reactive({
  planId: '',
  planName: '',
  planPrice: 99.99,
  autoRenew: true,
})
const formTargetUser = ref<string | null>(null)
const actionLoading = ref<Record<string, boolean>>({})

const roleOptions = [
  { label: 'Todos os papéis', value: '' as const },
  { label: 'Administradores', value: UserRole.ADMIN },
  { label: 'Instrutores', value: UserRole.INSTRUCTOR },
  { label: 'Alunos', value: UserRole.STUDENT },
]

const defaultPlanId = 'autoon-premium'
const defaultPlanName = 'Plano Premium AutoOn'
const defaultPlanPrice = 99.99

const usersWithSubscription = computed(() => users.value.filter((user) => Boolean(user.subscription)).length)

const badgeClass = (status?: SubscriptionStatus | null) => {
  if (!status) {
    return 'bg-slate-100 text-slate-600'
  }

  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return 'bg-emerald-100 text-emerald-700'
    case SubscriptionStatus.PENDING:
      return 'bg-amber-100 text-amber-700'
    case SubscriptionStatus.CANCELLED:
    case SubscriptionStatus.EXPIRED:
      return 'bg-rose-100 text-rose-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return '—'
  const parsed = typeof value === 'string' ? new Date(value) : value
  return parsed.toLocaleDateString('pt-BR')
}

const formatCurrency = (value?: number | null) => {
  const normalized = value ?? 0
  if (Number.isNaN(normalized)) {
    return 'R$ 0,00'
  }
  return `R$ ${normalized.toFixed(2)}`
}

const markActionLoading = (key: string, busy: boolean) => {
  if (busy) {
    actionLoading.value[key] = true
  } else {
    delete actionLoading.value[key]
  }
}

const isActionLoading = (userId: string, action: string) => {
  return Boolean(actionLoading.value[`${action}-${userId}`])
}

const scheduleNotificationClear = (message: string) => {
  setTimeout(() => {
    if (notification.value?.message === message) {
      notification.value = null
    }
  }, 4200)
}

const showNotification = (type: Notification['type'], message: string) => {
  notification.value = { type, message }
  scheduleNotificationClear(message)
}

const handleApiError = (error: unknown, fallback: string) => {
  if (isApiError(error)) {
    showNotification('error', error.message)
    return
  }

  if (error instanceof Error && error.message) {
    showNotification('error', error.message)
    return
  }

  showNotification('error', fallback)
}

const resetFormDefaults = () => {
  subscriptionForm.planId = defaultPlanId
  subscriptionForm.planName = defaultPlanName
  subscriptionForm.planPrice = defaultPlanPrice
  subscriptionForm.autoRenew = true
}

const loadUsers = async (options?: { page?: number }) => {
  const token = authStore.accessToken
  if (!token) return

  loadingUsers.value = true
  try {
    const response = await listAdminUsers(token, {
      page: options?.page ?? pagination.value.page,
      pageSize: pagination.value.pageSize,
      query: searchQuery.value.trim() || undefined,
      role: roleFilter.value || undefined,
    })

    users.value = response.data
    pagination.value = response.meta
  } catch (error) {
    handleApiError(error, 'Não foi possível carregar os usuários.')
  } finally {
    loadingUsers.value = false
  }
}

const changePage = (newPage: number) => {
  if (newPage < 1 || newPage > pagination.value.totalPages) {
    return
  }

  loadUsers({ page: newPage })
}

const toggleSubscriptionForm = (userId: string) => {
  if (formTargetUser.value === userId) {
    formTargetUser.value = null
    return
  }

  formTargetUser.value = userId
  resetFormDefaults()
}

const createSubscriptionForUser = async (userId: string) => {
  const token = authStore.accessToken
  if (!token) return

  markActionLoading(`create-${userId}`, true)
  try {
    await createSubscription(token, {
      userId,
      planId: subscriptionForm.planId.trim() || defaultPlanId,
      planName: subscriptionForm.planName.trim() || defaultPlanName,
      planPrice: Number(subscriptionForm.planPrice) || defaultPlanPrice,
      autoRenew: subscriptionForm.autoRenew,
    })
    showNotification('success', 'Assinatura criada com sucesso.')
    formTargetUser.value = null
    await loadUsers({ page: pagination.value.page })
  } catch (error) {
    handleApiError(error, 'Não foi possível criar a assinatura.')
  } finally {
    markActionLoading(`create-${userId}`, false)
  }
}

const handleActivate = async (user: AdminUser) => {
  const token = authStore.accessToken
  if (!token) return

  markActionLoading(`activate-${user.id}`, true)
  try {
    await activateSubscription(token, user.id)
    showNotification('success', `Assinatura de ${user.name} ativada.`)
    await loadUsers({ page: pagination.value.page })
  } catch (error) {
    handleApiError(error, `Não foi possível ativar a assinatura de ${user.name}.`)
  } finally {
    markActionLoading(`activate-${user.id}`, false)
  }
}

const handleCancel = async (user: AdminUser) => {
  const token = authStore.accessToken
  if (!token) return

  markActionLoading(`cancel-${user.id}`, true)
  try {
    await updateSubscription(token, user.id, {
      status: SubscriptionStatus.CANCELLED,
      autoRenew: false,
    })
    showNotification('success', `Assinatura de ${user.name} cancelada.`)
    await loadUsers({ page: pagination.value.page })
  } catch (error) {
    handleApiError(error, `Não foi possível cancelar a assinatura de ${user.name}.`)
  } finally {
    markActionLoading(`cancel-${user.id}`, false)
  }
}

const toggleAutoRenew = async (user: AdminUser) => {
  const token = authStore.accessToken
  if (!token || !user.subscription) return

  markActionLoading(`auto-${user.id}`, true)
  try {
    await updateSubscription(token, user.id, {
      autoRenew: !user.subscription.autoRenew,
    })
    showNotification('success', `Renovação automática atualizada para ${user.name}.`)
    await loadUsers({ page: pagination.value.page })
  } catch (error) {
    handleApiError(error, `Não foi possível atualizar a renovação automática.`)
  } finally {
    markActionLoading(`auto-${user.id}`, false)
  }
}

resetFormDefaults()

onMounted(async () => {
  await loadUsers({ page: 1 })
})
</script>
