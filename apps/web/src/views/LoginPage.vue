<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center justify-center gap-2 mb-6">
          <svg class="w-10 h-10 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v7.72c0 4.59-3.11 8.88-8 10.1-4.89-1.22-8-5.51-8-10.1V7.78l8-3.6z"/>
          </svg>
          <span class="text-2xl font-bold text-gray-900">AutoOn</span>
        </router-link>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h1>
        <p class="text-gray-600">Entre para continuar seus estudos</p>
      </div>

      <div class="glass-panel">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {{ error }}
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input-field w-full"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input-field w-full"
              placeholder="••••••••"
            />
          </div>

          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input
                v-model="form.remember"
                type="checkbox"
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-600">Lembrar-me</span>
            </label>
            <a href="#" class="text-sm text-primary-600 hover:text-primary-700">
              Esqueceu a senha?
            </a>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-primary-500/30 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">Entrando...</span>
            <span v-else>Entrar</span>
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-gray-600">
            Não tem uma conta?
            <router-link to="/register" class="text-primary-600 font-semibold hover:text-primary-700">
              Cadastre-se
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
  remember: false,
});

const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = '';

    await authStore.login({
      email: form.email,
      password: form.password,
    });

    // Redirect based on role
    if (authStore.user?.role === 'ADMIN' || authStore.user?.role === 'INSTRUCTOR') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  } catch (err: any) {
    error.value = err.message || 'Erro ao fazer login. Verifique suas credenciais.';
  } finally {
    loading.value = false;
  }
};
</script>
