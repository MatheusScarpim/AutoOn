# AutoOn Web Experience

Frontend Vue 3 desenhado para conversar diretamente com as rotas existentes do backend NestJS. Tudo foi pensado para o contexto de autoescolas: layout inspirado em pistas, player HLS com heartbeat e paineis que exibem o que realmente chega da API.

## Stack

- Vue 3 (Composition API) + Vite + TypeScript  
- Pinia para sessao/autenticacao  
- Vue Router com guards baseados em role (`ADMIN`, `INSTRUCTOR`, `STUDENT`)  
- TailwindCSS customizado com gradientes que remetem a faixas de asfalto  
- hls.js para streaming das aulas em `/videos/:id/stream`  
- Fetch wrapper proprio (`src/services/http.ts`) para lidar com JSON, query params e erros padronizados

## Setup rapido

```bash
cd apps/web
cp .env.example .env        # configure VITE_API_URL apontando para NestJS
pnpm install                # ja executado no monorepo
pnpm dev
```

Variaveis importantes:

```
VITE_API_URL=http://localhost:3000
VITE_APP_NAME="AutoOn EAD"
```

## Paginas e rotas

| Rota | Descricao | Rotas da API utilizadas |
| ---- | --------- | ----------------------- |
| `/` | Landing page moderna com cards descrevendo `/courses`, `/enrollments`, `/progress` e `/certificates`. | `GET /courses?published=true` |
| `/login` / `/registrar` | Form hibrido que chama `/auth/login`, `/auth/register` e guarda tokens na Pinia. | `POST /auth/login`, `POST /auth/register` |
| `/dashboard` | Painel do aluno com cards, cursos ativos via `/enrollments/my-courses`, certificados e heartbeat. | `GET /enrollments/my-courses`, `GET /certificates/my-certificates`, `GET /reports/student/:id`, `POST /certificates/:id/download`, `GET /certificates/verify/:code` |
| `/catalogo` | Lista real dos cursos com filtros, ordenacao e matricula direta. | `GET /courses`, `POST /enrollments/:courseId` |
| `/cursos/:id` | Detalha modulos, aulas e progresso do curso. | `GET /courses/:id`, `GET /enrollments/:courseId`, `GET /progress/course/:courseId/unlocked`, `POST /certificates/course/:courseId/generate` |
| `/cursos/:courseId/aulas/:lessonId` | Player HLS com heartbeat em tempo real e conclusao da aula. | `GET /lessons/:id`, `GET /videos/:id/stream`, `GET /progress/lesson/:id`, `POST /progress/heartbeat`, `POST /progress/lesson/:id/complete` |
| `/quizzes/:quizId` | Formulario dinamico que envia respostas para `/quizzes/:id/submit`. | `GET /quizzes/:id`, `POST /quizzes/:id/start`, `POST /quizzes/:id/submit` |
| `/certificados` | Lista com download e verificacao publica. | `GET /certificates/my-certificates`, `GET /certificates/:id/download`, `GET /certificates/verify/:code` |
| `/admin` | Visao macro usando `/admin/stats` e relatorio de engajamento por curso. | `GET /admin/stats`, `GET /courses`, `GET /reports/course/:id/engagement` |

## Componentes reutilizaveis

- `AppShell`: layout com sidebar, header responsivo, status da API e botoes rapidos.  
- `StatCard`: widgets usados no dashboard e admin com suporte a icone, tendencia e diferentes accents.  
- `CourseCard`: resume curso, progresso e CTA para matricula ou acesso.  
- `services/http.ts`: funcoes auxiliares para consumir o backend (query string, headers, erros).  
- `stores/auth.ts`: encapsula login, refresh, persistencia em `localStorage` e expande as iniciais do usuario para o avatar.

## Fluxos de destaque

1. **Autenticacao**  
   - `useAuthStore` chama `/auth/login` e `/auth/register`, salva tokens e expoe `isAuthenticated`.  
   - Router guard (meta `requiresAuth` e `roles`) bloqueia acesso sem o token.  
   - `main.ts` hidrata a sessao antes de montar o app e tenta sincronizar `/auth/me`.

2. **Matricula e progresso**  
   - Catalogo envia `POST /enrollments/:courseId`.  
   - Dashboard e curso consomem `/enrollments/my-courses` e `/enrollments/:courseId` para mostrar as aulas e progresso.  
   - Player envia heartbeat a cada 15s em `/progress/heartbeat` e permite marcar conclusao.

3. **Streaming**  
   - `LessonPlayerView` integra `hls.js` com as URLs assinadas de `/videos/:id/stream`.  
   - Reposiciona o video na ultima posicao retornada por `/progress/lesson/:id`.

4. **Certificados e quizzes**  
   - Certificados listados/baixados via `/certificates/my-certificates` e `/certificates/:id/download`.  
   - Verificacao publica usando `/certificates/verify/:code`.  
   - Quizzes pegam perguntas reais em `/quizzes/:id`, criam tentativa com `/quizzes/:id/start` e submetem para correcao.

## Estilo

O tema foi inspirado em pistas noturnas: gradientes azul escuro, linhas amarelas (classe `road-badge`) e cards translúcidos (`glass-panel`). Tailwind foi configurado para permitir esses utilitarios e o CSS global cria o background quadriculado com faixas centrais.

## Scripts

```bash
pnpm dev          # modo desenvolvimento
pnpm build        # build de producao
pnpm preview      # visualizar build
pnpm lint         # lint (usa configuracao compartilhada do monorepo)
```

## Proximos passos sugeridos

1. Implementar drag & drop para reordenar modulos e aulas (`POST /modules/course/:id/reorder`).  
2. Criar tabela de auditoria consumindo `/admin/audit-logs`.  
3. Habilitar tema claro/escuro com base no roadmap do README raiz.  
4. Adicionar testes e2e simulando matricula completa (login → curso → quiz → certificado).
