# Unidos de Avidos - Website

Website da associação **Unidos de Avidos**, participante nas Marchas Antoninas de Vila Nova de Famalicão desde 2005.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| **Backend** | Next.js API Routes (Server Actions ready) |
| **Base de Dados** | MongoDB Atlas (produção) + Prisma ORM |
| **Autenticação** | JWT (cookie httpOnly) + registo/login por email |

### Porquê esta stack?
- **Next.js**: SSR/SSG, ótimo SEO, API integrada, deployment fácil (Vercel)
- **Tailwind**: Mobile-first, design responsivo rápido
- **Prisma**: ORM type-safe, seeds
- **MongoDB Atlas**: hosted, escalável, fácil de gerir

## Estrutura do Projeto

```
src/
├── app/                    # App Router
│   ├── aluguer-roupas/     # Catálogo e reservas (prioridade 1)
│   ├── api/                # API Routes
│   ├── sobre/              # Sobre Nós
│   ├── galeria/            # Galeria por ano
│   └── ...
├── components/             # Header, Footer
└── lib/                    # Prisma client
```

## Como executar

```bash
# Instalar dependências
npm install

# Configurar variáveis locais (dev)
cp .env.example .env.local
# editar .env.local com credenciais de TESTE (nunca produção)

# Criar/atualizar coleções no MongoDB (MongoDB não usa migrations no Prisma)
npm run db:push

# Popular com dados de exemplo
npm run db:seed

# Iniciar desenvolvimento
npm run dev
```

Aceda a http://localhost:3000

## Separação de ambientes (Local vs Produção)

### Objetivo
- **Localhost**: testar funcionalidades sem tocar em dados reais.
- **Vercel Produção**: usar apenas credenciais reais e base de dados real.

### Regras obrigatórias
- Nunca commitar `.env.local` (já está protegido em `.gitignore`).
- Usar **bases de dados diferentes** (`unidos-avidos-dev` vs `unidos-avidos-prod`).
- Usar **Cloudinary separada** (conta/pasta dev diferente da produção).
- Usar **segredos diferentes** (`AUTH_SECRET`, `CRON_SECRET`, etc.).

### 1) Configurar ambiente local (desenvolvimento)
1. Copiar o template:
   ```bash
   cp .env.example .env.local
   ```
2. Em `.env.local`, preencher com:
   - `DATABASE_URL` de **teste/dev**
   - `AUTH_SECRET` de **teste**
   - `CLOUDINARY_URL` (ou chaves) de **teste**
   - `RESEND_API_KEY` de **teste** (opcional)
3. Aplicar schema à BD de teste:
   ```bash
   npm run db:push
   ```
4. (Opcional) semear dados de teste:
   ```bash
   npm run db:seed
   ```
5. Arrancar app local:
   ```bash
   npm run dev
   ```

### 2) Configurar produção no Vercel
No painel do Vercel (`Project > Settings > Environment Variables`), definir **apenas valores reais** para `Production`:
- `DATABASE_URL` (produção)
- `AUTH_SECRET` (produção)
- `RESEND_API_KEY` e `MAIL_FROM` (produção)
- `CLOUDINARY_URL` (ou `CLOUDINARY_*`) de produção
- `APP_URL` (domínio final)
- `CRON_SECRET`
- `CLOUDINARY_ASSET_FOLDER` (ex.: `unidos-avidos-prod`)

Não colocar segredos de produção em ficheiros locais do projeto.

## Fluxo Git + Vercel (deploy automático)

### Como o Vercel deteta atualizações
- O Vercel escuta o repositório Git ligado ao projeto.
- Cada `git push` para branch com ambiente configurado dispara build/deploy.
- **Recomendado**:
  - branch `main` -> Produção
  - outras branches -> Preview Deploys

### Fluxo diário recomendado
1. Atualizar código local:
   ```bash
   git pull
   ```
2. Trabalhar/testar localmente:
   ```bash
   npm run lint
   npm run build
   ```
3. Commit das alterações:
   ```bash
   git add .
   git commit -m "feat: descrição curta da alteração"
   ```
4. Enviar para repositório:
   ```bash
   git push
   ```
5. Verificar deploy no Vercel (logs de build/runtime).

### Fluxo seguro para evitar impacto em produção
1. Criar branch de trabalho:
   ```bash
   git checkout -b feature/nome-da-tarefa
   ```
2. Desenvolver e validar (`lint`, `build`) localmente.
3. `git push -u origin feature/nome-da-tarefa` -> gera Preview no Vercel.
4. Validar Preview.
5. Merge para `main` -> deploy automático em produção.

