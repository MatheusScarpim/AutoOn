Prompt para Claude

Quero que você gere um sistema completo tipo plataforma EAD para autoescola (cursos com vídeo-aulas), em monorepo, com frontend em Vue 3 + Vite e backend em Node.js (TypeScript). O banco de dados fica a sua escolha; justifique a escolha e entregue a infra de desenvolvimento com Docker Compose. Priorize código limpo e documentação clara.

Escopo geral

Plataforma para cursos de autoescola com:

Cursos → Módulos → Aulas (vídeos).

Upload de vídeos (arquivos grandes), transcodificação para HLS (.m3u8), geração de thumbnails e legendas (se fornecidas).

Stream seguro (URLs assinadas/expirão; sem download fácil).

Player de vídeo no front (HLS; use hls.js somente quando necessário).

Trilhas de progresso, bloqueio de próxima aula até assistir tempo mínimo (configurável).

Avaliações/Quizzes por módulo (objetivas), nota mínima, tentativa múltipla configurável.

Certificado (PDF) ao concluir curso (dados do aluno + carga horária + código de verificação).

Papéis: admin, instrutor, aluno.

Paginação/Busca/Ordenação.

Relatórios: tempo assistido, conclusão, notas, engajamento por vídeo.

Acessibilidade: legendas, velocidade, atalhos de teclado do player.

LGPD-ready: consentimento, política, logs de acesso.

Monorepo

Use pnpm workspaces e Turborepo (ou equivalente) para tarefas e cache.

Estrutura esperada:

/apps
  /web      -> Vue 3 + Vite (TypeScript), Vue Router, Pinia, Tailwind opcional
  /api      -> Node + TypeScript (Express ou Nest; sua escolha, justifique)
/packages
  /ui       -> componentes compartilhados (botões, player wrapper, tabelas)
  /config   -> eslint, tsconfig, prettier compartilhados
  /types    -> tipos compartilhados (DTOs/entidades)
  /utils    -> helpers (ex.: assinatura de URL, formatação)
/infra
  /docker   -> docker-compose.dev.yml (db, minio/s3, redis, ffmpeg)
  /migrations -> migrações/seed


Scripts raiz:

pnpm i, pnpm build, pnpm dev, pnpm lint, pnpm test, pnpm generate:cert (para certificado de desenvolvimento do player se necessário).

Docker Compose (dev) com serviços:

DB (o que você escolher), MinIO (S3-compatível) p/ armazenar originais e HLS, Redis (fila/background jobs), API, FFmpeg (no container da API ou job worker).

Volumes nomeados e networks.

Make os README com docker compose up -d e .env.example para todos.

Backend (Node + TS)

Escolha Express + Zod/Valibot ou NestJS. Justifique.

Autenticação & Autorização:

JWT (access + refresh), senhas com bcrypt, RBAC por decorators/middlewares.

Preparar integração opcional com Keycloak via OIDC (documente como ativar depois).

Upload de vídeo grande:

Implementar multipart S3 (MinIO) com resumo/retomada (presigned URLs por parte).

Alternativa: endpoint de upload chunked (se preferir), mas priorize multipart S3.

Persistir estado de upload (iniciado, partes, completado).

Transcodificação:

Job assíncrono com fila (BullMQ em Redis, por exemplo):

Baixa o arquivo original do bucket uploads/originals.

FFmpeg → gera HLS (qualidade 1080p/720p/480p com ladder simples) + thumbnails.

