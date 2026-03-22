-- Tabela de projetos (viagem, reforma, evento, etc.)
CREATE TABLE IF NOT EXISTS pf_projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  budget      numeric DEFAULT 0,
  color       text DEFAULT '#6b7280',
  icon        text DEFAULT '📁',
  start_date  date,
  end_date    date,
  status      text DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_at  timestamptz DEFAULT now()
);

-- Liga lançamentos a projetos
ALTER TABLE pf_transactions ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES pf_projects(id) ON DELETE SET NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_pf_transactions_project ON pf_transactions(project_id);