## Comandos do dia a dia (resumo)

```bash
# 1) sincronizar
git pull

# 2) correr em local (ambiente dev)
npm run dev

# 3) validar antes de publicar
npm run lint
npm run build

# 4) publicar alterações
git add .
git commit -m "chore: atualizar ..."
git push
```

## Logs (Super Admin) — retenção (12 meses)

O sistema de logs de auditoria (`AdminAuditLog`) tem uma limpeza automática para evitar acumulação.

- **Retenção**: 12 meses (365 dias)
- **Execução**: 1x por mês via Vercel Cron (ficheiro `vercel.json`)
- **Rota**: `GET /api/cron/cleanup-logs` (protegida por segredo)

### Configuração

Adicionar no ambiente (Vercel e local, se quiser testar):

- `CRON_SECRET`: um valor longo e aleatório

O cron chama a rota com header:

- `Authorization: Bearer <CRON_SECRET>`

## Funcionalidades

### ✅ Implementadas
- Layout base (Header com logo e navegação, Footer global)
- Página inicial com Hero e secções
- **Aluguer de Roupas**: Catálogo com roupas desde 2005
- Detalhe de cada roupa com ano, tema, preço, disponibilidade
- **Calendário de disponibilidade** (Verde=Livre, Vermelho=Alugada, Laranja=Manutenção)
- Formulário de pedido de reserva (nome, email, datas, quantidades)
- API para disponibilidade e criação de reservas
- **Formulário de contacto** (Resend) – mensagens enviadas para unidosdeavidos@gmail.com

### Notificações (in-app e email)
- **In-app**: contador no ícone do perfil (atualização ao mudar de página, ao voltar ao separador, eventos locais e **polling ~12–15 s**). Não é WebSocket nativo; em serverless puro o push exige serviço extra (ex.: Pusher, Ably) ou SSE com backend com estado partilhado.
- **Email** (Resend): já usado em novo pedido de reserva (admins) e **alteração de estado da reserva** (utilizador com conta), desde que `RESEND_API_KEY`, `MAIL_FROM` e **domínio verificado** no Resend estejam corretos; sem API key o fluxo continua sem falhar.

#### Entregabilidade (evitar spam em Gmail, SAPO, etc.)
- **DNS**: SPF/DKIM verificados no Resend; DMARC recomendado (`_dmarc` em `p=none` para começar, depois apertar).
- **Remetente**: `MAIL_FROM` com domínio próprio (ex.: `Unidos de Avidos <no-reply@unidosdeavidos.pt>`). Evitar assuntos genéricos tipo “teste” ou só emojis.
- **Conta nova**: Os primeiros envios podem ir para spam até a reputação do domínio estabilizar; na caixa SAPO pode **marcar como “Não é spam”** (ajuda o filtro).
- **Código**: o envio inclui versão **texto + HTML** e cabeçalho útil para mensagens transacionais; isto ajuda alguns filtros.

### Imagens — Cloudinary (opcional)

As fotos (galeria, capas, aluguer de roupas) são **sempre normalizadas no servidor com Sharp** (HEIC, DNG/ProRAW quando o libvips consegue ler). **Sem variáveis Cloudinary**, continuam a ser gravadas em `public/` como antes.

**Com `CLOUDINARY_URL` ou `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`** (ver `.env.example`):
- O mesmo fluxo de upload grava no **Cloudinary** (pastas `…/galeria/{ano}/`, `…/roupas/{id}/`) e guarda `https://res.cloudinary.com/...` na base de dados.
- **DNG**: quando o Sharp não consegue converter, se o Cloudinary estiver configurado é tentado um **fallback** (upload + *eager* JPEG no Cloudinary).
- **Remoções**: apagar fotos no admin remove o ficheiro local **ou** invalida o asset no Cloudinary quando aplicável.
- **Next/Image**: `next.config.ts` inclui `res.cloudinary.com` em `images.remotePatterns`. Se usares **CNAME** próprio, acrescenta o hostname aí também.

Código principal: `src/lib/media/` (`store-web-image`, `cloudinary`, `remove-stored-asset`), validações em `gallery-images.ts` / `roupa-images.ts`.

### 🔜 Próximos passos
- Melhorar gestão de campanhas email para utilizadores com consentimento ativo
- Painel Admin para aprovar/rejeitar reservas
- Hero com carrossel de fotos real
- Páginas Sobre Nós, Galeria completas
