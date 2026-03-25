# Plano de Lançamento — Sistema Financeiro SaaS
## 25/03/2026 → 01/04/2026

**Stack:** Next.js 16 · TypeScript · Supabase · Vercel · Tailwind CSS · PWA
**Módulos:** CRM · Financeiro Empresarial · Finanças Pessoais
**Prazo:** 7 dias úteis
**Status atual do código:** Funcional, sem multi-tenant, sem auth de usuários, sem cobrança

---

## DIAGNÓSTICO DO CÓDIGO ATUAL

Antes das análises de mercado, é essencial registrar o que foi encontrado no codebase:

| Item | Estado | Impacto no Lançamento |
|------|--------|-----------------------|
| RLS no Supabase | **DESABILITADO** (`DISABLE ROW LEVEL SECURITY`) | BLOQUEADOR CRÍTICO |
| Auth de usuários | Ausente — só service key | BLOQUEADOR CRÍTICO |
| Multi-tenant | Sem `user_id` nas tabelas | BLOQUEADOR CRÍTICO |
| Cobrança recorrente | Não implementada | CRÍTICO para monetização |
| `supabaseAdmin` usado em rotas GET | Service key exposta em lógica de leitura | RISCO DE SEGURANÇA |
| LGPD | Sem política de privacidade, sem logs de auditoria | RISCO LEGAL |
| OCR com Claude Vision | Implementado (`/api/pf/ocr`) | Diferencial pronto |
| Voz em PT-BR | Implementado | Diferencial pronto |
| PWA / manifest | Implementado | Diferencial pronto |
| DnD widgets | Implementado (`@dnd-kit`) | Diferencial pronto |

---

## 1. ANÁLISE COMPARATIVA DE MERCADO

### 1.1 Tabela de Comparação

| Funcionalidade | Nosso Sistema | Organizze | Mobills | Minhas Economias | Conta Azul | Nibo | ZeroPaper |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Finanças Pessoais** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Financeiro Empresarial** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **CRM integrado** | ✅ | ❌ | ❌ | ❌ | Parcial | ❌ | ❌ |
| **Lançamento por voz** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **OCR de comprovantes** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Consultor IA financeiro** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Dashboard drag-and-drop** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **PWA instalável** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **DRE automático** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Fluxo de caixa** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **App mobile nativo** | ❌ (PWA) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Importação OFX/CSV** | Parcial | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Conciliação bancária** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **NFe / NFSe** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Preço mensal** | A definir | R$19,90 | Freemium | Freemium | R$69 | R$89 | R$39 |

### 1.2 Pontos Fortes vs. Mercado

**Diferencial exclusivo — nenhum concorrente direto tem os 3 juntos:**

1. **IA nativa end-to-end** — voz + OCR + consultor em PT-BR com contexto financeiro real (não é chatbot genérico)
2. **3-em-1 integrado** — CRM + Financeiro Empresarial + Finanças Pessoais numa única plataforma
3. **OCR de comprovantes** — foto do cupom fiscal/boleto → lançamento automático. Mobills tem algo similar mas básico; o nosso usa Claude Vision com interpretação semântica
4. **Dashboard customizável** — drag-and-drop de widgets, algo que só ferramentas enterprise como Zoho oferecem
5. **PWA real** — instalável no iPhone e Android sem app store, funciona offline
6. **Stack moderna** — Next.js 16 + React 19, performance superior aos concorrentes em PHP/Ruby legado

### 1.3 Gaps Críticos para o Lançamento

| Gap | Gravidade | Por que importa |
|-----|-----------|-----------------|
| Sem multi-tenant / RLS | 🔴 BLOQUEADOR | Todos veem dados de todos |
| Sem autenticação | 🔴 BLOQUEADOR | Qualquer pessoa acessa tudo |
| Sem cobrança recorrente | 🔴 CRÍTICO | Sem receita |
| Sem importação OFX/CSV completa | 🟡 IMPORTANTE | Concorrentes têm; usuários esperam |
| Sem app mobile nativo | 🟡 IMPORTANTE | PWA compensa mas usuários preferem App Store |
| Sem conciliação bancária | 🟡 IMPORTANTE | Dor real de PMEs |
| Sem integração Open Finance | 🟢 DESEJÁVEL | Futuro |
| Sem NFe/NFSe | 🟢 DESEJÁVEL | Nicho específico |

### 1.4 Funcionalidades a Adicionar (pós-lançamento, 30-90 dias)

- **Open Finance / Belvo** — conexão automática com banco (maior diferencial do mercado em 2026)
- **Importação OFX completa** — padrão de mercado, esperado por PMEs
- **Notificações push** — lembretes de contas vencendo, metas atingidas
- **Relatórios exportáveis em PDF** — exigido por contadores
- **Integração com contador** — acesso de leitura para contadores dos clientes
- **App nativo React Native** — após validação do produto

---

## 2. CRONOGRAMA 7 DIAS (25/03 → 01/04/2026)

### Legenda
- **Dev/IA** = Claude Code executa autonomamente
- **Valter** = decisão/configuração manual necessária
- **Plataforma** = Vercel, Supabase, provedor de pagamento

```
PRIORIDADE: 🔴 CRÍTICO | 🟡 IMPORTANTE | 🟢 DESEJÁVEL
```

---

### DIA 1 — Quarta 25/03 | FUNDAÇÃO: Multi-tenant + Auth

**Meta do dia:** Ninguém mais vê dados de outro usuário. Sistema tem login real.

