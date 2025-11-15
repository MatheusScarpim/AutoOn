# Guia de Docker - AutoOn EAD

Este guia detalha como usar Docker e Docker Compose para rodar a aplicação AutoOn EAD.

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Arquitetura dos Containers](#arquitetura-dos-containers)
3. [Início Rápido](#início-rápido)
4. [Configuração Detalhada](#configuração-detalhada)
5. [Comandos Úteis](#comandos-úteis)
6. [Troubleshooting](#troubleshooting)
7. [Desenvolvimento](#desenvolvimento)
8. [Produção](#produção)

## Pré-requisitos

- **Docker**: versão 20.10 ou superior
- **Docker Compose**: versão 2.0 ou superior (geralmente já incluído no Docker Desktop)
- **Git**: para clonar o repositório
- **8GB RAM disponível**: recomendado para rodar todos os containers

### Instalar Docker

#### Windows / macOS
- Baixe e instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/)

#### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Verificar instalação

```bash
docker --version
# Deve exibir: Docker version 20.10+

docker compose version
# Deve exibir: Docker Compose version v2.0+
```

## Arquitetura dos Containers

O Docker Compose orquestra 4 serviços: PostgreSQL, Redis, API (NestJS) e Web (Vue + Nginx). O Azure Blob Storage não roda dentro do Compose; o backend consome o container configurado via variáveis STORAGE_PROVIDER e AZURE_*.

### Serviços

| Serviço | Descrição | Porta Externa | Porta Interna |
|---------|-----------|---------------|---------------|
| **postgres** | Banco de dados PostgreSQL 16 | 5432 | 5432 |
| **redis** | Cache e filas (BullMQ) | 6379 | 6379 |
| **api** | Backend NestJS | 3000 | 3000 |
| **web** | Frontend Vue 3 + Nginx | 80 | 80 |

### Volumes (Persistência)

Os dados são persistidos em volumes Docker nomeados:

- `autoon-postgres-data`: Dados do PostgreSQL
- `autoon-redis-data`: Dados do Redis (append-only log)

**IMPORTANTE**: Mesmo que você remova os containers com `docker compose down`, os dados permanecem nos volumes. Para apagar os dados, use `docker compose down -v`.

## Início Rápido

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd AutoOn
```

### 2. Criar arquivo .env

```bash
# Copiar o exemplo
cp .env.example .env

# (Opcional) Editar o .env
# Para desenvolvimento local, os valores padrão funcionam bem
```

### 3. Iniciar todos os serviços

```bash
docker compose up -d
```

Este comando:
- ✅ Baixa as imagens necessárias (primeira vez)
- ✅ Builda a API e o Web (primeira vez)
- ✅ Cria os volumes para persistência
- ✅ Inicia todos os containers
- ✅ Aguarda dependências (healthchecks)
- ✅ Configura o Azure Blob Storage com base nas credenciais e garante que o container exista

### 4. Acompanhar os logs

```bash
# Todos os serviços
docker compose logs -f

# Apenas API
docker compose logs -f api

# Apenas Web
docker compose logs -f web
```

### 5. Verificar se tudo está rodando

```bash
docker compose ps
```

Você deve ver todos os serviços com status "Up".

### 6. Acessar a aplicação

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api/docs
- **Azure Blob Storage**: acesse seu container via `https://<sua-conta>.blob.core.windows.net/<container>` ou use o [Azure Storage Explorer](https://learn.microsoft.com/azure/storage/common/storage-explorer)

## Configuração Detalhada

### Variáveis de Ambiente (.env)

O arquivo `.env` na raiz do projeto controla toda a configuração:

```env
# Portas (altere se houver conflito)
API_PORT=3000
WEB_PORT=5173
POSTGRES_PORT=5432
REDIS_PORT=6379

# PostgreSQL
POSTGRES_USER=autoon
POSTGRES_PASSWORD=autoon123
POSTGRES_DB=autoon

# Redis
REDIS_PASSWORD=redis123

# Storage (Azure Blob)
STORAGE_PROVIDER=AZURE
AZURE_STORAGE_ACCOUNT=your-storage-account
AZURE_STORAGE_KEY=your-storage-key
AZURE_STORAGE_CONTAINER=autoon-videos
AZURE_STORAGE_ENDPOINT_SUFFIX=core.windows.net
AZURE_UPLOAD_URL_TTL_SECONDS=3600
AZURE_AUTO_CONFIGURE_CORS=true
AZURE_CORS_ALLOWED_ORIGINS=http://localhost:5173
AZURE_CORS_ALLOWED_METHODS=GET,HEAD,PUT,POST,DELETE,OPTIONS
AZURE_CORS_ALLOWED_HEADERS=*
AZURE_CORS_EXPOSED_HEADERS=*
AZURE_CORS_MAX_AGE=3600

# JWT (mude em produção!)
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d

# CORS (URLs permitidas)
CORS_ORIGIN=http://localhost:5173

# URLs
APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000

# Ambiente
NODE_ENV=development
```

### Customizar Portas

Se alguma porta já estiver em uso no seu sistema:

```env
# Exemplo: Usar porta 8080 para o frontend
WEB_PORT=8080

# Exemplo: Usar porta 5433 para PostgreSQL
POSTGRES_PORT=5433
```

Após alterar, recrie os containers:

```bash
docker compose down
docker compose up -d
```

## Comandos Úteis

### Gerenciamento de Containers

```bash
# Iniciar todos os serviços
docker compose up -d

# Parar todos os serviços (mantém volumes)
docker compose stop

# Parar e remover containers (mantém volumes)
docker compose down

# Parar, remover containers E volumes (APAGA DADOS!)
docker compose down -v

# Reiniciar todos os serviços
docker compose restart

# Reiniciar apenas um serviço
docker compose restart api
docker compose restart web

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f
docker compose logs -f api
docker compose logs -f web --tail=100
```

### Build e Rebuild

```bash
# Rebuild da API (após mudanças no Dockerfile)
docker compose up -d --build api

# Rebuild do Web (após mudanças no Dockerfile)
docker compose up -d --build web

# Rebuild de tudo
docker compose up -d --build

# Rebuild sem usar cache (força rebuild completo)
docker compose build --no-cache
docker compose up -d
```

### Executar Comandos nos Containers

```bash
# Abrir shell no container da API
docker compose exec api sh

# Abrir shell no PostgreSQL
docker compose exec postgres psql -U autoon -d autoon

# Rodar migrations no container da API
docker compose exec api pnpm db:migrate

# Rodar seed no container da API
docker compose exec api pnpm db:seed

# Abrir Prisma Studio
docker compose exec api pnpm db:studio

# Ver variáveis de ambiente de um container
docker compose exec api env
```

### Volumes e Dados

```bash
# Listar volumes
docker volume ls

# Inspecionar um volume
docker volume inspect autoon-postgres-data

# Backup do PostgreSQL
docker compose exec postgres pg_dump -U autoon autoon > backup.sql

# Restaurar backup
cat backup.sql | docker compose exec -T postgres psql -U autoon -d autoon

# Remover volume específico (CUIDADO: apaga dados!)
docker compose down
docker volume rm autoon-postgres-data
```

### Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Remover volumes não utilizados (CUIDADO!)
docker volume prune

# Limpeza geral (MUITO CUIDADO!)
docker system prune -a --volumes
```

## Troubleshooting

### Porta já em uso

**Erro**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solução**:
```bash
# Descobrir o que está usando a porta
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Matar o processo ou alterar a porta no .env
API_PORT=3001
docker compose down
docker compose up -d
```

### Container não inicia / fica reiniciando

**Solução**:
```bash
# Ver logs do container problemático
docker compose logs api

# Ver logs em tempo real
docker compose logs -f api

# Verificar health checks
docker compose ps
```

### Erro de conexão com o banco

**Erro**: `Error: P1001: Can't reach database server`

**Solução**:
```bash
# Verificar se o PostgreSQL está rodando
docker compose ps postgres

# Ver logs do PostgreSQL
docker compose logs postgres

# Reiniciar o PostgreSQL
docker compose restart postgres

# Aguardar o health check
docker compose ps
```

### Erro de permissão no Linux

**Erro**: `permission denied while trying to connect to the Docker daemon`

**Solução**:
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Logout e login novamente, ou:
newgrp docker

# Verificar
docker ps
```

### Build muito lento

**Soluções**:

1. **Usar BuildKit** (mais rápido):
```bash
DOCKER_BUILDKIT=1 docker compose build
```

2. **Limpar cache de build**:
```bash
docker builder prune
```

3. **Aumentar recursos do Docker Desktop**:
   - Settings → Resources → Aumentar CPU e RAM

### Web não atualiza após mudanças

**Problema**: Frontend não reflete mudanças no código.

**Solução**:
```bash
# O frontend no Docker é buildado (produção)
# Para desenvolvimento com hot-reload, rode localmente:
docker compose stop web
pnpm --filter @autoon/web dev

# Ou rebuild o container:
docker compose up -d --build web
```

### Azure Blob Storage não cria container

**Solução**:
```bash
# Verificar logs da API para erros de credenciais ou permissions
docker compose logs api
```

1. Confirme que `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY` e `AZURE_STORAGE_CONTAINER` estão corretos no `.env`.
2. Se necessário, crie o container manualmente via [Azure Portal](https://portal.azure.com) ou [Azure Storage Explorer](https://learn.microsoft.com/azure/storage/common/storage-explorer).
3. A API recria o container automaticamente ao subir; reinicie o serviço para aplicar novas credenciais.

## Desenvolvimento

### Modo Híbrido (Recomendado para desenvolvimento)

Rode apenas a infraestrutura no Docker e a API/Web localmente para ter hot-reload:

```bash
# 1. Subir apenas infraestrutura
docker compose up -d postgres redis

# 2. Configurar .env locais
cp apps/api/.env.example apps/api/.env
echo "VITE_API_URL=http://localhost:3000" > apps/web/.env

# 3. Instalar dependências
pnpm install

# 4. Rodar migrations
pnpm db:migrate

# 5. Iniciar em modo dev (com hot-reload)
pnpm dev
```

**Acessos neste modo**:
- Frontend: http://localhost:5173 (Vite dev server com HMR)
- API: http://localhost:3000 (NestJS com watch mode)

### Debug da API no Docker

Adicione ao `docker-compose.yml`:

```yaml
api:
  ports:
    - "3000:3000"
    - "9229:9229"  # Debug port
  command: node --inspect=0.0.0.0:9229 start-dev.js
```

Configure no VS Code (`.vscode/launch.json`):

```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "port": 9229,
  "address": "localhost",
  "restart": true,
  "sourceMaps": true,
  "localRoot": "${workspaceFolder}/apps/api",
  "remoteRoot": "/app/apps/api"
}
```

## Produção

Para produção, use o arquivo `.env.production.example` como base:

```bash
# 1. Copiar exemplo de produção
cp .env.production.example .env.production

# 2. ALTERAR TODAS AS SENHAS!
nano .env.production

# 3. Subir com arquivo de produção
docker compose --env-file .env.production up -d

# 4. Ou usar docker-compose.prod.yml (se existir)
docker compose -f docker-compose.prod.yml up -d
```

**IMPORTANTE em produção**:
- ✅ Use senhas fortes e únicas
- ✅ Use HTTPS (configure nginx/traefik/caddy)
- ✅ Configure backup automático dos volumes
- ✅ Use secrets do Docker Swarm ou Kubernetes
- ✅ Configure monitoramento (Prometheus + Grafana)
- ✅ Configure logs centralizados (ELK/Loki)
- ✅ Use rede privada para comunicação entre containers

## Recursos Adicionais

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Postgres Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Azure Blob Storage Docs](https://learn.microsoft.com/azure/storage/blobs/)

---

**Dúvidas?** Abra uma issue no repositório ou consulte o [README.md](README.md) principal.
