/**
 * setup-queue-tables.mjs
 * Cria as tabelas do Módulo de Fila Inteligente no Supabase.
 * Execute com: node setup-queue-tables.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cvnwizhojoyourjkvumg.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bndpemhvam95b3Vyamt2dW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4Mzc5NjIsImV4cCI6MjA4NzQxMzk2Mn0.Ok6nSO8F-QyyaYkHJao57MKv3GmOu51nVw8amRHAE_g';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SQL para criar as 3 novas tabelas
const migrations = [
  {
    name: 'activity_queue',
    sql: `
      CREATE TABLE IF NOT EXISTS activity_queue (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        assigned_to TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'media',
        position INTEGER NOT NULL DEFAULT 0,
        scheduled_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'aguardando',
        tank_id TEXT,
        production_order TEXT,
        formula TEXT,
        product TEXT,
        title TEXT,
        description TEXT,
        estimated_minutes INTEGER DEFAULT 60,
        idle_since TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'queue_rules',
    sql: `
      CREATE TABLE IF NOT EXISTS queue_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        trigger_event TEXT NOT NULL,
        condition_data JSONB,
        action TEXT NOT NULL,
        action_data JSONB,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'load_balance_suggestions',
    sql: `
      CREATE TABLE IF NOT EXISTS load_balance_suggestions (
        id TEXT PRIMARY KEY,
        available_employee_id TEXT NOT NULL,
        overloaded_employee_id TEXT NOT NULL,
        suggested_task_id TEXT,
        estimated_delay_mins INTEGER,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  }
];

async function runMigrations() {
  console.log('🚀 Iniciando criação das tabelas da Fila Inteligente...\n');

  for (const migration of migrations) {
    console.log(`📋 Criando tabela: ${migration.name}...`);
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: migration.sql });
      if (error) {
        // Tenta via REST direto
        console.log(`  ⚠️  RPC não disponível, tabela pode já existir ou precisar ser criada manualmente.`);
        console.log(`  SQL para executar no Supabase SQL Editor:\n`);
        console.log(migration.sql);
      } else {
        console.log(`  ✅ Tabela ${migration.name} criada com sucesso!\n`);
      }
    } catch (err) {
      console.log(`  ℹ️  Execute este SQL manualmente no Supabase:\n`);
      console.log(migration.sql);
    }
  }

  // Verifica quais tabelas já existem
  console.log('\n🔍 Verificando tabelas existentes...');
  for (const migration of migrations) {
    const { data, error } = await supabase.from(migration.name).select('id').limit(1);
    if (error) {
      console.log(`  ❌ ${migration.name}: NÃO EXISTE — execute o SQL acima no Supabase Dashboard`);
    } else {
      console.log(`  ✅ ${migration.name}: EXISTE`);
    }
  }

  console.log('\n✅ Verificação concluída!');
}

runMigrations().catch(console.error);
