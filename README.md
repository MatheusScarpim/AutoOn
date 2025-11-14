# AutoOn EAD - Plataforma de Ensino para Autoescola

Plataforma completa de EAD para autoescolas com streaming HLS, quizzes, certificados e relatórios.

## Arquitetura do Projeto

Este é um monorepo usando **pnpm workspaces** e **Turborepo** com a seguinte estrutura:

```
autoon-ead/
├── apps/
│   ├── api/          # Backend NestJS + TypeScript + Prisma + PostgreSQL
│   └── web/          # Frontend Vue 3 + Vite + TypeScript + Tailwind
├── packages/
│   ├── config/       # Configurações compartilhadas (ESLint, TypeScript)
│   ├── types/        # Tipos TypeScript compartilhados (DTOs, entidades)
│   ├── utils/        # Utilitários compartilhados
│   └── ui/           # Componentes Vue compartilhados (futuro)
└── infra/
    └── docker/       # Docker Compose para ambiente de desenvolvimento
```

## Stack Tecnológica

### Backend
- **Framework**: NestJS (escolhido por ter arquitetura modular, decorators, injeção de dependências nativa e OpenAPI integrado)
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL (escolhido por ser relacional, ACID compliant, suportar transações complexas e ter excelente performance)
- **ORM**: Prisma (type-safety, migrations automáticas, dev experience superior)
- **Autenticação**: JWT + Passport
- **Validação**: Zod + class-validator
- **Filas**: BullMQ + Redis
- **Storage**: MinIO (S3-compatible)
- **Transcodificação**: FFmpeg
- **Logs**: Pino

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Build**: Vite
- **Linguagem**: TypeScript
- **Roteamento**: Vue Router
- **Estado**: Pinia
- **Estilo**: Tailwind CSS
- **Player HLS**: hls.js

### Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Cache/Filas**: Redis
- **Storage de objetos**: MinIO
- **Banco de dados**: PostgreSQL

## Pré-requisitos

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Docker** e **Docker Compose**

## Instalação e Setup

### 1. Instalar pnpm (se não tiver)

```bash
npm install -g pnpm@8.15.4
```

### 2. Clonar o repositório e instalar dependências

```bash
cd AutoOn
pnpm install
```

### 3. Configurar variáveis de ambiente

#### Backend (`apps/api/.env`)

```env
# Database
DATABASE_URL="postgresql://autoon:autoon123@localhost:5432/autoon?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# MinIO (S3)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_UPLOADS="uploads"
MINIO_BUCKET_VIDEOS="videos"
MINIO_BUCKET_CERTIFICATES="certificates"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# App
PORT=3000
NODE_ENV="development"
API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"

# Upload
MAX_FILE_SIZE=5368709120  # 5GB em bytes
MULTIPART_CHUNK_SIZE=10485760  # 10MB em bytes

# HLS
HLS_URL_EXPIRY_SECONDS=300  # 5 minutos

# FFmpeg
FFMPEG_PATH="/usr/bin/ffmpeg"
FFPROBE_PATH="/usr/bin/ffprobe"
```

#### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME="AutoOn EAD"
```

### 4. Subir a infraestrutura

#### Opção A: Com Docker (Recomendado para começar)

```bash
# Subir PostgreSQL, MinIO e Redis
docker compose up -d

# Verificar logs
docker compose logs -f

# Verificar status dos containers
docker compose ps
```

**Acessos:**
- PostgreSQL: `localhost:5432` (user: autoon, pass: autoon123)
- MinIO Console: `http://localhost:9001` (user: minioadmin, pass: minioadmin)
- MinIO API: `http://localhost:9000`
- Redis: `localhost:6379`

#### Opção B: Sem Docker (Serviços Cloud)

**Veja o guia completo:** [SETUP_SEM_DOCKER.md](SETUP_SEM_DOCKER.md)

