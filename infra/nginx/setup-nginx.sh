#!/bin/bash

# Script para configurar Nginx com SSL para AutoOn
# Domínio: scarlat.dev.br
# Subdomínios: autoon.scarlat.dev.br e autoon-api.scarlat.dev.br

set -e

echo "========================================"
echo "  AutoOn - Configuração Nginx + SSL"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Execute este script como root (sudo)${NC}"
    exit 1
fi

# Variáveis
DOMAIN_FRONTEND="autoon.scarlat.dev.br"
DOMAIN_API="autoon-api.scarlat.dev.br"
EMAIL="contato@scarlat.dev.br"  # Altere para seu email

echo -e "${YELLOW}📋 Configuração:${NC}"
echo "   Frontend: https://$DOMAIN_FRONTEND"
echo "   API: https://$DOMAIN_API"
echo "   Email: $EMAIL"
echo ""

read -p "Continuar com estas configurações? (s/N): " confirm
if [[ $confirm != [sS] ]]; then
    echo -e "${RED}❌ Operação cancelada.${NC}"
    exit 1
fi

# 1. Instalar Nginx e Certbot
echo ""
echo -e "${GREEN}1. Instalando Nginx e Certbot...${NC}"
if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get install -y nginx certbot python3-certbot-nginx
elif command -v yum &> /dev/null; then
    yum install -y nginx certbot python3-certbot-nginx
else
    echo -e "${RED}❌ Gerenciador de pacotes não suportado${NC}"
    exit 1
fi

# 2. Criar diretórios
echo ""
echo -e "${GREEN}2. Criando diretórios...${NC}"
mkdir -p /var/www/autoon/web/dist
mkdir -p /var/log/nginx

# 3. Copiar configurações do Nginx (sem SSL primeiro)
echo ""
echo -e "${GREEN}3. Configurando Nginx (HTTP temporário)...${NC}"

# Configuração temporária para frontend (HTTP only)
cat > /etc/nginx/sites-available/$DOMAIN_FRONTEND <<'EOF'
server {
    listen 80;
    server_name autoon.scarlat.dev.br;

    root /var/www/autoon/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /health {
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Configuração temporária para API (HTTP only)
cat > /etc/nginx/sites-available/$DOMAIN_API <<'EOF'
upstream autoon_api {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name autoon-api.scarlat.dev.br;

    client_max_body_size 6G;

    location / {
        proxy_pass http://autoon_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/autoon-api.access.log;
    error_log /var/log/nginx/autoon-api.error.log;
}
EOF

# Criar links simbólicos
ln -sf /etc/nginx/sites-available/$DOMAIN_FRONTEND /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/$DOMAIN_API /etc/nginx/sites-enabled/

# Remover default se existir
rm -f /etc/nginx/sites-enabled/default

# 4. Testar configuração do Nginx
echo ""
echo -e "${GREEN}4. Testando configuração do Nginx...${NC}"
nginx -t

# 5. Reiniciar Nginx
echo ""
echo -e "${GREEN}5. Reiniciando Nginx...${NC}"
systemctl restart nginx
systemctl enable nginx

# 6. Verificar DNS
echo ""
echo -e "${YELLOW}📡 Verificando DNS...${NC}"
for domain in $DOMAIN_FRONTEND $DOMAIN_API; do
    if host $domain > /dev/null 2>&1; then
        echo -e "   ✅ $domain"
    else
        echo -e "   ${RED}❌ $domain - DNS não configurado!${NC}"
        echo -e "   ${YELLOW}Configure o DNS antes de obter certificados SSL${NC}"
    fi
done

# 7. Obter certificados SSL
echo ""
echo -e "${GREEN}6. Obtendo certificados SSL com Let's Encrypt...${NC}"
echo -e "${YELLOW}⚠️  Certifique-se de que os domínios apontam para este servidor!${NC}"
read -p "Os domínios já estão configurados no DNS? (s/N): " dns_ready

if [[ $dns_ready == [sS] ]]; then
    # Obter certificado para frontend
    certbot --nginx -d $DOMAIN_FRONTEND --non-interactive --agree-tos --email $EMAIL --redirect

    # Obter certificado para API
    certbot --nginx -d $DOMAIN_API --non-interactive --agree-tos --email $EMAIL --redirect

    echo ""
    echo -e "${GREEN}✅ Certificados SSL obtidos com sucesso!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Pule a obtenção de SSL por enquanto${NC}"
    echo -e "   Execute manualmente após configurar o DNS:"
    echo -e "   ${GREEN}sudo certbot --nginx -d $DOMAIN_FRONTEND${NC}"
    echo -e "   ${GREEN}sudo certbot --nginx -d $DOMAIN_API${NC}"
fi

# 8. Configurar firewall
echo ""
echo -e "${GREEN}7. Configurando firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
    echo "y" | ufw enable || true
    echo -e "${GREEN}✅ UFW configurado${NC}"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo -e "${GREEN}✅ Firewalld configurado${NC}"
fi

# 9. Configurar renovação automática
echo ""
echo -e "${GREEN}8. Configurando renovação automática de certificados...${NC}"
systemctl enable certbot.timer || true
systemctl start certbot.timer || true

# 10. Resumo final
echo ""
echo "========================================"
echo -e "  ${GREEN}✅ Configuração concluída!${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo ""
echo "1. Deploy do frontend:"
echo "   cd /path/to/AutoOn/apps/web"
echo "   pnpm build"
echo "   sudo cp -r dist/* /var/www/autoon/web/dist/"
echo "   sudo chown -R www-data:www-data /var/www/autoon"
echo ""
echo "2. Iniciar a API:"
echo "   cd /path/to/AutoOn"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "3. Atualizar .env.production:"
echo "   CORS_ORIGIN=https://$DOMAIN_FRONTEND"
echo "   APP_URL=https://$DOMAIN_FRONTEND"
echo "   VITE_API_URL=https://$DOMAIN_API"
echo ""
echo "4. Verificar status:"
echo "   sudo systemctl status nginx"
echo "   sudo certbot certificates"
echo ""
echo "5. Testar:"
echo "   https://$DOMAIN_FRONTEND"
echo "   https://$DOMAIN_API/health"
echo ""
echo -e "${GREEN}🎉 Nginx configurado com sucesso!${NC}"
