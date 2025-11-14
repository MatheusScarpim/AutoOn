# Guia Rápido de Início - AutoOn EAD

## Passos para rodar o projeto pela primeira vez

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

#### Backend
```bash
cp apps/api/.env.example apps/api/.env
```

#### Frontend
```bash
cp apps/web/.env.example apps/web/.env
```

**IMPORTANTE**: Edite os arquivos `.env` se necessário (as configurações padrão já funcionam para desenvolvimento local).

### 3. Subir infraestrutura (Docker)

```bash
docker compose up -d
```

Aguarde os containers iniciarem. Verifique com:
```bash
docker compose ps
```

Todos devem estar com status "Up" e "healthy".

### 4. Configurar MinIO (Buckets)

Acesse: http://localhost:9001

- Login: `minioadmin`
- Senha: `minioadmin`

Crie os seguintes buckets:
1. `uploads`
2. `videos`
3. `certificates`

### 5. Configurar banco de dados

```bash
# Gerar Prisma Client
pnpm --filter @autoon/api prisma:generate

# Rodar migrations
pnpm db:migrate

# (Opcional) Popular com dados de exemplo
pnpm db:seed
```

### 6. Iniciar aplicação

```bash
pnpm dev
```

Isso iniciará:
- Backend API em http://localhost:3000
- Frontend em http://localhost:5173
- Swagger/Docs em http://localhost:3000/api/docs

## Verificação

Abra http://localhost:5173 no navegador.

Você deve ver a página inicial da plataforma AutoOn EAD.

## Problemas comuns

### "Cannot connect to database"
- Verifique se o Docker está rodando: `docker compose ps`
- Aguarde o PostgreSQL ficar "healthy"

### "Cannot connect to MinIO"
- Verifique se o MinIO está rodando: `docker compose logs minio`
- Acesse http://localhost:9001 para testar

### "Port already in use"
- Altere as portas no `docker-compose.yml` e nos `.env`

## Próximos passos

1. Explore o código em `apps/api/src` (backend)
2. Explore o código em `apps/web/src` (frontend)
3. Leia o README.md completo para mais detalhes
4. Acesse a documentação da API em http://localhost:3000/api/docs

---

Precisa de ajuda? Consulte o README.md principal.
