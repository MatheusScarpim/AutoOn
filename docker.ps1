# Script PowerShell para facilitar comandos do Docker Compose no Windows
# Uso: .\docker.ps1 <comando>

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Cores
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

# Banner
function Show-Banner {
    Write-Host ""
    Write-Success "╔═══════════════════════════════════════════════╗"
    Write-Success "║        AutoOn EAD - Docker Manager           ║"
    Write-Success "╚═══════════════════════════════════════════════╝"
    Write-Host ""
}

# Ajuda
function Show-Help {
    Show-Banner
    Write-Info "Comandos disponíveis:"
    Write-Host ""
    Write-Host "  Gerenciamento:"
    Write-Host "    up               - Iniciar todos os serviços"
    Write-Host "    down             - Parar e remover containers (mantém volumes)"
    Write-Host "    restart          - Reiniciar todos os serviços"
    Write-Host "    stop             - Parar serviços sem remover"
    Write-Host "    start            - Iniciar serviços já criados"
    Write-Host "    status           - Ver status dos containers"
    Write-Host "    logs             - Ver logs de todos os serviços"
    Write-Host "    logs-api         - Ver logs apenas da API"
    Write-Host "    logs-web         - Ver logs apenas do Web"
    Write-Host ""
    Write-Host "  Build:"
    Write-Host "    build            - Rebuildar todos os serviços"
    Write-Host "    build-api        - Rebuildar apenas a API"
    Write-Host "    build-web        - Rebuildar apenas o Web"
    Write-Host "    rebuild          - Rebuildar e reiniciar tudo"
    Write-Host ""
    Write-Host "  Banco de Dados:"
    Write-Host "    migrate          - Rodar migrations do Prisma"
    Write-Host "    seed             - Popular banco com dados de exemplo"
    Write-Host "    studio           - Abrir Prisma Studio"
    Write-Host "    db-shell         - Abrir shell do PostgreSQL"
    Write-Host "    db-reset         - PERIGO: Resetar banco de dados"
    Write-Host ""
    Write-Host "  Desenvolvimento:"
    Write-Host "    dev              - Iniciar apenas infraestrutura"
    Write-Host "    dev-full         - Iniciar tudo e seguir logs"
    Write-Host "    shell-api        - Abrir shell no container da API"
    Write-Host "    shell-web        - Abrir shell no container do Web"
    Write-Host ""
    Write-Host "  Backup:"
    Write-Host "    backup           - Criar backup do banco de dados"
    Write-Host "    restore          - Restaurar backup (arquivo: backups\restore.sql)"
    Write-Host ""
    Write-Host "  Limpeza:"
    Write-Host "    clean            - Parar e remover containers E volumes"
    Write-Host "    clean-images     - Remover imagens não utilizadas"
    Write-Host "    clean-all        - Limpeza completa (CUIDADO!)"
    Write-Host ""
    Write-Host "  Utilitários:"
    Write-Host "    env              - Criar .env a partir de .env.example"
    Write-Host "    info             - Mostrar informações dos serviços"
    Write-Host "    test             - Rodar testes"
    Write-Host "    lint             - Rodar linting"
    Write-Host ""
    Write-Info "Exemplos:"
    Write-Host "  .\docker.ps1 up"
    Write-Host "  .\docker.ps1 logs-api"
    Write-Host "  .\docker.ps1 migrate"
    Write-Host ""
}

# Verificar se Docker está instalado
function Test-DockerInstalled {
    try {
        docker --version | Out-Null
        return $true
    }
    catch {
        Write-Error "Docker não encontrado! Instale o Docker Desktop."
        exit 1
    }
}

# Executar comandos
Test-DockerInstalled

