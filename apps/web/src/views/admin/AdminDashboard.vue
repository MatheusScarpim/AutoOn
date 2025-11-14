<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            <p class="text-sm text-gray-600">Bem-vindo, {{ authStore.user?.name }}</p>
          </div>
          <button @click="logout" class="text-red-600 hover:text-red-700 font-semibold">
            Sair
          </button>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-6 py-8">
      <!-- Stats Cards -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        <p class="mt-4 text-gray-600">Carregando estatísticas...</p>
      </div>

      <div v-else>
        <div class="grid md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-600 mb-1">Total Usuários</h3>
                <div class="text-3xl font-bold text-primary-600">{{ stats.totalUsers }}</div>
              </div>
              <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-600 mb-1">Assinaturas Ativas</h3>
                <div class="text-3xl font-bold text-green-600">{{ stats.activeSubscriptions }}</div>
              </div>
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-600 mb-1">Total Cursos</h3>
                <div class="text-3xl font-bold text-blue-600">{{ stats.totalCourses }}</div>
              </div>
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-600 mb-1">Receita Mensal</h3>
                <div class="text-3xl font-bold text-purple-600">R$ {{ stats.monthlyRevenue.toFixed(2) }}</div>
              </div>
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Cards -->
        <div class="mb-8">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Gerenciamento</h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Courses Management -->
            <router-link
              to="/admin/courses"
              class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition group"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900 mb-2">Gestão de Cursos</h3>
                  <p class="text-sm text-gray-600">Crie, edite e gerencie cursos, módulos e aulas</p>
                </div>
              </div>
            </router-link>

            <!-- Users Management (Admin Only) -->
            <router-link
              v-if="authStore.user?.role === 'ADMIN'"
              to="/admin/users"
              class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition group"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900 mb-2">Gestão de Usuários</h3>
                  <p class="text-sm text-gray-600">Gerencie usuários, permissões e assinaturas</p>
                </div>
              </div>
            </router-link>

            <!-- API Documentation -->
            <a
              href="http://localhost:3000/api"
              target="_blank"
              class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition group"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900 mb-2">Documentação da API</h3>
                  <p class="text-sm text-gray-600">Explore endpoints e teste requisições</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <!-- Quick Actions -->
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
          <div class="grid md:grid-cols-2 gap-4">
            <button
              @click="router.push('/admin/courses')"
              class="bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl p-4 text-left hover:shadow-xl transition"
            >
              <div class="font-semibold mb-1">+ Criar Novo Curso</div>
              <div class="text-sm opacity-90">Comece a criar conteúdo para seus alunos</div>
            </button>

            <button
              v-if="authStore.user?.role === 'ADMIN'"
              @click="router.push('/admin/users')"
              class="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl p-4 text-left hover:shadow-xl transition"
            >
              <div class="font-semibold mb-1">+ Adicionar Usuário</div>
              <div class="text-sm opacity-90">Crie contas de instrutores ou administradores</div>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);

const stats = ref({
  totalUsers: 0,
  activeSubscriptions: 0,
  totalCourses: 0,
  monthlyRevenue: 0,
});

onMounted(async () => {
  await loadStats();
});

const loadStats = async () => {
  loading.value = true;
  try {
    // Load users count
    const usersResponse = await fetch('http://localhost:3000/users', {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`,
      },
    });
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      stats.value.totalUsers = usersData.data?.length || usersData.length || 0;
    }

    // Load courses count
    const coursesResponse = await fetch('http://localhost:3000/courses', {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`,
      },
    });
    if (coursesResponse.ok) {
      const coursesData = await coursesResponse.json();
      stats.value.totalCourses = coursesData.data?.length || coursesData.length || 0;
    }

    // Load subscriptions (if endpoint exists)
    try {
      const subsResponse = await fetch('http://localhost:3000/subscriptions', {
        headers: {
          'Authorization': `Bearer ${authStore.accessToken}`,
        },
      });
      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        const subs = subsData.data || subsData || [];
        stats.value.activeSubscriptions = subs.filter((s: any) => s.status === 'ACTIVE').length;
        stats.value.monthlyRevenue = stats.value.activeSubscriptions * 99.99;
      }
    } catch {
      // Endpoint may not exist yet
    }
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err);
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  authStore.logout();
  router.push('/');
};
</script>
