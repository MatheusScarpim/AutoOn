# Script PowerShell para inicializar repositório Git do AutoOn
# Execute com: .\init-git.ps1

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Inicializando repositório Git" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se já existe um repositório
if (Test-Path ".git") {
    Write-Host "⚠️  Repositório Git já existe!" -ForegroundColor Yellow
    $confirm = Read-Host "Deseja reinicializar? Isso apagará o histórico atual! (s/N)"
    if ($confirm -ne "s" -and $confirm -ne "S") {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        exit 1
    }
    Remove-Item -Recurse -Force .git
    Write-Host "🗑️  Repositório anterior removido" -ForegroundColor Yellow
}

# Inicializa o repositório
Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Green
git init

# Cria .gitignore se não existir
if (-not (Test-Path ".gitignore")) {
    Write-Host "📝 Criando .gitignore..." -ForegroundColor Green
    @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production builds
dist/
build/
.next/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# OS
.DS_Store
Thumbs.db
*.swp
*.swo
*~

# IDE
.vscode/
.idea/
*.sublime-workspace
*.sublime-project

# Docker
docker-compose.override.yml

# Prisma
.env

# Temporary
tmp/
temp/
*.tmp

# Database
*.db
*.sqlite
*.sqlite3

# Uploads (development)
uploads/

# MacOS
**/.DS_Store
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}

# Adiciona todos os arquivos
Write-Host "➕ Adicionando arquivos ao stage..." -ForegroundColor Green
git add .

# Cria o primeiro commit
Write-Host "💾 Criando commit inicial..." -ForegroundColor Green
git commit -m @"
🎉 Commit inicial - AutoOn EAD Platform

✨ Features:
- Backend completo em NestJS com TypeScript
- Frontend em Vue 3 + Vite + TypeScript
- Sistema de autenticação com JWT
- Upload e streaming de vídeos HLS
- Progresso de aulas com heartbeat
- Sistema de quizzes
- Certificados em PDF
- Dashboard com estatísticas
- Sistema de matrículas e assinaturas

🐳 Docker:
- docker-compose.yml para desenvolvimento
- docker-compose.prod.yml para produção
- Dockerfiles otimizados (multi-stage build)
- PostgreSQL + MinIO + Redis

🔒 Segurança:
- Senhas fortes configuradas
- JWT com refresh token
- Rate limiting
- CORS configurado
- Headers de segurança

📚 Documentação:
- DEPLOY.md com instruções completas
- .env.production.example
- README com toda a estrutura

🚀 Generated with Claude Code
"@

Write-Host ""
Write-Host "✅ Repositório Git inicializado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Próximos passos" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Criar repositório no GitHub/GitLab:" -ForegroundColor Yellow
Write-Host "   https://github.com/new" -ForegroundColor White
Write-Host ""
Write-Host "2. Adicionar remote:" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/seu-usuario/autoon.git" -ForegroundColor White
Write-Host ""
Write-Host "3. Fazer push:" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "4. Para clonar em outra máquina:" -ForegroundColor Yellow
Write-Host "   git clone https://github.com/seu-usuario/autoon.git" -ForegroundColor White
Write-Host "   cd autoon" -ForegroundColor White
Write-Host "   cp .env.production.example .env.production" -ForegroundColor White
Write-Host "   # Edite .env.production com suas senhas" -ForegroundColor Gray
Write-Host "   docker-compose -f docker-compose.prod.yml up -d --build" -ForegroundColor White
Write-Host ""
