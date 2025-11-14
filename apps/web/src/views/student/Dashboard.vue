<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
            <span class="text-xl font-bold text-gray-900">AutoOn</span>
          </div>
          <nav class="flex items-center gap-6">
            <router-link to="/courses" class="text-gray-600 hover:text-primary-600 transition">
              Cursos
            </router-link>
            <button @click="logout" class="text-gray-600 hover:text-red-600 transition">
              Sair
            </button>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Olá, {{ user?.name || 'Aluno' }}! 👋
        </h1>
        <p class="text-gray-600">Continue seus estudos de onde parou</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-2xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 mb-1">{{ stats.coursesEnrolled }}</div>
          <div class="text-sm text-gray-600">Cursos Matriculados</div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 mb-1">{{ stats.lessonsCompleted }}</div>
          <div class="text-sm text-gray-600">Aulas Concluídas</div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 mb-1">{{ stats.totalHours }}h</div>
          <div class="text-sm text-gray-600">Tempo de Estudo</div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 mb-1">{{ stats.averageScore }}%</div>
          <div class="text-sm text-gray-600">Média nos Simulados</div>
        </div>
      </div>

      <!-- Subscription Status -->
      <div v-if="subscription" class="mb-8 p-6 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl text-white">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold mb-1">Assinatura Ativa ✓</h3>
            <p class="text-primary-100">Renovação: {{ formatDate(subscription.endDate) }}</p>
          </div>
          <button class="px-4 py-2 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition">
            Gerenciar
          </button>
        </div>
      </div>

      <!-- Courses in Progress -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Meus Cursos</h2>
          <router-link to="/courses" class="text-primary-600 hover:text-primary-700 font-semibold">
            Ver todos →
          </router-link>
        </div>

        <p v-if="dashboardError" class="text-sm text-red-600 mb-4">
          {{ dashboardError }}
        </p>

        <div v-if="loadingCourses" class="text-center py-10 text-gray-600">
          Carregando seus cursos...
        </div>

        <div v-else class="grid md:grid-cols-2 gap-6">
          <div v-for="course in courses" :key="course.id" class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-start gap-4 mb-4">
              <div class="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 mb-1">{{ course.title }}</h3>
                <p class="text-sm text-gray-600">{{ course.workloadHours }}h de conteúdo</p>
              </div>
            </div>

            <div class="mb-3">
              <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progresso</span>
                <span class="font-semibold">{{ course.progress }}%</span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full transition-all"
                  :style="{ width: `${course.progress}%` }"
                ></div>
              </div>
            </div>

            <button
              class="w-full px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-semibold"
              @click="goToCourse(course)"
            >
              Continuar estudando
            </button>
          </div>

          <div v-if="courses.length === 0" class="col-span-2 text-center py-12">
            <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Nenhum curso matriculado</h3>
            <p class="text-gray-600 mb-4">Comece sua jornada para a CNH agora!</p>
            <router-link to="/courses" class="inline-block px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-semibold">
              Explorar Cursos
            </router-link>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { apiFetch, isApiError } from '../../services/http';

const router = useRouter();
const authStore = useAuthStore();

const user = ref(authStore.user);
const subscription = ref<any>(null);

const stats = ref({
  coursesEnrolled: 0,
  lessonsCompleted: 0,
  totalHours: 0,
  averageScore: 0,
});

const courses = ref<
  Array<{
    id: string;
    enrollmentId: string;
    title: string;
    description: string;
    workloadHours: number;
    progress: number;
    createdAt: string;
  }>
>([]);

const loadingCourses = ref(false);
const dashboardError = ref('');

const loadDashboard = async () => {
  loadingCourses.value = true;
  dashboardError.value = '';

  try {
    const [enrollmentsResponse, subscriptionResponse] = await Promise.all([
      apiFetch<any[]>('/enrollments/my-courses', { token: authStore.accessToken }),
      apiFetch<any>('/subscriptions/my-subscription', {
        token: authStore.accessToken,
      }).catch((err) => {
        if (isApiError(err) && err.status === 404) {
          return null;
        }
        throw err;
      }),
    ]);

    const normalizedCourses =
      (enrollmentsResponse || []).map((enrollment) => ({
        id: enrollment.course?.id ?? enrollment.id,
        enrollmentId: enrollment.id,
        title: enrollment.course?.title ?? 'Curso',
        description: enrollment.course?.description ?? '',
        workloadHours: enrollment.course?.workloadHours ?? 0,
        progress: enrollment.progressPercent ?? 0,
        createdAt: enrollment.createdAt,
      })) ?? [];

    courses.value = normalizedCourses;
    subscription.value = subscriptionResponse;

    const totalHours = normalizedCourses.reduce(
      (acc, course) => acc + (course.workloadHours || 0),
      0,
    );
    const completedCourses = normalizedCourses.filter(
      (course) => (course.progress ?? 0) >= 100,
    ).length;

    stats.value = {
      coursesEnrolled: normalizedCourses.length,
      lessonsCompleted: completedCourses,
      totalHours,
      averageScore: 0,
    };
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
    dashboardError.value = isApiError(err)
      ? err.message
      : 'Não foi possível carregar seus cursos.';
  } finally {
    loadingCourses.value = false;
  }
};

const goToCourse = (course: { id: string }) => {
  router.push(`/courses/${course.id}`);
};

// Recarrega quando a página fica visível novamente (usuário volta da aba/janela)
const handleVisibilityChange = () => {
  if (!document.hidden) {
    console.log('Página visível novamente, recarregando dashboard...');
    loadDashboard();
  }
};

onMounted(() => {
  loadDashboard();
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

// Recarrega o dashboard quando o componente é ativado novamente (usuário volta para a página)
onActivated(() => {
  console.log('Dashboard ativado, recarregando dados...');
  loadDashboard();
});

// Remove listener quando o componente é destruído
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

const logout = () => {
  authStore.logout();
  router.push('/');
};

const formatDate = (date?: string | null) => {
  if (!date) {
    return '-';
  }
  return new Date(date).toLocaleDateString('pt-BR');
};
</script>
