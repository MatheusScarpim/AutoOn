<template>
  <div class="landing-page min-h-screen">
    <!-- Hero Section -->
    <section class="hero relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div class="absolute inset-0 opacity-20">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 30px 30px;"></div>
      </div>

      <nav class="relative z-10 container mx-auto px-6 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v7.72c0 4.59-3.11 8.88-8 10.1-4.89-1.22-8-5.51-8-10.1V7.78l8-3.6z"/>
              <path d="M10.5 13l-2.5-2.5L6.5 12l4 4 7-7-1.5-1.5z"/>
            </svg>
            <span class="text-2xl font-bold">AutoOn</span>
          </div>
          <div class="hidden md:flex items-center space-x-8">
            <a href="#features" class="hover:text-purple-300 transition">Recursos</a>
            <a href="#pricing" class="hover:text-purple-300 transition">Preços</a>
            <a href="#faq" class="hover:text-purple-300 transition">FAQ</a>
            <button @click="goToLogin" class="px-6 py-2 bg-white/10 backdrop-blur border border-white/30 rounded-full hover:bg-white/20 transition">
              Entrar
            </button>
          </div>
        </div>
      </nav>

      <div class="relative z-10 container mx-auto px-6 py-20 md:py-32">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div class="text-center md:text-left">
            <div class="inline-block px-4 py-2 bg-purple-500/30 backdrop-blur rounded-full mb-6 border border-purple-400/30">
              <span class="text-sm font-semibold">✨ Nova forma de tirar sua CNH</span>
            </div>
            <h1 class="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Conquiste sua
              <span class="block text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                Habilitação Online
              </span>
            </h1>
            <p class="text-xl text-purple-100 mb-8 leading-relaxed">
              A maneira mais moderna e prática de se preparar para a CNH. Aulas em vídeo,
              simulados realistas e acompanhamento personalizado.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button @click="startNow" class="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition transform hover:scale-105">
                Começar Agora
              </button>
              <button class="px-8 py-4 bg-white/10 backdrop-blur border border-white/30 rounded-full font-semibold text-lg hover:bg-white/20 transition">
                Ver Como Funciona
              </button>
            </div>
            <div class="mt-12 flex items-center justify-center md:justify-start gap-8">
              <div class="text-center">
                <div class="text-3xl font-bold">10k+</div>
                <div class="text-sm text-purple-200">Alunos Aprovados</div>
              </div>
              <div class="w-px h-12 bg-purple-400/30"></div>
              <div class="text-center">
                <div class="text-3xl font-bold">98%</div>
                <div class="text-sm text-purple-200">Taxa de Aprovação</div>
              </div>
              <div class="w-px h-12 bg-purple-400/30"></div>
              <div class="text-center">
                <div class="text-3xl font-bold">4.9</div>
                <div class="text-sm text-purple-200">Avaliação</div>
              </div>
            </div>
          </div>
          <div class="hidden md:block">
            <div class="relative">
              <div class="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-3xl opacity-30"></div>
              <div class="relative bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl shadow-2xl p-12 flex items-center justify-center aspect-square">
                <svg class="w-64 h-64 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
        </svg>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 bg-white">
      <div class="container mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tudo que você precisa para
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              passar na CNH
            </span>
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Plataforma completa com conteúdo atualizado segundo as novas regras do DETRAN
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="p-8 rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:shadow-xl transition group">
            <div class="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Vídeo-Aulas</h3>
            <p class="text-gray-600 leading-relaxed">
              Conteúdo completo em vídeo com professores especializados.
              Aprenda no seu ritmo, quando e onde quiser.
            </p>
          </div>

          <div class="p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 hover:shadow-xl transition group">
            <div class="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Simulados</h3>
            <p class="text-gray-600 leading-relaxed">
              Milhares de questões atualizadas. Treine com simulados
              idênticos à prova oficial do DETRAN.
            </p>
          </div>

          <div class="p-8 rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 hover:shadow-xl transition group">
            <div class="w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Acompanhamento</h3>
            <p class="text-gray-600 leading-relaxed">
              Veja seu progresso em tempo real. Estatísticas detalhadas
              de desempenho e áreas para melhorar.
            </p>
          </div>

          <div class="p-8 rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 hover:shadow-xl transition group">
            <div class="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Conteúdo Completo</h3>
            <p class="text-gray-600 leading-relaxed">
              Legislação, Sinalização, Direção Defensiva, Primeiros Socorros
              e muito mais. Tudo em um só lugar.
            </p>
          </div>

          <div class="p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-pink-50 border border-indigo-100 hover:shadow-xl transition group">
            <div class="w-14 h-14 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Estude no Seu Ritmo</h3>
            <p class="text-gray-600 leading-relaxed">
              Acesso 24/7 de qualquer dispositivo. Pause, retome e
              revise sempre que precisar.
            </p>
          </div>

          <div class="p-8 rounded-3xl bg-gradient-to-br from-pink-50 to-indigo-50 border border-pink-100 hover:shadow-xl transition group">
            <div class="w-14 h-14 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Certificado</h3>
            <p class="text-gray-600 leading-relaxed">
              Receba certificado de conclusão digital ao completar
              o curso com sucesso.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-20 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div class="container mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Plano Único e Completo
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Acesso ilimitado a todo conteúdo por apenas R$ 99,99
          </p>
        </div>

        <div class="max-w-lg mx-auto">
          <div class="relative p-10 rounded-3xl bg-white shadow-2xl shadow-purple-200/50 border-2 border-purple-200">
            <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span class="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-semibold">
                ⭐ MAIS POPULAR
              </span>
            </div>

            <div class="text-center mb-8">
              <h3 class="text-3xl font-bold text-gray-900 mb-2">Plano Premium</h3>
              <div class="flex items-baseline justify-center gap-2">
                <span class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  R$ 99,99
                </span>
                <span class="text-gray-500">/mês</span>
              </div>
            </div>

            <ul class="space-y-4 mb-8">
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700">Acesso ilimitado a todas as vídeo-aulas</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700">Banco de questões atualizado</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700">Simulados ilimitados</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700">Acompanhamento de progresso</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700">Suporte via chat</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700">Certificado de conclusão</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700">Atualizações constantes de conteúdo</span>
              </li>
            </ul>

            <button @click="subscribe" class="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition transform hover:scale-105">
              Assinar Agora
            </button>

            <p class="text-center text-sm text-gray-500 mt-4">
              Cancele quando quiser. Sem taxas ocultas.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="py-20 bg-white">
      <div class="container mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Perguntas Frequentes
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Tire suas dúvidas sobre a plataforma
          </p>
        </div>

        <div class="max-w-3xl mx-auto space-y-4">
          <details class="group p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition cursor-pointer">
            <summary class="flex items-center justify-between font-semibold text-lg text-gray-900 cursor-pointer">
              O AutoOn substitui a autoescola?
              <svg class="w-5 h-5 text-gray-500 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </summary>
            <p class="mt-4 text-gray-600 leading-relaxed">
              Com as novas regras do DETRAN, você pode estudar a parte teórica de forma independente.
              O AutoOn oferece todo o conteúdo necessário para a prova teórica, incluindo vídeo-aulas
              e simulados. As aulas práticas de direção ainda precisam ser feitas em autoescola credenciada.
            </p>
          </details>

          <details class="group p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition cursor-pointer">
            <summary class="flex items-center justify-between font-semibold text-lg text-gray-900 cursor-pointer">
              Quanto tempo tenho de acesso?
              <svg class="w-5 h-5 text-gray-500 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </summary>
            <p class="mt-4 text-gray-600 leading-relaxed">
              Ao assinar, você tem acesso ilimitado à plataforma enquanto sua assinatura estiver ativa.
              Você pode cancelar quando quiser, sem multas ou taxas de cancelamento.
            </p>
          </details>

          <details class="group p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition cursor-pointer">
            <summary class="flex items-center justify-between font-semibold text-lg text-gray-900 cursor-pointer">
              O conteúdo está atualizado com as novas regras?
              <svg class="w-5 h-5 text-gray-500 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </summary>
            <p class="mt-4 text-gray-600 leading-relaxed">
              Sim! Todo nosso conteúdo é atualizado regularmente conforme as mudanças na legislação
              e nas regras do DETRAN. Você sempre terá acesso ao material mais recente.
            </p>
          </details>

          <details class="group p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition cursor-pointer">
            <summary class="flex items-center justify-between font-semibold text-lg text-gray-900 cursor-pointer">
              Posso acessar de qualquer dispositivo?
              <svg class="w-5 h-5 text-gray-500 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </summary>
            <p class="mt-4 text-gray-600 leading-relaxed">
              Sim! A plataforma é responsiva e funciona perfeitamente em computadores, tablets e
              smartphones. Estude onde e quando quiser, de qualquer dispositivo com internet.
            </p>
          </details>

          <details class="group p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition cursor-pointer">
            <summary class="flex items-center justify-between font-semibold text-lg text-gray-900 cursor-pointer">
              Como funciona o pagamento?
              <svg class="w-5 h-5 text-gray-500 group-open:rotate-180 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </summary>
            <p class="mt-4 text-gray-600 leading-relaxed">
              O pagamento é processado de forma segura através do Mercado Pago ou cartão de crédito.
              Após a confirmação do pagamento, você recebe acesso imediato à plataforma.
            </p>
          </details>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
      <div class="container mx-auto px-6">
        <div class="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div class="flex items-center space-x-2 mb-4">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v7.72c0 4.59-3.11 8.88-8 10.1-4.89-1.22-8-5.51-8-10.1V7.78l8-3.6z"/>
              </svg>
              <span class="text-xl font-bold">AutoOn</span>
            </div>
            <p class="text-gray-400">
              A forma mais moderna de conquistar sua habilitação.
            </p>
          </div>

          <div>
            <h4 class="font-semibold mb-4">Plataforma</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#" class="hover:text-white transition">Recursos</a></li>
              <li><a href="#" class="hover:text-white transition">Preços</a></li>
              <li><a href="#" class="hover:text-white transition">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold mb-4">Empresa</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#" class="hover:text-white transition">Sobre</a></li>
              <li><a href="#" class="hover:text-white transition">Contato</a></li>
              <li><a href="#" class="hover:text-white transition">Termos</a></li>
              <li><a href="#" class="hover:text-white transition">Privacidade</a></li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold mb-4">Redes Sociais</h4>
            <div class="flex gap-4">
              <a href="#" class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; 2025 AutoOn. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Redirect authenticated users to their appropriate dashboard
onMounted(() => {
  if (authStore.isAuthenticated && authStore.user) {
    const role = authStore.user.role;
    if (role === 'ADMIN' || role === 'INSTRUCTOR') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  }
});

const goToLogin = () => {
  router.push('/login');
};

const startNow = () => {
  router.push('/register');
};

const subscribe = () => {
  router.push('/register');
};
</script>

<style scoped>
.landing-page {
  scroll-behavior: smooth;
}
</style>