switch ($Command.ToLower()) {
    "help" {
        Show-Help
    }

    "up" {
        Show-Banner
        Write-Success "Iniciando todos os serviços..."
        docker compose up -d
        Write-Success "✓ Serviços iniciados!"
        Write-Warning "Aguarde alguns segundos para tudo inicializar."
        Write-Host ""
        docker compose ps
    }

    "down" {
        Write-Warning "Parando todos os serviços..."
        docker compose down
        Write-Success "✓ Serviços parados!"
    }

    "restart" {
        Write-Warning "Reiniciando todos os serviços..."
        docker compose restart
        Write-Success "✓ Serviços reiniciados!"
    }

    "stop" {
        Write-Warning "Parando serviços..."
        docker compose stop
        Write-Success "✓ Serviços parados!"
    }

    "start" {
        Write-Success "Iniciando serviços..."
        docker compose start
        Write-Success "✓ Serviços iniciados!"
    }

    "status" {
        Write-Success "Status dos containers:"
        docker compose ps
    }

    "logs" {
        docker compose logs -f
    }

    "logs-api" {
        docker compose logs -f api
    }

    "logs-web" {
        docker compose logs -f web
    }

    "logs-postgres" {
        docker compose logs -f postgres
    }

    "build" {
        Write-Success "Buildando todos os serviços..."
        docker compose build
        Write-Success "✓ Build concluído!"
    }

    "build-api" {
        Write-Success "Buildando API..."
        docker compose build api
        Write-Success "✓ Build da API concluído!"
    }

    "build-web" {
        Write-Success "Buildando Web..."
        docker compose build web
        Write-Success "✓ Build do Web concluído!"
    }

    "rebuild" {
        Write-Success "Rebuild completo..."
        docker compose up -d --build
        Write-Success "✓ Rebuild concluído!"
    }

    "rebuild-api" {
        Write-Success "Rebuild da API..."
        docker compose up -d --build api
        Write-Success "✓ Rebuild da API concluído!"
    }

    "rebuild-web" {
        Write-Success "Rebuild do Web..."
        docker compose up -d --build web
        Write-Success "✓ Rebuild do Web concluído!"
    }

    "migrate" {
        Write-Success "Rodando migrations..."
        docker compose exec api pnpm db:migrate
        Write-Success "✓ Migrations executadas!"
    }

    "seed" {
        Write-Success "Populando banco de dados..."
        docker compose exec api pnpm db:seed
        Write-Success "✓ Seed executado!"
    }

    "studio" {
        Write-Success "Abrindo Prisma Studio..."
        Write-Warning "Acesse: http://localhost:5555"
        docker compose exec api pnpm db:studio
    }

    "db-shell" {
        Write-Success "Conectando ao PostgreSQL..."
        docker compose exec postgres psql -U autoon -d autoon
    }

    "db-reset" {
        Write-Error "ATENÇÃO: Isso vai apagar TODOS os dados!"
        $confirm = Read-Host "Digite 'sim' para confirmar"
        if ($confirm -eq "sim") {
            docker compose exec api pnpm prisma migrate reset --force
            Write-Success "✓ Banco resetado!"
        }
        else {
            Write-Warning "Operação cancelada."
        }
    }

    "clean" {
        Write-Error "ATENÇÃO: Isso vai apagar TODOS os dados!"
        $confirm = Read-Host "Digite 'sim' para confirmar"
        if ($confirm -eq "sim") {
            docker compose down -v
            Write-Success "✓ Tudo limpo!"
        }
        else {
            Write-Warning "Operação cancelada."
        }
    }

    "clean-images" {
        Write-Warning "Removendo imagens não utilizadas..."
        docker image prune -f
        Write-Success "✓ Imagens removidas!"
    }

    "clean-all" {
        Write-Error "ATENÇÃO: Isso vai remover TUDO (containers, volumes, imagens)!"
        $confirm = Read-Host "Digite 'sim' para confirmar"
        if ($confirm -eq "sim") {
            docker compose down -v
            docker system prune -a -f --volumes
            Write-Success "✓ Limpeza completa executada!"
        }
        else {
            Write-Warning "Operação cancelada."
        }
    }

    "dev" {
        Write-Success "Iniciando apenas infraestrutura..."
        docker compose up -d postgres redis
        Write-Success "✓ Infraestrutura iniciada!"
        Write-Warning "Agora rode: pnpm dev"
    }

    "dev-full" {
        Write-Success "Iniciando tudo em modo desenvolvimento..."
        docker compose up --build
    }

    "shell-api" {
        docker compose exec api sh
    }

    "shell-web" {
        docker compose exec web sh
    }

    "backup" {
        Write-Success "Criando backup do banco..."
        if (!(Test-Path "backups")) {
            New-Item -ItemType Directory -Path "backups"
        }
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        docker compose exec -T postgres pg_dump -U autoon autoon > "backups\backup-$timestamp.sql"
        Write-Success "✓ Backup criado em backups\"
    }

    "restore" {
        Write-Warning "Restaurando backup..."
        if (!(Test-Path "backups\restore.sql")) {
            Write-Error "Erro: backups\restore.sql não encontrado!"
            exit 1
        }
        Get-Content "backups\restore.sql" | docker compose exec -T postgres psql -U autoon -d autoon
        Write-Success "✓ Backup restaurado!"
    }

    "info" {
        Show-Banner

        # Carregar .env se existir
        if (Test-Path ".env") {
            Get-Content .env | ForEach-Object {
                if ($_ -match '^([^=]+)=(.*)$') {
                    [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
                }
            }
        }

        $webPort = if ($env:WEB_PORT) { $env:WEB_PORT } else { "5173" }
        $apiPort = if ($env:API_PORT) { $env:API_PORT } else { "3000" }
        $postgresPort = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }
        $redisPort = if ($env:REDIS_PORT) { $env:REDIS_PORT } else { "6379" }
        $azureAccount = $env:AZURE_STORAGE_ACCOUNT
        $azureContainer = if ($env:AZURE_STORAGE_CONTAINER) { $env:AZURE_STORAGE_CONTAINER } else { "autoon-videos" }
        $storageInfo = if ($azureAccount) { "https://$azureAccount.blob.core.windows.net/$azureContainer" } else { "configure AZURE_STORAGE_ACCOUNT/AZURE_STORAGE_KEY in .env" }

        Write-Info "Informações dos Serviços:"
        Write-Host ""
        Write-Host "Frontend:       http://localhost:$webPort"
        Write-Host "API:            http://localhost:$apiPort"
        Write-Host "Swagger:        http://localhost:$apiPort/api/docs"
        Write-Host "Azure Blob Storage:  $storageInfo"
        Write-Host "PostgreSQL:     localhost:$postgresPort"
        Write-Host "Redis:          localhost:$redisPort"
        Write-Host ""
        Write-Success "Credenciais PostgreSQL:"
        Write-Host "  User: autoon"
        Write-Host "  Pass: autoon123"
        Write-Host "  DB:   autoon"
        Write-Host ""
    }

    "env" {
        if (Test-Path ".env") {
            Write-Warning ".env já existe! Renomeie ou delete antes."
        }
        else {
            Copy-Item ".env.example" ".env"
            Write-Success "✓ Arquivo .env criado!"
            Write-Warning "Edite o .env conforme necessário."
        }
    }

    "test" {
        docker compose exec api pnpm test
    }

    "lint" {
        docker compose exec api pnpm lint
    }

    default {
        Write-Error "Comando desconhecido: $Command"
        Write-Host ""
        Show-Help
    }
}
