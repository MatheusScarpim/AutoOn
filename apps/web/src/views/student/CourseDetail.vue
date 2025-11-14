<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="router.back()" class="text-gray-600 hover:text-primary-600 transition"><- Voltar</button>
          <h1 class="text-2xl font-bold text-gray-900">{{ course?.title || 'Curso' }}</h1>
        </div>
        <router-link to="/dashboard" class="text-sm text-gray-600 hover:text-primary-600">Dashboard</router-link>
      </div>
    </header>

    <main class="container mx-auto px-6 py-8">
      <div v-if="loading" class="text-center py-12 text-gray-600">Carregando curso...</div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <router-link to="/dashboard" class="px-6 py-3 bg-primary-600 text-white rounded-xl">Voltar</router-link>
      </div>

      <div v-else-if="course" class="space-y-8">
        <section class="bg-white rounded-2xl p-6 shadow-sm">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Descricao</h2>
          <p class="text-gray-700 leading-relaxed">{{ course.description }}</p>
          <div class="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
            <span>Horas: {{ course.workloadHours }}h</span>
            <span>Modulos: {{ course.modules?.length || 0 }}</span>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-gray-900">Conteudo</h2>
            <p class="text-sm text-gray-500">Selecione um modulo para continuar</p>
          </div>

          <div
            v-for="module in course.modules"
            :key="module.id"
            class="bg-white rounded-2xl p-5 shadow-sm space-y-4"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs uppercase text-gray-500 font-semibold">Modulo {{ module.order }}</p>
                  <h3 class="text-lg font-semibold text-gray-900">{{ module.title }}</h3>
                </div>
                <div class="text-right">
                  <p class="text-xs text-gray-500">Progresso</p>
                  <p class="text-sm font-semibold text-primary-600">
                    {{ getModuleProgress(module) }}%
                  </p>
                </div>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary-500 transition-all duration-300"
                  :style="{ width: `${getModuleProgress(module)}%` }"
                ></div>
              </div>
            </div>

            <div class="space-y-2">
              <div
                v-for="lesson in module.lessons"
                :key="lesson.id"
                class="flex items-center justify-between p-3 border rounded-xl transition"
                :class="{
                  'bg-green-50 border-green-300': isLessonCompleted(lesson.id),
                  'bg-gray-50 border-gray-200': !isLessonUnlocked(lesson.id),
                  'border-gray-300': isLessonUnlocked(lesson.id) && !isLessonCompleted(lesson.id)
                }"
              >
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0">
                    <span
                      v-if="isLessonCompleted(lesson.id)"
                      class="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold"
                      title="Concluída"
                    >
                      ✓
                    </span>
                    <span
                      v-else-if="!isLessonUnlocked(lesson.id)"
                      class="inline-flex items-center justify-center w-6 h-6 bg-gray-400 text-white rounded-full text-xs font-bold"
                      title="Bloqueada"
                    >
                      🔒
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center justify-center w-6 h-6 bg-primary-500 text-white rounded-full text-xs font-bold"
                      title="Disponível"
                    >
                      ▶
                    </span>
                  </div>
                  <div>
                    <p class="font-medium" :class="isLessonUnlocked(lesson.id) ? 'text-gray-900' : 'text-gray-500'">
                      {{ lesson.title }}
                    </p>
                    <p class="text-xs text-gray-500">
                      Ordem {{ lesson.order }}
                      <span v-if="isLessonCompleted(lesson.id)" class="text-green-600 font-semibold ml-2">• Concluída</span>
                      <span v-else-if="!isLessonUnlocked(lesson.id)" class="text-gray-600 font-semibold ml-2">• Bloqueada</span>
                    </p>
                  </div>
                </div>
                <button
                  class="px-4 py-2 text-sm rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                  :class="isLessonUnlocked(lesson.id) && lesson.videoId
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'"
                  :disabled="!lesson.videoId || !isLessonUnlocked(lesson.id)"
                  @click="startLesson(lesson, module)"
                  :title="!isLessonUnlocked(lesson.id) ? 'Complete as aulas anteriores para desbloquear' : (lesson.videoId ? 'Assistir aula' : 'Sem vídeo')"
                >
                  {{ !lesson.videoId ? 'Sem video' : isLessonCompleted(lesson.id) ? 'Assistir novamente' : 'Assistir' }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <div
      v-if="showPlayerModal && activeLesson"
      class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      @click.self="closePlayer"
    >
      <div class="bg-white rounded-2xl w-full max-w-4xl shadow-2xl p-6 space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-xl font-bold text-gray-900">Assistir aula</h3>
            <p class="text-sm text-gray-600">{{ activeLesson.title }}</p>
            <div class="mt-2 space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500">
                  Progresso de visualização
                </span>
                <span
                  :class="currentWatchPercent >= (activeLesson.minWatchPercent || 80) ? 'text-green-600 font-bold' : 'text-primary-600 font-semibold'"
                >
                  {{ currentWatchPercent }}% / {{ activeLesson.minWatchPercent || 80 }}% necessário
                </span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="flex h-full">
                  <!-- Barra de progresso assistido -->
                  <div
                    class="transition-all duration-300"
                    :class="currentWatchPercent >= (activeLesson.minWatchPercent || 80) ? 'bg-green-500' : 'bg-primary-500'"
                    :style="{ width: `${Math.min(currentWatchPercent, activeLesson.minWatchPercent || 80)}%` }"
                  ></div>
                  <!-- Barra de progresso extra (além do mínimo) -->
                  <div
                    v-if="currentWatchPercent > (activeLesson.minWatchPercent || 80)"
                    class="bg-green-300 transition-all duration-300"
                    :style="{ width: `${currentWatchPercent - (activeLesson.minWatchPercent || 80)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="text-gray-500 hover:text-gray-800"
            @click="closePlayer"
          >
            ✕
          </button>
        </div>

        <div v-if="playerError" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {{ playerError }}
        </div>

        <div
          v-if="playerLoading"
          class="p-4 border border-dashed rounded-lg text-sm text-gray-600 text-center"
        >
          Preparando video...
        </div>

        <div v-else-if="playerUrl" class="rounded-xl overflow-hidden bg-black">
          <video
            ref="playerElement"
            class="w-full h-full"
            controls
            playsinline
            controlsList="nodownload"
          ></video>
        </div>

        <div v-else class="p-4 border border-dashed rounded-lg text-sm text-gray-600 text-center">
          Nenhum video disponivel.
        </div>
      </div>
    </div>

    <!-- Modal do Quiz -->
    <div
      v-if="showQuizModal && activeQuiz"
      class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      @click.self="closeQuiz"
    >
      <div class="bg-white rounded-2xl w-full max-w-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-xl font-bold text-gray-900">{{ activeQuiz.title }}</h3>
            <p class="text-sm text-gray-600">Nota mínima: {{ activeQuiz.minScore }}%</p>
          </div>
          <button
            type="button"
            class="text-gray-500 hover:text-gray-800"
            @click="closeQuiz"
            :disabled="quizSubmitting"
          >
            ✕
          </button>
        </div>

        <div v-if="quizError" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {{ quizError }}
        </div>

        <div v-if="quizResult" class="p-4 rounded-lg text-sm" :class="quizResult.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
          <p class="font-semibold mb-1">{{ quizResult.passed ? '✓ Aprovado!' : '✗ Reprovado' }}</p>
          <p>Sua nota: {{ quizResult.score }}% (necessário: {{ activeQuiz.minScore }}%)</p>
          <p v-if="!quizResult.passed" class="mt-2 text-xs">Você pode tentar novamente.</p>
        </div>

        <div
          v-if="quizLoading"
          class="p-4 border border-dashed rounded-lg text-sm text-gray-600 text-center"
        >
          Carregando questões...
        </div>

        <div v-else-if="quizQuestions.length > 0" class="space-y-6">
          <div
            v-for="(question, index) in quizQuestions"
            :key="question.id"
            class="border rounded-xl p-4 space-y-3"
          >
            <div>
              <p class="text-xs uppercase text-gray-500 font-semibold">Questão {{ index + 1 }}</p>
              <p class="font-medium text-gray-900 mt-1">{{ question.statement }}</p>
              <p class="text-xs text-gray-500 mt-1">
                {{ question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE' ? 'Selecione UMA opção' : 'Selecione TODAS as opções corretas' }}
              </p>
            </div>

            <div class="space-y-2">
              <label
                v-for="option in question.options"
                :key="option"
                class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                :class="{ 'bg-primary-50 border-primary-300': quizAnswers[question.id]?.includes(option) }"
              >
                <input
                  :type="question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE' ? 'radio' : 'checkbox'"
                  :name="'question-' + question.id"
                  :value="option"
                  :checked="quizAnswers[question.id]?.includes(option)"
                  @change="toggleAnswer(question.id, option, question.type)"
                  :disabled="quizSubmitting || quizResult !== null"
                  class="w-4 h-4"
                />
                <span class="text-sm text-gray-900">{{ option }}</span>
              </label>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              @click="closeQuiz"
              :disabled="quizSubmitting"
            >
              {{ quizResult ? 'Fechar' : 'Cancelar' }}
            </button>
            <button
              v-if="!quizResult"
              type="button"
              class="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
              @click="submitQuiz"
              :disabled="quizSubmitting"
            >
              {{ quizSubmitting ? 'Enviando...' : 'Enviar respostas' }}
            </button>
          </div>
        </div>

        <div v-else class="p-4 border border-dashed rounded-lg text-sm text-gray-600 text-center">
          Nenhuma questão disponível.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch, isApiError } from '../../services/http'
import { useAuthStore } from '../../stores/auth'
import Hls from 'hls.js'
import type { Course, Lesson, Module, Question, Quiz, QuizResultDto } from '@autoon/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

type ModuleWithLessons = Module & {
  lessons?: Lesson[]
  quizzes?: Quiz[]
}

type CourseWithLessons = Course & {
  modules?: ModuleWithLessons[]
}

type QuizWithQuestions = Quiz & {
  questions: Question[]
}

interface ProgressPayload {
  unlockedLessonIds?: string[]
  completedLessonIds?: string[]
}

const course = ref<CourseWithLessons | null>(null)
const loading = ref(false)
const error = ref('')
const showPlayerModal = ref(false)
const activeLesson = ref<Lesson | null>(null)
const activeModule = ref<ModuleWithLessons | null>(null)
const playerLoading = ref(false)
const playerError = ref('')
const playerUrl = ref('')
const playerElement = ref<HTMLVideoElement | null>(null)
let hlsInstance: Hls | null = null
let heartbeatInterval: number | null = null
let lastPosition = 0

// Quiz state
const showQuizModal = ref(false)
const activeQuiz = ref<Quiz | null>(null)
const quizLoading = ref(false)
const quizError = ref('')
const quizQuestions = ref<Question[]>([])
const quizAnswers = ref<Record<string, string[]>>({})
const quizSubmitting = ref(false)
const quizResult = ref<QuizResultDto | null>(null)

// Progress state
const unlockedLessonIds = ref<Set<string>>(new Set())
const completedLessonIds = ref<Set<string>>(new Set())
const progressLoading = ref(false)
const currentWatchPercent = ref(0)
const videoDuration = ref(0)

const loadCourse = async () => {
  loading.value = true
  error.value = ''
  try {
    const courseData = await apiFetch<CourseWithLessons>(`/courses/${route.params.id}`, {
      token: authStore.accessToken,
    })
    course.value = courseData

    // Verifica se está matriculado e matricula se necessário
    await ensureEnrollment()

    // Carrega o progresso do estudante
    await loadProgress()
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Nao foi possivel carregar o curso.'
  } finally {
    loading.value = false
  }
}

const ensureEnrollment = async () => {
  if (!route.params.id) return

  try {
    // Tenta matricular no curso (se já estiver matriculado, a API retorna a matrícula existente)
    await apiFetch(`/enrollments/${route.params.id}`, {
      method: 'POST',
      token: authStore.accessToken,
    })
    console.log('Matrícula confirmada no curso')
  } catch (err) {
    // Se der erro 400, provavelmente já está matriculado
    if (isApiError(err) && err.message.includes('já matriculado')) {
      console.log('Já matriculado no curso')
    } else {
      console.error('Erro ao verificar matrícula:', err)
      // Não bloqueia o carregamento do curso
    }
  }
}

const loadProgress = async () => {
  if (!route.params.id) return

  progressLoading.value = true
  try {
    const data = await apiFetch<ProgressPayload>(`/progress/course/${route.params.id}/unlocked`, {
      token: authStore.accessToken,
    })

    console.log('Progresso carregado:', data)

    unlockedLessonIds.value = new Set(data.unlockedLessonIds || [])
    completedLessonIds.value = new Set(data.completedLessonIds || [])
  } catch (err) {
    console.error('Erro ao carregar progresso:', err)
    // Se der erro, desbloqueia a primeira aula
    const firstLesson = course.value?.modules?.[0]?.lessons?.[0]
    if (firstLesson?.id) {
      unlockedLessonIds.value = new Set([firstLesson.id])
    }
  } finally {
    progressLoading.value = false
  }
}

const isLessonUnlocked = (lessonId: string) => {
  return unlockedLessonIds.value.has(lessonId)
}

const isLessonCompleted = (lessonId: string) => {
  return completedLessonIds.value.has(lessonId)
}

const getModuleProgress = (module: ModuleWithLessons | null) => {
  if (!module?.lessons || module.lessons.length === 0) return 0

  const completedCount = module.lessons.filter((lesson: Lesson) => isLessonCompleted(lesson.id)).length

  return Math.round((completedCount / module.lessons.length) * 100)
}

const isModuleCompleted = (module: ModuleWithLessons | null) => {
  if (!module?.lessons || module.lessons.length === 0) return false

  // Verifica se TODAS as aulas do módulo foram concluídas
  return module.lessons.every((lesson: Lesson) => isLessonCompleted(lesson.id))
}

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}

const sendHeartbeat = async () => {
  if (!activeLesson.value?.id || !playerElement.value) {
    console.log('Heartbeat não enviado: aula ou player não disponível')
    return
  }

  const currentPosition = playerElement.value.currentTime
  const watchedDelta = Math.max(0, currentPosition - lastPosition)

  console.log('Tentando enviar heartbeat:', {
    lessonId: activeLesson.value.id,
    currentPosition,
    lastPosition,
    watchedDelta
  })

  // Envia heartbeat mesmo se delta for 0 (importante para criar progresso inicial)
  try {
    await apiFetch('/progress/heartbeat', {
      method: 'POST',
      token: authStore.accessToken,
      body: JSON.stringify({
        lessonId: activeLesson.value.id,
        positionSec: currentPosition,
        watchedDeltaSec: Math.max(0.1, watchedDelta), // Garante ao menos 0.1 segundo
      }),
    })
    console.log('✓ Heartbeat enviado com sucesso:', { position: currentPosition, delta: watchedDelta })
    lastPosition = currentPosition
  } catch (err) {
    console.error('✗ Erro ao enviar heartbeat:', err)
  }
}

let heartbeatStarted = false

const onTimeUpdate = () => {
  // Inicia o heartbeat na primeira atualização de tempo se ainda não foi iniciado
  if (!heartbeatStarted && playerElement.value && playerElement.value.currentTime > 0) {
    console.log('TimeUpdate detectado, iniciando heartbeat...')
    heartbeatStarted = true
    startHeartbeat()
  }

  // Atualiza porcentagem de progresso
  if (playerElement.value && playerElement.value.duration) {
    videoDuration.value = playerElement.value.duration
    const watchedTime = playerElement.value.currentTime
    currentWatchPercent.value = Math.min(100, Math.round((watchedTime / playerElement.value.duration) * 100))
  }
}

const startHeartbeat = async () => {
  // Evita múltiplas inicializações
  if (heartbeatInterval) {
    console.log('Heartbeat já está rodando, ignorando nova inicialização')
    return
  }

  console.log('=== Iniciando heartbeat ===')

  // Define a posição inicial
  if (playerElement.value) {
    lastPosition = playerElement.value.currentTime
    console.log('Posição inicial do vídeo:', lastPosition)
  }

  // Envia o primeiro heartbeat imediatamente
  await sendHeartbeat()

  // Envia heartbeat a cada 5 segundos
  heartbeatInterval = window.setInterval(sendHeartbeat, 5000)
  console.log('Heartbeat configurado para enviar a cada 5 segundos')
}

const destroyPlayer = () => {
  heartbeatStarted = false
  stopHeartbeat()
  if (playerElement.value) {
    try {
      playerElement.value.removeEventListener('ended', onVideoEnded)
      playerElement.value.removeEventListener('play', startHeartbeat)
      playerElement.value.removeEventListener('playing', startHeartbeat)
      playerElement.value.removeEventListener('timeupdate', onTimeUpdate)
      playerElement.value.pause()
      playerElement.value.removeAttribute('src')
      playerElement.value.load()
    } catch (err) {
      console.error('Erro ao limpar elemento de vídeo:', err)
    }
  }
  if (hlsInstance) {
    try {
      hlsInstance.destroy()
    } catch (err) {
      console.error('Erro ao destruir instância HLS:', err)
    }
    hlsInstance = null
  }
}

const attachPlayerSource = () => {
  if (!playerUrl.value) {
    console.error('URL do player não está definida')
    return
  }

  if (!playerElement.value) {
    console.error('Elemento de vídeo não está disponível')
    return
  }

  console.log('Carregando vídeo:', playerUrl.value)

  // Limpa instância anterior se existir
  destroyPlayer()

  try {
    if (Hls.isSupported()) {
      console.log('HLS.js é suportado, criando instância...')
      hlsInstance = new Hls({
        debug: true,
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      })

      hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('Mídia anexada ao elemento de vídeo')
      })

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        console.log('Manifest carregado, níveis disponíveis:', data.levels)
        playerError.value = ''
      })

      hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
        console.error('Erro HLS:', data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Erro de rede fatal, tentando recuperar...')
              playerError.value = 'Erro de rede ao carregar vídeo'
              hlsInstance?.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Erro de mídia fatal, tentando recuperar...')
              playerError.value = 'Erro ao processar mídia'
              hlsInstance?.recoverMediaError()
              break
            default:
              console.error('Erro fatal não recuperável')
              playerError.value = 'Erro ao carregar vídeo: ' + data.type
              destroyPlayer()
              break
          }
        }
      })

      hlsInstance.loadSource(playerUrl.value)
      hlsInstance.attachMedia(playerElement.value)
    } else if (playerElement.value.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('Safari/iOS nativo detectado, usando player nativo')
      playerElement.value.src = playerUrl.value
      playerError.value = ''
    } else {
      console.error('HLS não é suportado neste navegador')
      playerError.value = 'Seu navegador não suporta HLS.'
    }

    // Adiciona listeners para detectar eventos do vídeo
    if (playerElement.value) {
      playerElement.value.addEventListener('ended', onVideoEnded)
      playerElement.value.addEventListener('play', startHeartbeat)
      playerElement.value.addEventListener('playing', startHeartbeat)
      playerElement.value.addEventListener('timeupdate', onTimeUpdate)
      console.log('Listeners de vídeo adicionados (ended, play, playing, timeupdate)')
    }
  } catch (err: any) {
    console.error('Erro ao configurar player:', err)
    playerError.value = 'Erro ao inicializar player: ' + err.message
  }
}

