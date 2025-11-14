# Guia de Implementação - AutoOn CNH Online

## Status Atual do Projeto

### ✅ Concluído

#### Backend
- [x] Modelos de dados: Subscription, Payment
- [x] APIs de Subscriptions e Payments
- [x] Guard de verificação de assinatura ativa
- [x] Integração com Mercado Pago/Stripe (estrutura base)
- [x] Proteção de rotas sensíveis (Enrollments)

#### Frontend
- [x] Tema roxo configurado no Tailwind
- [x] Landing Page completa
- [x] Router configurado
- [x] Estilos customizados com tema AutoOn

### 🔄 Próximos Passos Importantes

#### 1. Migração do Banco de Dados
```bash
cd apps/api
pnpm prisma migrate dev --name add-subscriptions-and-payments
pnpm prisma generate
```

#### 2. Criar Páginas do Frontend

**a) LoginPage.vue e RegisterPage.vue**
- Formulários com validação
- Design roxo consistente
- Integração com auth store

**b) CheckoutPage.vue**
- Página de pagamento
- Exibir plano de R$ 99,99
- Botão para processar pagamento

**c) Dashboard do Aluno (student/Dashboard.vue)**
- Exibir status da assinatura
- Meus cursos matriculados
- Progresso geral

**d) CoursesPage.vue**
- Listagem de cursos disponíveis
- Filtros e busca
- Botão de matrícula

**e) Admin Dashboard**
- Estatísticas gerais
- Gestão de usuários
- Gestão de cursos
- Gestão de assinaturas/pagamentos

#### 3. Banco de Questões CNH

**Adicionar ao schema.prisma:**
```prisma
enum QuestionCategory {
  LEGISLACAO
  SINALIZACAO
  DIRECAO_DEFENSIVA
  PRIMEIROS_SOCORROS
  MECANICA_BASICA
}

model CNHQuestion {
  id          String             @id @default(uuid())
  category    QuestionCategory
  statement   String             @db.Text
  imageUrl    String?
  options     Json               @default("[]")
  answerKey   String[]
  explanation String?            @db.Text
  difficulty  Int                @default(1)
  isActive    Boolean            @default(true)
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@index([category])
  @@index([difficulty])
}
```

**Seeds de questões:**
- Legislação de Trânsito: 100+ questões
- Sinalização: 100+ questões
- Direção Defensiva: 80+ questões
- Primeiros Socorros: 50+ questões

#### 4. Variáveis de Ambiente

**apps/api/.env:**
```env
# Database
DATABASE_URL="postgresql://autoon:autoon123@localhost:5432/autoon"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Storage
STORAGE_PROVIDER=S3

# MinIO/S3
S3_ENDPOINT=localhost:9000
S3_USE_SSL=false
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=autoon-videos
S3_REGION=us-east-1

# Azure Blob (opcional)
AZURE_STORAGE_ACCOUNT=
AZURE_STORAGE_KEY=
AZURE_STORAGE_CONTAINER=autoon-videos
AZURE_STORAGE_ENDPOINT_SUFFIX=core.windows.net
AZURE_UPLOAD_URL_TTL_SECONDS=3600
AZURE_AUTO_CONFIGURE_CORS=true
AZURE_CORS_ALLOWED_ORIGINS=http://localhost:5173
AZURE_CORS_ALLOWED_METHODS=GET,HEAD,PUT,POST,DELETE,OPTIONS
AZURE_CORS_ALLOWED_HEADERS=*
AZURE_CORS_EXPOSED_HEADERS=*
AZURE_CORS_MAX_AGE=3600

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# App
PORT=3000
NODE_ENV=development
API_URL=http://localhost:3000
WEB_URL=http://localhost:5173

# Payments
MERCADO_PAGO_ACCESS_TOKEN=your-mp-access-token
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Upload
MAX_FILE_SIZE_BYTES=5368709120
MULTIPART_PART_SIZE=10485760
HLS_URL_EXPIRY_SECONDS=300
```

**apps/web/.env:**
```env
VITE_API_URL=http://localhost:3000
```

#### 5. Criação de Cursos de Exemplo

**Seed para cursos CNH:**

```typescript
// apps/api/prisma/seed-cnh.ts
const cnhCourses = [
  {
    title: 'Legislação de Trânsito',
    description: 'Código de Trânsito Brasileiro completo...',
    workloadHours: 45,
    modules: [
      {
        title: 'Introdução ao CTB',
        lessons: [
          { title: 'O que é o Código de Trânsito Brasileiro' },
          { title: 'Direitos e Deveres do Condutor' },
        ]
      },
      {
        title: 'Infrações e Penalidades',
        lessons: [
          { title: 'Tipos de Infrações' },
          { title: 'Sistema de Pontuação' },
        ]
      }
    ]
  },
  {
    title: 'Sinalização de Trânsito',
    description: 'Placas, semáforos e marcas viárias',
    workloadHours: 30,
    modules: [
      {
        title: 'Placas de Regulamentação',
        lessons: [
          { title: 'Placas de Parada Obrigatória' },
          { title: 'Placas de Velocidade' },
        ]
      },
      {
        title: 'Placas de Advertência',
        lessons: [
          { title: 'Curvas e Lombadas' },
          { title: 'Travessias e Cruzamentos' },
        ]
      }
    ]
  },
  {
    title: 'Direção Defensiva',
    description: 'Técnicas para dirigir com segurança',
    workloadHours: 16,
  },
  {
    title: 'Primeiros Socorros',
    description: 'Procedimentos básicos em acidentes',
    workloadHours: 12,
  }
];
```

