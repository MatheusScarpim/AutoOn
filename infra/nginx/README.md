# Configuração Nginx para Produção

Este diretório contém as configurações do Nginx para o AutoOn em produção.

## Domínios

- **Frontend**: https://autoon.scarlat.dev.br
- **Backend API**: https://autoon-api.scarlat.dev.br

## Instalação

### 1. Instalar Nginx e Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo yum install nginx certbot python3-certbot-nginx -y
```

### 2. Copiar Arquivos de Configuração

```bash
# Copiar configurações para o Nginx
sudo cp autoon.scarlat.dev.br.conf /etc/nginx/sites-available/
sudo cp autoon-api.scarlat.dev.br.conf /etc/nginx/sites-available/

# Criar links simbólicos
sudo ln -s /etc/nginx/sites-available/autoon.scarlat.dev.br.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/autoon-api.scarlat.dev.br.conf /etc/nginx/sites-enabled/
```

### 3. Configurar DNS

Antes de obter os certificados SSL, configure os registros DNS:

```
Tipo    Nome           Valor
A       autoon         <IP-DO-SERVIDOR>
A       autoon-api     <IP-DO-SERVIDOR>
```

Ou usando CNAME se preferir:

```
Tipo    Nome           Valor
CNAME   autoon         scarlat.dev.br
CNAME   autoon-api     scarlat.dev.br
```

### 4. Obter Certificados SSL (Let's Encrypt)

```bash
# Para o frontend
sudo certbot --nginx -d autoon.scarlat.dev.br

# Para a API
sudo certbot --nginx -d autoon-api.scarlat.dev.br
```

O Certbot irá:
- Obter os certificados SSL
- Configurar o Nginx automaticamente
- Configurar renovação automática

### 5. Ajustar Configurações

Edite os arquivos de configuração se necessário:

**Para Docker Compose:**

No arquivo `autoon-api.scarlat.dev.br.conf`, altere o upstream:

```nginx
upstream autoon_api {
    server autoon-api-prod:3000;  # Nome do container do Docker
    keepalive 32;
}
```

**Para deploy direto (sem Docker):**

```nginx
upstream autoon_api {
    server localhost:3000;  # Porta onde a API está rodando
    keepalive 32;
}
```

### 6. Deploy do Frontend

Copie os arquivos compilados do Vue.js para o diretório do Nginx:

```bash
# Criar diretório
sudo mkdir -p /var/www/autoon/web/dist

# Copiar arquivos do build (após rodar pnpm build no projeto)
sudo cp -r apps/web/dist/* /var/www/autoon/web/dist/

# Ajustar permissões
sudo chown -R www-data:www-data /var/www/autoon
sudo chmod -R 755 /var/www/autoon
```

### 7. Testar e Reiniciar Nginx

```bash
# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Habilitar inicialização automática
sudo systemctl enable nginx
```

## Variáveis de Ambiente

Atualize o arquivo `.env.production` com os domínios:

```bash
# CORS
CORS_ORIGIN=https://autoon.scarlat.dev.br

# URLs
APP_URL=https://autoon.scarlat.dev.br
VITE_API_URL=https://autoon-api.scarlat.dev.br
```

## Firewall

Certifique-se de que as portas estão abertas:

```bash
# UFW (Ubuntu)
sudo ufw allow 'Nginx Full'
sudo ufw allow 22/tcp
sudo ufw enable

# Firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Renovação Automática de Certificados

O Certbot cria um cron job automaticamente. Para testar a renovação:

```bash
# Testar renovação
sudo certbot renew --dry-run

# Forçar renovação (se necessário)
sudo certbot renew --force-renewal
```

## Logs

Verificar logs do Nginx:

```bash
# Access logs da API
sudo tail -f /var/log/nginx/autoon-api.access.log

# Error logs da API
sudo tail -f /var/log/nginx/autoon-api.error.log

# Logs gerais do Nginx
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Erro 502 Bad Gateway

```bash
# Verificar se a API está rodando
curl http://localhost:3000/health

# Verificar logs da API
docker logs autoon-api-prod

# Verificar status do Nginx
sudo systemctl status nginx
```

### Erro 404 no frontend (rotas do Vue)

Certifique-se de que a configuração tem `try_files $uri $uri/ /index.html;` para o SPA funcionar.

### CORS errors

Ajuste os headers CORS no arquivo `autoon-api.scarlat.dev.br.conf`:

```nginx
add_header Access-Control-Allow-Origin "https://autoon.scarlat.dev.br" always;
```

## Segurança Adicional

### Limitar taxa de requisições (Rate Limiting)

Adicione no bloco `http` do `/etc/nginx/nginx.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

E no server block da API:

```nginx
location / {
    limit_req zone=api_limit burst=20 nodelay;
    # ... resto da configuração
}
```

### Firewall de Aplicação (ModSecurity)

Para proteção adicional, considere instalar o ModSecurity:

```bash
sudo apt install libnginx-mod-security
```

## Monitoramento

### Verificar status do Nginx

```bash
# Status do serviço
sudo systemctl status nginx

# Conexões ativas
sudo nginx -T | grep worker_connections

# Estatísticas em tempo real
sudo apt install nginx-module-vts
```

## Backup

Faça backup regular das configurações:

```bash
# Backup das configurações
sudo tar -czf nginx-config-backup-$(date +%Y%m%d).tar.gz /etc/nginx/

# Backup dos certificados SSL
sudo tar -czf ssl-certs-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/
```