Resumo rápido:
1. **PostgreSQL**: Use [Neon](https://neon.tech) ou [Supabase](https://supabase.com) (free)
2. **Redis**: Use [Upstash](https://upstash.com) (free)
3. **Storage**: Use [Cloudflare R2](https://cloudflare.com/products/r2) ou MinIO local
4. Configure as credenciais no `.env`

### 5. Configurar banco de dados (Prisma)

```bash
# Gerar Prisma Client
pnpm --filter @autoon/api prisma:generate

# Rodar migrations
pnpm db:migrate

# (Opcional) Popular banco com dados de exemplo
pnpm db:seed
```

### 6. Configurar buckets no MinIO

Acesse o MinIO Console em `http://localhost:9001` e crie os buckets:

1. Faça login com `minioadmin` / `minioadmin`
2. Vá em "Buckets" → "Create Bucket"
3. Crie os seguintes buckets:
   - `uploads` (para vídeos originais)
   - `videos` (para HLS processado)
   - `certificates` (para PDFs de certificados)
4. Configure acesso público de leitura (ou mantenha privado com URLs assinadas)

### 7. Iniciar aplicação em modo desenvolvimento

```bash
# Iniciar tudo (API + Web) em paralelo
pnpm dev
```

Ou iniciar separadamente:

```bash
# Apenas API
pnpm --filter @autoon/api dev

# Apenas Web
pnpm --filter @autoon/web dev
```

**Aplicação rodando:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Swagger/OpenAPI: `http://localhost:3000/api/docs`

## Scripts Disponíveis

### Raiz do projeto

```bash
pnpm dev              # Inicia API e Web em modo dev
pnpm build            # Builda todos os projetos
pnpm lint             # Roda linting em todos os projetos
pnpm test             # Roda testes de todos os projetos
pnpm db:migrate       # Roda migrations do Prisma
pnpm db:seed          # Popula banco com dados iniciais
```

### Backend (@autoon/api)

```bash
pnpm --filter @autoon/api dev              # Modo desenvolvimento com hot-reload
pnpm --filter @autoon/api build            # Build para produção
pnpm --filter @autoon/api start            # Inicia servidor em produção
pnpm --filter @autoon/api db:migrate       # Migrations do Prisma
pnpm --filter @autoon/api db:seed          # Seed do banco
pnpm --filter @autoon/api db:studio        # Abre Prisma Studio
pnpm --filter @autoon/api prisma:generate  # Gera Prisma Client
```

### Frontend (@autoon/web)

```bash
pnpm --filter @autoon/web dev          # Servidor de desenvolvimento Vite
pnpm --filter @autoon/web build        # Build para produção
pnpm --filter @autoon/web preview      # Preview do build de produção
pnpm --filter @autoon/web lint         # Linting
pnpm --filter @autoon/web type-check   # Verificação de tipos TypeScript
```

## Estrutura do Backend (NestJS)

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/           # Autenticação JWT, login, registro
│   │   ├── users/          # Gestão de usuários
│   │   ├── courses/        # CRUD de cursos
│   │   ├── modules/        # Módulos dos cursos
│   │   ├── lessons/        # Aulas (com vídeos)
│   │   ├── videos/         # Upload, transcodificação, streaming
│   │   ├── enrollments/    # Matrículas e progresso
│   │   ├── quizzes/        # Quizzes e avaliações
│   │   ├── certificates/   # Geração de certificados PDF
│   │   ├── reports/        # Relatórios e analytics
│   │   └── audit/          # Logs de auditoria (LGPD)
│   ├── common/             # Guards, decorators, interceptors
│   ├── config/             # Configurações da aplicação
│   └── main.ts
├── prisma/
│   ├── schema.prisma       # Schema do banco de dados
│   ├── migrations/         # Migrations
│   └── seed.ts             # Dados iniciais
└── test/
```

## Estrutura do Frontend (Vue 3)

```
apps/web/
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── common/         # Botões, inputs, modais
│   │   ├── player/         # Player HLS customizado
│   │   └── layout/         # Header, sidebar, footer
│   ├── views/              # Páginas/rotas
│   │   ├── public/         # Home, login, cursos públicos
│   │   ├── student/        # Dashboard aluno, player, progresso
│   │   └── admin/          # Dashboard admin/instrutor
│   ├── stores/             # Pinia stores (auth, courses, etc)
│   ├── router/             # Configuração de rotas
│   ├── services/           # API clients
│   ├── composables/        # Composables Vue
│   └── main.ts
└── public/
```

## Funcionalidades Principais

### 1. Gestão de Cursos
- ✅ CRUD completo de cursos, módulos e aulas
- ✅ Sistema de ordenação drag & drop
- ✅ Upload de imagens de capa
- ✅ Publicação e arquivamento

### 2. Upload e Streaming de Vídeos
- ✅ Upload multipart para arquivos grandes (até 5GB)
- ✅ Barra de progresso em tempo real
- ✅ Transcodificação assíncrona para HLS (FFmpeg)
- ✅ Múltiplas resoluções (1080p, 720p, 480p)
- ✅ Geração automática de thumbnails
- ✅ URLs assinadas com expiração (5 min)
- ✅ Player HLS com controles customizados

### 3. Progresso e Trilha de Aprendizagem
- ✅ Tracking de tempo assistido (heartbeat)
- ✅ Bloqueio de próxima aula por % mínima
- ✅ Salvamento de posição do vídeo
- ✅ Indicadores visuais de progresso

### 4. Avaliações (Quizzes)
- ✅ Criação de quizzes por módulo
- ✅ Questões objetivas (múltipla escolha)
- ✅ Nota mínima configurável
- ✅ Múltiplas tentativas (configurável)
- ✅ Feedback imediato

### 5. Certificados
- ✅ Geração automática em PDF
- ✅ Código de verificação único
- ✅ Validação pública de autenticidade
- ✅ Download seguro

### 6. Relatórios
- ✅ Tempo assistido por aluno/curso
- ✅ Taxa de conclusão
- ✅ Notas e tentativas de quizzes
- ✅ Retenção por vídeo
- ✅ Engajamento geral

### 7. LGPD e Segurança
- ✅ Consentimento de dados no registro
- ✅ Política de privacidade
- ✅ Logs de auditoria
- ✅ Senhas com bcrypt
- ✅ Rate limiting
- ✅ CORS configurado

### 8. Papéis e Permissões
- ✅ **Admin**: acesso total
- ✅ **Instrutor**: criar/editar cursos e conteúdo
- ✅ **Aluno**: acessar cursos matriculados

## Justificativa das Escolhas Tecnológicas

### Por que NestJS?
- **Arquitetura modular**: facilita escalabilidade e manutenção
- **TypeScript nativo**: type-safety em todo código
- **Decorators e DI**: código mais limpo e testável
- **OpenAPI integrado**: documentação automática da API
- **Ecossistema maduro**: suporte a Prisma, JWT, BullMQ, etc.

### Por que PostgreSQL?
- **Relacional**: dados estruturados (cursos, módulos, usuários)
- **ACID compliant**: garante integridade de dados
- **Transações**: essencial para matrículas, certificados
- **Performance**: índices, queries complexas
- **Extensões**: suporte a JSON, full-text search

### Por que Prisma?
- **Type-safety**: tipagem automática do schema
- **Migrations**: versionamento do banco
- **Dev experience**: Prisma Studio, autocomplete
- **Performance**: query optimization automática

## Troubleshooting

### Erro ao conectar no banco
- Verifique se o Docker está rodando: `docker compose ps`
- Confira as credenciais no `.env`
- Rode: `docker compose logs postgres`

### Erro ao fazer upload
- Verifique se o MinIO está rodando
- Confira se os buckets foram criados
- Verifique permissões dos buckets

### Erro de transcodificação
- Verifique se o Redis está rodando (filas)
- Confira logs do worker: `pnpm --filter @autoon/api dev`
- Verifique se o FFmpeg está instalado no container

### Porta já em uso
- Altere as portas no `docker-compose.yml` e nos `.env`
- Ou pare o serviço que está usando a porta

## Roadmap / Próximos Passos

- [ ] Implementar UI packages compartilhados
- [ ] Adicionar testes e2e
- [ ] Implementar webhooks para eventos
- [ ] Suporte a legendas WebVTT
- [ ] Export CSV de relatórios
- [ ] Tema claro/escuro
- [ ] i18n (internacionalização)
- [ ] Notificações em tempo real (WebSockets)
- [ ] Integração com Keycloak (SSO)

## Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-feature`
2. Commit: `git commit -m 'feat: adiciona nova feature'`
3. Push: `git push origin feature/nova-feature`
4. Abra um Pull Request

## Licença

MIT

---

Feito com ❤️ para autoescolas
