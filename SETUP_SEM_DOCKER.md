# Setup sem Docker - AutoOn EAD

Guia para rodar o projeto **sem usar Docker**, com serviços em cloud ou instalados localmente.

## Pré-requisitos

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **PostgreSQL** (local ou cloud)
- **Redis** (local ou cloud)
- **MinIO** ou **AWS S3** (para storage)
- **FFmpeg** (opcional, para transcodificação de vídeos)

---

## 1. Instalar dependências

```bash
pnpm install
```

---

## 2. Configurar PostgreSQL

### Opção A: PostgreSQL Local

1. Instale PostgreSQL: https://www.postgresql.org/download/
2. Crie um banco de dados:
```sql
CREATE DATABASE autoon;
CREATE USER autoon WITH PASSWORD 'autoon123';
GRANT ALL PRIVILEGES ON DATABASE autoon TO autoon;
```

### Opção B: PostgreSQL Cloud (Recomendado)

Use um serviço gratuito:
- **Supabase**: https://supabase.com (Free tier com 500MB)
- **Neon**: https://neon.tech (Free tier ilimitado)
- **ElephantSQL**: https://www.elephantsql.com (Free 20MB)

Copie a `DATABASE_URL` fornecida.

---

## 3. Configurar Redis

### Opção A: Redis Local

1. Instale Redis: https://redis.io/download
2. Inicie o servidor:
```bash
redis-server
```

### Opção B: Redis Cloud (Recomendado)

Use um serviço gratuito:
- **Upstash**: https://upstash.com (Free 10K commands/day)
- **Redis Cloud**: https://redis.com/try-free (Free 30MB)

Copie o `REDIS_HOST`, `REDIS_PORT` e `REDIS_PASSWORD`.

---

## 4. Configurar Storage (MinIO ou S3)

### Opção A: MinIO Local

1. Baixe MinIO: https://min.io/download
2. Inicie o servidor:
```bash
minio server ./data --console-address ":9001"
```
3. Acesse http://localhost:9001
4. Crie os buckets: `uploads`, `videos`, `certificates`

### Opção B: MinIO Cloud (Recomendado para dev)

1. Crie conta em https://min.io/cloud
2. Crie um bucket
3. Copie `Access Key` e `Secret Key`

### Opção C: AWS S3

1. Crie conta AWS
2. Crie bucket S3
3. Crie IAM user com permissões S3
4. Copie credentials

---

## 5. Configurar variáveis de ambiente

### Backend

```bash
cp apps/api/.env.local.example apps/api/.env
```

Edite `apps/api/.env` com suas credenciais:

```env
# PostgreSQL (exemplo Neon)
DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Redis (exemplo Upstash)
REDIS_HOST="your-redis.upstash.io"
REDIS_PORT=6379
REDIS_PASSWORD="your-password"

# Storage
STORAGE_PROVIDER="S3" # ou "AZURE"

# MinIO/S3
S3_ENDPOINT="play.min.io"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_BUCKET="autoon-videos"
S3_USE_SSL=true

# Azure Blob
AZURE_STORAGE_ACCOUNT=""
AZURE_STORAGE_KEY=""
AZURE_STORAGE_CONTAINER="autoon-videos"
AZURE_STORAGE_ENDPOINT_SUFFIX="core.windows.net"
AZURE_UPLOAD_URL_TTL_SECONDS=3600
AZURE_AUTO_CONFIGURE_CORS=true
AZURE_CORS_ALLOWED_ORIGINS="http://localhost:5173"
AZURE_CORS_ALLOWED_METHODS="GET,HEAD,PUT,POST,DELETE,OPTIONS"
AZURE_CORS_ALLOWED_HEADERS="*"
AZURE_CORS_EXPOSED_HEADERS="*"
AZURE_CORS_MAX_AGE=3600

# JWT
JWT_SECRET="change-me-to-random-string"
JWT_REFRESH_SECRET="change-me-to-another-random-string"

# App
PORT=3000
NODE_ENV="development"
API_URL="http://localhost:3000"
WEB_URL="http://localhost:5173"
```

### Frontend

```bash
cp apps/web/.env.example apps/web/.env
```

Edite `apps/web/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME="AutoOn EAD"
```

