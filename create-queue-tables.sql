-- ============================================================
-- MÓDULO FILA INTELIGENTE — SQL para o Supabase SQL Editor
-- Execute este script no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabela principal da fila de atividades
CREATE TABLE IF NOT EXISTS activity_queue (
  id                TEXT PRIMARY KEY,
  task_id           TEXT,
  assigned_to       TEXT NOT NULL,
  priority          TEXT NOT NULL DEFAULT 'media',
  position          INTEGER NOT NULL DEFAULT 0,
  scheduled_at      TIMESTAMPTZ,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'aguardando',
  tank_id           TEXT,
  production_order  TEXT,
  formula           TEXT,
  product           TEXT DEFAULT '',
  title             TEXT DEFAULT '',
  description       TEXT DEFAULT '',
  estimated_minutes INTEGER DEFAULT 60,
  idle_since        TIMESTAMPTZ,
  notes             TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_queue_public" ON activity_queue;
CREATE POLICY "activity_queue_public" ON activity_queue
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabela de regras do motor de automação
CREATE TABLE IF NOT EXISTS queue_rules (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  trigger_event   TEXT NOT NULL,
  condition_data  JSONB,
  action          TEXT NOT NULL,
  action_data     JSONB,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE queue_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "queue_rules_public" ON queue_rules;
CREATE POLICY "queue_rules_public" ON queue_rules
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabela de sugestões de balanceamento de carga
CREATE TABLE IF NOT EXISTS load_balance_suggestions (
  id                     TEXT PRIMARY KEY,
  available_employee_id  TEXT NOT NULL,
  overloaded_employee_id TEXT NOT NULL,
  suggested_task_id      TEXT,
  estimated_delay_mins   INTEGER DEFAULT 0,
  status                 TEXT DEFAULT 'pending',
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE load_balance_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "load_balance_suggestions_public" ON load_balance_suggestions;
CREATE POLICY "load_balance_suggestions_public" ON load_balance_suggestions
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Habilitar Realtime para as 3 tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE activity_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE queue_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE load_balance_suggestions;

-- ✅ Script concluído! As 3 tabelas foram criadas.
