/**
 * Supabase Edge Function — SMS Webhook
 * ─────────────────────────────────────────────────────────────────────────────
 * Recebe callbacks dos provedores de SMS (Twilio, Zenvia, Infobip, AWS SNS)
 * quando o colaborador responde a mensagem.
 *
 * Fluxo:
 *   1. Provedor SMS envia POST para esta URL com o corpo da resposta do colaborador
 *   2. Esta função extrai: número do remetente, corpo da mensagem, taskId
 *   3. Se a mensagem for "OK" (case-insensitive), confirma a tarefa no banco
 *   4. Se não for "OK", registra a tentativa mas não confirma
 *
 * Deploy:
 *   supabase functions deploy sms-webhook --no-verify-jwt
 *
 * Variáveis de Ambiente (Supabase Secrets):
 *   SUPABASE_URL              → URL do projeto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY → Chave de serviço (com permissão de escrita)
 *   SMS_WEBHOOK_SECRET        → Secret para validar autenticidade do webhook
 *   SMS_PROVIDER              → 'twilio' | 'zenvia' | 'infobip' | 'aws_sns'
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ParsedSmsResponse {
  /** Número do remetente (colaborador) — formato E.164 */
  fromPhone: string;
  /** Corpo da mensagem recebida */
  messageBody: string;
  /** ID da tarefa — extraído do corpo da mensagem ou do metadata do provedor */
  taskId: string | null;
}

// ─── Parsers por Provedor ─────────────────────────────────────────────────────

/**
 * Twilio envia form-encoded: From=+5511..., Body=OK, ...
 */
function parseTwilioWebhook(formData: URLSearchParams): ParsedSmsResponse {
  const body = formData.get('Body') ?? '';
  const from  = formData.get('From') ?? '';

  // Tenta extrair taskId do corpo: ex. "OK task:1234567890"
  const taskMatch = body.match(/task[:\s]+(\w+)/i);

  return {
    fromPhone:   from,
    messageBody: body.trim(),
    taskId:      taskMatch?.[1] ?? null,
  };
}

/**
 * Zenvia envia JSON: { "message": { "from": "5511...", "contents": [{ "text": "OK" }] } }
 */
function parseZenviaWebhook(json: Record<string, any>): ParsedSmsResponse {
  const from  = json?.message?.from ?? '';
  const body  = json?.message?.contents?.[0]?.text ?? '';
  const taskMatch = body.match(/task[:\s]+(\w+)/i);

  return {
    fromPhone:   from,
    messageBody: body.trim(),
    taskId:      taskMatch?.[1] ?? null,
  };
}

/**
 * Infobip envia JSON com array de results
 */
function parseInfobipWebhook(json: Record<string, any>): ParsedSmsResponse {
  const result = json?.results?.[0] ?? {};
  const from   = result?.from ?? '';
  const body   = result?.cleanText ?? result?.text ?? '';
  const taskMatch = body.match(/task[:\s]+(\w+)/i);

  return {
    fromPhone:   from,
    messageBody: body.trim(),
    taskId:      taskMatch?.[1] ?? null,
  };
}

// ─── Busca taskId pelo número de telefone ─────────────────────────────────────

/**
 * Caso o colaborador não informe o taskId na resposta,
 * busca a tarefa mais recente com SMS 'sent' para aquele número.
 *
 * NOTA: Para isso funcionar, o campo de telefone do colaborador
 * precisa estar salvo no banco (tabela employees com coluna 'phone').
 */
async function findTaskByPhone(
  supabase: ReturnType<typeof createClient>,
  phone: string,
): Promise<string | null> {
  // Normaliza o número (remove espaços, traços)
  const normalized = phone.replace(/\s|-/g, '');

  // Busca o colaborador pelo telefone
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('phone', normalized)
    .single();

  if (!employee) return null;

  // Busca a tarefa mais recente com SMS enviado para esse colaborador
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('assigned_to', employee.id)
    .eq('sms_status', 'sent')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  return task?.id ?? null;
}

// ─── Handler Principal ────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Rejeita métodos que não sejam POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Inicializa cliente Supabase com permissões de serviço
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const provider = Deno.env.get('SMS_PROVIDER') ?? 'twilio';
  let parsed: ParsedSmsResponse;

  try {
    // ── Parse do payload conforme o provedor ─────────────────────────────────
    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Twilio usa form-encoded
      const text     = await req.text();
      const formData = new URLSearchParams(text);
      parsed         = parseTwilioWebhook(formData);
    } else {
      // Zenvia, Infobip, AWS SNS usam JSON
      const json = await req.json();
      switch (provider) {
        case 'zenvia':  parsed = parseZenviaWebhook(json);  break;
        case 'infobip': parsed = parseInfobipWebhook(json); break;
        default:        parsed = parseTwilioWebhook(new URLSearchParams(JSON.stringify(json)));
      }
    }
  } catch (parseErr) {
    console.error('[SMS Webhook] Erro ao parsear payload:', parseErr);
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log('[SMS Webhook] Recebido:', {
    provider,
    from:    parsed.fromPhone,
    message: parsed.messageBody,
    taskId:  parsed.taskId,
  });

  // ── Verifica se a resposta é "OK" (case-insensitive, trim) ────────────────
  const isOkResponse = parsed.messageBody.trim().toUpperCase() === 'OK';

  if (!isOkResponse) {
    console.log('[SMS Webhook] Resposta não é "OK" — ignorando confirma\u00e7\u00e3o.');
    // Retorna 200 para o provedor não retentar o webhook
    return new Response(
      JSON.stringify({ received: true, confirmed: false, reason: 'Response is not OK' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Resolve o taskId ──────────────────────────────────────────────────────
  let taskId = parsed.taskId;

  if (!taskId) {
    // Tenta encontrar pelo número de telefone
    taskId = await findTaskByPhone(supabase, parsed.fromPhone);
  }

  if (!taskId) {
    console.warn('[SMS Webhook] Não foi possível identificar a tarefa para o número:', parsed.fromPhone);
    return new Response(
      JSON.stringify({ received: true, confirmed: false, reason: 'Task not found for phone number' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Confirma a tarefa via função SQL ──────────────────────────────────────
  const { data: result, error } = await supabase.rpc('confirm_task_by_sms', {
    p_task_id:      taskId,
    p_phone:        parsed.fromPhone,
    p_confirmed_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[SMS Webhook] Erro ao confirmar tarefa:', error);
    return new Response(
      JSON.stringify({ received: true, confirmed: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const resultData = result as Record<string, any>;

  if (!resultData?.success) {
    console.warn('[SMS Webhook] confirm_task_by_sms retornou falha:', resultData);
    return new Response(
      JSON.stringify({ received: true, confirmed: false, reason: resultData?.error }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  console.log('[SMS Webhook] ✅ Tarefa confirmada com sucesso:', taskId);

  // Resposta de sucesso no formato do Twilio (TwiML vazio para não enviar SMS de volta)
  if (provider === 'twilio') {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      },
    );
  }

  return new Response(
    JSON.stringify({ received: true, confirmed: true, task_id: taskId }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
