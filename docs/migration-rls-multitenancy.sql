-- ============================================================
-- MIGRATION: Multi-tenancy + RLS
-- Executar no Supabase SQL Editor
-- https://supabase.com/dashboard/project/pkokvlxwldjnbededoeo/sql
-- ============================================================

-- ── 1. TABELA DE PERFIS DE USUÁRIO ──────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT,
  plan                TEXT NOT NULL DEFAULT 'trial',  -- trial | pessoal | negocios | completo | agencia
  trial_ends_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  billing_customer_id TEXT,          -- ID do cliente no Asaas
  onboarding_done     BOOLEAN NOT NULL DEFAULT false,
  preferences         JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: cria perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. ADICIONAR user_id EM TODAS AS TABELAS ────────────────

-- Finanças Pessoais
ALTER TABLE pf_accounts     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_goals        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_budgets      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_categories   ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_advisor_cache ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_projects     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Finanças Pessoais — tabelas auxiliares (advisor)
ALTER TABLE pf_advisor_scripts  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pf_advisor_schedule ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Financeiro Empresarial
ALTER TABLE fin_accounts     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE fin_categories   ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE fin_notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE fin_appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE fin_advisor_cache ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Financeiro Empresarial — tabelas auxiliares (advisor)
ALTER TABLE fin_advisor_scripts  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE fin_advisor_schedule ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- CRM
ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── 3. HABILITAR RLS ─────────────────────────────────────────
ALTER TABLE user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_goals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_budgets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_appointments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_advisor_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_advisor_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_advisor_scripts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_advisor_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_advisor_scripts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_advisor_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales             ENABLE ROW LEVEL SECURITY;

-- ── 4. POLICIES (padrão para cada tabela) ────────────────────
-- Macro para não repetir: usa DO $$ para cada tabela

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'pf_accounts','pf_transactions','pf_goals','pf_budgets',
    'pf_categories','pf_notifications','pf_appointments','pf_advisor_cache','pf_projects',
    'fin_accounts','fin_transactions','fin_categories','fin_notifications',
    'fin_appointments','fin_advisor_cache',
    'pf_advisor_scripts','pf_advisor_schedule',
    'fin_advisor_scripts','fin_advisor_schedule',
    'sales'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "iso_select" ON %I;
      DROP POLICY IF EXISTS "iso_insert" ON %I;
      DROP POLICY IF EXISTS "iso_update" ON %I;
      DROP POLICY IF EXISTS "iso_delete" ON %I;
      CREATE POLICY "iso_select" ON %I FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "iso_insert" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "iso_update" ON %I FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "iso_delete" ON %I FOR DELETE USING (auth.uid() = user_id);
    ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- user_profiles: usuário vê/edita apenas o próprio perfil
DROP POLICY IF EXISTS "profile_select" ON user_profiles;
DROP POLICY IF EXISTS "profile_update" ON user_profiles;
CREATE POLICY "profile_select" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- ── 5. ÍNDICES DE PERFORMANCE ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pf_transactions_user      ON pf_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pf_transactions_user_date ON pf_transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_pf_accounts_user          ON pf_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_pf_goals_user             ON pf_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_pf_budgets_user           ON pf_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_pf_categories_user        ON pf_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_fin_transactions_user     ON fin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fin_transactions_user_date ON fin_transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_accounts_user         ON fin_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_fin_categories_user       ON fin_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user                ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_billing     ON user_profiles(billing_customer_id) WHERE billing_customer_id IS NOT NULL;

-- ── 6. VERIFICAÇÃO FINAL ─────────────────────────────────────
-- Deve retornar rowsecurity = true para TODAS as tabelas listadas
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE ANY(ARRAY['pf_%','fin_%','sales','user_profiles'])
ORDER BY tablename;