---

## 6. Rodar migrations do Prisma

```bash
# Gerar Prisma Client
pnpm --filter @autoon/api prisma:generate

# Rodar migrations
pnpm db:migrate

# (Opcional) Popular com dados de exemplo
pnpm db:seed
```

---

## 7. Iniciar aplicação

### Opção A: Modo desenvolvimento (recomendado)

```bash
pnpm dev
```

Isso inicia:
- Backend API em http://localhost:3000
- Frontend em http://localhost:5173

### Opção B: Iniciar separadamente

Backend:
```bash
pnpm --filter @autoon/api dev
```

Frontend:
```bash
pnpm --filter @autoon/web dev
```

---

## 8. Acessar aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:3000/api-docs
- **Prisma Studio**: `pnpm --filter @autoon/api db:studio`

---

## Serviços Cloud Gratuitos Recomendados

### PostgreSQL
- **Neon** (Recomendado): https://neon.tech
  - ✅ Free tier ilimitado
  - ✅ Serverless
  - ✅ 0.5 GB storage

- **Supabase**: https://supabase.com
  - ✅ 500 MB storage
  - ✅ Painel visual
  - ✅ Auth integrado

### Redis
- **Upstash** (Recomendado): https://upstash.com
  - ✅ 10K commands/day
  - ✅ Serverless
  - ✅ Global edge network

### Storage (S3-compatible)
- **MinIO Cloud**: https://min.io/cloud
  - ✅ S3-compatible
  - ✅ Free trial

- **Cloudflare R2**: https://cloudflare.com/products/r2
  - ✅ 10 GB/mês grátis
  - ✅ S3-compatible
  - ✅ Sem custo de egress

- **Backblaze B2**: https://www.backblaze.com/b2/cloud-storage.html
  - ✅ 10 GB grátis
  - ✅ S3-compatible

---

## Troubleshooting

### Erro de conexão com PostgreSQL
- Verifique se a `DATABASE_URL` está correta
- Se usar SSL, adicione `?sslmode=require` no final da URL
- Teste a conexão: `pnpm --filter @autoon/api prisma studio`

### Erro de conexão com Redis
- Verifique `REDIS_HOST`, `REDIS_PORT` e `REDIS_PASSWORD`
- Se Redis local, certifique-se que está rodando: `redis-cli ping`

### Erro de conexão com Storage (MinIO/S3)
- Verifique credenciais (`S3_ACCESS_KEY`, `S3_SECRET_KEY`)
- Verifique se os buckets existem
- Se usar HTTPS, configure `S3_USE_SSL=true`

### Erro de conexão com Azure Blob
- Garanta que `STORAGE_PROVIDER="AZURE"`
- Verifique `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY` e o container informado
- Confirme se o tempo (`AZURE_UPLOAD_URL_TTL_SECONDS`) não expirou

### Erro "Cannot find module"
- Rode: `pnpm install`
- Gere o Prisma Client: `pnpm --filter @autoon/api prisma:generate`

---

## Setup Rápido com Neon + Upstash

### 1. PostgreSQL (Neon)
1. Crie conta em https://neon.tech
2. Crie projeto
3. Copie a `DATABASE_URL`

### 2. Redis (Upstash)
1. Crie conta em https://upstash.com
2. Crie database Redis
3. Copie credenciais (Host, Port, Password)

### 3. MinIO (Local ou Cloud)
- **Local**: `minio server ./data --console-address ":9001"`
- **Cloud**: Use Cloudflare R2 ou Backblaze B2

### 4. Configure .env
```env
DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/db?sslmode=require"
REDIS_HOST="your-db.upstash.io"
REDIS_PORT=6379
REDIS_PASSWORD="your-password"

STORAGE_PROVIDER="S3"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="autoon-videos"

# Caso use Azure Blob
AZURE_STORAGE_ACCOUNT=""
AZURE_STORAGE_KEY=""
AZURE_STORAGE_CONTAINER="autoon-videos"
AZURE_STORAGE_ENDPOINT_SUFFIX="core.windows.net"
```

### 5. Rode migrations e inicie
```bash
pnpm db:migrate
pnpm dev
```

---

Pronto! Aplicação rodando sem Docker! 🚀
