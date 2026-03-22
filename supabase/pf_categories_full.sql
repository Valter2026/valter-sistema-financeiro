-- =============================================
-- PLANO DE CONTAS PESSOAL COMPLETO
-- Apaga categorias antigas e recria completo
-- =============================================

-- Limpa subcategorias primeiro (FK constraint)
delete from pf_categories where parent_id is not null;
delete from pf_categories where parent_id is null;

-- =============================================
-- DESPESAS — Categorias Pai
-- =============================================
insert into pf_categories (id, name, type, color, icon) values
  ('d0000001-0000-0000-0000-000000000001', 'Moradia',           'expense', '#ef4444', '🏠'),
  ('d0000001-0000-0000-0000-000000000002', 'Alimentação',       'expense', '#f97316', '🍔'),
  ('d0000001-0000-0000-0000-000000000003', 'Transporte',        'expense', '#f59e0b', '🚗'),
  ('d0000001-0000-0000-0000-000000000004', 'Saúde',             'expense', '#10b981', '❤️'),
  ('d0000001-0000-0000-0000-000000000005', 'Educação',          'expense', '#3b82f6', '📚'),
  ('d0000001-0000-0000-0000-000000000006', 'Lazer',             'expense', '#8b5cf6', '🎬'),
  ('d0000001-0000-0000-0000-000000000007', 'Vestuário',         'expense', '#ec4899', '👕'),
  ('d0000001-0000-0000-0000-000000000008', 'Cuidados Pessoais', 'expense', '#06b6d4', '💆'),
  ('d0000001-0000-0000-0000-000000000009', 'Finanças',          'expense', '#6366f1', '🏦'),
  ('d0000001-0000-0000-0000-000000000010', 'Pets',              'expense', '#f59e0b', '🐾'),
  ('d0000001-0000-0000-0000-000000000011', 'Tecnologia',        'expense', '#64748b', '💻'),
  ('d0000001-0000-0000-0000-000000000012', 'Presentes',         'expense', '#f43f5e', '🎁'),
  ('d0000001-0000-0000-0000-000000000013', 'Outros Gastos',     'expense', '#6b7280', '📦')
on conflict (id) do update set name=excluded.name, color=excluded.color, icon=excluded.icon;

