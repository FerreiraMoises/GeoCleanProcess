/**
 * fix-tanks-rls.mjs
 * Cria a tabela storage_tanks e corrige as políticas RLS via Supabase REST API.
 *
 * Uso:
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJ... && node fix-tanks-rls.mjs
 *
 * A SERVICE_ROLE_KEY está em: Supabase Dashboard > Project Settings > API > service_role (secret)
 */

const SUPABASE_URL = 'https://cvnwizhojoyourjkvumg.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌ Defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.');
  console.error('   Exemplo (PowerShell):');
  console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; node fix-tanks-rls.mjs\n');
  process.exit(1);
}

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });
  return res;
}

// Usa o endpoint de query direto do Postgres via Management API
async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log('\n🔧 Iniciando configuração da tabela storage_tanks...\n');

// 1. Verificar se a tabela existe
const { data: tableCheck, error: tableErr } = await supabase
  .from('storage_tanks')
  .select('id')
  .limit(1);

if (tableErr) {
  console.error('❌ Tabela storage_tanks não existe ou não está acessível:', tableErr.message);
  console.log('\n📋 Execute o SQL abaixo no Supabase Dashboard > SQL Editor:\n');
  console.log(`
-- =====================================================
-- COLE ESTE SQL NO SUPABASE SQL EDITOR
-- =====================================================

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS storage_tanks (
  id TEXT PRIMARY KEY,
  volume NUMERIC(10,4) NOT NULL DEFAULT 0,
  product TEXT NOT NULL DEFAULT '',
  pump_on BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Inserir registros iniciais
INSERT INTO storage_tanks (id, volume, product, pump_on)
VALUES
  ('T1', 0, '', FALSE),
  ('T2', 0, '', FALSE),
  ('T3', 0, '', FALSE),
  ('T4', 0, '', FALSE),
  ('T5', 0, '', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. Habilitar RLS
ALTER TABLE storage_tanks ENABLE ROW LEVEL SECURITY;

-- 4. Permitir leitura para anon
CREATE POLICY IF NOT EXISTS "Allow anon read storage_tanks"
  ON storage_tanks FOR SELECT
  TO anon
  USING (true);

-- 5. Permitir escrita para anon
CREATE POLICY IF NOT EXISTS "Allow anon write storage_tanks"
  ON storage_tanks FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- =====================================================
`);
  process.exit(1);
}

console.log('✅ Tabela storage_tanks existe!');
console.log('   Registros encontrados:', JSON.stringify(tableCheck));

// 2. Testar se consegue fazer upsert com a service role key
const { error: upsertErr } = await supabase
  .from('storage_tanks')
  .upsert([
    { id: 'T1', volume: 0, product: '', pump_on: false, updated_at: new Date().toISOString() },
    { id: 'T2', volume: 0, product: '', pump_on: false, updated_at: new Date().toISOString() },
    { id: 'T3', volume: 0, product: '', pump_on: false, updated_at: new Date().toISOString() },
    { id: 'T4', volume: 0, product: '', pump_on: false, updated_at: new Date().toISOString() },
    { id: 'T5', volume: 0, product: '', pump_on: false, updated_at: new Date().toISOString() },
  ], { onConflict: 'id', ignoreDuplicates: true });

if (upsertErr) {
  console.error('❌ Erro ao fazer upsert:', upsertErr.message);
} else {
  console.log('✅ Upsert dos 5 tanques: OK');
}

// 3. Listar políticas RLS atuais
const { data: policies, error: polErr } = await supabase
  .from('pg_policies')
  .select('*')
  .eq('tablename', 'storage_tanks');

if (!polErr && policies) {
  console.log('\n📋 Políticas RLS atuais na storage_tanks:');
  if (policies.length === 0) {
    console.log('   ⚠️  NENHUMA política encontrada! Precisa criar políticas RLS.');
  } else {
    policies.forEach(p => console.log(`   - ${p.policyname} (${p.cmd}) para ${p.roles}`));
  }
}

console.log('\n📋 Para corrigir as políticas RLS, cole este SQL no Supabase Dashboard > SQL Editor:\n');
console.log(`
-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow anon read storage_tanks" ON storage_tanks;
DROP POLICY IF EXISTS "Allow anon write storage_tanks" ON storage_tanks;
DROP POLICY IF EXISTS "Allow all storage_tanks" ON storage_tanks;

-- Habilitar RLS
ALTER TABLE storage_tanks ENABLE ROW LEVEL SECURITY;

-- Política de leitura para anon
CREATE POLICY "Allow anon read storage_tanks"
  ON storage_tanks FOR SELECT
  TO anon
  USING (true);

-- Política de escrita para anon (INSERT, UPDATE, DELETE)
CREATE POLICY "Allow anon write storage_tanks"
  ON storage_tanks FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
`);
