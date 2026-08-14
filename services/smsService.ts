/**
 * smsService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Camada de integração de SMS desacoplada — Strategy Pattern.
 *
 * Provedores suportados:
 *   • simulated  → log no console (padrão, sem chaves de API)
 *   • twilio     → Twilio SMS API
 *   • zenvia     → Zenvia SMS API (brasil)
 *   • infobip    → Infobip SMS API
 *   • aws_sns    → Amazon SNS
 *
 * Para ativar um provedor real, defina as variáveis de ambiente:
 *   VITE_SMS_PROVIDER=twilio
 *   VITE_SMS_API_KEY=...
 *   VITE_SMS_API_SECRET=...     (Twilio account SID / Zenvia secret)
 *   VITE_SMS_FROM_NUMBER=+5511... (número remetente)
 *
 * Para a confirmação via webhook (resposta "OK" do colaborador):
 *   A Supabase Edge Function `sms-webhook` recebe o callback do provedor
 *   e atualiza o campo `sms_status` na tabela `tasks`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Task, Employee } from '../types';

// ─── Tipos do Serviço ─────────────────────────────────────────────────────────

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsSendParams {
  /** Número de destino no formato E.164: +5511999999999 */
  to: string;
  /** Corpo da mensagem */
  body: string;
}

/**
 * Interface do provedor SMS — permite trocar o provedor sem alterar
 * o código de negócio (Strategy Pattern / Princípio OCP do SOLID).
 */
export interface SmsProvider {
  name: string;
  send(params: SmsSendParams): Promise<SmsResult>;
}

// ─── Provedor Simulado (padrão) ───────────────────────────────────────────────

class SimulatedProvider implements SmsProvider {
  name = 'simulated';

  async send(params: SmsSendParams): Promise<SmsResult> {
    // Em desenvolvimento: exibe o SMS no console e simula sucesso
    console.group('[SMS Simulado] 📱 Mensagem enviada');
    console.log('Para:', params.to);
    console.log('Mensagem:\n', params.body);
    console.groupEnd();
    return { success: true, messageId: `sim_${Date.now()}` };
  }
}

// ─── Provedor Twilio ──────────────────────────────────────────────────────────

class TwilioProvider implements SmsProvider {
  name = 'twilio';

  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = import.meta.env.VITE_SMS_API_KEY ?? '';
    this.authToken   = import.meta.env.VITE_SMS_API_SECRET ?? '';
    this.fromNumber  = import.meta.env.VITE_SMS_FROM_NUMBER ?? '';
  }

  async send(params: SmsSendParams): Promise<SmsResult> {
    try {
      /**
       * NOTA: Chamadas diretas ao Twilio a partir do browser enviariam
       * credenciais expostas. Em produção, use uma Supabase Edge Function
       * ou Vercel Function como proxy.
       *
       * Endpoint de proxy sugerido: POST /api/send-sms
       * Body: { to, body }
       */
      const proxyUrl = import.meta.env.VITE_SMS_PROXY_URL;
      if (!proxyUrl) {
        console.warn('[Twilio] VITE_SMS_PROXY_URL não configurada. Usando modo simulado.');
        return new SimulatedProvider().send(params);
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'twilio',
          accountSid: this.accountSid,
          authToken: this.authToken,
          from: this.fromNumber,
          to: params.to,
          body: params.body,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: `Twilio error: ${response.status} — ${JSON.stringify(errorData)}` };
      }

      const data = await response.json();
      return { success: true, messageId: data.sid ?? data.messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Twilio exception: ${message}` };
    }
  }
}

// ─── Provedor Zenvia ──────────────────────────────────────────────────────────

class ZenviaProvider implements SmsProvider {
  name = 'zenvia';

  private apiToken: string;
  private fromNumber: string;

  constructor() {
    this.apiToken    = import.meta.env.VITE_SMS_API_KEY ?? '';
    this.fromNumber  = import.meta.env.VITE_SMS_FROM_NUMBER ?? '';
  }

  async send(params: SmsSendParams): Promise<SmsResult> {
    try {
      const proxyUrl = import.meta.env.VITE_SMS_PROXY_URL;
      if (!proxyUrl) {
        console.warn('[Zenvia] VITE_SMS_PROXY_URL não configurada. Usando modo simulado.');
        return new SimulatedProvider().send(params);
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'zenvia',
          apiToken: this.apiToken,
          from: this.fromNumber,
          to: params.to,
          body: params.body,
        }),
      });

      if (!response.ok) {
        return { success: false, error: `Zenvia error: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, messageId: data.id ?? data.messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Zenvia exception: ${message}` };
    }
  }
}

// ─── Provedor Infobip ─────────────────────────────────────────────────────────

class InfobipProvider implements SmsProvider {
  name = 'infobip';

  private apiKey: string;
  private baseUrl: string;
  private fromNumber: string;

  constructor() {
    this.apiKey     = import.meta.env.VITE_SMS_API_KEY ?? '';
    this.baseUrl    = import.meta.env.VITE_SMS_API_BASE_URL ?? 'https://api.infobip.com';
    this.fromNumber = import.meta.env.VITE_SMS_FROM_NUMBER ?? 'GeoClean';
  }

  async send(params: SmsSendParams): Promise<SmsResult> {
    try {
      const proxyUrl = import.meta.env.VITE_SMS_PROXY_URL;
      if (!proxyUrl) {
        console.warn('[Infobip] VITE_SMS_PROXY_URL não configurada. Usando modo simulado.');
        return new SimulatedProvider().send(params);
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'infobip',
          apiKey: this.apiKey,
          baseUrl: this.baseUrl,
          from: this.fromNumber,
          to: params.to,
          body: params.body,
        }),
      });

      if (!response.ok) {
        return { success: false, error: `Infobip error: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, messageId: data.messages?.[0]?.messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Infobip exception: ${message}` };
    }
  }
}

// ─── Provedor AWS SNS ─────────────────────────────────────────────────────────

class AwsSnsProvider implements SmsProvider {
  name = 'aws_sns';

  async send(params: SmsSendParams): Promise<SmsResult> {
    try {
      const proxyUrl = import.meta.env.VITE_SMS_PROXY_URL;
      if (!proxyUrl) {
        console.warn('[AWS SNS] VITE_SMS_PROXY_URL não configurada. Usando modo simulado.');
        return new SimulatedProvider().send(params);
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'aws_sns',
          accessKeyId: import.meta.env.VITE_SMS_API_KEY,
          secretAccessKey: import.meta.env.VITE_SMS_API_SECRET,
          region: import.meta.env.VITE_SMS_AWS_REGION ?? 'us-east-1',
          to: params.to,
          body: params.body,
        }),
      });

      if (!response.ok) {
        return { success: false, error: `AWS SNS error: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, messageId: data.MessageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `AWS SNS exception: ${message}` };
    }
  }
}

