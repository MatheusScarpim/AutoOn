# Makefile para facilitar comandos do Docker Compose
# Uso: make <comando>

.PHONY: help up down restart logs build clean migrate seed studio backup restore

# Cores para output
GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
NC=\033[0m # No Color

help: ## Mostrar esta ajuda
	@echo "$(GREEN)AutoOn EAD - Comandos disponíveis:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ===========================================
# Comandos principais
# ===========================================

up: ## Iniciar todos os serviços (docker compose up -d)
	@echo "$(GREEN)Iniciando todos os serviços...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✓ Serviços iniciados!$(NC)"
	@echo "$(YELLOW)Aguarde alguns segundos para tudo inicializar.$(NC)"
	@echo ""
	@make status

down: ## Parar e remover containers (mantém volumes)
	@echo "$(YELLOW)Parando todos os serviços...$(NC)"
	docker compose down
	@echo "$(GREEN)✓ Serviços parados!$(NC)"

restart: ## Reiniciar todos os serviços
	@echo "$(YELLOW)Reiniciando todos os serviços...$(NC)"
	docker compose restart
	@echo "$(GREEN)✓ Serviços reiniciados!$(NC)"

stop: ## Parar serviços sem remover containers
	@echo "$(YELLOW)Parando serviços...$(NC)"
	docker compose stop
	@echo "$(GREEN)✓ Serviços parados!$(NC)"

start: ## Iniciar serviços já criados
	@echo "$(GREEN)Iniciando serviços...$(NC)"
	docker compose start
	@echo "$(GREEN)✓ Serviços iniciados!$(NC)"

status: ## Verificar status dos containers
	@echo "$(GREEN)Status dos containers:$(NC)"
	@docker compose ps

logs: ## Ver logs de todos os serviços
	docker compose logs -f

logs-api: ## Ver logs apenas da API
	docker compose logs -f api

logs-web: ## Ver logs apenas do Web
	docker compose logs -f web

logs-postgres: ## Ver logs do PostgreSQL
	docker compose logs -f postgres

# ===========================================
# Build e Deploy
# ===========================================

build: ## Rebuildar todos os serviços
	@echo "$(GREEN)Buildando todos os serviços...$(NC)"
	docker compose build
	@echo "$(GREEN)✓ Build concluído!$(NC)"

build-api: ## Rebuildar apenas a API
	@echo "$(GREEN)Buildando API...$(NC)"
	docker compose build api
	@echo "$(GREEN)✓ Build da API concluído!$(NC)"

build-web: ## Rebuildar apenas o Web
	@echo "$(GREEN)Buildando Web...$(NC)"
	docker compose build web
	@echo "$(GREEN)✓ Build do Web concluído!$(NC)"

rebuild: ## Rebuildar e reiniciar todos os serviços
	@echo "$(GREEN)Rebuild completo...$(NC)"
	docker compose up -d --build
	@echo "$(GREEN)✓ Rebuild concluído!$(NC)"

rebuild-api: ## Rebuildar e reiniciar apenas a API
	@echo "$(GREEN)Rebuild da API...$(NC)"
	docker compose up -d --build api
	@echo "$(GREEN)✓ Rebuild da API concluído!$(NC)"

rebuild-web: ## Rebuildar e reiniciar apenas o Web
	@echo "$(GREEN)Rebuild do Web...$(NC)"
	docker compose up -d --build web
	@echo "$(GREEN)✓ Rebuild do Web concluído!$(NC)"

# ===========================================
# Banco de Dados (Prisma)
# ===========================================

migrate: ## Rodar migrations do Prisma
	@echo "$(GREEN)Rodando migrations...$(NC)"
	docker compose exec api pnpm db:migrate
	@echo "$(GREEN)✓ Migrations executadas!$(NC)"

seed: ## Popular banco com dados de exemplo
	@echo "$(GREEN)Populando banco de dados...$(NC)"
	docker compose exec api pnpm db:seed
	@echo "$(GREEN)✓ Seed executado!$(NC)"

studio: ## Abrir Prisma Studio (GUI do banco)
	@echo "$(GREEN)Abrindo Prisma Studio...$(NC)"
	@echo "$(YELLOW)Acesse: http://localhost:5555$(NC)"
	docker compose exec api pnpm db:studio

db-shell: ## Abrir shell do PostgreSQL
	@echo "$(GREEN)Conectando ao PostgreSQL...$(NC)"
	docker compose exec postgres psql -U autoon -d autoon

db-reset: ## PERIGO: Resetar banco de dados
	@echo "$(RED)ATENÇÃO: Isso vai apagar TODOS os dados!$(NC)"
	@echo "Pressione Ctrl+C para cancelar ou Enter para continuar..."
	@read confirm
	docker compose exec api pnpm prisma migrate reset --force
	@echo "$(GREEN)✓ Banco resetado!$(NC)"

# ===========================================
# Limpeza
# ===========================================

clean: ## Parar e remover containers E volumes (APAGA DADOS!)
	@echo "$(RED)ATENÇÃO: Isso vai apagar TODOS os dados!$(NC)"
	@echo "Pressione Ctrl+C para cancelar ou Enter para continuar..."
	@read confirm
	docker compose down -v
	@echo "$(GREEN)✓ Tudo limpo!$(NC)"

clean-images: ## Remover imagens não utilizadas
	@echo "$(YELLOW)Removendo imagens não utilizadas...$(NC)"
	docker image prune -f
	@echo "$(GREEN)✓ Imagens removidas!$(NC)"

clean-all: ## Limpeza completa (MUITO CUIDADO!)
	@echo "$(RED)ATENÇÃO: Isso vai remover TUDO (containers, volumes, imagens)!$(NC)"
	@echo "Pressione Ctrl+C para cancelar ou Enter para continuar..."
	@read confirm
	docker compose down -v
	docker system prune -a -f --volumes
	@echo "$(GREEN)✓ Limpeza completa executada!$(NC)"

# ===========================================
# Desenvolvimento
# ===========================================

dev: ## Iniciar apenas infraestrutura (para rodar API/Web localmente)
	@echo "$(GREEN)Iniciando apenas infraestrutura...$(NC)"
	docker compose up -d postgres redis
	@echo "$(GREEN)✓ Infraestrutura iniciada!$(NC)"
	@echo "$(YELLOW)Agora rode: pnpm dev$(NC)"

dev-full: ## Iniciar tudo e seguir logs
	@echo "$(GREEN)Iniciando tudo em modo desenvolvimento...$(NC)"
	docker compose up --build

shell-api: ## Abrir shell no container da API
	docker compose exec api sh

shell-web: ## Abrir shell no container do Web
	docker compose exec web sh

# ===========================================
# Backup e Restore
# ===========================================

backup: ## Criar backup do banco de dados
	@echo "$(GREEN)Criando backup do banco...$(NC)"
	@mkdir -p backups
	docker compose exec -T postgres pg_dump -U autoon autoon > backups/backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "$(GREEN)✓ Backup criado em backups/$(NC)"

restore: ## Restaurar backup do banco (arquivo: backups/restore.sql)
	@echo "$(YELLOW)Restaurando backup...$(NC)"
	@if [ ! -f backups/restore.sql ]; then \
		echo "$(RED)Erro: backups/restore.sql não encontrado!$(NC)"; \
		exit 1; \
	fi
	cat backups/restore.sql | docker compose exec -T postgres psql -U autoon -d autoon
	@echo "$(GREEN)✓ Backup restaurado!$(NC)"

# ===========================================
# Informações
# ===========================================

info: ## Mostrar informações dos serviços
	@echo "$(GREEN)Informações dos Serviços:$(NC)"
	@echo ""
	@echo "$(YELLOW)Frontend:$(NC)       http://localhost:$${WEB_PORT:-5173}"
	@echo "$(YELLOW)API:$(NC)            http://localhost:$${API_PORT:-3000}"
	@echo "$(YELLOW)Swagger:$(NC)        http://localhost:$${API_PORT:-3000}/api/docs"
	@bash -c "azure_account=$${AZURE_STORAGE_ACCOUNT:-}; azure_container=$${AZURE_STORAGE_CONTAINER:-autoon-videos}; if [ -n \"$$azure_account\" ]; then echo \"$(YELLOW)Azure Blob Storage:$(NC)  https://$$azure_account.blob.core.windows.net/$$azure_container\"; else echo \"$(YELLOW)Azure Blob Storage:$(NC)  configure AZURE_STORAGE_ACCOUNT/AZURE_STORAGE_KEY in .env\"; fi"
	@echo "$(YELLOW)PostgreSQL:$(NC)     localhost:$${POSTGRES_PORT:-5432}"
	@echo "$(YELLOW)Redis:$(NC)          localhost:$${REDIS_PORT:-6379}"
	@echo ""
	@echo "$(GREEN)Credenciais PostgreSQL:$(NC)"
	@echo "  User: $${POSTGRES_USER:-autoon}"
	@echo "  Pass: $${POSTGRES_PASSWORD:-autoon123}"
	@echo "  DB:   $${POSTGRES_DB:-autoon}"
	@echo ""
env: ## Criar arquivo .env a partir do .env.example
	@if [ -f .env ]; then \
		echo "$(YELLOW).env já existe! Renomeie ou delete antes.$(NC)"; \
	else \
		cp .env.example .env; \
		echo "$(GREEN)✓ Arquivo .env criado!$(NC)"; \
		echo "$(YELLOW)Edite o .env conforme necessário.$(NC)"; \
	fi

# ===========================================
# Testes e Qualidade
# ===========================================

test: ## Rodar testes no container da API
	docker compose exec api pnpm test

lint: ## Rodar linting no container da API
	docker compose exec api pnpm lint

# Default target
.DEFAULT_GOAL := help
