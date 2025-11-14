<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Conteudo do Curso</h1>
          <p class="text-sm text-gray-600">Configure modulos, aulas e provas</p>
        </div>
        <div class="flex items-center gap-4">
          <router-link to="/admin/courses" class="text-gray-600 hover:text-gray-900">
            Voltar para cursos
          </router-link>
          <button @click="logout" class="text-red-600 hover:text-red-700">
            Sair
          </button>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-6 py-8 space-y-6">
      <section class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm text-gray-500 uppercase tracking-wide">Curso</p>
            <h2 class="text-2xl font-bold text-gray-900">
              {{ course?.title || 'Carregando curso...' }}
            </h2>
            <p class="text-sm text-gray-600 mt-2 max-w-3xl">
              {{ course?.description }}
            </p>
            <div class="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
              <span><strong>Carga horaria:</strong> {{ course?.workloadHours || 0 }}h</span>
              <span><strong>Status:</strong> {{ course?.isPublished ? 'Publicado' : 'Rascunho' }}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              @click="reloadAll"
              class="px-4 py-2 bg-white border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 font-semibold"
              :disabled="modulesLoading"
            >
              {{ modulesLoading ? 'Atualizando...' : 'Recarregar conteudo' }}
            </button>
            <button
              type="button"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
              @click="router.push('/admin/courses')"
            >
              Voltar para lista
            </button>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div
          v-if="contentError"
          class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
        >
          {{ contentError }}
        </div>

        <div class="bg-white border border-dashed border-gray-300 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 class="text-lg font-semibold text-gray-900">Adicionar novo modulo</h3>
          <div class="grid md:grid-cols-2 gap-3">
            <input
              v-model="newModuleForm.title"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              placeholder="Titulo do modulo"
            />
            <input
              v-model.number="newModuleForm.order"
              type="number"
              min="1"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              placeholder="Ordem"
            />
          </div>
          <button
            type="button"
            class="px-5 py-3 bg-white border border-primary-200 text-primary-700 rounded-xl hover:bg-primary-50 font-semibold"
            @click="createModule"
            :disabled="modulesLoading || !newModuleForm.title"
          >
            Adicionar modulo
          </button>
        </div>

        <div v-if="modulesLoading" class="text-sm text-gray-600">
          Carregando conteudo do curso...
        </div>
        <div v-else-if="courseModules.length === 0" class="text-sm text-gray-500 italic">
          Nenhum modulo cadastrado ainda.
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="module in courseModules"
            :key="module.id"
            class="bg-white border rounded-2xl p-5 shadow-sm"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 class="text-xl font-semibold text-gray-900">{{ module.title }}</h4>
                <p class="text-sm text-gray-600">
                  Ordem {{ module.order }} · {{ module.lessons?.length || 0 }} aulas · {{ module.quizzes?.length || 0 }} provas
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="px-4 py-2 text-sm rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 font-semibold"
                  @click="toggleModule(module.id)"
                >
                  {{ expandedModules[module.id] ? 'Ocultar conteudo' : 'Gerenciar conteudo' }}
                </button>
                <button
                  type="button"
                  class="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-semibold"
                  @click="removeModule(module)"
                >
                  Remover
                </button>
              </div>
            </div>

            <div v-if="expandedModules[module.id]" class="mt-4 space-y-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Titulo do modulo</label>
                  <input
                    v-model="moduleForms[module.id].title"
                    type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Ordem</label>
                  <input
                    v-model.number="moduleForms[module.id].order"
                    type="number"
                    min="1"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div class="flex justify-end">
                <button
                  type="button"
                  class="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
                  @click="updateModule(module.id)"
                >
                  Salvar modulo
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-5">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h5 class="font-semibold text-gray-900">Aulas</h5>
                    <button
                      type="button"
                      class="text-sm px-3 py-1 bg-white border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50"
                      @click="openLessonModal(module.id)"
                    >
                      + Nova aula
                    </button>
                  </div>
                  <div
                    v-if="(module.lessons?.length || 0) === 0"
                    class="text-sm text-gray-500 border border-dashed rounded-lg p-3"
                  >
                    Nenhuma aula cadastrada.
                  </div>
                  <div v-else class="space-y-2 max-h-60 overflow-y-auto pr-1">
                    <div
                      v-for="lesson in module.lessons"
                      :key="lesson.id"
                      class="flex flex-wrap items-center justify-between gap-3 p-3 border rounded-lg"
                    >
                      <div>
                        <p class="font-medium text-gray-900">{{ lesson.order }}. {{ lesson.title }}</p>
                        <p v-if="lesson.videoId" class="text-xs text-gray-500">Video: {{ lesson.videoId }}</p>
                        <p v-if="lesson.video?.status" class="text-xs text-gray-500">
                          Status do video: {{ videoStatusLabel(lesson.video?.status) }}
                        </p>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          v-if="lesson.videoId"
                          type="button"
                          class="text-xs px-3 py-1 border border-primary-200 text-primary-700 rounded-md hover:bg-primary-50 font-semibold disabled:opacity-50"
                          :disabled="lesson.video?.status !== 'READY'"
                          @click="openVideoPlayerModal(module.id, lesson)"
                        >
                          {{ lesson.video?.status === 'READY' ? 'Assistir' : 'Processando...' }}
                        </button>
                        <button
                          type="button"
                          class="text-xs px-3 py-1 border border-primary-200 text-primary-700 rounded-md hover:bg-primary-50 font-semibold"
                          @click="openVideoUploadModal(module.id, lesson)"
                        >
                          {{ lesson.videoId ? 'Substituir video' : 'Enviar video' }}
                        </button>
                        <button
                          type="button"
                          class="text-xs text-red-600 hover:underline"
                          @click="removeLesson(lesson.id)"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h5 class="font-semibold text-gray-900">Provas / Quizzes</h5>
                    <button
                      type="button"
                      class="text-sm px-3 py-1 bg-white border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50"
                      @click="openQuizModal(module.id)"
                    >
                      + Nova prova
                    </button>
                  </div>
                  <div
                    v-if="(module.quizzes?.length || 0) === 0"
                    class="text-sm text-gray-500 border border-dashed rounded-lg p-3"
                  >
                    Nenhuma prova cadastrada.
                  </div>
                  <div v-else class="space-y-2 max-h-60 overflow-y-auto pr-1">
                      <div
                        v-for="quiz in module.quizzes"
                        :key="quiz.id"
                        class="p-3 border rounded-lg space-y-2"
                      >
                        <div class="flex items-center justify-between gap-3">
                          <div>
                            <p class="font-medium text-gray-900">{{ quiz.title }}</p>
                            <p class="text-xs text-gray-500">
                              Nota minima {{ quiz.minScore }} · {{ quiz.attemptsAllowed }} tentativa(s) · {{ quiz._count?.questions || 0 }} questoes
                            </p>
                          </div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          <button
                            type="button"
                            class="px-3 py-1 text-xs rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 font-semibold"
                            @click="openQuestionsModal(quiz)"
                          >
                            Gerenciar questoes
                          </button>
                          <button
                            type="button"
                            class="px-3 py-1 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-semibold"
                            @click="removeQuiz(quiz.id)"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <div
      v-if="showLessonModal && activeLessonForm && activeLessonModule"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="closeLessonModal"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-xl font-bold text-gray-900 mb-1">Nova aula</h3>
        <p class="text-sm text-gray-600 mb-4">Modulo: {{ activeLessonModule.title }}</p>

        <div v-if="lessonModalError" class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {{ lessonModalError }}
        </div>

        <form @submit.prevent="submitLessonModal" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
            <input
              v-model="activeLessonForm.title"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Aula 1 - Introducao"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ordem *</label>
              <input
                v-model.number="activeLessonForm.order"
                type="number"
                min="1"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Video (opcional)</label>
              <input
                :key="lessonModalVideoFileKey"
                type="file"
                accept="video/*"
                class="w-full text-sm"
                :disabled="videoUploadInProgress"
                @change="handleLessonVideoFileChange"
              />
              <p class="text-xs text-gray-500 mt-1">
                O arquivo sera enviado apos salvar a aula (limite {{ maxVideoSizeLabel }}).
              </p>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Minimo de visualizacao (%)</label>
            <input
              v-model.number="activeLessonForm.minWatchPercent"
              type="number"
              min="0"
              max="100"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Opcional"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              @click="closeLessonModal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
            >
              Salvar aula
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showQuizModal && activeQuizForm && activeQuizModule"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="closeQuizModal"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <h3 class="text-xl font-bold text-gray-900 mb-1">Nova prova / quiz</h3>
        <p class="text-sm text-gray-600 mb-4">Modulo: {{ activeQuizModule.title }}</p>

        <div v-if="quizModalError" class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {{ quizModalError }}
        </div>

        <form @submit.prevent="submitQuizModal" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
            <input
              v-model="activeQuizForm.title"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Quiz final"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
            <textarea
              v-model="activeQuizForm.description"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Opcional"
            ></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nota minima *</label>
              <input
                v-model.number="activeQuizForm.minScore"
                type="number"
                min="0"
                max="100"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tentativas *</label>
              <input
                v-model.number="activeQuizForm.attemptsAllowed"
                type="number"
                min="1"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              @click="closeQuizModal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
            >
              Salvar prova
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div
    v-if="showQuestionsModal && activeQuizForQuestions"
    class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    @click.self="closeQuestionsModal"
  >
    <div class="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-2xl font-bold text-gray-900 mb-1">Questoes do quiz</h3>
      <p class="text-sm text-gray-600 mb-4">
        {{ activeQuizForQuestions.title }} · Nota minima {{ activeQuizForQuestions.minScore }} · {{ activeQuizForQuestions.attemptsAllowed }} tentativa(s)
      </p>

      <div v-if="questionModalError" class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
        {{ questionModalError }}
      </div>

      <div v-if="questionModalLoading" class="text-sm text-gray-600 mb-4">
        Carregando questoes...
      </div>

      <div v-else class="space-y-3 mb-6">
        <div
          v-if="quizQuestions.length === 0"
          class="p-4 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500"
        >
          Nenhuma questao cadastrada ainda.
        </div>
        <div
          v-for="question in quizQuestions"
          :key="question.id"
          class="border rounded-xl p-4 space-y-2"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase text-gray-500 font-semibold">Questao {{ question.order }}</p>
              <p class="font-semibold text-gray-900">{{ question.statement }}</p>
            </div>
            <button
              type="button"
              class="text-xs text-red-600 hover:underline"
              @click="removeQuestion(question.id)"
            >
              Remover
            </button>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</p>
            <p class="text-sm text-gray-700">{{ question.type }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Opcoes</p>
            <ul class="text-sm text-gray-700 list-disc list-inside">
              <li v-for="option in question.options" :key="option">{{ option }}</li>
            </ul>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Respostas corretas</p>
            <ul class="text-sm text-gray-700 list-disc list-inside">
              <li v-for="answer in question.answerKey" :key="answer">{{ answer }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-200 pt-4 space-y-4">
        <h4 class="text-lg font-semibold text-gray-900">Adicionar nova questao</h4>
        <form @submit.prevent="submitQuestion" class="space-y-4">
          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                v-model="questionForm.type"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option v-for="type in questionTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ordem *</label>
              <input
                v-model.number="questionForm.order"
                type="number"
                min="1"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Enunciado *</label>
            <textarea
              v-model="questionForm.statement"
              rows="3"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Descreva a questao"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Opcoes (uma por linha) *</label>
            <textarea
              v-model="questionForm.optionsText"
              rows="3"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Digite cada opcao em uma linha"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Respostas corretas (uma por linha) *</label>
            <textarea
              v-model="questionForm.answersText"
              rows="3"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Deve corresponder exatamente a uma das opcoes"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              @click="closeQuestionsModal"
            >
              Fechar
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
            >
              Salvar questao
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div
    v-if="showVideoUploadModal && selectedVideoLesson"
    class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    @click.self="closeVideoUploadModal"
  >
    <div class="bg-white rounded-2xl p-6 w-full max-w-xl shadow-xl space-y-4">
      <div>
        <h3 class="text-xl font-bold text-gray-900">Upload de video</h3>
        <p class="text-sm text-gray-600">
          Aula: {{ selectedVideoLesson.lesson.title }}
        </p>
        <p v-if="selectedVideoLesson.lesson.video?.status" class="text-xs text-gray-500 mt-1">
          Status atual: {{ videoStatusLabel(selectedVideoLesson.lesson.video?.status) }}
        </p>
      </div>

      <div v-if="videoUploadError" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
        {{ videoUploadError }}
      </div>

      <div v-if="videoUploadSuccess" class="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
        Video enviado! O processamento pode levar alguns minutos.
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Arquivo de video</label>
          <input
            :key="videoFileInputKey"
            type="file"
            accept="video/*"
            class="w-full text-sm"
            :disabled="videoUploadInProgress"
            @change="handleVideoFileChange"
          />
          <p class="text-xs text-gray-500 mt-1">Ate {{ maxVideoSizeLabel }} por arquivo.</p>
        </div>

        <div v-if="videoUploadProgress > 0" class="space-y-1">
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary-500 transition-all duration-200"
              :style="{ width: `${videoUploadProgress}%` }"
            ></div>
          </div>
          <p class="text-xs text-gray-600">{{ videoUploadProgress }}% enviado</p>
        </div>

        <p v-if="videoUploadStatus" class="text-sm text-gray-600">{{ videoUploadStatus }}</p>
      </div>

      <div class="flex gap-3 pt-2">
        <button
          type="button"
          class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          :disabled="videoUploadInProgress"
          @click="closeVideoUploadModal"
        >
          Fechar
        </button>
        <button
          type="button"
          class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
          :disabled="!videoUploadFile || videoUploadInProgress"
          @click="uploadVideoForLesson"
        >
          {{ videoUploadInProgress
            ? 'Enviando...'
            : selectedVideoLesson.lesson.videoId
              ? 'Substituir video'
              : 'Enviar video' }}
        </button>
      </div>
    </div>
  </div>

  <div
    v-if="showVideoPlayerModal && videoPlayerLesson"
    class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
    @click.self="closeVideoPlayerModal"
  >
    <div class="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold text-gray-900">Visualizar video</h3>
          <p class="text-sm text-gray-600">
            Aula: {{ videoPlayerLesson.lesson.title }}
          </p>
        </div>
        <button
          type="button"
          class="text-gray-500 hover:text-gray-800"
          @click="closeVideoPlayerModal"
        >
          ✕
        </button>
      </div>

      <div v-if="videoPlayerError" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
        {{ videoPlayerError }}
      </div>

      <div
        v-if="videoPlayerLoading"
        class="p-4 border border-dashed rounded-lg text-sm text-gray-600 text-center"
      >
        Carregando video...
      </div>

      <div v-else-if="videoPlayerUrl" class="relative w-full rounded-xl overflow-hidden bg-black">
        <video
          ref="videoPlayerElement"
          class="w-full h-full"
          controls
          playsinline
          controlsList="nodownload"
        ></video>
      </div>

      <div v-else class="p-4 border border-dashed rounded-lg text-sm text-gray-600 text-center">
        Nenhum video disponivel para esta aula.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import type { InitiateUploadResponse } from '@autoon/types';
import Hls from 'hls.js';

type ModuleFormState = {
  title: string;
  order: number;
};

type LessonFormState = {
  title: string;
  order: number;
  videoId: string;
  minWatchPercent: number | null;
};

type QuizFormState = {
  title: string;
  description: string;
  minScore: number;
  attemptsAllowed: number;
};

const parseEnvNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const formatFileSize = (bytes: number) => {
  if (!bytes || Number.isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formatter = unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(formatter)} ${units[unitIndex]}`;
};

const MAX_VIDEO_SIZE_BYTES =
  parseEnvNumber(import.meta.env.VITE_MAX_VIDEO_SIZE_BYTES as string | undefined) ??
  parseEnvNumber(import.meta.env.VITE_MAX_FILE_SIZE_BYTES as string | undefined) ??
  5368709120;

const maxVideoSizeLabel = formatFileSize(MAX_VIDEO_SIZE_BYTES);

const VIDEO_STATUS_LABELS: Record<string, string> = {
  UPLOADING: 'Upload em andamento',
  PROCESSING: 'Processando',
  READY: 'Disponivel',
  ERROR: 'Erro',
};

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

const questionTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'] as const;

const course = ref<any>(null);
const modulesLoading = ref(false);
const contentError = ref('');
const courseModules = ref<any[]>([]);
const expandedModules = ref<Record<string, boolean>>({});
const moduleForms = ref<Record<string, ModuleFormState>>({});
const lessonForms = ref<Record<string, LessonFormState>>({});
const quizForms = ref<Record<string, QuizFormState>>({});
const newModuleForm = ref({ title: '', order: 1 });

const showLessonModal = ref(false);
const showQuizModal = ref(false);
const showQuestionsModal = ref(false);
const showVideoUploadModal = ref(false);
const showVideoPlayerModal = ref(false);
const activeLessonModuleId = ref<string | null>(null);
const activeQuizModuleId = ref<string | null>(null);
const activeQuizForQuestions = ref<any | null>(null);
const lessonModalError = ref('');
const quizModalError = ref('');
const questionModalError = ref('');
const questionModalLoading = ref(false);
const quizQuestions = ref<any[]>([]);
const questionForm = ref({
  type: 'SINGLE_CHOICE',
  statement: '',
  optionsText: '',
  answersText: '',
  order: 1,
});
const selectedVideoLesson = ref<{ moduleId: string; lesson: any } | null>(null);
const videoUploadFile = ref<File | null>(null);
const videoUploadProgress = ref(0);
const videoUploadStatus = ref('');
const videoUploadError = ref('');
const videoUploadInProgress = ref(false);
const videoUploadSuccess = ref(false);
const videoFileInputKey = ref(0);
const lessonModalVideoFile = ref<File | null>(null);
const lessonModalVideoFileKey = ref(0);
const videoPlayerLesson = ref<{ moduleId: string; lesson: any } | null>(null);
const videoPlayerLoading = ref(false);
const videoPlayerError = ref('');
const videoPlayerUrl = ref('');
const videoPlayerElement = ref<HTMLVideoElement | null>(null);
let hlsInstance: Hls | null = null;

const activeLessonForm = computed(() =>
  activeLessonModuleId.value ? lessonForms.value[activeLessonModuleId.value] : null,
);

const activeQuizForm = computed(() =>
  activeQuizModuleId.value ? quizForms.value[activeQuizModuleId.value] : null,
);

const activeLessonModule = computed(() =>
  activeLessonModuleId.value
    ? courseModules.value.find((module) => module.id === activeLessonModuleId.value) || null
    : null,
);

const activeQuizModule = computed(() =>
  activeQuizModuleId.value
    ? courseModules.value.find((module) => module.id === activeQuizModuleId.value) || null
    : null,
);

const videoStatusLabel = (status?: string | null) => {
  if (!status) {
    return 'Sem video';
  }
  return VIDEO_STATUS_LABELS[status] || status;
};

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
      // ignore corpo vazio
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return null;
};

const resetVideoUploadState = () => {
  videoUploadFile.value = null;
  videoUploadProgress.value = 0;
  videoUploadStatus.value = '';
  videoUploadError.value = '';
  videoUploadSuccess.value = false;
  videoFileInputKey.value += 1;
};

const openVideoUploadModal = (moduleId: string, lesson: any) => {
  selectedVideoLesson.value = { moduleId, lesson };
  if (!videoUploadInProgress.value) {
    resetVideoUploadState();
  }
  showVideoUploadModal.value = true;
};

const closeVideoUploadModal = () => {
  if (videoUploadInProgress.value) return;
  showVideoUploadModal.value = false;
  selectedVideoLesson.value = null;
  resetVideoUploadState();
};

const destroyVideoPlayerInstance = () => {
  if (hlsInstance) {
    try {
      hlsInstance.destroy();
    } catch (err) {
      console.error('Erro ao destruir instância HLS:', err);
    }
    hlsInstance = null;
  }
  if (videoPlayerElement.value) {
    try {
      videoPlayerElement.value.pause();
      videoPlayerElement.value.removeAttribute('src');
      videoPlayerElement.value.load();
    } catch (err) {
      console.error('Erro ao limpar elemento de vídeo:', err);
    }
  }
};

const attachVideoPlayerSource = () => {
  if (!videoPlayerUrl.value) {
    console.error('URL do player não está definida');
    return;
  }

  if (!videoPlayerElement.value) {
    console.error('Elemento de vídeo não está disponível');
    return;
  }

  console.log('Carregando vídeo:', videoPlayerUrl.value);

  // Limpa instância anterior se existir
  destroyVideoPlayerInstance();

  try {
    if (Hls.isSupported()) {
      console.log('HLS.js é suportado, criando instância...');
      hlsInstance = new Hls({
        debug: true, // Ativa logs de debug
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('Mídia anexada ao elemento de vídeo');
      });

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        console.log('Manifest carregado, níveis disponíveis:', data.levels);
        videoPlayerError.value = '';
      });

      hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
        console.error('Erro HLS:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Erro de rede fatal, tentando recuperar...');
              videoPlayerError.value = 'Erro de rede ao carregar vídeo';
              hlsInstance?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Erro de mídia fatal, tentando recuperar...');
              videoPlayerError.value = 'Erro ao processar mídia';
              hlsInstance?.recoverMediaError();
              break;
            default:
              console.error('Erro fatal não recuperável');
              videoPlayerError.value = 'Erro ao carregar vídeo: ' + data.type;
              destroyVideoPlayerInstance();
              break;
          }
        }
      });

      hlsInstance.loadSource(videoPlayerUrl.value);
      hlsInstance.attachMedia(videoPlayerElement.value);
    } else if (videoPlayerElement.value.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('Safari/iOS nativo detectado, usando player nativo');
      videoPlayerElement.value.src = videoPlayerUrl.value;
      videoPlayerError.value = '';
    } else {
      console.error('HLS não é suportado neste navegador');
      videoPlayerError.value = 'Seu navegador não suporta HLS.';
    }
  } catch (err: any) {
    console.error('Erro ao configurar player:', err);
    videoPlayerError.value = 'Erro ao inicializar player: ' + err.message;
  }
};

const openVideoPlayerModal = async (moduleId: string, lesson: any) => {
  if (!lesson.videoId) return;
  console.log('=== Abrindo modal do player ===');
  console.log('Video ID:', lesson.videoId);

  videoPlayerLesson.value = { moduleId, lesson };
  videoPlayerError.value = '';
  videoPlayerUrl.value = '';
  videoPlayerLoading.value = true;
  showVideoPlayerModal.value = true;

  try {
    console.log('Fazendo requisição para /videos/' + lesson.videoId + '/stream');
    const response = await apiFetch(`/videos/${lesson.videoId}/stream`);
    const data = await handleResponse(response, 'Erro ao carregar video');
    console.log('Dados recebidos da API:', data);

    const url = data?.masterPlaylistUrl || '';
    console.log('URL do player recebida:', url);

    if (!url) {
      throw new Error('URL do video nao disponivel');
    }

    // Define loading = false ANTES da URL para renderizar o elemento <video>
    videoPlayerLoading.value = false;
    console.log('Loading definido como false, elemento de vídeo será renderizado');

    // Aguarda um momento para o DOM renderizar
    await nextTick();

    // Define a URL - o watcher vai chamar attachVideoPlayerSource
    videoPlayerUrl.value = url;
    console.log('URL do player definida, watcher vai inicializar o player');
  } catch (err: any) {
    console.error('Erro ao abrir modal do player:', err);
    videoPlayerError.value = err.message || 'Erro ao carregar video';
    videoPlayerLoading.value = false;
  } finally {
    console.log('=== Fim do carregamento do player ===');
  }
};

const closeVideoPlayerModal = () => {
  destroyVideoPlayerInstance();
  showVideoPlayerModal.value = false;
  videoPlayerLesson.value = null;
  videoPlayerUrl.value = '';
  videoPlayerError.value = '';
  videoPlayerLoading.value = false;
};

const handleLessonVideoFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] || null;

  if (file && file.size > MAX_VIDEO_SIZE_BYTES) {
    lessonModalError.value = `Arquivo maior que o limite permitido (${maxVideoSizeLabel}).`;
    lessonModalVideoFile.value = null;
    lessonModalVideoFileKey.value += 1;
    return;
  }

  lessonModalError.value = '';
  lessonModalVideoFile.value = file;
};

const handleVideoFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] || null;
  videoUploadError.value = '';
  videoUploadStatus.value = '';
  videoUploadSuccess.value = false;
  videoUploadProgress.value = 0;

  if (file && file.size > MAX_VIDEO_SIZE_BYTES) {
    videoUploadError.value = `Arquivo maior que o limite permitido (${maxVideoSizeLabel}).`;
    videoUploadFile.value = null;
    videoFileInputKey.value += 1;
    return;
  }

  videoUploadFile.value = file;
};

const uploadFileParts = async (
  file: File,
  session: InitiateUploadResponse,
): Promise<{ partNumber: number; etag?: string; blockId?: string }[]> => {
  const orderedParts = [...session.uploadUrls].sort((a, b) => a.partNumber - b.partNumber);
  const partsResult: { partNumber: number; etag?: string; blockId?: string }[] = [];
  let uploadedBytes = 0;

  for (const part of orderedParts) {
    const start = (part.partNumber - 1) * session.partSize;
    const end = Math.min(file.size, start + session.partSize);
    const chunk = file.slice(start, end);

    if (chunk.size === 0) {
      continue;
    }

    videoUploadStatus.value = `Enviando parte ${part.partNumber} de ${orderedParts.length}`;

    const response = await fetch(part.uploadUrl, {
      method: 'PUT',
      body: chunk,
    });

    if (!response.ok) {
      throw new Error(`Falha ao enviar parte ${part.partNumber}`);
    }

    const etag = response.headers.get('etag') || response.headers.get('ETag') || undefined;
    partsResult.push({ partNumber: part.partNumber, etag, blockId: part.blockId });
    uploadedBytes += chunk.size;
    videoUploadProgress.value = Math.min(99, Math.round((uploadedBytes / file.size) * 100));
  }

  videoUploadProgress.value = 100;
  return partsResult;
};

const uploadVideoForLesson = async () => {
  if (!selectedVideoLesson.value) return;
  if (!videoUploadFile.value) {
    videoUploadError.value = 'Selecione um arquivo de video.';
    return;
  }

  videoUploadInProgress.value = true;
  videoUploadError.value = '';
  videoUploadSuccess.value = false;
  videoUploadProgress.value = 0;
  videoUploadStatus.value = 'Preparando upload...';

  try {
    const initiateResponse = await apiFetch('/videos/initiate-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: videoUploadFile.value.name,
        fileSize: videoUploadFile.value.size,
        contentType: videoUploadFile.value.type || 'application/octet-stream',
      }),
    });

    const session = (await handleResponse(
      initiateResponse,
      'Erro ao iniciar upload do video',
    )) as InitiateUploadResponse;

    if (!session?.uploadUrls?.length) {
      throw new Error('Servidor nao retornou URLs de upload.');
    }

    const parts = await uploadFileParts(videoUploadFile.value, session);

    videoUploadStatus.value = 'Finalizando upload...';

    const completeResponse = await apiFetch(`/videos/${session.videoId}/complete-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parts }),
    });
    await handleResponse(completeResponse, 'Erro ao finalizar upload do video');

    videoUploadStatus.value = 'Vinculando video a aula...';

    const lessonResponse = await apiFetch(`/lessons/${selectedVideoLesson.value.lesson.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: session.videoId }),
    });
    await handleResponse(lessonResponse, 'Erro ao vincular video a aula');

    videoUploadStatus.value = 'Video enviado! O processamento pode levar alguns minutos.';
    videoUploadSuccess.value = true;
    await loadCourseContent();
  } catch (err: any) {
    videoUploadError.value = err.message || 'Erro ao enviar video';
  } finally {
    videoUploadInProgress.value = false;
  }
};

const currentCourseId = () => route.params.id as string;

const loadCourse = async () => {
  const id = currentCourseId();
  if (!id) return;

  try {
    const response = await apiFetch(`/courses/${id}`);
    course.value = await handleResponse(response, 'Erro ao carregar curso');
  } catch (err: any) {
    contentError.value = err.message || 'Nao foi possivel carregar o curso';
  }
};

const loadCourseContent = async () => {
  const id = currentCourseId();
  if (!id) return;

  modulesLoading.value = true;
  contentError.value = '';

  try {
    const modulesResponse = await apiFetch(`/modules/course/${id}`);
    const modulesData = (await handleResponse(modulesResponse, 'Erro ao carregar modulos')) || [];

    const modulesWithExtras = await Promise.all(
      modulesData.map(async (module: any) => {
        const moduleWithLessons = { ...module, lessons: module.lessons || [] };
        try {
          const quizzesResponse = await apiFetch(`/quizzes/module/${module.id}`);
          const quizzesData = await handleResponse(quizzesResponse, 'Erro ao carregar quizzes');
          return { ...moduleWithLessons, quizzes: quizzesData || [] };
        } catch (err) {
          console.error('Erro ao carregar quizzes:', err);
          return { ...moduleWithLessons, quizzes: [] };
        }
      }),
    );

    syncModuleForms(modulesWithExtras);
    courseModules.value = modulesWithExtras;
    newModuleForm.value = {
      title: '',
      order: modulesWithExtras.length + 1,
    };
  } catch (err: any) {
    contentError.value = err.message || 'Nao foi possivel carregar os modulos';
  } finally {
    modulesLoading.value = false;
  }
};

const syncModuleForms = (modulesData: any[]) => {
  const moduleState: Record<string, ModuleFormState> = {};
  const lessonState: Record<string, LessonFormState> = {};
  const quizState: Record<string, QuizFormState> = {};
  const expandedState: Record<string, boolean> = {};

  modulesData.forEach((module) => {
    moduleState[module.id] = {
      title: module.title,
      order: module.order,
    };
    lessonState[module.id] = {
      title: '',
      order: (module.lessons?.length || 0) + 1,
      videoId: '',
      minWatchPercent: null,
    };
    quizState[module.id] = {
      title: '',
      description: '',
      minScore: 70,
      attemptsAllowed: 1,
    };
  });

  Object.keys(expandedModules.value).forEach((moduleId) => {
    if (moduleState[moduleId]) {
      expandedState[moduleId] = expandedModules.value[moduleId];
    }
  });

  Object.keys(moduleState).forEach((moduleId) => {
    if (expandedState[moduleId] === undefined) {
      expandedState[moduleId] = false;
    }
  });

  moduleForms.value = moduleState;
  lessonForms.value = lessonState;
  quizForms.value = quizState;
  expandedModules.value = expandedState;
};

const resetLessonForm = (moduleId: string) => {
  const moduleData = courseModules.value.find((module) => module.id === moduleId);
  lessonForms.value[moduleId] = {
    title: '',
    order: (moduleData?.lessons?.length || 0) + 1,
    videoId: '',
    minWatchPercent: null,
  };
  lessonModalVideoFile.value = null;
  lessonModalVideoFileKey.value += 1;
};

const resetQuizForm = (moduleId: string) => {
  quizForms.value[moduleId] = {
    title: '',
    description: '',
    minScore: 70,
    attemptsAllowed: 1,
  };
};

const toggleModule = (moduleId: string) => {
  expandedModules.value[moduleId] = !expandedModules.value[moduleId];
};

const reloadAll = async () => {
  await Promise.all([loadCourse(), loadCourseContent()]);
};

const createModule = async () => {
  const id = currentCourseId();
  if (!id || !newModuleForm.value.title) {
    contentError.value = 'Informe o titulo do modulo.';
    return;
  }

  contentError.value = '';

  try {
    const response = await apiFetch('/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: id,
        title: newModuleForm.value.title,
        order: Number(newModuleForm.value.order) || courseModules.value.length + 1,
      }),
    });

    await handleResponse(response, 'Erro ao criar modulo');
    await loadCourseContent();
  } catch (err: any) {
    contentError.value = err.message || 'Erro ao criar modulo';
  }
};

const updateModule = async (moduleId: string) => {
  const payload = moduleForms.value[moduleId];
  if (!payload) return;

  contentError.value = '';

  try {
    const response = await apiFetch(`/modules/${moduleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        order: Number(payload.order) || 1,
      }),
    });

    await handleResponse(response, 'Erro ao atualizar modulo');
    await loadCourseContent();
  } catch (err: any) {
    contentError.value = err.message || 'Erro ao atualizar modulo';
  }
};

