<template>
  <div class="min-h-screen py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center justify-center gap-2 mb-6">
          <svg class="w-10 h-10 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v7.72c0 4.59-3.11 8.88-8 10.1-4.89-1.22-8-5.51-8-10.1V7.78l8-3.6z"/>
          </svg>
          <span class="text-2xl font-bold text-gray-900">AutoOn</span>
        </router-link>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Finalizar Assinatura</h1>
        <p class="text-gray-600">Um passo para conquistar sua CNH</p>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        <!-- Order Summary -->
        <div class="glass-panel">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Resumo do Pedido</h2>

          <div class="space-y-4 mb-6">
            <div class="flex items-start gap-4 p-4 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl">
              <div class="w-12 h-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">Plano Premium AutoOn</h3>
                <p class="text-sm text-gray-600">Acesso ilimitado por 30 dias</p>
              </div>
              <div class="text-right">
                <div class="text-xl font-bold text-primary-600">R$ 99,99</div>
                <div class="text-sm text-gray-500">/mês</div>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-4 space-y-3 mb-6">
            <div class="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>R$ 99,99</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>Desconto</span>
              <span class="text-green-600">- R$ 0,00</span>
            </div>
            <div class="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
              <span>Total</span>
              <span>R$ 99,99</span>
            </div>
          </div>

          <div class="bg-primary-50 border border-primary-200 rounded-2xl p-4">
            <h4 class="font-semibold text-primary-900 mb-2">O que está incluído:</h4>
            <ul class="space-y-2 text-sm text-primary-800">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Acesso a todos os cursos
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Simulados ilimitados
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Certificado de conclusão
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Suporte prioritário
              </li>
            </ul>
          </div>
        </div>

        <!-- Payment Form -->
        <div class="glass-panel">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Forma de Pagamento</h2>

          <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {{ error }}
          </div>

          <div v-if="success" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            Pagamento processado com sucesso! Redirecionando...
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Método de Pagamento
              </label>
              <div class="grid grid-cols-2 gap-4">
                <button
                  @click="paymentMethod = 'credit_card'"
                  :class="[
                    'p-4 border-2 rounded-xl transition',
                    paymentMethod === 'credit_card'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  ]"
                >
                  <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  <div class="text-sm font-medium">Cartão</div>
                </button>

                <button
                  @click="paymentMethod = 'pix'"
                  :class="[
                    'p-4 border-2 rounded-xl transition',
                    paymentMethod === 'pix'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  ]"
                >
                  <svg class="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <div class="text-sm font-medium">PIX</div>
                </button>
              </div>
            </div>

            <div v-if="paymentMethod === 'credit_card'" class="space-y-4">
              <div>
                <label for="cardNumber" class="block text-sm font-medium text-gray-700 mb-2">
                  Número do Cartão
                </label>
                <input
                  id="cardNumber"
                  v-model="cardForm.number"
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  class="input-field w-full"
                />
              </div>

              <div>
                <label for="cardName" class="block text-sm font-medium text-gray-700 mb-2">
                  Nome no Cartão
                </label>
                <input
                  id="cardName"
                  v-model="cardForm.name"
                  type="text"
                  placeholder="NOME SOBRENOME"
                  class="input-field w-full"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="cardExpiry" class="block text-sm font-medium text-gray-700 mb-2">
                    Validade
                  </label>
                  <input
                    id="cardExpiry"
                    v-model="cardForm.expiry"
                    type="text"
                    placeholder="MM/AA"
                    class="input-field w-full"
                  />
                </div>
                <div>
                  <label for="cardCvv" class="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    id="cardCvv"
                    v-model="cardForm.cvv"
                    type="text"
                    placeholder="123"
                    maxlength="4"
                    class="input-field w-full"
                  />
                </div>
              </div>
            </div>

            <div v-if="paymentMethod === 'pix'" class="text-center py-8">
              <div class="w-48 h-48 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg class="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h18v18H3V3zm16 16V5H5v14h14z"/>
                </svg>
              </div>
              <p class="text-gray-600 mb-2">QR Code será gerado após confirmação</p>
              <p class="text-sm text-gray-500">Pagamento instantâneo via PIX</p>
            </div>

            <button
              @click="handlePayment"
              :disabled="loading"
              class="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-primary-500/50 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">Processando...</span>
              <span v-else>Confirmar Pagamento - R$ 99,99</span>
            </button>

            <p class="text-xs text-center text-gray-500">
              Ao confirmar, você concorda com nossos termos de serviço e política de cancelamento.
              Pagamento seguro processado via Mercado Pago.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const paymentMethod = ref<'credit_card' | 'pix'>('credit_card');
const loading = ref(false);
const error = ref('');
const success = ref(false);

const cardForm = reactive({
  number: '',
  name: '',
  expiry: '',
  cvv: '',
});

const handlePayment = async () => {
  try {
    loading.value = true;
    error.value = '';

    // TODO: Integrate with real payment API
    // For now, simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    success.value = true;

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  } catch (err: any) {
    error.value = 'Erro ao processar pagamento. Tente novamente.';
  } finally {
    loading.value = false;
  }
};
</script>
