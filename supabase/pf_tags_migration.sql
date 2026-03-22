-- Adiciona coluna tags em pf_transactions
ALTER TABLE pf_transactions ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Índice para busca por tags
CREATE INDEX IF NOT EXISTS idx_pf_transactions_tags ON pf_transactions USING gin(tags);