const onVideoEnded = async () => {
  console.log('=== Vídeo terminou ===')
  console.log('Aula ativa:', activeLesson.value)
  console.log('Módulo ativo:', activeModule.value)

  // Marca a aula como concluída
  if (activeLesson.value?.id) {
    try {
      console.log('Tentando marcar aula como concluída:', activeLesson.value.id)
      const completeResponse = await apiFetch(`/progress/lesson/${activeLesson.value.id}/complete`, {
        method: 'POST',
        token: authStore.accessToken,
      })
      console.log('Resposta da API complete:', completeResponse)
      console.log('Aula marcada como concluída com sucesso!')

      // Atualiza o progresso local
      console.log('Atualizando progresso...')
      await loadProgress()
      console.log('Progresso atualizado!')

      // Aguarda um momento para o progresso ser atualizado
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verifica se TODAS as aulas do módulo foram concluídas
      const moduleCompleted = isModuleCompleted(activeModule.value)
      console.log('Módulo completamente concluído?', moduleCompleted)

      // Verifica se o módulo tem quiz E se foi completamente concluído
      if (moduleCompleted && activeModule.value?.quizzes && activeModule.value.quizzes.length > 0) {
        console.log('Todas as aulas concluídas! Módulo tem quiz, mostrando modal...')
        const quiz = activeModule.value.quizzes[0] // Pega o primeiro quiz do módulo
        showQuizAfterVideo(quiz)
      } else {
        console.log('Aula concluída, mas módulo ainda não foi completado ou não tem quiz')
        closePlayer()
        if (moduleCompleted) {
          window.alert('Parabéns! Você concluiu todas as aulas deste módulo!')
        } else {
          window.alert('Aula concluída! Continue com as próximas aulas do módulo.')
        }
      }
    } catch (err) {
      console.error('Erro ao marcar aula como concluída:', err)
      closePlayer()
    }
  }
}

