-- =============================================
-- SISTEMA FINANCEIRO PESSOAL (Pessoa Física)
-- Prefixo: pf_
-- =============================================

-- Contas bancárias pessoais
create table if not exists pf_accounts (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  type            text not null default 'checking',
  bank            text,
  color           text default '#3b82f6',
  opening_balance numeric(12,2) default 0,
  active          boolean default true,
  created_at      timestamptz default now()
);

-- Categorias pessoais (com subcategorias)
create table if not exists pf_categories (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  type       text not null,  -- expense | income
  color      text default '#6b7280',
  icon       text,
  parent_id  uuid references pf_categories(id) on delete set null,
  created_at timestamptz default now()
);

-- Lançamentos pessoais
create table if not exists pf_transactions (
  id                  uuid default gen_random_uuid() primary key,
  type                text not null,  -- income | expense | transfer
  description         text,
  amount              numeric(12,2) not null,
  date                date not null,
  account_id          uuid references pf_accounts(id) on delete set null,
  category_id         uuid references pf_categories(id) on delete set null,
  status              text default 'confirmed',  -- confirmed | pending | scheduled
  recurrence          text default 'single',     -- single | fixed | installment
  installment_current int,
  installment_total   int,
  group_id            uuid,
  notes               text,
  voice_input         text,  -- texto original falado pelo usuário
  created_at          timestamptz default now()
);

-- Metas de economia
create table if not exists pf_goals (
  id             uuid default gen_random_uuid() primary key,
  name           text not null,
  description    text,
  target_amount  numeric(12,2) not null,
  current_amount numeric(12,2) default 0,
  target_date    date,
  color          text default '#3b82f6',
  icon           text default '🎯',
  status         text default 'active',  -- active | completed | cancelled
  created_at     timestamptz default now()
);

-- Orçamento mensal por categoria
create table if not exists pf_budgets (
  id          uuid default gen_random_uuid() primary key,
  category_id uuid references pf_categories(id) on delete cascade,
  month       int not null,
  year        int not null,
  amount      numeric(12,2) not null,
  created_at  timestamptz default now(),
  unique(category_id, month, year)
);

-- =============================================
-- CATEGORIAS PADRÃO — DESPESAS
-- =============================================
insert into pf_categories (name, type, color, icon) values
  ('Moradia',           'expense', '#ef4444', '🏠'),
  ('Alimentação',       'expense', '#f97316', '🍔'),
  ('Transporte',        'expense', '#f59e0b', '🚗'),
  ('Saúde',             'expense', '#10b981', '❤️'),
  ('Educação',          'expense', '#3b82f6', '📚'),
  ('Lazer',             'expense', '#8b5cf6', '🎬'),
  ('Vestuário',         'expense', '#ec4899', '👕'),
  ('Cuidados Pessoais', 'expense', '#06b6d4', '💆'),
  ('Finanças',          'expense', '#6366f1', '🏦'),
  ('Outros Gastos',     'expense', '#6b7280', '📦')
on conflict do nothing;

-- =============================================
-- CATEGORIAS PADRÃO — RECEITAS
-- =============================================
insert into pf_categories (name, type, color, icon) values
  ('Salário',           'income', '#10b981', '💼'),
  ('Freelance',         'income', '#3b82f6', '💻'),
  ('Investimentos',     'income', '#f59e0b', '📈'),
  ('Aluguel Recebido',  'income', '#8b5cf6', '🏘️'),
  ('Outras Receitas',   'income', '#6b7280', '💰')
on conflict do nothing;

-- =============================================
-- SUBCATEGORIAS — MORADIA
-- =============================================
insert into pf_categories (name, type, color, parent_id)
select 'Aluguel', 'expense', '#ef4444', id from pf_categories where name = 'Moradia' and type = 'expense' limit 1
on conflict do nothing;
insert into pf_categories (name, type, color, parent_id)
select 'Condomínio', 'expense', '#ef4444', id from pf_categories where name = 'Moradia' and type = 'expense' limit 1
on conflict do nothing;
insert into pf_categories (name, type, color, parent_id)
select 'Energia Elétrica', 'expense', '#ef4444', id from pf_categories where name = 'Moradia' and type = 'expense' limit 1
on conflict do nothing;
insert into pf_categories (name, type, color, parent_id)
select 'Água', 'expense', '#ef4444', id from pf_categories where name = 'Moradia' and type = 'expense' limit 1
on conflict do nothing;
insert into pf_categories (name, type, color, parent_id)
select 'Internet', 'expense', '#ef4444', id from pf_categories where name = 'Moradia' and type = 'expense' limit 1
on conflict do nothing;

-- =============================================
-- SUBCATEGORIAS — ALIMENTAÇÃO
-- =============================================
insert into pf_categories (name, type, color, parent_id)
select 'Supermercado', 'expense', '#f97316', id from pf_categories where name = 'Alimentação' and type = 'expense' limit 1
on conflict do nothing;
insert into pf_categories (name, type, color, parent_id)
select 'Restaurante', 'expense', '#f97316', id from pf_categories where name = 'Alimentação' and type = 'expense' limit 1
on conflict do nothing;
insert into pf_categories (name, type, color, parent_id)
select 'Delivery', 'expense', '#f97316', id from pf_categories where name = 'Alimentação' and type = 'expense' limit 1
on conflict do nothing;

-- =============================================
-- SUBCATEGORIAS — TRANSPORTE
-- =============================================
insert into pf_categories (name, type, color, parent_id)
select 'Combustível', 'expense', '#f59e0b', id from pf_categories where name = 'Transporte' and type = 'expense' limit 1
on conflict do nothing;
insert into pf_categories (name, type, color, parent_id)
select 'Uber / Taxi', 'expense', '#f59e0b', id from pf_categories where name = 'Transporte' and type = 'expense' limit 1
on conflict do nothing;
insert into pf_categories (name, type, color, parent_id)
select 'Ônibus / Metrô', 'expense', '#f59e0b', id from pf_categories where name = 'Transporte' and type = 'expense' limit 1
on conflict do nothing;