const removeModule = async (module: any) => {
  const confirmed = window.confirm(`Remover o modulo "${module.title}"?`);
  if (!confirmed) return;

  contentError.value = '';

  try {
    const response = await apiFetch(`/modules/${module.id}`, { method: 'DELETE' });
    await handleResponse(response, 'Erro ao remover modulo');
    await loadCourseContent();
  } catch (err: any) {
    contentError.value = err.message || 'Erro ao remover modulo';
  }
};

const createLesson = async (moduleId: string) => {
  const form = lessonForms.value[moduleId];
  if (!form || !form.title.trim()) {
    throw new Error('Informe o titulo da aula.');
  }

  contentError.value = '';

  try {
    const response = await apiFetch('/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId,
        title: form.title,
        order: Number(form.order) || 1,
        videoId: form.videoId || undefined,
        minWatchPercent:
          form.minWatchPercent === null || form.minWatchPercent === undefined
            ? undefined
            : Number(form.minWatchPercent),
      }),
    });

    const lesson = await handleResponse(response, 'Erro ao criar aula');
    await loadCourseContent();
    return lesson;
  } catch (err: any) {
    const message = err.message || 'Erro ao criar aula';
    contentError.value = message;
    throw new Error(message);
  }
};

const removeLesson = async (lessonId: string) => {
  const confirmed = window.confirm('Remover esta aula?');
  if (!confirmed) return;

  contentError.value = '';

  try {
    const response = await apiFetch(`/lessons/${lessonId}`, { method: 'DELETE' });
    await handleResponse(response, 'Erro ao remover aula');
    await loadCourseContent();
  } catch (err: any) {
    contentError.value = err.message || 'Erro ao remover aula';
  }
};

