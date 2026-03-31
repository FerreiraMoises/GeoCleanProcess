// Roda com: node setup-tanks-table.mjs
// Cria a tabela storage_tanks no Supabase

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cvnwizhojoyourjkvumg.supabase.co';
// Use a SERVICE ROLE KEY aqui (encontre em: Project Settings > API > service_role)
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.');
  console.error('   Exemplo: set SUPABASE_SERVICE_ROLE_KEY=eyJ... && node setup-tanks-table.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SQL = `
CREATE TABLE IF NOT EXISTS storage_tanks (
  id TEXT PRIMARY KEY,
  volume NUMERIC(10,4) NOT NULL DEFAULT 0,
  product TEXT NOT NULL DEFAULT '',
  pump_on BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO storage_tanks (id, volume, product, pump_on)
VALUES
  ('T1', 0, '', FALSE),
  ('T2', 0, '', FALSE),
  ('T3', 0, '', FALSE),
  ('T4', 0, '', FALSE),
  ('T5', 0, '', FALSE)
ON CONFLICT (id) DO NOTHING;
`;

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ query: SQL }),
});

if (!res.ok) {
  // Tenta via pg endpoint
  console.log('Tentando via endpoint alternativo...');
}

// Usa o cliente supabase para verificar se a tabela foi criada
const { data, error } = await supabase.from('storage_tanks').select('id');

if (error) {
  console.error('❌ Tabela ainda não existe. Vá ao Supabase Dashboard > SQL Editor e cole o SQL abaixo:');
  console.log('\n' + SQL + '\n');
} else {
  console.log('✅ Tabela storage_tanks pronta! Registros:', data);
}