-- =============================================
-- DESPESAS — Moradia (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Aluguel',           'expense', '#ef4444', '🏠', 'd0000001-0000-0000-0000-000000000001'),
  ('Condomínio',        'expense', '#ef4444', '🏢', 'd0000001-0000-0000-0000-000000000001'),
  ('IPTU',              'expense', '#ef4444', '📄', 'd0000001-0000-0000-0000-000000000001'),
  ('Energia Elétrica',  'expense', '#ef4444', '⚡', 'd0000001-0000-0000-0000-000000000001'),
  ('Água / Saneamento', 'expense', '#ef4444', '💧', 'd0000001-0000-0000-0000-000000000001'),
  ('Gás',               'expense', '#ef4444', '🔥', 'd0000001-0000-0000-0000-000000000001'),
  ('Internet',          'expense', '#ef4444', '📡', 'd0000001-0000-0000-0000-000000000001'),
  ('TV por Assinatura', 'expense', '#ef4444', '📺', 'd0000001-0000-0000-0000-000000000001'),
  ('Telefone Fixo',     'expense', '#ef4444', '📞', 'd0000001-0000-0000-0000-000000000001'),
  ('Manutenção Casa',   'expense', '#ef4444', '🔧', 'd0000001-0000-0000-0000-000000000001'),
  ('Móveis / Decoração','expense', '#ef4444', '🛋️', 'd0000001-0000-0000-0000-000000000001'),
  ('Seguro Residencial','expense', '#ef4444', '🔒', 'd0000001-0000-0000-0000-000000000001')
on conflict do nothing;

-- =============================================
-- DESPESAS — Alimentação (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Supermercado',      'expense', '#f97316', '🛒', 'd0000001-0000-0000-0000-000000000002'),
  ('Feira / Hortifruti','expense', '#f97316', '🥦', 'd0000001-0000-0000-0000-000000000002'),
  ('Açougue / Peixaria','expense', '#f97316', '🥩', 'd0000001-0000-0000-0000-000000000002'),
  ('Padaria',           'expense', '#f97316', '🥐', 'd0000001-0000-0000-0000-000000000002'),
  ('Restaurante',       'expense', '#f97316', '🍽️', 'd0000001-0000-0000-0000-000000000002'),
  ('Lanchonete',        'expense', '#f97316', '🍟', 'd0000001-0000-0000-0000-000000000002'),
  ('Delivery',          'expense', '#f97316', '🛵', 'd0000001-0000-0000-0000-000000000002'),
  ('Café / Cafeteria',  'expense', '#f97316', '☕', 'd0000001-0000-0000-0000-000000000002'),
  ('Bar / Bebidas',     'expense', '#f97316', '🍺', 'd0000001-0000-0000-0000-000000000002')
on conflict do nothing;

-- =============================================
-- DESPESAS — Transporte (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Combustível',         'expense', '#f59e0b', '⛽', 'd0000001-0000-0000-0000-000000000003'),
  ('Uber / 99 / Taxi',   'expense', '#f59e0b', '🚕', 'd0000001-0000-0000-0000-000000000003'),
  ('Ônibus / Metrô',     'expense', '#f59e0b', '🚌', 'd0000001-0000-0000-0000-000000000003'),
  ('Estacionamento',     'expense', '#f59e0b', '🅿️', 'd0000001-0000-0000-0000-000000000003'),
  ('Manutenção Veículo', 'expense', '#f59e0b', '🔩', 'd0000001-0000-0000-0000-000000000003'),
  ('IPVA',               'expense', '#f59e0b', '📄', 'd0000001-0000-0000-0000-000000000003'),
  ('Seguro Auto',        'expense', '#f59e0b', '🛡️', 'd0000001-0000-0000-0000-000000000003'),
  ('Licenciamento',      'expense', '#f59e0b', '📋', 'd0000001-0000-0000-0000-000000000003'),
  ('Pedágio',            'expense', '#f59e0b', '🚧', 'd0000001-0000-0000-0000-000000000003'),
  ('Financiamento Auto', 'expense', '#f59e0b', '🚗', 'd0000001-0000-0000-0000-000000000003')
on conflict do nothing;

-- =============================================
-- DESPESAS — Saúde (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Plano de Saúde',    'expense', '#10b981', '🏥', 'd0000001-0000-0000-0000-000000000004'),
  ('Médico / Consulta', 'expense', '#10b981', '👨‍⚕️', 'd0000001-0000-0000-0000-000000000004'),
  ('Dentista',          'expense', '#10b981', '🦷', 'd0000001-0000-0000-0000-000000000004'),
  ('Farmácia',          'expense', '#10b981', '💊', 'd0000001-0000-0000-0000-000000000004'),
  ('Exames / Laboratório','expense','#10b981', '🔬', 'd0000001-0000-0000-0000-000000000004'),
  ('Academia',          'expense', '#10b981', '🏋️', 'd0000001-0000-0000-0000-000000000004'),
  ('Psicólogo',         'expense', '#10b981', '🧠', 'd0000001-0000-0000-0000-000000000004'),
  ('Fisioterapia',      'expense', '#10b981', '🤸', 'd0000001-0000-0000-0000-000000000004'),
  ('Óptica / Óculos',   'expense', '#10b981', '👓', 'd0000001-0000-0000-0000-000000000004')
on conflict do nothing;

-- =============================================
-- DESPESAS — Educação (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Escola / Colégio',  'expense', '#3b82f6', '🏫', 'd0000001-0000-0000-0000-000000000005'),
  ('Faculdade',         'expense', '#3b82f6', '🎓', 'd0000001-0000-0000-0000-000000000005'),
  ('Cursos Online',     'expense', '#3b82f6', '💻', 'd0000001-0000-0000-0000-000000000005'),
  ('Livros',            'expense', '#3b82f6', '📖', 'd0000001-0000-0000-0000-000000000005'),
  ('Material Escolar',  'expense', '#3b82f6', '✏️', 'd0000001-0000-0000-0000-000000000005'),
  ('Idiomas',           'expense', '#3b82f6', '🌎', 'd0000001-0000-0000-0000-000000000005')
on conflict do nothing;

-- =============================================
-- DESPESAS — Lazer (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Streaming',          'expense', '#8b5cf6', '📱', 'd0000001-0000-0000-0000-000000000006'),
  ('Cinema / Teatro',    'expense', '#8b5cf6', '🎭', 'd0000001-0000-0000-0000-000000000006'),
  ('Shows / Eventos',    'expense', '#8b5cf6', '🎵', 'd0000001-0000-0000-0000-000000000006'),
  ('Viagem / Hospedagem','expense', '#8b5cf6', '✈️', 'd0000001-0000-0000-0000-000000000006'),
  ('Hobbies',            'expense', '#8b5cf6', '🎯', 'd0000001-0000-0000-0000-000000000006'),
  ('Games / Jogos',      'expense', '#8b5cf6', '🎮', 'd0000001-0000-0000-0000-000000000006'),
  ('Esportes',           'expense', '#8b5cf6', '⚽', 'd0000001-0000-0000-0000-000000000006'),
  ('Livros / Revistas',  'expense', '#8b5cf6', '📚', 'd0000001-0000-0000-0000-000000000006')
on conflict do nothing;

-- =============================================
-- DESPESAS — Finanças (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Imposto de Renda',   'expense', '#6366f1', '📊', 'd0000001-0000-0000-0000-000000000009'),
  ('Tarifa Bancária',    'expense', '#6366f1', '🏦', 'd0000001-0000-0000-0000-000000000009'),
  ('Seguro de Vida',     'expense', '#6366f1', '🛡️', 'd0000001-0000-0000-0000-000000000009'),
  ('Previdência',        'expense', '#6366f1', '💰', 'd0000001-0000-0000-0000-000000000009'),
  ('Empréstimo',         'expense', '#6366f1', '💳', 'd0000001-0000-0000-0000-000000000009'),
  ('Cartão de Crédito',  'expense', '#6366f1', '💳', 'd0000001-0000-0000-0000-000000000009'),
  ('Financiamento',      'expense', '#6366f1', '📑', 'd0000001-0000-0000-0000-000000000009'),
  ('Juros / Multas',     'expense', '#6366f1', '⚠️', 'd0000001-0000-0000-0000-000000000009')
on conflict do nothing;

-- =============================================
-- DESPESAS — Pets (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Ração / Petisco',    'expense', '#f59e0b', '🦴', 'd0000001-0000-0000-0000-000000000010'),
  ('Veterinário',        'expense', '#f59e0b', '🩺', 'd0000001-0000-0000-0000-000000000010'),
  ('Banho e Tosa',       'expense', '#f59e0b', '🛁', 'd0000001-0000-0000-0000-000000000010'),
  ('Plano Pet',          'expense', '#f59e0b', '❤️', 'd0000001-0000-0000-0000-000000000010'),
  ('Acessórios Pet',     'expense', '#f59e0b', '🐾', 'd0000001-0000-0000-0000-000000000010')
on conflict do nothing;

-- =============================================
-- DESPESAS — Tecnologia (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Celular / Plano',    'expense', '#64748b', '📱', 'd0000001-0000-0000-0000-000000000011'),
  ('Computador',         'expense', '#64748b', '🖥️', 'd0000001-0000-0000-0000-000000000011'),
  ('Software / Apps',    'expense', '#64748b', '⚙️', 'd0000001-0000-0000-0000-000000000011'),
  ('Acessórios Tech',    'expense', '#64748b', '🔌', 'd0000001-0000-0000-0000-000000000011')
on conflict do nothing;

-- =============================================
-- RECEITAS — Categorias Pai
-- =============================================
insert into pf_categories (id, name, type, color, icon) values
  ('r0000001-0000-0000-0000-000000000001', 'Trabalho',          'income', '#10b981', '💼'),
  ('r0000001-0000-0000-0000-000000000002', 'Negócios',          'income', '#3b82f6', '🏢'),
  ('r0000001-0000-0000-0000-000000000003', 'Investimentos',     'income', '#f59e0b', '📈'),
  ('r0000001-0000-0000-0000-000000000004', 'Patrimônio',        'income', '#8b5cf6', '🏘️'),
  ('r0000001-0000-0000-0000-000000000005', 'Benefícios',        'income', '#06b6d4', '🎁'),
  ('r0000001-0000-0000-0000-000000000006', 'Outras Receitas',   'income', '#6b7280', '💰')
on conflict (id) do update set name=excluded.name, color=excluded.color, icon=excluded.icon;

-- =============================================
-- RECEITAS — Trabalho (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Salário',            'income', '#10b981', '💰', 'r0000001-0000-0000-0000-000000000001'),
  ('13º Salário',        'income', '#10b981', '🎄', 'r0000001-0000-0000-0000-000000000001'),
  ('Férias',             'income', '#10b981', '🏖️', 'r0000001-0000-0000-0000-000000000001'),
  ('Bônus / PLR',        'income', '#10b981', '⭐', 'r0000001-0000-0000-0000-000000000001'),
  ('Hora Extra',         'income', '#10b981', '⏰', 'r0000001-0000-0000-0000-000000000001'),
  ('Freelance',          'income', '#10b981', '💻', 'r0000001-0000-0000-0000-000000000001'),
  ('Comissão',           'income', '#10b981', '🤝', 'r0000001-0000-0000-0000-000000000001')
on conflict do nothing;

-- =============================================
-- RECEITAS — Negócios (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Venda de Produto',   'income', '#3b82f6', '📦', 'r0000001-0000-0000-0000-000000000002'),
  ('Prestação de Serviço','income','#3b82f6', '🔧', 'r0000001-0000-0000-0000-000000000002'),
  ('Venda Online',       'income', '#3b82f6', '🛒', 'r0000001-0000-0000-0000-000000000002'),
  ('Consultoria',        'income', '#3b82f6', '📊', 'r0000001-0000-0000-0000-000000000002')
on conflict do nothing;

-- =============================================
-- RECEITAS — Investimentos (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Dividendos',         'income', '#f59e0b', '📊', 'r0000001-0000-0000-0000-000000000003'),
  ('Rendimento CDB/LCI', 'income', '#f59e0b', '🏦', 'r0000001-0000-0000-0000-000000000003'),
  ('Resgate Poupança',   'income', '#f59e0b', '🐷', 'r0000001-0000-0000-0000-000000000003'),
  ('Venda de Ações',     'income', '#f59e0b', '📈', 'r0000001-0000-0000-0000-000000000003'),
  ('Criptomoedas',       'income', '#f59e0b', '🪙', 'r0000001-0000-0000-0000-000000000003')
on conflict do nothing;

-- =============================================
-- RECEITAS — Patrimônio (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Aluguel Recebido',   'income', '#8b5cf6', '🏠', 'r0000001-0000-0000-0000-000000000004'),
  ('Venda de Imóvel',    'income', '#8b5cf6', '🏗️', 'r0000001-0000-0000-0000-000000000004'),
  ('Venda de Veículo',   'income', '#8b5cf6', '🚗', 'r0000001-0000-0000-0000-000000000004')
on conflict do nothing;

-- =============================================
-- RECEITAS — Benefícios (subcategorias)
-- =============================================
insert into pf_categories (name, type, color, icon, parent_id) values
  ('Vale Alimentação',   'income', '#06b6d4', '🍽️', 'r0000001-0000-0000-0000-000000000005'),
  ('Vale Transporte',    'income', '#06b6d4', '🚌', 'r0000001-0000-0000-0000-000000000005'),
  ('Seguro Desemprego',  'income', '#06b6d4', '📋', 'r0000001-0000-0000-0000-000000000005'),
  ('FGTS',               'income', '#06b6d4', '💼', 'r0000001-0000-0000-0000-000000000005'),
  ('Restituição IR',     'income', '#06b6d4', '📊', 'r0000001-0000-0000-0000-000000000005'),
  ('Pensão / Alimentos', 'income', '#06b6d4', '👨‍👩‍👧', 'r0000001-0000-0000-0000-000000000005'),
  ('Doação / Presente',  'income', '#06b6d4', '🎁', 'r0000001-0000-0000-0000-000000000005')
on conflict do nothing;