const startLesson = async (lesson: Lesson, moduleData: ModuleWithLessons) => {
  if (!lesson.videoId) {
    window.alert('Esta aula ainda nao possui video.')
    return
  }
  console.log('=== Iniciando aula ===')
  console.log('Video ID:', lesson.videoId)
  console.log('Módulo:', moduleData)

  activeLesson.value = lesson
  activeModule.value = moduleData
  playerError.value = ''
  playerUrl.value = ''
  playerLoading.value = true
  showPlayerModal.value = true

  try {
    console.log('Fazendo requisição para /videos/' + lesson.videoId + '/stream')
    const data = await apiFetch<{ masterPlaylistUrl?: string }>(`/videos/${lesson.videoId}/stream`, {
      token: authStore.accessToken,
    })
    console.log('Dados recebidos da API:', data)

    const url = data?.masterPlaylistUrl || ''
    console.log('URL do player recebida:', url)

    if (!url) {
      throw new Error('Video nao disponivel.')
    }

    // Define loading = false ANTES da URL para renderizar o elemento <video>
    playerLoading.value = false
    console.log('Loading definido como false, elemento de vídeo será renderizado')

    // Aguarda um momento para o DOM renderizar
    await nextTick()

    // Define a URL - o watcher vai chamar attachPlayerSource
    playerUrl.value = url
    console.log('URL do player definida, watcher vai inicializar o player')
  } catch (err) {
    console.error('Erro ao iniciar aula:', err)
    playerError.value = isApiError(err) ? err.message : 'Erro ao carregar video.'
    playerLoading.value = false
  } finally {
    console.log('=== Fim do carregamento da aula ===')
  }
}