| # | Tarefa | Executor | Prioridade | Horas |
|---|--------|----------|------------|-------|
| 1.1 | Criar coluna `user_id UUID REFERENCES auth.users(id)` em TODAS as tabelas de dados (`pf_transactions`, `pf_accounts`, `pf_goals`, `pf_budgets`, `pf_categories`, tabelas financeiras, tabelas CRM) | Dev/IA | 🔴 | 2h |
| 1.2 | Habilitar RLS e criar policies em todas as tabelas (ver seção 3) | Dev/IA | 🔴 | 2h |
| 1.3 | Criar páginas `/login`, `/signup`, `/forgot-password` com Supabase Auth | Dev/IA | 🔴 | 3h |
| 1.4 | Criar middleware Next.js que protege todas as rotas autenticadas | Dev/IA | 🔴 | 1h |
| 1.5 | Migrar cliente Supabase nas rotas de API de `supabaseAdmin` (service key) para cliente autenticado do usuário | Dev/IA | 🔴 | 2h |
| 1.6 | **Valter:** Configurar domínio `gestao.valterleite.com.br` no Vercel (DNS) | Valter + Vercel | 🔴 | 1h |

**Total Dia 1:** ~11h — dividir em 2 sessões (manhã e tarde)

---

### DIA 2 — Quinta 26/03 | AUTH COMPLETO + ONBOARDING

| # | Tarefa | Executor | Prioridade | Horas |
|---|--------|----------|------------|-------|
| 2.1 | Implementar Google OAuth no Supabase + página de login | Dev/IA | 🔴 | 2h |
| 2.2 | Implementar 2FA com TOTP (ver seção 5) | Dev/IA | 🔴 | 3h |
| 2.3 | Criar fluxo de onboarding (wizard 3 passos: perfil → primeiro módulo → tutorial) | Dev/IA | 🟡 | 3h |
| 2.4 | Criar tabela `user_profiles` (nome, plano, trial_ends_at, onboarding_completed) | Dev/IA | 🔴 | 1h |
| 2.5 | Implementar lógica de trial de 14 dias (middleware verifica `trial_ends_at`) | Dev/IA | 🔴 | 2h |
| 2.6 | **Valter:** Configurar projeto no Supabase Auth: habilitar Google, configurar redirect URLs | Valter + Supabase | 🔴 | 1h |

**Total Dia 2:** ~12h

---

### DIA 3 — Sexta 27/03 | COBRANÇA RECORRENTE

| # | Tarefa | Executor | Prioridade | Horas |
|---|--------|----------|------------|-------|
| 3.1 | **Valter:** Criar conta no Asaas (recomendado para BR) ou Stripe | Valter | 🔴 | 1h |
| 3.2 | Criar página `/planos` com cards dos planos e preços | Dev/IA | 🔴 | 2h |
| 3.3 | Implementar API `/api/billing/subscribe` (cria customer + assinatura no Asaas/Stripe) | Dev/IA | 🔴 | 3h |
| 3.4 | Implementar webhook de pagamento (`/api/webhook/billing`) — atualiza `user_profiles.plan` | Dev/IA | 🔴 | 3h |
| 3.5 | Implementar middleware de parede de pagamento (plano expirado → redirect para `/planos`) | Dev/IA | 🔴 | 2h |
| 3.6 | Criar página `/configuracoes/assinatura` (ver plano atual, cancelar, trocar) | Dev/IA | 🟡 | 2h |
| 3.7 | Testar ciclo completo: signup → trial → upgrade → webhook → acesso liberado | Dev/IA + Valter | 🔴 | 2h |

**Total Dia 3:** ~15h — dia mais pesado, foco total

---

### DIA 4 — Sábado 28/03 | SEGURANÇA + LGPD

| # | Tarefa | Executor | Prioridade | Horas |
|---|--------|----------|------------|-------|
| 4.1 | Implementar rate limiting nas rotas de API (ver seção 3) | Dev/IA | 🔴 | 2h |
| 4.2 | Criar tabela `audit_logs` e trigger de log em operações sensíveis | Dev/IA | 🔴 | 2h |
| 4.3 | Validação de inputs com Zod em todas as rotas de API | Dev/IA | 🔴 | 3h |
| 4.4 | Criar página `/privacidade` e `/termos` (conteúdo básico LGPD) | Dev/IA | 🔴 | 2h |
| 4.5 | Criar rota `/api/user/export-data` (LGPD art. 18 — portabilidade) | Dev/IA | 🟡 | 2h |
| 4.6 | Criar rota `/api/user/delete-account` com cascata de deleção | Dev/IA | 🟡 | 2h |
| 4.7 | Configurar headers de segurança no `next.config.ts` (CSP, HSTS, X-Frame-Options) | Dev/IA | 🔴 | 1h |
| 4.8 | **Valter:** Configurar backup automático diário no Supabase (painel Settings > Backups) | Valter + Supabase | 🔴 | 0.5h |

**Total Dia 4:** ~14.5h

---

### DIA 5 — Domingo 29/03 | TESTES + CORREÇÕES

| # | Tarefa | Executor | Prioridade | Horas |
|---|--------|----------|------------|-------|
| 5.1 | Testes de isolamento multi-tenant (criar 2 usuários, verificar que dados não vazam) | Dev/IA + Valter | 🔴 | 2h |
| 5.2 | Testes de fluxo completo: signup → onboarding → lançamento → relatório | Valter | 🔴 | 2h |
| 5.3 | Testes de cobrança: trial → expiração → upgrade → acesso | Dev/IA + Valter | 🔴 | 2h |
| 5.4 | Testes mobile (iPhone Safari + Android Chrome) — PWA, voz, OCR | Valter | 🟡 | 2h |
| 5.5 | Correção de bugs encontrados nos testes | Dev/IA | 🔴 | 4h |
| 5.6 | Testes de performance (ver seção 4) | Dev/IA | 🟡 | 2h |
| 5.7 | Revisar todos os console.log e remover dados sensíveis | Dev/IA | 🔴 | 1h |

