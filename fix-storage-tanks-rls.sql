-- ================================================================
-- CORREÇÃO: Políticas de acesso da tabela storage_tanks
-- Execute este script no Supabase Dashboard > SQL Editor
-- ================================================================

-- 1. Garante que a tabela existe com as colunas corretas
CREATE TABLE IF NOT EXISTS public.storage_tanks (
  id         TEXT PRIMARY KEY,      -- 'T1' ... 'T5'
  volume     NUMERIC  NOT NULL DEFAULT 0,
  product    TEXT     NOT NULL DEFAULT '',
  pump_on    BOOLEAN  NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Remove políticas antigas (caso existam) para recriar do zero
DROP POLICY IF EXISTS "Allow anonymous reads"  ON public.storage_tanks;
DROP POLICY IF EXISTS "Allow anonymous writes" ON public.storage_tanks;
DROP POLICY IF EXISTS "Allow public reads"     ON public.storage_tanks;
DROP POLICY IF EXISTS "Allow public writes"    ON public.storage_tanks;
DROP POLICY IF EXISTS "tanks_select"           ON public.storage_tanks;
DROP POLICY IF EXISTS "tanks_insert"           ON public.storage_tanks;
DROP POLICY IF EXISTS "tanks_update"           ON public.storage_tanks;
DROP POLICY IF EXISTS "tanks_upsert"           ON public.storage_tanks;

-- 3. Habilita RLS
ALTER TABLE public.storage_tanks ENABLE ROW LEVEL SECURITY;

-- 4. Permite leitura pública (qualquer pessoa conectada vê os tanques)
CREATE POLICY "tanks_select"
  ON public.storage_tanks
  FOR SELECT
  USING (true);

-- 5. Permite inserção pública (seed inicial)
CREATE POLICY "tanks_insert"
  ON public.storage_tanks
  FOR INSERT
  WITH CHECK (true);

-- 6. Permite atualização pública (salvar volume/produto/bomba)
CREATE POLICY "tanks_update"
  ON public.storage_tanks
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 7. Insere os 5 tanques se ainda não existirem
INSERT INTO public.storage_tanks (id, volume, product, pump_on)
  VALUES
    ('T1', 0, '', false),
    ('T2', 0, '', false),
    ('T3', 0, '', false),
    ('T4', 0, '', false),
    ('T5', 0, '', false)
  ON CONFLICT (id) DO NOTHING;

-- 8. Confirmação
SELECT id, volume, product, pump_on, updated_at
  FROM public.storage_tanks
  ORDER BY id;