Publica resultado em videos/<videoId>/hls/*.

Atualiza status do vídeo (processing → ready/error).

Proteção do streaming:

Endpoint que devolve URL assinada temporária do .m3u8 e dos segments (.ts/.m4s).

Checagem de matrícula do aluno no curso e restrições (tempo mínimo p/ liberar próxima aula).

Domínio & entidades principais:

User {id, name, email, passwordHash, role, createdAt}

Course {id, title, description, coverImage, workloadHours, isPublished, createdBy, createdAt}

Module {id, courseId, title, order}

Lesson {id, moduleId, title, order, videoId, minWatchPercent}

Video {id, originalKey, hlsKeyPrefix, durationSec, status, sizeBytes, thumbnails[], subtitles[]}

Enrollment {id, userId, courseId, progressPercent, completedAt}

LessonProgress {id, enrollmentId, lessonId, watchedSeconds, lastPositionSec, completedAt}

Quiz {id, moduleId, title, minScore, attemptsAllowed}

Question {id, quizId, type, statement, options[], answerKey}

Attempt {id, quizId, enrollmentId, score, startedAt, finishedAt, answers[]}

Certificate {id, enrollmentId, code, issuedAt, pdfKey}

AuditLog {id, userId, action, entity, entityId, meta, at}

Banco de dados:

Escolha e justifique (ex.: PostgreSQL + Prisma).

Se relacional, entregue schema Prisma completo e migrações; se NoSQL, entregue coleções e índices.

API (REST) documentada com OpenAPI/Swagger:

Auth: /auth/register, /auth/login, /auth/refresh, /auth/me.

Cursos:

Admin/Instrutor: POST/PUT/PATCH/DELETE /courses, POST /courses/:id/publish, upload capa.

Público/Aluno: GET /courses?query=&page=&pageSize=, GET /courses/:id, GET /courses/:id/modules.

Módulos/Aulas:

CRUD módulos/aulas (restrito a instrutor/admin), ordenação por order.

POST /lessons/:id/video/initiate-upload (retorna dados p/ multipart),
POST /lessons/:id/video/complete-upload → cria job de transcoding.

GET /lessons/:id/stream → retorna URL(s) assinada(s) HLS.

Progresso:

POST /progress/heartbeat (body: lessonId, positionSec, watchedDeltaSec) → salva progresso.

GET /enrollments/:courseId → progresso do curso; POST /enrollments/:courseId (matricular).

Quizzes:

CRUD de quiz/perguntas (instrutor/admin).

POST /quizzes/:id/start, POST /quizzes/:id/submit.

Certificados:

POST /courses/:id/certificate (se requisitos batidos) → gera PDF (usar pdf-lib ou puppeteer),
salva em S3 e retorna code verificável.

GET /certificates/verify/:code.

Relatórios:

GET /reports/course/:id/engagement, GET /reports/video/:id/retention.

Admin:

GET /admin/users, GET /admin/audit-logs, GET /admin/storage/usage.

Boas práticas:

Validação com Zod/DTOs, tratador global de erros, logs estruturados (pino/winston), rate-limit e CORS, testes unitários chaves.

Frontend (Vue 3 + Vite + TS)

Stack: Vue Router, Pinia, Fetch API (sem libs HTTP externas), Tailwind opcional.

Páginas:

Público: Home (lista cursos), Curso (detalhe), Login/Registro.

Aluno: Meus cursos, Player da aula (com trilha lateral), Progresso em tempo real, Quiz, Certificado.

Instrutor/Admin: CRUD cursos/módulos/aulas (drag & drop de ordem), upload de vídeo com barra de progresso (multipart), status de processamento, criação de quizzes, relatórios e auditoria.

Player HLS:

Usar <video> nativo; integrar hls.js apenas se necessário para Safari/desktop.

Controles: velocidade, legendas, “pular 10s”, lembrar posição (persistir com heartbeat no backend).

UX de upload:

Selecionar arquivo → criar upload multipart → enviar partes em paralelo (tamanho de parte configurável) → completar → mostrar status “Processando” → polling do status até “Pronto”.

Acessibilidade e i18n (pt-BR padrão; estrutura pronta p/ i18n).

Estados & Tipos compartilhados via /packages/types.

Segurança & LGPD

Fluxo de consentimento e política de privacidade (checkbox no registro).

Minimizar PII; criptografar secrets; .env.example completo.

URLs assinadas curtas (ex.: 5 minutos).

Auditoria para ações críticas (login, upload, publicar curso, emitir certificado).

Infra e DevEx

Docker Compose para subir stack local (db, minio, redis, api, web).

Seed inicial: usuário admin, um curso de exemplo, e um vídeo pequeno de exemplo (ou script para gerar dummy via FFmpeg).

Scripts prontos: pnpm dev (web+api), pnpm db:migrate, pnpm db:seed.

README.md raiz com:

Requisitos, setup (pnpm, Node versão), .env de cada app, comandos de desenvolvimento e build.

Como configurar buckets/credenciais MinIO, chaves JWT, e URL base.

Como trocar o banco (se optar por outro).

Critérios de aceite

docker compose up -d + pnpm dev deixam web e api acessíveis.

Consigo criar curso, módulo, aula, fazer upload de vídeo grande, e assistir via HLS no front.

Progresso é salvo enquanto assisto; próxima aula bloqueada até % mínima.

Quiz funciona com nota mínima; certificado gera PDF com código verificável.

Documentação OpenAPI disponível; README ensina tudo.

Justifique a escolha do banco de dados e da stack do backend (Express vs Nest), incluindo trade-offs.

Extras (se der tempo)

Webhooks para finalizar transcodificação.

Suporte a subtítulos WebVTT no player.

Export CSV de relatórios.

Tema claro/escuro.

Entregue o código completo no formato de monorepo, com comentários, testes básicos, OpenAPI, migrações/seed e README detalhado. Foque em soluções simples e robustas (sem overengineering), mas com upload resiliente e streaming HLS funcionando.