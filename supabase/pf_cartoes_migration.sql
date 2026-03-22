-- Adiciona campos de cartão de crédito em pf_accounts
ALTER TABLE pf_accounts ADD COLUMN IF NOT EXISTS credit_limit  numeric DEFAULT 0;
ALTER TABLE pf_accounts ADD COLUMN IF NOT EXISTS closing_day   int     DEFAULT 5;
ALTER TABLE pf_accounts ADD COLUMN IF NOT EXISTS due_day       int     DEFAULT 15;