#### 6. Funcionalidades de Pagamento

**a) Integração Mercado Pago (Recomendado para Brasil):**
```typescript
// apps/api/src/payments/providers/mercado-pago.service.ts
import mercadopago from 'mercadopago';

export class MercadoPagoService {
  async createPreference(amount: number, userId: string) {
    const preference = {
      items: [
        {
          title: 'Plano Premium AutoOn',
          unit_price: amount,
          quantity: 1,
        }
      ],
      back_urls: {
        success: `${process.env.WEB_URL}/payment/success`,
        failure: `${process.env.WEB_URL}/payment/failure`,
        pending: `${process.env.WEB_URL}/payment/pending`,
      },
      external_reference: userId,
    };

    const response = await mercadopago.preferences.create(preference);
    return response.body.init_point;
  }
}
```

**b) Página de Sucesso do Pagamento:**
- Redirecionar para `/dashboard` após confirmação
- Ativar assinatura automaticamente via webhook
- Enviar email de boas-vindas

#### 7. Scripts de Deploy

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    ports:
      - '3000:3000'
    depends_on:
      - postgres
      - redis
      - minio

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - '80:80'
    environment:
      - VITE_API_URL=${API_URL}
```

#### 8. Checklist de Lançamento

- [ ] Rodar migrações em produção
- [ ] Popular banco com cursos e questões
- [ ] Testar fluxo completo de pagamento
- [ ] Configurar webhooks do Mercado Pago
- [ ] Configurar domínio e SSL
- [ ] Testar envio de emails
- [ ] Configurar backup do banco de dados
- [ ] Configurar monitoramento (Sentry, etc)
- [ ] Testar em dispositivos móveis
- [ ] Preparar documentação de uso

#### 9. Roadmap Futuro

**Curto Prazo (1-2 meses):**
- App mobile (React Native)
- Sistema de gamificação
- Ranking de alunos
- Notificações push

**Médio Prazo (3-6 meses):**
- Simulador de direção 3D
- Integração com agendamento de exames DETRAN
- Sistema de indicação e cashback
- Cursos de reciclagem

**Longo Prazo (6+ meses):**
- Expansão para outros tipos de habilitação (Moto, Caminhão)
- Parcerias com autoescolas
- Marketplace de instrutores
- Chatbot com IA para dúvidas

## Comandos Úteis

### Desenvolvimento
```bash
# Instalar dependências
pnpm install

# Iniciar infraestrutura
docker compose up -d

# Rodar migrações
pnpm db:migrate

# Popular banco
pnpm db:seed

# Iniciar dev servers
pnpm dev

# Build para produção
pnpm build
```

### Banco de Dados
```bash
# Criar migração
pnpm --filter @autoon/api prisma migrate dev --name migration-name

# Gerar cliente Prisma
pnpm --filter @autoon/api prisma generate

# Abrir Prisma Studio
pnpm --filter @autoon/api db:studio

# Reset banco (cuidado!)
pnpm --filter @autoon/api prisma migrate reset
```

### Testes
```bash
# Rodar testes
pnpm test

# Testes com coverage
pnpm test:cov

# Testes E2E
pnpm test:e2e
```

## Arquitetura de Pastas

```
AutoOn/
├── apps/
│   ├── api/              # Backend NestJS
│   │   ├── src/
│   │   │   ├── subscriptions/
│   │   │   ├── payments/
│   │   │   ├── courses/
│   │   │   ├── quizzes/
│   │   │   └── ...
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── web/              # Frontend Vue 3
│       ├── src/
│       │   ├── views/
│       │   │   ├── LandingPage.vue  ✅
│       │   │   ├── LoginPage.vue
│       │   │   ├── RegisterPage.vue
│       │   │   ├── CheckoutPage.vue
│       │   │   ├── student/
│       │   │   │   ├── Dashboard.vue
│       │   │   │   └── CoursesPage.vue
│       │   │   └── admin/
│       │   │       ├── AdminDashboard.vue
│       │   │       ├── CoursesManagement.vue
│       │   │       └── UsersManagement.vue
│       │   ├── components/
│       │   ├── stores/
│       │   ├── router/
│       │   └── services/
│       └── tailwind.config.js  ✅
├── packages/
│   ├── types/
│   ├── utils/
│   └── config/
└── docker-compose.yml
```

## Recursos e Links

- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Vue 3 Docs](https://vuejs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Mercado Pago Docs](https://www.mercadopago.com.br/developers)
- [DETRAN - Regras CNH](https://www.gov.br/infraestrutura/pt-br/assuntos/transito/conteudo-denatran)

## Suporte

Para dúvidas ou problemas, consulte a documentação ou abra uma issue no repositório.

---

**Última atualização:** 2025-01-14
**Versão:** 1.0.0
**Status:** Em Desenvolvimento Ativo
