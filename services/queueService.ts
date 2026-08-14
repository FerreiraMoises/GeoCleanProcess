/**
 * services/queueService.ts
 * Lógica central da Fila Inteligente de Produção.
 * Gerencia avanço automático, balanceamento de carga, ociosidade e motor de regras.
 */
import { supabase } from '../supabaseClient';
import {
  ActivityQueueItem, Priority, QueueStatus, QueueRule,
  LoadBalanceSuggestion, IdleAlert, Employee, PRIORITY_CONFIG,
} from '../types';
import {
  updateQueueItem, reorderQueue, addLoadSuggestion, updateSuggestionStatus,
} from '../dbService';

const PRIORITY_ORDER: Record<Priority, number> = { critica: 1, alta: 2, media: 3, baixa: 4 };

// ─── Ordenação local ──────────────────────────────────────────────────────────

export function sortQueueItems(items: ActivityQueueItem[]): ActivityQueueItem[] {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function getEmployeeQueue(
  queue: ActivityQueueItem[],
  employeeId: string
): ActivityQueueItem[] {
  return sortQueueItems(
    queue.filter(
      i => i.assignedTo === employeeId &&
        i.status !== 'concluido' &&
        i.status !== 'cancelado'
    )
  );
}

export function getCurrentActivity(
  queue: ActivityQueueItem[],
  employeeId: string
): ActivityQueueItem | null {
  const active = queue.find(
    i => i.assignedTo === employeeId && i.status === 'em_andamento'
  );
  if (active) return active;
  return getEmployeeQueue(queue, employeeId)[0] ?? null;
}

// ─── Avanço automático ────────────────────────────────────────────────────────

/**
 * Conclui a atividade atual e inicia a próxima automaticamente.
 * Retorna a próxima atividade iniciada (ou null se não houver).
 */
export async function completeActivity(
  completedItem: ActivityQueueItem,
  allQueue: ActivityQueueItem[],
  onQueueChange: (updated: ActivityQueueItem[]) => void,
  onNotification: (msg: string) => void,
): Promise<ActivityQueueItem | null> {
  const now = new Date().toISOString();

  // 1. Marca a atividade atual como concluída
  await updateQueueItem(completedItem.id, {
    status: 'concluido',
    completedAt: now,
  });

  // 2. Encontra a próxima atividade na fila do colaborador
  const employeeQueue = sortQueueItems(
    allQueue.filter(
      i => i.assignedTo === completedItem.assignedTo &&
        i.id !== completedItem.id &&
        i.status !== 'concluido' &&
        i.status !== 'cancelado'
    )
  );

  const nextItem = employeeQueue[0] ?? null;

  if (nextItem) {
    // 3. Inicia a próxima atividade
    await updateQueueItem(nextItem.id, {
      status: 'em_andamento',
      startedAt: now,
      idleSince: null,
    });

    // 4. Notificação
    const tankInfo = nextItem.tankId ? ` no ${nextItem.tankId}` : '';
    onNotification(`✅ Atividade concluída! Próxima: ${nextItem.title}${tankInfo}`);

    // 5. Atualiza estado local
    const updated = allQueue.map(i => {
      if (i.id === completedItem.id) return { ...i, status: 'concluido' as QueueStatus, completedAt: now };
      if (i.id === nextItem.id) return { ...i, status: 'em_andamento' as QueueStatus, startedAt: now };
      return i;
    });
    onQueueChange(updated);

    return { ...nextItem, status: 'em_andamento', startedAt: now };
  } else {
    // Sem próxima atividade — registra ociosidade
    onNotification('✅ Atividade concluída! Aguardando novas tarefas...');
    const updated = allQueue.map(i =>
      i.id === completedItem.id ? { ...i, status: 'concluido' as QueueStatus, completedAt: now } : i
    );
    onQueueChange(updated);
    return null;
  }
}

// ─── Alerta de próxima atividade ─────────────────────────────────────────────

let alertTimerMap: Map<string, ReturnType<typeof setTimeout>> = new Map();

/**
 * Agenda um alerta 5 min antes do término previsto da atividade atual.
 * estimatedMinutes: duração prevista da atividade
 * startedAt: quando foi iniciada
 */
export function scheduleNextActivityAlert(
  item: ActivityQueueItem,
  nextTitle: string | null,
  onAlert: (msg: string) => void,
): void {
  // Cancela alertas anteriores para este item
  const existing = alertTimerMap.get(item.id);
  if (existing) clearTimeout(existing);

  if (!item.startedAt || !nextTitle) return;

  const started = new Date(item.startedAt).getTime();
  const endTime = started + item.estimatedMinutes * 60_000;
  const alertTime = endTime - 5 * 60_000; // 5 min antes
  const msUntilAlert = alertTime - Date.now();

  if (msUntilAlert <= 0) return; // já passou

  const timer = setTimeout(() => {
    alertTimerMap.delete(item.id);
    onAlert(`⏰ Em 5 minutos: "${nextTitle}"`);
  }, msUntilAlert);

  alertTimerMap.set(item.id, timer);
}

export function clearAllAlerts(): void {
  alertTimerMap.forEach(t => clearTimeout(t));
  alertTimerMap.clear();
}

// ─── Tempo restante ──────────────────────────────────────────────────────────

export function getRemainingMinutes(item: ActivityQueueItem): number {
  if (!item.startedAt) return item.estimatedMinutes;
  const elapsed = (Date.now() - new Date(item.startedAt).getTime()) / 60_000;
  return Math.max(0, item.estimatedMinutes - elapsed);
}

export function getProgressPercent(item: ActivityQueueItem): number {
  if (!item.startedAt) return 0;
  const elapsed = (Date.now() - new Date(item.startedAt).getTime()) / 60_000;
  return Math.min(100, Math.round((elapsed / item.estimatedMinutes) * 100));
}

// ─── Balanceamento de carga ──────────────────────────────────────────────────

export function checkLoadBalance(
  queue: ActivityQueueItem[],
  employees: Employee[],
): { available: Employee; overloaded: Employee; suggestedItem: ActivityQueueItem; estimatedDelay: number }[] {
  const suggestions: { available: Employee; overloaded: Employee; suggestedItem: ActivityQueueItem; estimatedDelay: number }[] = [];

  const countByEmployee: Record<string, number> = {};
  employees.forEach(e => { countByEmployee[e.id] = 0; });
  queue.forEach(i => {
    if (i.status !== 'concluido' && i.status !== 'cancelado') {
      countByEmployee[i.assignedTo] = (countByEmployee[i.assignedTo] ?? 0) + 1;
    }
  });

  const avg = employees.length > 0
    ? Object.values(countByEmployee).reduce((a, b) => a + b, 0) / employees.length
    : 0;

  employees.forEach(available => {
    const availCount = countByEmployee[available.id] ?? 0;
    if (availCount > 0) return; // não está disponível

    employees.forEach(overloaded => {
      if (overloaded.id === available.id) return;
      const overCount = countByEmployee[overloaded.id] ?? 0;
      if (overCount < avg + 2) return; // não está sobrecarregado

      // Encontra a atividade de menor prioridade do sobrecarregado para realocar
      const overloadedItems = sortQueueItems(
        queue.filter(i => i.assignedTo === overloaded.id && i.status !== 'em_andamento' && i.status !== 'concluido' && i.status !== 'cancelado')
      );
      const itemToMove = overloadedItems[overloadedItems.length - 1];
      if (!itemToMove) return;

      const estimatedDelay = Math.round(overloadedItems.reduce((sum, i) => sum + i.estimatedMinutes, 0));

      suggestions.push({ available, overloaded, suggestedItem: itemToMove, estimatedDelay });
    });
  });

  return suggestions;
}

// ─── Controle de Ociosidade ──────────────────────────────────────────────────

const IDLE_THRESHOLD_MINUTES = 5;

export function detectIdleEmployees(
  queue: ActivityQueueItem[],
  employees: Employee[],
): IdleAlert[] {
  const alerts: IdleAlert[] = [];
  const now = Date.now();

  employees.forEach(emp => {
    const hasActive = queue.some(
      i => i.assignedTo === emp.id &&
        (i.status === 'em_andamento' || i.status === 'em_fila' || i.status === 'aguardando')
    );
    if (hasActive) return;

    // Encontra o último item concluído deste colaborador
    const completed = queue
      .filter(i => i.assignedTo === emp.id && i.status === 'concluido' && i.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    const lastCompleted = completed[0];
    const idleSince = lastCompleted?.completedAt ?? null;

    if (idleSince) {
      const idleMs = now - new Date(idleSince).getTime();
      const idleMinutes = idleMs / 60_000;
      if (idleMinutes >= IDLE_THRESHOLD_MINUTES) {
        alerts.push({ employeeId: emp.id, idleSince, idleMinutes: Math.round(idleMinutes) });
      }
    }
  });

  return alerts;
}

// ─── Motor de Regras ─────────────────────────────────────────────────────────

type RuleEventData = {
  itemId?: string;
  tankId?: string;
  product?: string;
  assignedTo?: string;
};

export function applyRules(
  triggerEvent: string,
  rules: QueueRule[],
  eventData: RuleEventData,
  queue: ActivityQueueItem[],
  onQueueChange: (updated: ActivityQueueItem[]) => void,
  onNotification: (msg: string) => void,
): void {
  const activeRules = rules.filter(r => r.active && r.triggerEvent === triggerEvent);

  activeRules.forEach(rule => {
    switch (rule.action) {
      case 'release_next': {
        // Já tratado no completeActivity
        break;
      }
      case 'block_tank': {
        // Coloca em espera todas as atividades do tanque bloqueado
        if (!eventData.tankId) break;
        const updated = queue.map(i =>
          i.tankId === eventData.tankId && i.status !== 'concluido' && i.status !== 'cancelado'
            ? { ...i, status: 'aguardando' as QueueStatus }
            : i
        );
        onQueueChange(updated);
        onNotification(`🔒 Tanque ${eventData.tankId} bloqueado. Atividades movidas para espera.`);
        break;
      }
      case 'hold_related': {
        // Coloca em espera atividades do mesmo produto
        if (!eventData.product) break;
        const updated = queue.map(i =>
          i.product === eventData.product && i.status !== 'concluido' && i.status !== 'cancelado'
            ? { ...i, status: 'aguardando_materia_prima' as QueueStatus }
            : i
        );
        onQueueChange(updated);
        onNotification(`⏸️ Atividades de ${eventData.product} aguardando matéria-prima.`);
        break;
      }
      case 'block_activity': {
        if (!eventData.itemId) break;
        const updated = queue.map(i =>
          i.id === eventData.itemId ? { ...i, status: 'aguardando' as QueueStatus } : i
        );
        onQueueChange(updated);
        break;
      }
      case 'notify_admin': {
        onNotification(`⚠️ Regra "${rule.name}" disparada: verifique o painel de administração.`);
        break;
      }
    }
  });
}

// ─── Cria item de fila a partir de uma Task ──────────────────────────────────

export function taskToQueueItem(
  task: { id: string; title: string; description: string; assignedTo: string; product: string; deadline: string },
  priority: Priority = 'media',
  positionInQueue: number = 0,
): Omit<ActivityQueueItem, 'createdAt'> {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    taskId: task.id,
    assignedTo: task.assignedTo,
    priority,
    position: positionInQueue,
    scheduledAt: task.deadline || null,
    startedAt: null,
    completedAt: null,
    status: 'em_fila',
    tankId: null,
    productionOrder: null,
    formula: null,
    product: task.product,
    title: task.title,
    description: task.description,
    estimatedMinutes: 60,
    idleSince: null,
    notes: '',
  };
}
