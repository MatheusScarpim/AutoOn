# AutoOn EAD - Plataforma de Ensino para Autoescola

Plataforma completa de EAD para autoescolas com streaming HLS, quizzes, certificados e relatórios.

## 🚀 Início Rápido

Quer começar agora? Em **3 comandos** você tem tudo rodando:

```bash
# 1. Copiar variáveis de ambiente
cp .env.example .env

# 2. Subir tudo com Docker
docker compose up -d

# 3. Aguardar inicialização (1-2 min) e acessar
# Frontend: http://localhost:5173
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

**Primeira vez usando Docker?** Veja o [Guia de Início Rápido completo](QUICKSTART.md) com explicações passo a passo.

**Precisa rebuildar?** Se você já rodou antes e está tendo problemas:
```bash
docker compose down
docker compose up -d --build
```

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
- **Storage**: Azure Blob Storage
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
- **Storage de objetos**: Azure Blob Storage
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

# Storage (Azure Blob)
STORAGE_PROVIDER="AZURE"
AZURE_STORAGE_ACCOUNT="your-storage-account"
AZURE_STORAGE_KEY="your-storage-key"
AZURE_STORAGE_CONTAINER="autoon-videos"
AZURE_STORAGE_ENDPOINT_SUFFIX="core.windows.net"
AZURE_STORAGE_ENDPOINT="https://your-storage-account.blob.core.windows.net"
AZURE_UPLOAD_URL_TTL_SECONDS=3600
AZURE_AUTO_CONFIGURE_CORS=true
AZURE_CORS_ALLOWED_ORIGINS="http://localhost:5173"
AZURE_CORS_ALLOWED_METHODS="GET,HEAD,PUT,POST,DELETE,OPTIONS"
AZURE_CORS_ALLOWED_HEADERS="*"
AZURE_CORS_EXPOSED_HEADERS="*"
AZURE_CORS_MAX_AGE=3600

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

#### Opção A: Com Docker Compose (Recomendado - Tudo junto)

Esta opção sobe **TODOS** os serviços necessários em containers Docker: PostgreSQL, Redis, API (backend) e Web (frontend), enquanto o Azure Blob Storage é consumido através das credenciais definidas no `.env`.

```bash
# 1. Copiar o arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# 2. (Opcional) Editar o .env com suas preferências (incluindo as credenciais do Azure Storage)
# Você pode manter os valores padrão para desenvolvimento local

# 3. Subir todos os serviços (PostgreSQL, Redis, API e Web)
docker compose up -d

# 4. Acompanhar os logs de todos os serviços
docker compose logs -f

# 5. Verificar status dos containers
docker compose ps
```

**O que acontece:**
- ✅ PostgreSQL é iniciado e cria o banco `autoon`
- ✅ Redis é iniciado com senha configurada
- ✅ Azure Blob Storage é configurado via credenciais e o container é criado automaticamente
- ✅ API (backend) é buildada, aguarda o banco ficar pronto e inicia
- ✅ Web (frontend) é buildada e servida via Nginx

**Acessos após inicialização:**
- **Frontend**: `http://localhost:5173` (porta pode ser alterada no .env via WEB_PORT)
- **Backend API**: `http://localhost:3000` (porta pode ser alterada no .env via API_PORT)
- - **Swagger/OpenAPI**: `http://localhost:3000/api/docs`
- - **Azure Blob Storage**: acesse `https://<sua-conta>.blob.core.windows.net/<container>` ou use o [Azure Storage Explorer](https://learn.microsoft.com/azure/storage/common/storage-explorer)
- **PostgreSQL**: `localhost:5432` (user: autoon, pass: autoon123, db: autoon)
- **Redis**: `localhost:6379` (password: redis123)

**Comandos úteis do Docker Compose:**

```bash
# Parar todos os serviços (mas manter os volumes/dados)
docker compose stop

# Reiniciar todos os serviços
docker compose restart

# Ver logs de um serviço específico
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres

# Parar e remover containers (volumes/dados são mantidos)
docker compose down

# Parar, remover containers E remover volumes (apaga os dados!)
docker compose down -v

# Recriar apenas um serviço
docker compose up -d --build api

# Executar comando dentro de um container
docker compose exec api sh
docker compose exec postgres psql -U autoon -d autoon
```

#### Opção B: Docker apenas para infraestrutura (Dev local)

Se você prefere rodar a API e o Web localmente (com hot-reload) e usar Docker apenas para os serviços de infraestrutura:

```bash
# 1. Subir apenas PostgreSQL e Redis
docker compose up -d postgres redis

# 2. Configurar variáveis de ambiente para desenvolvimento local (incluindo as credenciais do Azure Storage)
# Copie apps/api/.env.example para apps/api/.env
# Copie apps/web/.env para definir VITE_API_URL=http://localhost:3000

# 3. Rodar migrações do banco
pnpm db:migrate

# 4. (Opcional) Popular banco com dados de exemplo
pnpm db:seed

# 5. Iniciar API e Web em modo desenvolvimento
pnpm dev
```

**Acessos nesta opção:**
- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend API**: `http://localhost:3000`
- Demais serviços: mesmos da Opção A

#### Opção C: Sem Docker (Serviços Cloud)

Se não quiser usar Docker, use serviços em cloud gratuitos:

1. **PostgreSQL**: Use [Neon](https://neon.tech), [Supabase](https://supabase.com) ou [Railway](https://railway.app) (free tier)
2. **Redis**: Use [Upstash](https://upstash.com) (free tier com 10k commands/dia)
3. **Storage**: Use [Azure Blob Storage](https://azure.microsoft.com/services/storage/blobs/) ou [Cloudflare R2](https://cloudflare.com/products/r2) (10GB free)
4. Configure as credenciais nos arquivos `.env`
5. Rode `pnpm dev` para iniciar a aplicação

### 5. Configurar banco de dados (Prisma)

**Se estiver usando a Opção A (Docker Compose completo):**
As migrações são rodadas automaticamente quando a API inicia. Você não precisa fazer nada!

**Se estiver usando a Opção B ou C:**

```bash
# Gerar Prisma Client
pnpm --filter @autoon/api prisma:generate

# Rodar migrations
pnpm db:migrate

# (Opcional) Popular banco com dados de exemplo
pnpm db:seed
```

**Para rodar comandos do Prisma dentro do container Docker:**

```bash
# Gerar Prisma Client no container
docker compose exec api pnpm prisma:generate

# Rodar migrations no container
docker compose exec api pnpm db:migrate

# Popular banco com seed no container
docker compose exec api pnpm db:seed

# Abrir Prisma Studio (GUI para visualizar/editar dados)
docker compose exec api pnpm db:studio
```

### 6. Azure Blob Storage

O backend cria o container configurado em `AZURE_STORAGE_CONTAINER` automaticamente quando o `StorageService` inicia. Também aplicamos as regras de CORS definidas nas variáveis `AZURE_CORS_*`, a menos que `AZURE_AUTO_CONFIGURE_CORS=false`.

Se quiser inspecionar os blobs localmente, abra o [Azure Storage Explorer](https://learn.microsoft.com/azure/storage/common/storage-explorer) ou o portal do Azure na seção **Storage Accounts > Containers** para o container escolhido. Você ainda pode criar pastas (`videos`, `thumbnails`, `certificates`) manualmente ou deixar o serviço criá-las no primeiro upload.

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
- Verifique se o Azure Blob Storage está acessível (credenciais e container)
- Confira se o container definido em `AZURE_STORAGE_CONTAINER` existe e as regras de CORS permitem o domínio
- Verifique permissões dos blobs/carpetas no Azure

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
