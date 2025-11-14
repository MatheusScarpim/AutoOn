<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Gestao de Cursos</h1>
            <p class="text-sm text-gray-600">Crie e gerencie os cursos publicados na plataforma</p>
          </div>
          <div class="flex items-center gap-4">
            <router-link to="/admin" class="text-gray-600 hover:text-gray-900">
              Voltar ao Dashboard
            </router-link>
            <button @click="logout" class="text-red-600 hover:text-red-700">
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-6 py-8">
      <div class="mb-6">
        <button
          @click="openCreateModal"
          class="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-xl transition"
        >
          + Criar Novo Curso
        </button>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        <p class="mt-4 text-gray-600">Carregando cursos...</p>
      </div>

      <div v-else-if="courses.length === 0" class="text-center py-12">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Nenhum curso criado</h3>
        <p class="text-gray-600 mb-4">Comece criando seu primeiro curso!</p>
      </div>

      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="course in courses"
          :key="course.id"
          class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900 mb-1">{{ course.title }}</h3>
              <p class="text-sm text-gray-600 line-clamp-2">{{ course.description }}</p>
            </div>
            <span
              :class="[
                'px-3 py-1 rounded-full text-xs font-semibold',
                course.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              ]"
            >
              {{ course.isPublished ? 'Publicado' : 'Rascunho' }}
            </span>
          </div>

          <div class="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <span>{{ course.workloadHours }}h</span>
            <span>{{ course._count?.modules || 0 }} modulos</span>
          </div>

          <div class="flex flex-col gap-2">
            <button
              @click="editCourse(course)"
              class="w-full px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition font-semibold"
            >
              Editar dados
            </button>
            <button
              v-if="course.id"
              @click="goToContentManager(course.id)"
              class="w-full px-4 py-2 bg-white border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 transition font-semibold"
            >
              Gerenciar conteudo
            </button>
            <button
              @click="togglePublish(course)"
              class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
            >
              {{ course.isPublished ? 'Despublicar' : 'Publicar' }}
            </button>
            <p
              v-if="publishErrors[course.id]"
              class="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2"
            >
              {{ publishErrors[course.id] }}
            </p>
          </div>
        </div>
      </div>
    </main>

    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="closeCourseModal"
    >
      <div class="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          {{ editingCourse ? 'Editar Curso' : 'Criar Novo Curso' }}
        </h2>

        <form @submit.prevent="saveCourse" class="space-y-6">
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {{ error }}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Titulo do Curso *</label>
            <input
              v-model="courseForm.title"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Legislacao de Transito"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Descricao *</label>
            <textarea
              v-model="courseForm.description"
              required
              rows="4"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Descreva o conteudo do curso..."
            ></textarea>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Carga Horaria (horas) *</label>
              <input
                v-model.number="courseForm.workloadHours"
                type="number"
                min="1"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: 45"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">URL da Imagem de Capa</label>
              <input
                v-model="courseForm.coverImage"
                type="url"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
          </div>

          <div
            v-if="editingCourse"
            class="border-t border-gray-200 pt-6 space-y-3"
          >
            <h3 class="text-lg font-semibold text-gray-900">Gerenciamento avancado</h3>
            <p class="text-sm text-gray-600">
              Configure modulos, aulas e provas em uma pagina dedicada para este curso.
            </p>
            <p class="text-xs text-gray-500">
              Para publicar, o curso precisa ter pelo menos um modulo contendo uma aula.
            </p>
            <button
              type="button"
              @click="goToContentManager(editingCourse.id)"
              class="w-full px-4 py-3 bg-white border border-primary-200 text-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition"
            >
              Abrir pagina de conteudo
            </button>
          </div>

          <div class="flex flex-wrap gap-4">
            <button
              type="button"
              @click="closeCourseModal"
              class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-xl transition disabled:opacity-50"
            >
              {{ saving ? 'Salvando...' : 'Salvar Curso' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

const loading = ref(false);
const saving = ref(false);
const error = ref('');
const showCreateModal = ref(false);
const editingCourse = ref<any>(null);
const publishErrors = ref<Record<string, string>>({});

const courses = ref<any[]>([]);

const createEmptyCourseForm = () => ({
  title: '',
  description: '',
  workloadHours: 45,
  coverImage: '',
});

const courseForm = ref(createEmptyCourseForm());

const withBasePath = (path: string) =>
  path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const apiFetch = (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authStore.accessToken}`);
  }
  return fetch(withBasePath(path), {
    ...options,
    headers,
  });
};

const handleResponse = async (response: Response, defaultMessage: string) => {
  if (!response.ok) {
    let message = defaultMessage;
    try {
      const data = await response.json();
      if (data?.message) {
        message = data.message;
      }
    } catch (err) {
      // corpo vazio, segue mensagem padrao
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return null;
};

const resetCourseForm = () => {
  courseForm.value = createEmptyCourseForm();
};

onMounted(async () => {
  await loadCourses();
});

const loadCourses = async () => {
  loading.value = true;
  try {
    const response = await apiFetch('/courses');
    const data = await handleResponse(response, 'Erro ao carregar cursos');
    courses.value = data?.data || data || [];
    publishErrors.value = {};
  } catch (err) {
    console.error('Erro ao carregar cursos:', err);
  } finally {
    loading.value = false;
  }
};

const saveCourse = async () => {
  saving.value = true;
  error.value = '';

  try {
    const url = editingCourse.value ? `/courses/${editingCourse.value.id}` : '/courses';
    const method = editingCourse.value ? 'PUT' : 'POST';

    const response = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseForm.value),
    });

    await handleResponse(response, 'Erro ao salvar curso');

    await loadCourses();
    closeCourseModal();
  } catch (err: any) {
    error.value = err.message || 'Erro ao salvar curso';
  } finally {
    saving.value = false;
  }
};

const openCreateModal = () => {
  editingCourse.value = null;
  resetCourseForm();
  error.value = '';
  showCreateModal.value = true;
};

const closeCourseModal = () => {
  showCreateModal.value = false;
  editingCourse.value = null;
  resetCourseForm();
  error.value = '';
};

const editCourse = (course: any) => {
  editingCourse.value = course;
  courseForm.value = {
    title: course.title,
    description: course.description,
    workloadHours: course.workloadHours,
    coverImage: course.coverImage || '',
  };
  error.value = '';
  showCreateModal.value = true;
};

const togglePublish = async (course: any) => {
  publishErrors.value[course.id] = '';
  try {
    const response = await apiFetch(`/courses/${course.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !course.isPublished }),
    });
    await handleResponse(response, 'Erro ao atualizar publicacao do curso');
    await loadCourses();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nao foi possivel atualizar publicacao';
    publishErrors.value[course.id] = message;
  }
};

const goToContentManager = (courseId: string) => {
  closeCourseModal();
  router.push(`/admin/courses/${courseId}/content`);
};

const logout = () => {
  authStore.logout();
  router.push('/');
};
</script>
