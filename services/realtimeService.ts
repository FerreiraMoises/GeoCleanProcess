/**
 * services/realtimeService.ts
 * Gerencia as subscriptions Supabase Realtime para o módulo de Fila Inteligente.
 */
import { supabase } from '../supabaseClient';
import { ActivityQueueItem, QueueRule, LoadBalanceSuggestion } from '../types';

type RealtimeCallback<T> = (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: T; old: T }) => void;

const activeChannels: ReturnType<typeof supabase.channel>[] = [];

function cleanupChannel(channel: ReturnType<typeof supabase.channel>) {
  supabase.removeChannel(channel);
}

// ─── Activity Queue Subscription ─────────────────────────────────────────────

export function subscribeToQueue(
  onInsert: (item: ActivityQueueItem) => void,
  onUpdate: (item: ActivityQueueItem) => void,
  onDelete: (id: string) => void,
): () => void {
  const channel = supabase
    .channel('realtime:activity_queue')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'activity_queue' },
      (payload) => {
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';

        if (eventType === 'INSERT' && payload.new) {
          onInsert(rowToQueueItem(payload.new));
        } else if (eventType === 'UPDATE' && payload.new) {
          onUpdate(rowToQueueItem(payload.new));
        } else if (eventType === 'DELETE' && payload.old) {
          onDelete((payload.old as any).id);
        }
      }
    )
    .subscribe();

  activeChannels.push(channel);

  return () => {
    cleanupChannel(channel);
    const idx = activeChannels.indexOf(channel);
    if (idx > -1) activeChannels.splice(idx, 1);
  };
}

// ─── Queue Rules Subscription ─────────────────────────────────────────────────

export function subscribeToRules(
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel('realtime:queue_rules')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'queue_rules' },
      () => onChange()
    )
    .subscribe();

  activeChannels.push(channel);
  return () => {
    cleanupChannel(channel);
    const idx = activeChannels.indexOf(channel);
    if (idx > -1) activeChannels.splice(idx, 1);
  };
}

// ─── Load Balance Suggestions Subscription ───────────────────────────────────

export function subscribeToSuggestions(
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel('realtime:load_balance_suggestions')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'load_balance_suggestions' },
      () => onChange()
    )
    .subscribe();

  activeChannels.push(channel);
  return () => {
    cleanupChannel(channel);
    const idx = activeChannels.indexOf(channel);
    if (idx > -1) activeChannels.splice(idx, 1);
  };
}

export function unsubscribeAll(): void {
  activeChannels.forEach(ch => supabase.removeChannel(ch));
  activeChannels.length = 0;
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

function rowToQueueItem(row: any): ActivityQueueItem {
  return {
    id: row.id,
    taskId: row.task_id ?? null,
    assignedTo: row.assigned_to,
    priority: row.priority,
    position: row.position,
    scheduledAt: row.scheduled_at ?? null,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    status: row.status,
    tankId: row.tank_id ?? null,
    productionOrder: row.production_order ?? null,
    formula: row.formula ?? null,
    product: row.product ?? '',
    title: row.title ?? '',
    description: row.description ?? '',
    estimatedMinutes: row.estimated_minutes ?? 60,
    idleSince: row.idle_since ?? null,
    notes: row.notes ?? '',
    createdAt: row.created_at,
  };
}
