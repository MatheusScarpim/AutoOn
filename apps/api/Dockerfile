# ===========================================
# Stage 1: Builder
# ===========================================
FROM node:20-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm@8.15.4

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat python3 make g++ openssl ffmpeg

WORKDIR /app

# Copiar arquivos de configuração do workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copiar package.jsons de todos os workspaces
COPY packages/types/package.json ./packages/types/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY apps/api/package.json ./apps/api/package.json

# Instalar dependências (isso cria os symlinks corretos do pnpm)
RUN pnpm install --frozen-lockfile

# Copiar código fonte dos packages
COPY packages/types/src ./packages/types/src
COPY packages/types/tsconfig.json ./packages/types/tsconfig.json
COPY packages/utils/src ./packages/utils/src
COPY packages/utils/tsconfig.json ./packages/utils/tsconfig.json
COPY packages/config ./packages/config

# Copiar código fonte da API
COPY apps/api/src ./apps/api/src
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/api/tsconfig.build.json ./apps/api/tsconfig.build.json
COPY apps/api/nest-cli.json ./apps/api/nest-cli.json
COPY apps/api/start-dev.js ./apps/api/start-dev.js

# Gerar Prisma Client
RUN cd apps/api && pnpm prisma:generate

# Build
RUN pnpm --filter @autoon/api build

# ===========================================
# Stage 2: Runner
# ===========================================
FROM node:20-alpine AS runner

# Instalar pnpm
RUN npm install -g pnpm@8.15.4

# Instalar dependências de runtime
RUN apk add --no-cache \
    openssl \
    ffmpeg \
    curl \
    bash

WORKDIR /app

# Copiar tudo do builder
COPY --from=builder /app ./

# Criar script de entrypoint
RUN echo '#!/bin/bash' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo 'echo "==================================="' >> /docker-entrypoint.sh && \
    echo 'echo "AutoOn API - Inicializando..."' >> /docker-entrypoint.sh && \
    echo 'echo "==================================="' >> /docker-entrypoint.sh && \
    echo 'echo ""' >> /docker-entrypoint.sh && \
    echo 'echo "Aguardando banco de dados..."' >> /docker-entrypoint.sh && \
    echo 'sleep 10' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo 'cd /app/apps/api' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo 'echo "Gerando Prisma Client..."' >> /docker-entrypoint.sh && \
    echo 'pnpm prisma:generate' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo 'echo "Rodando migrations..."' >> /docker-entrypoint.sh && \
    echo 'pnpm prisma migrate deploy || true' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo 'echo ""' >> /docker-entrypoint.sh && \
    echo 'echo "==================================="' >> /docker-entrypoint.sh && \
    echo 'echo "✓ Inicialização concluída!"' >> /docker-entrypoint.sh && \
    echo 'echo "API rodando na porta 3000"' >> /docker-entrypoint.sh && \
    echo 'echo "==================================="' >> /docker-entrypoint.sh && \
    echo 'echo ""' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo 'exec node start-dev.js' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app && \
    mkdir -p /tmp/uploads && \
    chown -R nodejs:nodejs /tmp/uploads

USER nodejs

WORKDIR /app/apps/api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
