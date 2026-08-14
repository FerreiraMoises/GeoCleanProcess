-- ═══════════════════════════════════════════════════════════════════════════════
-- GeoClean Process — Migration: Campos SMS + Atualização de Colaboradores
-- Aplicar no painel Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Adicionar colunas de confirmação por SMS à tabela tasks
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS sms_status         TEXT    DEFAULT 'pending'
    CHECK (sms_status IN ('pending', 'sent', 'confirmed', 'not_started')),
  ADD COLUMN IF NOT EXISTS sms_confirmed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sms_confirmed_phone TEXT;

-- Comentários explicativos nas colunas
COMMENT ON COLUMN tasks.sms_status IS
  'Estado do fluxo de confirmação via SMS:
   pending     = tarefa criada, SMS ainda não enviado
   sent        = SMS enviado, aguardando resposta
   confirmed   = colaborador respondeu "OK"
   not_started = prazo expirou sem confirmação';

COMMENT ON COLUMN tasks.sms_confirmed_at IS
  'Timestamp ISO da confirmação via SMS pelo colaborador';

COMMENT ON COLUMN tasks.sms_confirmed_phone IS
  'Número de telefone que respondeu "OK" para confirmar a atividade';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Atualização de Colaboradores — Remover Firmino, Adicionar Jorge e Diego
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove Firmino (fm-07)
DELETE FROM employees WHERE id = 'fm-07';

-- Adiciona Jorge como Auxiliar de Produção
INSERT INTO employees (id, name, role)
VALUES ('jg-08', 'Jorge', 'Auxiliar de Produção')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Adiciona Diego como Auxiliar de Produção
INSERT INTO employees (id, name, role)
VALUES ('dg-09', 'Diego', 'Auxiliar de Produção')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Índice para consultas por sms_status (desempenho)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tasks_sms_status ON tasks (sms_status)
  WHERE sms_status IN ('sent', 'not_started');

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Função de webhook — chamada pela Supabase Edge Function após resposta "OK"
--
--    A Edge Function (supabase/functions/sms-webhook/index.ts) recebe o
--    callback do provedor SMS, extrai o taskId da mensagem e chama esta função.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION confirm_task_by_sms(
  p_task_id       TEXT,
  p_phone         TEXT,
  p_confirmed_at  TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task tasks%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Busca a tarefa
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not found: ' || p_task_id);
  END IF;

  -- Verifica se o SMS está aguardando confirmação
  IF v_task.sms_status NOT IN ('sent', 'pending') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SMS already processed with status: ' || v_task.sms_status
    );
  END IF;

  -- Atualiza a tarefa: confirma o SMS e muda o status para "Em Andamento"
  UPDATE tasks SET
    sms_status         = 'confirmed',
    sms_confirmed_at   = p_confirmed_at,
    sms_confirmed_phone = p_phone,
    status             = 'Em Andamento'
  WHERE id = p_task_id;

  RETURN jsonb_build_object(
    'success',       true,
    'task_id',       p_task_id,
    'confirmed_at',  p_confirmed_at,
    'phone',         p_phone,
    'new_status',    'Em Andamento'
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Função para marcar tarefas não iniciadas após timeout
--    Pode ser chamada por um pg_cron job ou pela Edge Function de verificação
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mark_unconfirmed_tasks(
  p_timeout_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(task_id TEXT, employee_id TEXT, title TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Encontra tarefas com SMS enviado há mais de p_timeout_minutes e não confirmadas
  RETURN QUERY
  UPDATE tasks SET
    sms_status = 'not_started'
  WHERE
    sms_status = 'sent'
    AND NOW() - updated_at > (p_timeout_minutes || ' minutes')::INTERVAL
  RETURNING
    id         AS task_id,
    assigned_to AS employee_id,
    title;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verificação final
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  'tasks sms columns' AS check,
  COUNT(*) AS columns_added
FROM information_schema.columns
WHERE table_name = 'tasks'
  AND column_name IN ('sms_status', 'sms_confirmed_at', 'sms_confirmed_phone');

SELECT
  'employees after update' AS check,
  id, name, role
FROM employees
ORDER BY id;
