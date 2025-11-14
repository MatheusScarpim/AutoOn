#!/bin/bash

# Script para inicializar repositório Git do AutoOn
# Execute com: bash init-git.sh

echo "======================================"
echo "  Inicializando repositório Git"
echo "======================================"
echo ""

# Verifica se já existe um repositório
if [ -d ".git" ]; then
    echo "⚠️  Repositório Git já existe!"
    read -p "Deseja reinicializar? Isso apagará o histórico atual! (s/N): " confirm
    if [[ $confirm != [sS] ]]; then
        echo "❌ Operação cancelada."
        exit 1
    fi
    rm -rf .git
    echo "🗑️  Repositório anterior removido"
fi

# Inicializa o repositório
echo "📦 Inicializando repositório Git..."
git init

# Cria .gitignore se não existir
if [ ! -f ".gitignore" ]; then
    echo "📝 Criando .gitignore..."
    cat > .gitignore << 'EOF'
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
EOF
fi

# Adiciona todos os arquivos
echo "➕ Adicionando arquivos ao stage..."
git add .

# Cria o primeiro commit
echo "💾 Criando commit inicial..."
git commit -m "🎉 Commit inicial - AutoOn EAD Platform

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

🚀 Generated with Claude Code"

echo ""
echo "✅ Repositório Git inicializado com sucesso!"
echo ""
echo "======================================"
echo "  Próximos passos"
echo "======================================"
echo ""
echo "1. Criar repositório no GitHub/GitLab:"
echo "   https://github.com/new"
echo ""
echo "2. Adicionar remote:"
echo "   git remote add origin https://github.com/seu-usuario/autoon.git"
echo ""
echo "3. Fazer push:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. Para clonar em outra máquina:"
echo "   git clone https://github.com/seu-usuario/autoon.git"
echo "   cd autoon"
echo "   cp .env.production.example .env.production"
echo "   # Edite .env.production com suas senhas"
echo "   docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
