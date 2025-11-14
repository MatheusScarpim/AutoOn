<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <router-link to="/dashboard" class="flex items-center gap-3">
            <svg class="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
            <span class="text-xl font-bold text-gray-900">AutoOn</span>
          </router-link>
          <button
            class="px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition"
            @click="logout"
          >
            Sair
          </button>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-6 py-8">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Cursos Disponíveis</h1>
          <p class="text-gray-600">Selecione um curso para iniciar sua jornada</p>
        </div>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar curso"
          class="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        <p class="mt-4 text-gray-600">Carregando cursos...</p>
      </div>

      <div v-else-if="courses.length === 0" class="text-center py-12">
        <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Nenhum curso encontrado</h3>
        <p class="text-gray-600 mb-4">Tente ajustar sua busca.</p>
      </div>

      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="course in filteredCourses"
          :key="course.id"
          class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-900 mb-1">{{ course.title }}</h3>
              <p class="text-sm text-gray-600 line-clamp-2">{{ course.description }}</p>
            </div>
            <span
              class="px-3 py-1 text-xs font-semibold rounded-full"
              :class="course.isPublished
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-100 text-gray-500'"
            >
              {{ course.isPublished ? 'Disponível' : 'Em breve' }}
            </span>
          </div>

          <div class="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <span>?? {{ course.workloadHours }}h</span>
            <span>?? {{ course._count?.modules || 0 }} módulos</span>
          </div>

          <div class="space-y-2">
            <button
              @click="enroll(course)"
              :disabled="enrollingCourseId === course.id || !course.isPublished"
              class="w-full px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
            >
              {{ enrollingCourseId === course.id ? 'Matriculando...' : 'Matricular' }}
            </button>
            <p v-if="errors[course.id]" class="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
              {{ errors[course.id] }}
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiFetch, isApiError } from '../../services/http'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const courses = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const errors = ref<Record<string, string>>({})
const enrollingCourseId = ref<string | null>(null)

const filteredCourses = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return courses.value
  return courses.value.filter((course) =>
    [course.title, course.description]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(term)),
  )
})

const loadCourses = async () => {
  loading.value = true
  errors.value = {}
  try {
    const response = await apiFetch<any>('/courses', {
      token: authStore.accessToken,
    })
    courses.value = response?.data || response || []
  } catch (err) {
    console.error('Erro ao carregar cursos:', err)
  } finally {
    loading.value = false
  }
}

const enroll = async (course: any) => {
  if (!course.isPublished) {
    errors.value[course.id] = 'Curso ainda não está disponível para matrícula.'
    return
  }

  enrollingCourseId.value = course.id
  errors.value[course.id] = ''

  try {
    await apiFetch(`/enrollments/${course.id}`, {
      method: 'POST',
      token: authStore.accessToken,
    })
    await loadCourses()
    router.push('/dashboard')
  } catch (err) {
    if (isApiError(err)) {
      errors.value[course.id] = err.message
    } else {
      errors.value[course.id] = 'Erro ao realizar matrícula. Tente novamente.'
    }
  } finally {
    enrollingCourseId.value = null
  }
}

const logout = () => {
  authStore.logout()
  router.push('/')
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