**Total Dia 5:** ~15h (dia de buffer para bugs)

---

### DIA 6 — Segunda 31/03 | UX + POLISH + LANDING PAGE

| # | Tarefa | Executor | Prioridade | Horas |
|---|--------|----------|------------|-------|
| 6.1 | Criar landing page de captação (pode ser `/landing` ou domínio separado) | Dev/IA | 🟡 | 4h |
| 6.2 | Implementar notificações in-app (contas vencendo, metas, lembretes) | Dev/IA | 🟡 | 3h |
| 6.3 | Melhorias de UX no onboarding (ver seção 7) | Dev/IA | 🟡 | 2h |
| 6.4 | Implementar página de erro amigável (404, 500, sessão expirada) | Dev/IA | 🟡 | 1h |
| 6.5 | Configurar monitoramento (Vercel Analytics + Sentry) | Dev/IA + Valter | 🟡 | 2h |
| 6.6 | Criar email de boas-vindas via Supabase Edge Functions + Resend | Dev/IA | 🟡 | 2h |
| 6.7 | **Valter:** Configurar domínio de email para envio (SPF, DKIM, DMARC) | Valter | 🟡 | 1h |
| 6.8 | Deploy de produção final e smoke test | Dev/IA + Valter | 🔴 | 1h |

**Total Dia 6:** ~16h

---

### DIA 7 — Terça 01/04 | GO-LIVE

| # | Tarefa | Executor | Prioridade | Horas |
|---|--------|----------|------------|-------|
| 7.1 | Verificação final do checklist de segurança (seção 3) | Dev/IA + Valter | 🔴 | 1h |
| 7.2 | Smoke test em produção: cadastro + login + transação + cobrança | Valter | 🔴 | 1h |
| 7.3 | Divulgação para primeiros usuários (lista de espera, grupo WhatsApp) | Valter | 🔴 | — |
| 7.4 | Monitorar dashboard Vercel + Supabase durante as primeiras horas | Valter | 🔴 | — |
| 7.5 | Canal de suporte ativo (WhatsApp Business / email) | Valter | 🔴 | — |

---

## 3. CHECKLIST DE SEGURANÇA

### 3.1 Multi-tenant com Row Level Security (RLS)

**Migration SQL — executar no Supabase SQL Editor:**

```sql
-- PASSO 1: Adicionar user_id em todas as tabelas de dados
ALTER TABLE pf_accounts     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_goals        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_budgets      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_categories   ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- Repita para tabelas CRM e Financeiro Empresarial

-- PASSO 2: Habilitar RLS
ALTER TABLE pf_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_budgets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_categories   ENABLE ROW LEVEL SECURITY;

-- PASSO 3: Criar policies de isolamento
-- Padrão para TODAS as tabelas com user_id:
CREATE POLICY "usuarios_isolados_select" ON pf_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "usuarios_isolados_insert" ON pf_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usuarios_isolados_update" ON pf_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "usuarios_isolados_delete" ON pf_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Repita o bloco de 4 policies para cada tabela

-- PASSO 4: Tabela de perfis de usuário
CREATE TABLE user_profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT,
  plan             TEXT DEFAULT 'trial',  -- trial | personal | business | pro
  trial_ends_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  billing_customer_id TEXT,  -- ID do cliente no Asaas/Stripe
  onboarding_done  BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfil_proprio" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- PASSO 5: Trigger para criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**ATENÇÃO:** A tabela `sales` (Eduzz) é dados do Valter, não de usuários finais. Mantenha isolada ou crie policy específica para o user_id do Valter.

### 3.2 Autenticação — Práticas Obrigatórias

```typescript
// lib/auth.ts — helper para verificar sessão nas Server Actions e Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function requireAuth() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) throw new Error('Unauthorized')
  return { user, supabase }
}

// Uso em qualquer route handler:
export async function GET() {
  const { user, supabase } = await requireAuth()  // lança 401 se não autenticado
  const { data } = await supabase.from('pf_transactions').select('*')
  // RLS garante que só retorna dados do user
  return Response.json(data)
}
```

**Middleware de proteção de rotas (`middleware.ts`):**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/planos', '/privacidade', '/termos', '/landing']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: (cookies) => cookies.forEach(c => res.cookies.set(c)) } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isPublic = PUBLIC_ROUTES.some(r => req.nextUrl.pathname.startsWith(r))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Verificar plano ativo (trial ou pago)
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan, trial_ends_at')
      .eq('id', user.id)
      .single()

    const planExpired =
      profile?.plan === 'trial' &&
      profile?.trial_ends_at &&
      new Date(profile.trial_ends_at) < new Date()

    if (planExpired && !req.nextUrl.pathname.startsWith('/planos')) {
      return NextResponse.redirect(new URL('/planos?expired=true', req.url))
    }
  }

  return res
}

export const config = { matcher: ['/((?!_next|api/webhook|favicon|public).*)'] }
```

### 3.3 Rate Limiting nas APIs