const closePlayer = () => {
  destroyPlayer()
  showPlayerModal.value = false
  activeLesson.value = null
  playerUrl.value = ''
  playerError.value = ''
  playerLoading.value = false
  currentWatchPercent.value = 0
  videoDuration.value = 0
}

const showQuizAfterVideo = async (quiz: Quiz) => {
  console.log('=== Mostrando quiz ===')
  console.log('Quiz:', quiz)

  // Fecha o player
  closePlayer()

  // Abre o modal do quiz
  activeQuiz.value = quiz
  quizError.value = ''
  quizResult.value = null
  quizAnswers.value = {}
  quizLoading.value = true
  showQuizModal.value = true

  try {
    // Busca as questões do quiz
    const data = await apiFetch<QuizWithQuestions>(`/quizzes/${quiz.id}`, {
      token: authStore.accessToken,
    })
    console.log('Questões carregadas:', data)
    quizQuestions.value = data.questions || []

    // Inicializa respostas vazias
    quizQuestions.value.forEach(question => {
      quizAnswers.value[question.id] = []
    })
  } catch (err) {
    console.error('Erro ao carregar quiz:', err)
    quizError.value = isApiError(err) ? err.message : 'Erro ao carregar quiz.'
  } finally {
    quizLoading.value = false
  }
}

