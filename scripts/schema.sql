-- Tabela principal de vendas (espelho fiel da Eduzz)
CREATE TABLE IF NOT EXISTS sales (
  sale_id             BIGINT PRIMARY KEY,
  date_create         TIMESTAMPTZ,
  date_payment        TIMESTAMPTZ,
  date_credit         TIMESTAMPTZ,
  sale_status         INT,
  sale_status_name    TEXT,
  sale_total          NUMERIC(10,2),    -- faturamento bruto
  sale_amount_win     NUMERIC(10,2),    -- líquido para o produtor
  sale_fee            NUMERIC(10,2),    -- taxa plataforma
  sale_coop           NUMERIC(10,2),    -- taxa COOP
  sale_payment_method TEXT,
  client_name         TEXT,
  client_email        TEXT,
  content_id          BIGINT,
  content_title       TEXT,
  utm_source          TEXT,
  utm_campaign        TEXT,
  utm_medium          TEXT,
  utm_content         TEXT,
  installments        INT,
  synced_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas no dashboard
CREATE INDEX IF NOT EXISTS idx_sales_date_payment  ON sales(date_payment);
CREATE INDEX IF NOT EXISTS idx_sales_sale_status   ON sales(sale_status);
CREATE INDEX IF NOT EXISTS idx_sales_content_id    ON sales(content_id);
CREATE INDEX IF NOT EXISTS idx_sales_date_create   ON sales(date_create);

-- Log de sincronizações
CREATE TABLE IF NOT EXISTS sync_log (
  id         BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at   TIMESTAMPTZ,
  total      INT DEFAULT 0,
  status     TEXT DEFAULT 'running'
);

-- Desabilita RLS para acesso direto via service key
ALTER TABLE sales    DISABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log DISABLE ROW LEVEL SECURITY;