```typescript
// lib/rate-limit.ts
// Implementação sem Redis — usa headers + memória em edge (suficiente para MVP)
const requests = new Map<string, { count: number; reset: number }>()

export function rateLimit(ip: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = requests.get(ip)

  if (!entry || now > entry.reset) {
    requests.set(ip, { count: 1, reset: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}

// Uso em route handlers críticos:
const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
if (!rateLimit(ip, 30, 60_000)) {
  return Response.json({ error: 'Too many requests' }, { status: 429 })
}
```

**Para produção real com volume:** migrar para Upstash Redis + `@upstash/ratelimit` (gratuito até 10k req/dia).

### 3.4 Validação de Inputs com Zod

```typescript
// Instalar: npm install zod
import { z } from 'zod'

// Exemplo para rota de lançamento financeiro
const TransactionSchema = z.object({
  type:        z.enum(['income', 'expense', 'transfer']),
  description: z.string().min(1).max(200),
  amount:      z.number().positive().max(10_000_000),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  account_id:  z.string().uuid(),
  category_id: z.string().uuid().optional(),
  notes:       z.string().max(500).optional(),
})

export async function POST(req: Request) {
  const { user, supabase } = await requireAuth()
  const body = await req.json()
  const parsed = TransactionSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('pf_transactions')
    .insert({ ...parsed.data, user_id: user.id })

  return Response.json(data)
}
```

### 3.5 Logs de Auditoria

```sql
-- Tabela de auditoria (append-only, sem update/delete via RLS)
CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,  -- 'login', 'transaction.create', 'account.delete', etc.
  entity      TEXT,
  entity_id   TEXT,
  ip_address  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- Usuário pode VER seus logs mas não modificar
CREATE POLICY "audit_readonly" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);
-- INSERT apenas via service role (server-side)
```

```typescript
// lib/audit.ts
export async function logAudit(params: {
  user_id: string
  action: string
  entity?: string
  entity_id?: string
  ip?: string
  metadata?: Record<string, unknown>
}) {
  // Usar supabaseAdmin aqui é correto — log é server-side
  await supabaseAdmin.from('audit_logs').insert(params)
}
```

