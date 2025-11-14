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
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Crie sua conta</h1>
        <p class="text-gray-600">Comece sua jornada para a CNH</p>
      </div>

      <div class="glass-panel">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {{ error }}
          </div>

          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="input-field w-full"
              placeholder="João Silva"
            />
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
              minlength="6"
              class="input-field w-full"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              class="input-field w-full"
              placeholder="Digite a senha novamente"
            />
          </div>

          <div class="space-y-3">
            <label class="flex items-start">
              <input
                v-model="form.agreedToTerms"
                type="checkbox"
                required
                class="w-4 h-4 mt-1 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-600">
                Aceito os
                <a href="#" class="text-primary-600 hover:text-primary-700">Termos de Uso</a>
              </span>
            </label>
            <label class="flex items-start">
              <input
                v-model="form.agreedToPrivacy"
                type="checkbox"
                required
                class="w-4 h-4 mt-1 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-600">
                Aceito a
                <a href="#" class="text-primary-600 hover:text-primary-700">Política de Privacidade</a>
              </span>
            </label>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-primary-500/30 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">Criando conta...</span>
            <span v-else>Criar Conta</span>
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-gray-600">
            Já tem uma conta?
            <router-link to="/login" class="text-primary-600 font-semibold hover:text-primary-700">
              Faça login
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
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreedToTerms: false,
  agreedToPrivacy: false,
});

const loading = ref(false);
const error = ref('');

const handleRegister = async () => {
  try {
    loading.value = true;
    error.value = '';

    if (form.password !== form.confirmPassword) {
      error.value = 'As senhas não coincidem';
      return;
    }

    if (!form.agreedToTerms || !form.agreedToPrivacy) {
      error.value = 'Você deve aceitar os termos e a política de privacidade';
      return;
    }

    await authStore.register({
      name: form.name,
      email: form.email,
      password: form.password,
      agreedToTerms: form.agreedToTerms,
      agreedToPrivacy: form.agreedToPrivacy,
    });

    // Redirect to checkout to subscribe
    router.push('/checkout');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erro ao criar conta. Tente novamente.';
  } finally {
    loading.value = false;
  }
};
</script>