const toggleAnswer = (questionId: string, answer: string, questionType: string) => {
  if (!quizAnswers.value[questionId]) {
    quizAnswers.value[questionId] = []
  }

  if (questionType === 'SINGLE_CHOICE' || questionType === 'TRUE_FALSE') {
    // Resposta única - substitui
    quizAnswers.value[questionId] = [answer]
  } else {
    // Resposta múltipla - toggle
    const index = quizAnswers.value[questionId].indexOf(answer)
    if (index > -1) {
      quizAnswers.value[questionId].splice(index, 1)
    } else {
      quizAnswers.value[questionId].push(answer)
    }
  }
}

const submitQuiz = async () => {
  if (!activeQuiz.value) return

  // Valida se todas as questões foram respondidas
  const unanswered = quizQuestions.value.filter(q => !quizAnswers.value[q.id] || quizAnswers.value[q.id].length === 0)
  if (unanswered.length > 0) {
    quizError.value = `Você precisa responder todas as questões. Faltam ${unanswered.length} questão(ões).`
    return
  }

  quizSubmitting.value = true
  quizError.value = ''

  try {
    // Formata as respostas para o backend
    const answers = quizQuestions.value.map(question => ({
      questionId: question.id,
      answers: quizAnswers.value[question.id],
    }))

    console.log('Enviando respostas:', answers)

    const data = await apiFetch<QuizResultDto>(`/quizzes/${activeQuiz.value.id}/submit`, {
      method: 'POST',
      token: authStore.accessToken,
      body: JSON.stringify({ answers }),
    })

    console.log('Resultado:', data)
    quizResult.value = data

    if (data.passed) {
      setTimeout(() => {
        closeQuiz()
        window.alert('Parabéns! Você foi aprovado no quiz!')
      }, 2000)
    }
  } catch (err) {
    console.error('Erro ao enviar quiz:', err)
    quizError.value = isApiError(err) ? err.message : 'Erro ao enviar quiz.'
  } finally {
    quizSubmitting.value = false
  }
}