### 3.6 Headers de Segurança (`next.config.ts`)

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // Next.js precisa desses
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com",
              "font-src 'self'",
              "media-src 'self' blob:",
            ].join('; ')
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
        ],
      },
    ]
  },
}
```

### 3.7 Checklist de Segurança — Go-Live

- [ ] RLS habilitado em 100% das tabelas com dados de usuários
- [ ] Nenhuma rota GET usa `supabaseAdmin` (service key) — apenas `supabase` autenticado
- [ ] `SUPABASE_SERVICE_KEY` não está exposta ao browser (nunca em variável sem prefixo `NEXT_PUBLIC_`)
- [ ] Rate limiting nas rotas: `/api/auth/*`, `/api/pf/voice`, `/api/pf/ocr`, `/api/fin/advisor`
- [ ] Validação Zod em todas as rotas POST/PUT/PATCH
- [ ] Headers de segurança configurados no `next.config.ts`
- [ ] Backup automático configurado no Supabase
- [ ] Logs de auditoria ativos para: login, criação/deleção de conta, transações acima de R$10k
- [ ] `.env.local` não commitado no git (verificar `.gitignore`)
- [ ] Variáveis de ambiente de produção configuradas no Vercel (não no código)
- [ ] Página de Política de Privacidade e Termos de Uso publicadas
- [ ] Rota de exportação de dados LGPD funcionando

---

## 4. TESTES NECESSÁRIOS

### 4.1 Testes de Segurança (OBRIGATÓRIOS antes do go-live)

```bash
# Teste 1: Vazamento de dados entre usuários
# Crie usuário A com uma transação
# Logue como usuário B
# Tente acessar: GET /api/pf/transactions — deve retornar [] para B
# Tente: GET /api/pf/transactions?user_id=<id-do-A> — deve ignorar o param e retornar [] para B

# Teste 2: Acesso sem autenticação
curl https://gestao.valterleite.com.br/api/pf/transactions
# Esperado: 401 Unauthorized

# Teste 3: IDOR (Insecure Direct Object Reference)
curl -H "Authorization: Bearer <token-usuario-B>" \
  https://gestao.valterleite.com.br/api/pf/transactions/<uuid-de-transacao-do-usuario-A>
# Esperado: 404 Not Found (RLS esconde o registro, não expõe erro de autorização)

# Teste 4: Injeção via input de voz/OCR
# Input: "Lançar receita de R$ 100; DROP TABLE pf_transactions; --"
# O Zod deve rejeitar ou a query parameterizada do Supabase deve ignorar

# Teste 5: Rate limit
# Faça 35 requisições em 1 minuto para /api/pf/voice
# Da 31ª em diante deve retornar 429
```

### 4.2 Testes de Isolamento Multi-tenant

```typescript
// scripts/test-multitenant.ts — executar com: npx tsx scripts/test-multitenant.ts
import { createClient } from '@supabase/supabase-js'

async function testIsolation() {
  // Cria dois clientes com tokens de usuários diferentes
  const clientA = createClient(URL, ANON_KEY)
  const clientB = createClient(URL, ANON_KEY)

  // Login A e B
  await clientA.auth.signInWithPassword({ email: 'test-a@test.com', password: 'senha123' })
  await clientB.auth.signInWithPassword({ email: 'test-b@test.com', password: 'senha123' })

  // A cria uma transação
  const { data: tx } = await clientA.from('pf_transactions').insert({
    type: 'income', description: 'Teste A', amount: 100, date: '2026-03-25',
    account_id: '<uuid-conta-A>', user_id: '<uid-A>'
  }).select().single()

  // B tenta ver transações — deve ser []
  const { data: bData } = await clientB.from('pf_transactions').select('*')
  console.assert(bData?.length === 0, '❌ FALHA: B viu transação de A!')
  console.log('✅ Isolamento OK')
}
```

### 4.3 Testes de Performance

**Referências de performance aceitável para lançamento:**

| Endpoint | Meta | Crítico acima de |
|----------|------|-----------------|
| Dashboard inicial | < 800ms | 2s |
| Lista de transações (100 items) | < 300ms | 1s |
| OCR de comprovante | < 5s | 10s |
| Consultor IA (primeira resposta) | < 3s | 8s |
| Lançamento por voz | < 2s | 5s |
| Login / autenticação | < 500ms | 2s |

```bash
# Teste de carga simples com Apache Bench (já presente no macOS)
ab -n 100 -c 10 -H "Authorization: Bearer <token>" \
  https://gestao.valterleite.com.br/api/pf/summary

# Métrica importante: "Time per request" (média) e "Failed requests" (deve ser 0)
```

**Volume suportado com Supabase Free:**
- 500MB de banco: suporta ~500k transações financeiras
- 2GB de bandwidth/mês: suficiente para ~5.000 usuários ativos
- Para escalar: Supabase Pro (R$125/mês) → 8GB de banco, sem limite de bandwidth

### 4.4 Testes de UX Mobile

Executar estes cenários em iPhone (Safari) e Android (Chrome):

- [ ] PWA instala na tela inicial sem erros
- [ ] App abre offline com mensagem amigável (não tela em branco)
- [ ] Lançamento por voz funciona (microfone ativo no PWA)
- [ ] OCR de comprovante funciona com câmera do celular
- [ ] Teclado numérico aparece ao digitar valores (campo `inputMode="decimal"`)
- [ ] Menus não ficam cortados em iPhone com notch
- [ ] Scroll funciona sem travamentos no dashboard com muitos widgets
- [ ] Formulários não pulam ao abrir teclado virtual (iOS quirk)

### 4.5 Testes de Negócio (Antes do Go-Live)

- [ ] Signup → email de confirmação chega em < 2min
- [ ] Trial de 14 dias começa na data correta
- [ ] Após trial expirar, sistema bloqueia corretamente e mostra página de upgrade
- [ ] Pagamento com cartão real (usar Asaas em modo sandbox)
- [ ] Webhook de pagamento confirmado → plano atualizado no banco
- [ ] Cancelamento de assinatura → acesso revogado na data correta
- [ ] Recuperação de senha funciona
- [ ] Deleção de conta remove todos os dados (LGPD)

---

## 5. SISTEMA DE AUTENTICAÇÃO

### 5.1 Arquitetura Completa

```
Usuário → /login → Supabase Auth → JWT → Cookie HttpOnly → Middleware valida → App
                       ↓
                 Google OAuth (opção 2)
                       ↓
                 2FA TOTP (se habilitado)
                       ↓
                 user_profiles (plano, trial)
```

### 5.2 Páginas de Auth

**`/app/login/page.tsx`** — estrutura mínima:

```tsx
'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-sm border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-6">Entrar</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700" />
          <input type="password" placeholder="Senha" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700" />
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="my-4 text-center text-gray-500 text-sm">ou</div>
        <button onClick={handleGoogle}
          className="w-full bg-gray-800 text-white py-3 rounded-lg border border-gray-700 flex items-center justify-center gap-2">
          Continuar com Google
        </button>
        <p className="text-center text-gray-400 text-sm mt-4">
          <a href="/forgot-password" className="text-blue-400">Esqueceu a senha?</a>
        </p>
        <p className="text-center text-gray-400 text-sm mt-2">
          Não tem conta? <a href="/signup" className="text-blue-400">Criar conta grátis</a>
        </p>
      </div>
    </div>
  )
}
```

**Callback do Google OAuth (`/app/auth/callback/route.ts`):**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const cookieStore = await cookies()

  if (code) {
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(cookie => cookieStore.set(cookie)) } }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

### 5.3 Implementação de 2FA com TOTP

O Supabase suporta 2FA nativo via MFA (Multi-Factor Authentication). **Não precisa de lib externa.**

```typescript
// Habilitar 2FA para um usuário (feito no painel do usuário):
const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
// data.totp.qr_code — mostrar como QR code para escanear no Google Authenticator / Authy

// Verificar código TOTP no login:
const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: data.id })
const { error: verifyError } = await supabase.auth.mfa.verify({
  factorId: data.id,
  challengeId: challenge.id,
  code: totpCode  // código de 6 dígitos que o usuário digitou
})
```

**Fluxo completo de 2FA:**
1. Usuário faz login com email/senha → autenticado em nível 1
2. Se tem 2FA habilitado → redirecionar para `/auth/mfa`
3. Usuário digita código do app autenticador → `supabase.auth.mfa.verify()`
4. Sucesso → nível de assurance 2 (`aal2`) → acesso total

**Referência:** https://supabase.com/docs/guides/auth/auth-mfa

### 5.4 Recuperação de Senha

```typescript
// /api/auth/forgot-password — envia email
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://gestao.valterleite.com.br/auth/reset-password'
})

// /app/auth/reset-password/page.tsx — usuário chega com token na URL, define nova senha
await supabase.auth.updateUser({ password: newPassword })
```

O Supabase gerencia o envio do email de recuperação automaticamente.

### 5.5 Onboarding do Novo Usuário

**Fluxo:** Signup → Verificação de email → Login → Wizard de Onboarding (3 etapas) → Dashboard

```
Etapa 1: Dados pessoais/empresa
  - Nome completo
  - Tipo: Pessoa Física | Pessoa Jurídica | Ambos
  - Segmento (dropdown)

Etapa 2: Módulos a usar
  - [ ] Finanças Pessoais
  - [ ] Financeiro Empresarial
  - [ ] CRM
  (habilita/desabilita menus do sidebar)

Etapa 3: Configuração inicial
  - Criar primeira conta bancária
  - (Opcional) Importar extrato CSV/OFX
  - Tour guiado de 60 segundos
```

---

## 6. MONETIZAÇÃO

### 6.1 Planos e Preços Recomendados

**Pesquisa de mercado:**
- Organizze: R$19,90/mês (PF)
- Conta Azul: R$69-229/mês (PJ)
- Nibo: R$89-299/mês (PJ)
- ZeroPaper: R$39-99/mês (PJ)

**Estratégia recomendada — posicionamento "all-in-one premium":**

| Plano | Preço Mensal | Preço Anual (20% off) | Público | Módulos |
|-------|-------------|----------------------|---------|---------|
| **Pessoal** | R$ 29,90 | R$ 287/ano (= R$23,90/mês) | Pessoa física | Finanças Pessoais |
| **Negócios** | R$ 69,90 | R$ 671/ano (= R$55,90/mês) | Autônomo / MEI | Fin. Pessoal + Fin. Empresarial |
| **Completo** | R$ 119,90 | R$ 1.150/ano (= R$95,90/mês) | PME | Todos os módulos (+ CRM) |
| **Agência** | R$ 299,90 | R$ 2.878/ano | Revendedor | 10 empresas clientes |

**Âncora psicológica:** Destacar o plano "Negócios" como o mais escolhido. O plano "Completo" existe para fazer o "Negócios" parecer acessível.

**Trial:** 14 dias em qualquer plano, sem cartão de crédito.

### 6.2 Implementação com Asaas (Recomendado para BR)

**Por que Asaas e não Stripe?**
- Aceita Pix, boleto, cartão nacional sem fricção
- Sem necessidade de conta em dólar
- Dashboard em português
- Taxa menor para volume baixo: 1,99% no cartão vs 2,9% do Stripe
- Sandbox completo para testes

**Documentação:** https://asaasv3.docs.apiary.io/

```typescript
// lib/asaas.ts
const ASAAS_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'

const headers = {
  'access_token': process.env.ASAAS_API_KEY!,
  'Content-Type': 'application/json'
}

// Criar cliente no Asaas
export async function createAsaasCustomer(params: {
  name: string
  email: string
  cpfCnpj?: string
}) {
  const res = await fetch(`${ASAAS_BASE}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  })
  return res.json()
}

// Criar assinatura recorrente
export async function createSubscription(params: {
  customer: string   // ID do customer no Asaas
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO'
  value: number
  nextDueDate: string  // YYYY-MM-DD
  cycle: 'MONTHLY' | 'YEARLY'
  description: string
}) {
  const res = await fetch(`${ASAAS_BASE}/subscriptions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  })
  return res.json()
}
```

```typescript
// app/api/billing/subscribe/route.ts
import { requireAuth } from '@/lib/auth'
import { createAsaasCustomer, createSubscription } from '@/lib/asaas'

const PLANOS = {
  personal:  { valor: 29.90, descricao: 'Plano Pessoal — Sistema Financeiro' },
  business:  { valor: 69.90, descricao: 'Plano Negócios — Sistema Financeiro' },
  complete:  { valor: 119.90, descricao: 'Plano Completo — Sistema Financeiro' },
}

export async function POST(req: Request) {
  const { user, supabase } = await requireAuth()
  const { plano, billingType } = await req.json()

  const planoConfig = PLANOS[plano as keyof typeof PLANOS]
  if (!planoConfig) return Response.json({ error: 'Plano inválido' }, { status: 400 })

  // Buscar perfil do usuário
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()

  // Criar ou recuperar customer no Asaas
  let customerId = profile?.billing_customer_id
  if (!customerId) {
    const customer = await createAsaasCustomer({ name: profile?.name ?? '', email: user.email! })
    customerId = customer.id
    await supabase.from('user_profiles').update({ billing_customer_id: customerId }).eq('id', user.id)
  }

  // Criar assinatura
  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + 14)  // trial de 14 dias
  const subscription = await createSubscription({
    customer: customerId,
    billingType,
    value: planoConfig.valor,
    nextDueDate: nextDueDate.toISOString().split('T')[0],
    cycle: 'MONTHLY',
    description: planoConfig.descricao,
  })

  return Response.json({ subscription })
}
```

```typescript
// app/api/webhook/billing/route.ts
// Asaas envia eventos: PAYMENT_CONFIRMED, PAYMENT_OVERDUE, SUBSCRIPTION_CANCELLED
export async function POST(req: Request) {
  const event = await req.json()

  // Verificar autenticidade (Asaas não tem assinatura de webhook — use IP whitelist no Vercel)
  // IPs do Asaas: consulte https://asaasv3.docs.apiary.io/

  if (event.event === 'PAYMENT_CONFIRMED') {
    // Buscar subscription para achar o customer
    const subscription = event.payment.subscription
    // Atualizar plano do usuário no banco
    await supabaseAdmin
      .from('user_profiles')
      .update({ plan: 'active', trial_ends_at: null })
      .eq('billing_customer_id', event.payment.customer)
  }

  if (event.event === 'SUBSCRIPTION_CANCELLED') {
    await supabaseAdmin
      .from('user_profiles')
      .update({ plan: 'cancelled' })
      .eq('billing_customer_id', event.payment.customer)
  }

  return Response.json({ received: true })
}
```

### 6.3 Estratégias de Retenção (Anti-Churn)

| Trigger | Ação | Canal |
|---------|------|-------|
| Dia 7 do trial sem lançamento | "Você ainda não fez seu primeiro lançamento — precisa de ajuda?" | Email + in-app |
| Dia 12 do trial | "Seu trial acaba em 2 dias — veja o que você construiu" (resumo de dados) | Email |
| Dia 14 (fim de trial) | "Não perca seu histórico — assine por R$29,90/mês" | Email + bloquear app |
| Mês 2 sem login | "Sentimos sua falta — o que podemos melhorar?" | Email |
| Inadimplência (boleto não pago) | Avisar 3 dias antes do vencimento | Email + in-app |
| Meta financeira atingida | "Parabéns! Você atingiu sua meta de R$X!" | Push + in-app |

---

## 7. MELHORIAS DE UX/PRODUTO

### 7.1 Prioridades de UX para o Lançamento

**Crítico (fazer antes do go-live):**

1. **Empty states com CTAs claros** — quando o usuário não tem dados ainda, mostrar o que fazer (não tela em branco)
   ```tsx
   // Componente EmptyState reutilizável
   function EmptyState({ icon, title, description, action }: EmptyStateProps) {
     return (
       <div className="flex flex-col items-center justify-center py-16 text-center">
         <div className="text-6xl mb-4">{icon}</div>
         <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
         <p className="text-gray-400 text-sm mb-6 max-w-xs">{description}</p>
         {action}
       </div>
     )
   }
   // Uso: <EmptyState icon="💰" title="Nenhum lançamento ainda" description="Adicione sua primeira receita ou despesa" action={<button>+ Novo lançamento</button>} />
   ```

2. **Loading states adequados** — skeleton screens em vez de spinners (sensação de velocidade)

3. **Feedback imediato em ações** — toast de sucesso/erro em todas as operações

4. **Confirmação antes de deletar** — modal "Tem certeza? Esta ação não pode ser desfeita"

5. **Formulários com validação in-line** — erro aparece embaixo do campo, não só no submit

**Importante (fazer na primeira semana pós-lançamento):**

6. **Botão de ação flutuante (FAB) no mobile** — "+ Lançamento" sempre visível em telas de listagem

7. **Swipe para deletar** em listas no mobile (padrão iOS/Android)

8. **Pesquisa rápida** — Ctrl+K (desktop) / ícone de busca (mobile) para navegar por transações

### 7.2 Onboarding Guiado

```typescript
// Sequência de tooltips interativos (sem biblioteca externa — CSS puro)
const ONBOARDING_STEPS = [
  {
    target: '#sidebar-financas',
    title: 'Finanças Pessoais',
    body: 'Aqui você controla suas receitas e despesas do dia a dia',
    position: 'right'
  },
  {
    target: '#btn-novo-lancamento',
    title: 'Primeiro lançamento',
    body: 'Clique para adicionar sua primeira transação — pode usar voz!',
    position: 'bottom'
  },
  {
    target: '#widget-saldo',
    title: 'Seu saldo em tempo real',
    body: 'Este widget mostra seu saldo atual atualizado a cada lançamento',
    position: 'bottom'
  },
]
```

**Armazenar progresso:** `user_profiles.onboarding_step` (int) — usuário pode fechar e retomar depois.

### 7.3 Notificações Inteligentes

**Tabela de notificações:**
```sql
CREATE TABLE notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,  -- 'bill_due', 'goal_reached', 'trial_ending', 'budget_exceeded'
  title      TEXT NOT NULL,
  body       TEXT,
  read       BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_owner" ON notifications FOR ALL USING (auth.uid() = user_id);
```

**Triggers de notificação (via Cron no Supabase ou Vercel Cron):**
- Diariamente às 8h: verificar contas vencendo nos próximos 3 dias
- Ao lançar transação: verificar se orçamento da categoria foi ultrapassado
- Mensalmente: gerar resumo financeiro mensal

**Vercel Cron (`vercel.json`):**
```json
{
  "crons": [
    { "path": "/api/cron/notifications", "schedule": "0 8 * * *" },
    { "path": "/api/cron/sync-eduzz", "schedule": "0 */2 * * *" }
  ]
}
```

### 7.4 Personalização do Usuário

**Configurações salvas em `user_profiles.preferences` (JSONB):**
```json
{
  "currency": "BRL",
  "dateFormat": "DD/MM/YYYY",
  "weekStartsOn": 0,
  "defaultModule": "personal",
  "dashboardWidgets": ["saldo", "despesas-mes", "grafico-categorias"],
  "notificationsEnabled": true,
  "language": "pt-BR"
}
```

---

## 8. INFRAESTRUTURA

### 8.1 Configuração do Domínio `gestao.valterleite.com.br`

**Passo a passo no Vercel:**

1. Acesse: https://vercel.com/[seu-projeto]/settings/domains
2. Clique "Add Domain" → digite `gestao.valterleite.com.br`
3. Vercel mostrará um registro DNS para adicionar:
   ```
   Type: CNAME
   Name: gestao
   Value: cname.vercel-dns.com
   ```
4. Acesse o painel do seu registrador (registro.br, GoDaddy, Cloudflare) e adicione o registro
5. Propagação: 15min a 4h
6. SSL/TLS é automático via Let's Encrypt (certificado gerado em < 1min após DNS propagar)

**Verificação:**
```bash
dig gestao.valterleite.com.br CNAME
# Deve retornar: cname.vercel-dns.com
curl -I https://gestao.valterleite.com.br
# Deve retornar: HTTP/2 200
```

### 8.2 CDN e Performance

O Vercel inclui CDN global automaticamente (Vercel Edge Network — 76 regiões). Não precisa configurar Cloudflare separado para o MVP.

**Otimizações no `next.config.ts`:**
```typescript
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },
  compress: true,
  // Configurar região do Vercel para São Paulo (mais próximo dos usuários BR)
  // Em vercel.json:
}
```

**`vercel.json` completo:**
```json
{
  "regions": ["gru1"],
  "crons": [
    { "path": "/api/cron/notifications", "schedule": "0 8 * * *" },
    { "path": "/api/cron/trial-check", "schedule": "0 9 * * *" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### 8.3 Variáveis de Ambiente (Vercel)

```bash
# Configurar em: Vercel > Project > Settings > Environment Variables

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx  # seguro expor ao browser (é a anon key)
SUPABASE_SERVICE_KEY=eyJxxx           # NUNCA com prefixo NEXT_PUBLIC_

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-xxx

# Asaas
ASAAS_API_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=https://gestao.valterleite.com.br
```

### 8.4 Monitoramento e Alertas

**Vercel Analytics** (já incluído no plano Pro):
- Ativar em: Project > Analytics > Enable
- Métricas: Core Web Vitals, visitas, erros de build

**Sentry para erros de produção:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configurar alertas para:
- Taxa de erros > 1% → email imediato
- P95 de latência > 3s → email
- Build falhou → email/Slack

**Uptime monitoring (gratuito):**
- https://uptimerobot.com — verificação a cada 5 minutos, alerta no WhatsApp/email
- Configure para monitorar: `gestao.valterleite.com.br`, `/api/health`

**Rota de health check:**
```typescript
// app/api/health/route.ts
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { error } = await supabaseAdmin.from('user_profiles').select('count').limit(1)
  if (error) return Response.json({ status: 'error', db: error.message }, { status: 503 })
  return Response.json({ status: 'ok', ts: new Date().toISOString() })
}
```

### 8.5 Banco de Dados — Plano de Escala

| Usuários ativos | Plano Supabase | Custo/mês | Configuração |
|-----------------|----------------|-----------|--------------|
| 0 - 500 | Free | R$ 0 | Padrão |
| 500 - 5.000 | Pro | R$ 125 | Aumentar max_connections para 200 |
| 5.000 - 50.000 | Pro + PgBouncer | R$ 250 | Connection pooling via Supabase Pooler |
| 50.000+ | Enterprise | Sob consulta | Réplicas de leitura |

**Índices críticos a criar antes do lançamento:**
```sql
-- Queries mais frequentes no sistema
CREATE INDEX idx_pf_transactions_user_date ON pf_transactions(user_id, date DESC);
CREATE INDEX idx_pf_transactions_user_category ON pf_transactions(user_id, category_id);
CREATE INDEX idx_pf_accounts_user ON pf_accounts(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_user_profiles_billing ON user_profiles(billing_customer_id) WHERE billing_customer_id IS NOT NULL;
```

**Backup:**
- Supabase Free: backup manual apenas
- Supabase Pro: backup automático diário + point-in-time recovery (PITR) de 7 dias

**Ação imediata:** Ativar o plano Pro **antes** do lançamento para ter backup automático. O custo de R$125/mês é negligível comparado ao risco de perda de dados de clientes.

---

## RESUMO EXECUTIVO — O QUE FAZER AGORA

### Top 5 Ações Imediatas (Hoje, 25/03)

1. **Habilitar RLS no Supabase** — sem isso, qualquer usuário vê dados de todos. Bloqueador absoluto.
2. **Criar página de login** com Supabase Auth — o sistema não pode lançar sem autenticação.
3. **Adicionar `user_id` em todas as tabelas** — migração SQL de 30 linhas, feita em 10 minutos.
4. **Configurar DNS do domínio** no Vercel — demora até 4h para propagar, fazer logo.
5. **Criar conta no Asaas (sandbox)** — precisa do API key para implementar cobrança amanhã.

### O que NÃO fazer nesta semana

- Não implementar Open Finance / Belvo — complexidade alta, irrelevante para o lançamento
- Não fazer app React Native — PWA é suficiente e está pronto
- Não adicionar testes automatizados (Jest/Playwright) — manual por ora
- Não refatorar o codebase existente — está funcionando, apenas adicione o que falta
- Não implementar NFe/NFSe — nicho específico, não é dor do público inicial

### Definição de "Pronto para Lançar" em 01/04

- [ ] Qualquer pessoa consegue se cadastrar, logar e usar o sistema
- [ ] Dois usuários diferentes **nunca** veem dados um do outro
- [ ] Trial de 14 dias funciona e expira corretamente
- [ ] Pagamento via cartão ou Pix funciona (pelo menos em sandbox)
- [ ] Sistema funciona no iPhone via PWA
- [ ] Página de privacidade e termos publicadas
- [ ] Domínio gestao.valterleite.com.br ativo com SSL
- [ ] Monitoramento de uptime configurado

---

*Documento gerado em 25/03/2026 | Sistema: valter-crm (Next.js 16 + Supabase + Vercel)*