// ─── Factory — Seleciona o Provedor via Variável de Ambiente ──────────────────

/**
 * Retorna a instância do provedor configurado em VITE_SMS_PROVIDER.
 * Padrão: 'simulated' (sem dependências externas).
 */
export function getSmsProvider(): SmsProvider {
  const provider = import.meta.env.VITE_SMS_PROVIDER ?? 'simulated';

  switch (provider) {
    case 'twilio':   return new TwilioProvider();
    case 'zenvia':   return new ZenviaProvider();
    case 'infobip':  return new InfobipProvider();
    case 'aws_sns':  return new AwsSnsProvider();
    default:         return new SimulatedProvider();
  }
}

// ─── Formatação da Mensagem de Tarefa ─────────────────────────────────────────

/**
 * Formata a mensagem SMS que será enviada ao colaborador quando
 * uma nova tarefa é criada para ele.
 */
export function formatTaskSmsMessage(task: Task, employee: Employee): string {
  const deadline = new Date(task.deadline);

  // Formata data: 25/07/2026
  const date = deadline.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Formata horário: 08:00
  const time = deadline.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines: string[] = [
    `Olá, ${employee.name}!`,
    `Você recebeu uma nova atividade.`,
    ``,
    `Atividade: ${task.title}`,
    `Data: ${date}`,
    `Horário: ${time}`,
  ];

  if (task.description) {
    lines.push(`Descrição: ${task.description}`);
  }

  lines.push(``);
  lines.push(`Responda OK para confirmar o início da atividade.`);
  lines.push(`— GeoClean Process`);

  return lines.join('\n');
}

// ─── Função Principal de Envio ────────────────────────────────────────────────

/**
 * Envia um SMS de notificação ao colaborador quando uma tarefa é criada.
 *
 * @param task     - Tarefa recém-criada
 * @param employee - Colaborador designado
 * @param phone    - Número de telefone do colaborador (E.164: +5511999999999)
 *
 * @returns SmsResult com success e messageId ou erro
 */
export async function sendTaskNotificationSms(
  task: Task,
  employee: Employee,
  phone: string,
): Promise<SmsResult> {
  const provider = getSmsProvider();
  const body     = formatTaskSmsMessage(task, employee);

  console.log(`[SMS] Enviando notificação via ${provider.name} para ${employee.name} (${phone})`);

  const result = await provider.send({ to: phone, body });

  if (result.success) {
    console.log(`[SMS] ✅ Enviado com sucesso. MessageId: ${result.messageId}`);
  } else {
    console.error(`[SMS] ❌ Falha no envio: ${result.error}`);
  }

  return result;
}

// ─── Verificação de Timeout ───────────────────────────────────────────────────

/**
 * Verifica se o prazo de confirmação expirou.
 *
 * @param smsSentAt    - ISO timestamp de quando o SMS foi enviado
 * @param timeoutMins  - Minutos até expirar (padrão: VITE_SMS_TIMEOUT_MINUTES ou 60)
 */
export function isSmsConfirmationExpired(smsSentAt: string, timeoutMins?: number): boolean {
  const timeout = timeoutMins
    ?? parseInt(import.meta.env.VITE_SMS_TIMEOUT_MINUTES ?? '60', 10);

  const sentTime   = new Date(smsSentAt).getTime();
  const nowTime    = Date.now();
  const elapsedMs  = nowTime - sentTime;
  const timeoutMs  = timeout * 60 * 1000;

  return elapsedMs > timeoutMs;
}