const createQuiz = async (moduleId: string) => {
  const form = quizForms.value[moduleId];
  if (!form || !form.title.trim()) {
    throw new Error('Informe o titulo da prova.');
  }

  contentError.value = '';

  try {
    const response = await apiFetch(`/quizzes/module/${moduleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        minScore: Number(form.minScore) || 0,
        attemptsAllowed: Number(form.attemptsAllowed) || 1,
      }),
    });

    await handleResponse(response, 'Erro ao criar prova');
    await loadCourseContent();
  } catch (err: any) {
    const message = err.message || 'Erro ao criar prova';
    contentError.value = message;
    throw new Error(message);
  }
};

const removeQuiz = async (quizId: string) => {
  const confirmed = window.confirm('Remover esta prova?');
  if (!confirmed) return;

  contentError.value = '';

  try {
    const response = await apiFetch(`/quizzes/${quizId}`, { method: 'DELETE' });
    await handleResponse(response, 'Erro ao remover prova');
    await loadCourseContent();
  } catch (err: any) {
    contentError.value = err.message || 'Erro ao remover prova';
  }
};

const openLessonModal = (moduleId: string) => {
  resetLessonForm(moduleId);
  activeLessonModuleId.value = moduleId;
  lessonModalError.value = '';
  showLessonModal.value = true;
};

const closeLessonModal = () => {
  showLessonModal.value = false;
  activeLessonModuleId.value = null;
  lessonModalVideoFile.value = null;
  lessonModalVideoFileKey.value += 1;
};

const submitLessonModal = async () => {
  if (!activeLessonModuleId.value) return;

  lessonModalError.value = '';
  try {
    const moduleId = activeLessonModuleId.value;
    const pendingFile = lessonModalVideoFile.value;
    const createdLesson = await createLesson(moduleId);
    closeLessonModal();

    if (createdLesson && pendingFile) {
      selectedVideoLesson.value = { moduleId, lesson: createdLesson };
      resetVideoUploadState();
      videoUploadFile.value = pendingFile;
      showVideoUploadModal.value = true;
      await uploadVideoForLesson();
    }
  } catch (err: any) {
    lessonModalError.value = err.message || 'Erro ao criar aula';
  }
};

const openQuizModal = (moduleId: string) => {
  resetQuizForm(moduleId);
  activeQuizModuleId.value = moduleId;
  quizModalError.value = '';
  showQuizModal.value = true;
};

const closeQuizModal = () => {
  showQuizModal.value = false;
  activeQuizModuleId.value = null;
};

const submitQuizModal = async () => {
  if (!activeQuizModuleId.value) return;

  quizModalError.value = '';
  try {
    await createQuiz(activeQuizModuleId.value);
    closeQuizModal();
  } catch (err: any) {
    quizModalError.value = err.message || 'Erro ao criar prova';
  }
};

const openQuestionsModal = async (quiz: any) => {
  activeQuizForQuestions.value = quiz;
  questionModalError.value = '';
  showQuestionsModal.value = true;
  await loadQuizQuestions(quiz.id);
};

const closeQuestionsModal = () => {
  showQuestionsModal.value = false;
  activeQuizForQuestions.value = null;
  quizQuestions.value = [];
  questionForm.value = {
    type: 'SINGLE_CHOICE',
    statement: '',
    optionsText: '',
    answersText: '',
    order: 1,
  };
};

const loadQuizQuestions = async (quizId: string) => {
  questionModalLoading.value = true;
  questionModalError.value = '';
  try {
    const response = await apiFetch(`/quizzes/${quizId}`);
    const quiz = await handleResponse(response, 'Erro ao carregar questoes');
    quizQuestions.value = quiz?.questions || [];
    questionForm.value = {
      type: 'SINGLE_CHOICE',
      statement: '',
      optionsText: '',
      answersText: '',
      order: (quizQuestions.value.length || 0) + 1,
    };
  } catch (err: any) {
    questionModalError.value = err.message || 'Erro ao carregar questoes';
  } finally {
    questionModalLoading.value = false;
  }
};

const submitQuestion = async () => {
  if (!activeQuizForQuestions.value) return;

  const options = questionForm.value.optionsText
    .split('\n')
    .map((opt) => opt.trim())
    .filter((opt) => opt.length > 0);

  const answers = questionForm.value.answersText
    .split('\n')
    .map((ans) => ans.trim())
    .filter((ans) => ans.length > 0);

  if (options.length === 0) {
    questionModalError.value = 'Informe ao menos uma opcao.';
    return;
  }

  if (answers.length === 0) {
    questionModalError.value = 'Informe ao menos uma resposta.';
    return;
  }

  questionModalError.value = '';

  try {
    const response = await apiFetch(`/quizzes/${activeQuizForQuestions.value.id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: questionForm.value.type,
        statement: questionForm.value.statement,
        options,
        answerKey: answers,
        order: Number(questionForm.value.order) || 1,
      }),
    });

    await handleResponse(response, 'Erro ao criar questao');
    await loadQuizQuestions(activeQuizForQuestions.value.id);
    await loadCourseContent();
  } catch (err: any) {
    questionModalError.value = err.message || 'Erro ao criar questao';
  }
};