const closeQuiz = () => {
  showQuizModal.value = false
  activeQuiz.value = null
  quizQuestions.value = []
  quizAnswers.value = {}
  quizError.value = ''
  quizResult.value = null
  quizSubmitting.value = false
}

watch(playerUrl, async (url) => {
  if (url && showPlayerModal.value) {
    console.log('Watcher detectou mudança na URL do player')

    // Aguarda o elemento estar disponível no DOM
    await nextTick()

    // Tenta múltiplas vezes se o elemento ainda não estiver disponível
    let attempts = 0
    const maxAttempts = 10

    while (!playerElement.value && attempts < maxAttempts) {
      console.log('Elemento de vídeo ainda não disponível, aguardando... (tentativa ' + (attempts + 1) + ')')
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }

    if (playerElement.value) {
      console.log('Elemento de vídeo encontrado, inicializando player')
      attachPlayerSource()
    } else {
      console.error('Elemento de vídeo não encontrado após ' + maxAttempts + ' tentativas')
      playerError.value = 'Erro ao inicializar player: elemento de vídeo não encontrado'
    }
  }
})

watch(showPlayerModal, (visible) => {
  if (!visible) {
    destroyPlayer()
  }
})

onBeforeUnmount(() => {
  destroyPlayer()
})

onMounted(() => {
  loadCourse()
})
</script>
