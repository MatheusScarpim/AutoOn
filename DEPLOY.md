# 🚀 Guia de Deploy - AutoOn

## Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM mínimo (8GB recomendado)
- 20GB espaço em disco

## 📋 Preparação para Produção

### 1. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.production.example .env.production

# Edite e altere TODAS as senhas
nano .env.production  # ou use seu editor preferido
```

**⚠️ IMPORTANTE:** NUNCA use as senhas padrão em produção!

### 2. Gere Senhas Seguras

```bash
# Linux/Mac - Gerar senha aleatória de 32 caracteres
openssl rand -base64 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Substitua as seguintes variáveis no `.env.production`:
- `POSTGRES_PASSWORD`
- `MINIO_ROOT_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

## 🏗️ Build e Deploy

### Primeira Vez (Build das Imagens)

```bash
# Build de todas as imagens
docker-compose -f docker-compose.prod.yml build

# Suba todos os serviços
docker-compose -f docker-compose.prod.yml up -d

# Acompanhe os logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Execute as Migrações do Banco

```bash
# Entre no container da API
docker exec -it autoon-api-prod sh

# Execute as migrações
cd apps/api
pnpm prisma migrate deploy

# (Opcional) Seed inicial
pnpm prisma db seed

# Saia do container
exit
```

### Configure o MinIO

```bash
# Acesse o console do MinIO
# http://seu-servidor:9001

# Login com as credenciais do .env.production
# MINIO_ROOT_USER e MINIO_ROOT_PASSWORD

# Crie o bucket "autoon" (ou o nome definido em MINIO_BUCKET)
# Configure as permissões adequadas
```

## 🔍 Verificação

### Health Checks

```bash
# API
curl http://localhost:3000/health

# Frontend
curl http://localhost/health

# Verificar todos os containers
docker-compose -f docker-compose.prod.yml ps
```

Todos os serviços devem estar com status "healthy".

## 🔧 Comandos Úteis

### Ver Logs

```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Apenas a API
docker-compose -f docker-compose.prod.yml logs -f api

# Apenas o Frontend
docker-compose -f docker-compose.prod.yml logs -f web
```

### Parar Serviços

```bash
# Parar todos
docker-compose -f docker-compose.prod.yml stop

# Parar e remover containers
docker-compose -f docker-compose.prod.yml down

# Parar, remover containers E volumes (⚠️ APAGA DADOS!)
docker-compose -f docker-compose.prod.yml down -v
```

### Reiniciar Serviços

```bash
# Reiniciar todos
docker-compose -f docker-compose.prod.yml restart

# Reiniciar apenas a API
docker-compose -f docker-compose.prod.yml restart api
```

### Atualizar Aplicação

```bash
# 1. Pull do código atualizado
git pull origin main

# 2. Rebuild das imagens
docker-compose -f docker-compose.prod.yml build

# 3. Restart dos serviços
docker-compose -f docker-compose.prod.yml up -d

# 4. Execute migrações se houver
docker exec -it autoon-api-prod sh -c "cd apps/api && pnpm prisma migrate deploy"
```

## 🗄️ Backup

### Backup do PostgreSQL

```bash
# Criar backup
docker exec autoon-postgres-prod pg_dump -U autoon autoon > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker exec -i autoon-postgres-prod psql -U autoon autoon < backup_20240101_120000.sql
```

### Backup do MinIO

```bash
# Criar backup dos volumes
docker run --rm \
  -v autoon_minio_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/minio_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

## 🔒 Segurança

### Checklist de Segurança

- [ ] Todas as senhas foram alteradas
- [ ] JWT secrets são únicos e complexos
- [ ] HTTPS/SSL configurado (recomendado usar nginx ou traefik como proxy reverso)
- [ ] Firewall configurado
- [ ] Portas expostas apenas as necessárias
- [ ] Backup automático configurado
- [ ] Logs sendo monitorados
- [ ] Rate limiting configurado
- [ ] CORS configurado corretamente

### Configurar HTTPS com Let's Encrypt e Nginx

As configurações do Nginx estão em `infra/nginx/` com suporte para os domínios:
- Frontend: https://autoon.scarlat.dev.br
- API: https://autoon-api.scarlat.dev.br

#### Configuração rápida:

```bash
# 1. Copiar arquivos de configuração (se ainda não fez)
cd infra/nginx
sudo cp autoon.scarlat.dev.br.conf /etc/nginx/sites-available/
sudo cp autoon-api.scarlat.dev.br.conf /etc/nginx/sites-available/

# 2. Criar links simbólicos
sudo ln -s /etc/nginx/sites-available/autoon.scarlat.dev.br.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/autoon-api.scarlat.dev.br.conf /etc/nginx/sites-enabled/

# 3. Obter certificados SSL
sudo certbot --nginx -d autoon.scarlat.dev.br
sudo certbot --nginx -d autoon-api.scarlat.dev.br

# 4. Testar e reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

Veja `infra/nginx/README.md` para instruções completas.

## 📊 Monitoramento

### Uso de Recursos

```bash
# Ver uso de CPU/Memória
docker stats

# Espaço em disco dos volumes
docker system df -v
```

### Logs de Aplicação

```bash
# Logs da API (últimas 100 linhas)
docker-compose -f docker-compose.prod.yml logs --tail=100 api

# Buscar erros nos logs
docker-compose -f docker-compose.prod.yml logs api | grep -i error
```

## 🆘 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs [nome-do-servico]

# Inspecionar container
docker inspect [container-id]
```

### Problemas de conexão com banco

```bash
# Testar conexão com PostgreSQL
docker exec -it autoon-postgres-prod psql -U autoon -d autoon

# Ver configurações de rede
docker network inspect autoon-network
```

### API não conecta ao MinIO

```bash
# Verificar se MinIO está rodando
docker-compose -f docker-compose.prod.yml ps minio

# Testar conectividade
docker exec -it autoon-api-prod ping minio
```

### Limpar tudo e recomeçar (⚠️ APAGA DADOS!)

```bash
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a --volumes
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Consulte a documentação do projeto
3. Abra uma issue no repositório

## 🔄 Manutenção

### Rotina Diária
- Verificar logs de erro
- Monitorar uso de recursos

### Rotina Semanal
- Backup dos dados
- Verificar atualizações de segurança

### Rotina Mensal
- Atualizar dependências
- Rotacionar senhas críticas
- Revisar logs de auditoria
- Limpar dados antigos/desnecessários