const removeQuestion = async (questionId: string) => {
  if (!activeQuizForQuestions.value) return;
  const confirmed = window.confirm('Remover esta questao?');
  if (!confirmed) return;

  questionModalError.value = '';

  try {
    const response = await apiFetch(`/quizzes/questions/${questionId}`, {
      method: 'DELETE',
    });
    await handleResponse(response, 'Erro ao remover questao');
    await loadQuizQuestions(activeQuizForQuestions.value.id);
    await loadCourseContent();
  } catch (err: any) {
    questionModalError.value = err.message || 'Erro ao remover questao';
  }
};

const logout = () => {
  authStore.logout();
  router.push('/');
};

watch(videoPlayerUrl, async (url) => {
  if (url && showVideoPlayerModal.value) {
    console.log('Watcher detectou mudança na URL do player');

    // Aguarda o elemento estar disponível no DOM
    await nextTick();

    // Tenta múltiplas vezes se o elemento ainda não estiver disponível
    let attempts = 0;
    const maxAttempts = 10;

    while (!videoPlayerElement.value && attempts < maxAttempts) {
      console.log('Elemento de vídeo ainda não disponível, aguardando... (tentativa ' + (attempts + 1) + ')');
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (videoPlayerElement.value) {
      console.log('Elemento de vídeo encontrado, inicializando player');
      attachVideoPlayerSource();
    } else {
      console.error('Elemento de vídeo não encontrado após ' + maxAttempts + ' tentativas');
      videoPlayerError.value = 'Erro ao inicializar player: elemento de vídeo não encontrado';
    }
  }
});

watch(showVideoPlayerModal, (visible) => {
  if (!visible) {
    destroyVideoPlayerInstance();
  }
});

onBeforeUnmount(() => {
  destroyVideoPlayerInstance();
});

onMounted(async () => {
  await reloadAll();
});

watch(
  () => route.params.id,
  async () => {
    await reloadAll();
  },
);
</script>
