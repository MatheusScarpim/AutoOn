# ===========================================
# Stage 1: Builder
# ===========================================
FROM node:20-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm@8.15.4

WORKDIR /app

# Copiar arquivos de configuração do workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copiar package.jsons de todos os workspaces
COPY packages/types/package.json ./packages/types/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY apps/web/package.json ./apps/web/package.json

# Copiar código fonte do pacote de tipos (necessário para `pnpm install`)
COPY packages/types/src ./packages/types/src
COPY packages/types/tsconfig.json ./packages/types/tsconfig.json

# Instalar dependências (isso cria os symlinks corretos do pnpm)
RUN pnpm install --frozen-lockfile

COPY packages/utils/src ./packages/utils/src
COPY packages/utils/tsconfig.json ./packages/utils/tsconfig.json

# Copiar código fonte do web
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
COPY apps/web/index.html ./apps/web/index.html
COPY apps/web/vite.config.ts ./apps/web/vite.config.ts
COPY apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY apps/web/tsconfig.node.json ./apps/web/tsconfig.node.json
COPY apps/web/tailwind.config.js ./apps/web/tailwind.config.js
COPY apps/web/postcss.config.js ./apps/web/postcss.config.js

# Build do frontend
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm --filter @autoon/web build

# ===========================================
# Stage 2: Runner (Nginx)
# ===========================================
FROM nginx:alpine AS runner

# Copiar configuração do Nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build do frontend
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Criar script de entrypoint
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo 'echo "==================================="' >> /docker-entrypoint.sh && \
    echo 'echo "AutoOn Web - Inicializando..."' >> /docker-entrypoint.sh && \
    echo 'echo "==================================="' >> /docker-entrypoint.sh && \
    echo 'echo ""' >> /docker-entrypoint.sh && \
    echo 'echo "Frontend disponível na porta 80"' >> /docker-entrypoint.sh && \
    echo 'echo ""' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Configurar permissões
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
