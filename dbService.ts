import { supabase } from './supabaseClient';
import { Employee, ProductionLog, Task, ProcessStatus, ReactorState, ReactorId, Observacao,
         ActivityQueueItem, Priority, QueueStatus, QueueRule, LoadBalanceSuggestion } from './types';

// ─── Tipo local para tanques ───────────────────────────────────────────────────
export interface TankRow {
    id: string;        // 'T1'...'T5'
    volume: number;
    product: string;
    pumpOn: boolean;
}

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────

export async function fetchEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) throw error;
    return data as Employee[];
}

export async function seedEmployees(employees: Employee[]): Promise<void> {
    const { error } = await supabase.from('employees').upsert(employees, { onConflict: 'id' });
    if (error) throw error;
}

// ─── PRODUCTION LOGS ──────────────────────────────────────────────────────────

export async function fetchLogs(): Promise<ProductionLog[]> {
    const { data, error } = await supabase
        .from('production_logs')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((row: any) => ({
        id: row.id,
        date: row.date,
        product: row.product,
        quantityM3: Number(row.quantity_m3),
        shift: row.shift,
        notes: row.notes,
    })) as ProductionLog[];
}

export async function addLog(log: ProductionLog): Promise<void> {
    const { error } = await supabase.from('production_logs').insert({
        id: log.id,
        date: log.date,
        product: log.product,
        quantity_m3: log.quantityM3,
        shift: log.shift,
        notes: log.notes,
    });
    if (error) throw error;
}

/**
 * Remove um registro de produção pelo ID.
 * Chamado pelo handler handleDeleteLog em App.tsx.
 */
export async function deleteLog(logId: string): Promise<void> {
    const { error } = await supabase.from('production_logs').delete().eq('id', logId);
    if (error) throw error;
}

export async function seedLogs(logs: ProductionLog[]): Promise<void> {
    const rows = logs.map(log => ({
        id: log.id,
        date: log.date,
        product: log.product,
        quantity_m3: log.quantityM3,
        shift: log.shift,
        notes: log.notes,
    }));
    const { error } = await supabase.from('production_logs').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        assignedTo: row.assigned_to,
        product: row.product,
        status: row.status as ProcessStatus,
        deadline: row.deadline,
        // Campos de confirmação SMS
        smsStatus:         row.sms_status ?? undefined,
        smsConfirmedAt:    row.sms_confirmed_at ?? undefined,
        smsConfirmedPhone: row.sms_confirmed_phone ?? undefined,
    })) as Task[];
}

export async function addTask(task: Task): Promise<void> {
    const { error } = await supabase.from('tasks').insert({
        id: task.id,
        title: task.title,
        description: task.description,
        assigned_to: task.assignedTo,
        product: task.product,
        status: task.status,
        deadline: task.deadline,
    });
    if (error) throw error;
}

export async function updateTaskStatus(taskId: string, status: ProcessStatus): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);
    if (error) throw error;
}

/**
 * Atualiza os campos de confirmação via SMS de uma tarefa.
 * Chamado após o envio do SMS e após o webhook de confirmação.
 *
 * @param taskId       - ID da tarefa
 * @param smsStatus    - Novo estado do SMS
 * @param confirmedAt  - ISO timestamp da confirmação (opcional)
 * @param confirmedPhone - Número utilizado na confirmação (opcional)
 */
export async function updateTaskSmsStatus(
    taskId: string,
    smsStatus: string,
    confirmedAt?: string,
    confirmedPhone?: string,
): Promise<void> {
    const updates: Record<string, unknown> = { sms_status: smsStatus };
    if (confirmedAt)    updates.sms_confirmed_at    = confirmedAt;
    if (confirmedPhone) updates.sms_confirmed_phone = confirmedPhone;

    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
    if (error) throw error;
}

export async function seedTasks(tasks: Task[]): Promise<void> {
    const rows = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        assigned_to: task.assignedTo,
        product: task.product,
        status: task.status,
        deadline: task.deadline,
    }));
    const { error } = await supabase.from('tasks').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
}

export async function deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
}

export async function deleteCompletedTasks(): Promise<string[]> {
    // Busca IDs das tarefas concluídas antes de deletar
    const { data: completed, error: fetchErr } = await supabase
        .from('tasks')
        .select('id')
        .eq('status', 'Concluído');
    if (fetchErr) throw fetchErr;
    if (!completed || completed.length === 0) return [];

    const ids = completed.map((r: any) => r.id);
    const { error: deleteErr } = await supabase
        .from('tasks')
        .delete()
        .eq('status', 'Concluído');
    if (deleteErr) throw deleteErr;
    return ids;
}

// ─── REACTORS ─────────────────────────────────────────────────────────────────

export async function fetchReactors(): Promise<ReactorState[]> {
    const { data, error } = await supabase.from('reactors').select('*').order('id');
    if (error) throw error;
    return data.map((row: any) => ({
        id: row.id as ReactorId,
        status: row.status,
        currentProduct: row.current_product,
        temperature: row.temperature,
        lastUpdate: row.last_update,
    })) as ReactorState[];
}

export async function updateReactor(id: ReactorId, updates: Partial<ReactorState>): Promise<void> {
    const dbUpdates: Record<string, any> = { last_update: new Date().toISOString() };
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.currentProduct !== undefined) dbUpdates.current_product = updates.currentProduct;
    if (updates.temperature !== undefined) dbUpdates.temperature = updates.temperature;

    const { error } = await supabase.from('reactors').update(dbUpdates).eq('id', id);
    if (error) throw error;
}

export async function seedReactors(reactors: ReactorState[]): Promise<void> {
    const rows = reactors.map(r => ({
        id: r.id,
        status: r.status,
        current_product: r.currentProduct,
        temperature: r.temperature,
        last_update: r.lastUpdate,
    }));
    const { error } = await supabase.from('reactors').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
}

// ─── OBSERVATIONS ─────────────────────────────────────────────────────────────

export async function fetchObservations(): Promise<Observacao[]> {
    const { data, error } = await supabase
        .from('observations')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((row: any) => ({
        id: row.id,
        tipo: row.tipo,
        descricao: row.descricao,
        timestamp: row.timestamp,
    })) as Observacao[];
}

export async function addObservation(obs: Observacao): Promise<void> {
    const { error } = await supabase.from('observations').insert({
        id: obs.id,
        tipo: obs.tipo,
        descricao: obs.descricao,
        timestamp: obs.timestamp,
    });
    if (error) throw error;
}

export async function deleteObservation(id: string): Promise<void> {
    const { error } = await supabase.from('observations').delete().eq('id', id);
    if (error) throw error;
}

// ─── STORAGE TANKS ────────────────────────────────────────────────────────────

export async function fetchTanks(): Promise<TankRow[]> {
    const { data, error } = await supabase
        .from('storage_tanks')
        .select('*')
        .order('id');
    if (error) throw error;
    return (data as any[]).map(row => ({
        id: row.id,
        volume: Number(row.volume),
        product: row.product ?? '',
        pumpOn: Boolean(row.pump_on),
    }));
}

/** Inicializa os 5 registros de tanque se ainda não existirem. */
export async function seedTanks(): Promise<void> {
    const rows = ['T1', 'T2', 'T3', 'T4', 'T5'].map(id => ({
        id,
        volume: 0,
        product: '',
        pump_on: false,
        updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
        .from('storage_tanks')
        .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
}

/**
 * Salva (ou cria) um tanque via upsert — funciona mesmo se a linha
 * ainda não existir na tabela.
 */
export async function updateTank(
    id: string,
    volume: number,
    product: string,
    pumpOn: boolean,
): Promise<void> {
    const { error } = await supabase
        .from('storage_tanks')
        .upsert(
            {
                id,
                volume,
                product,
                pump_on: pumpOn,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' },
        );
    if (error) throw error;
}

// ─── ACTIVITY QUEUE ───────────────────────────────────────────────────────────

function rowToQueueItem(row: any): ActivityQueueItem {
    return {
        id: row.id,
        taskId: row.task_id ?? null,
        assignedTo: row.assigned_to,
        priority: row.priority as Priority,
        position: row.position,
        scheduledAt: row.scheduled_at ?? null,
        startedAt: row.started_at ?? null,
        completedAt: row.completed_at ?? null,
        status: row.status as QueueStatus,
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

export async function fetchQueue(employeeId?: string): Promise<ActivityQueueItem[]> {
    let query = supabase
        .from('activity_queue')
        .select('*')
        .not('status', 'in', '("concluido","cancelado")')
        .order('priority_order', { ascending: true, nullsFirst: false });

    // Supabase não tem coluna calculada — ordenamos no cliente
    let q2 = supabase
        .from('activity_queue')
        .select('*')
        .not('status', 'in', '("concluido","cancelado")')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

    if (employeeId) q2 = q2.eq('assigned_to', employeeId);

    const { data, error } = await q2;
    if (error) throw error;
    return (data as any[]).map(rowToQueueItem);
}

export async function fetchAllQueue(): Promise<ActivityQueueItem[]> {
    const { data, error } = await supabase
        .from('activity_queue')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as any[]).map(rowToQueueItem);
}

export async function addToQueue(item: Omit<ActivityQueueItem, 'createdAt'>): Promise<void> {
    const { error } = await supabase.from('activity_queue').insert({
        id: item.id,
        task_id: item.taskId,
        assigned_to: item.assignedTo,
        priority: item.priority,
        position: item.position,
        scheduled_at: item.scheduledAt,
        started_at: item.startedAt,
        completed_at: item.completedAt,
        status: item.status,
        tank_id: item.tankId,
        production_order: item.productionOrder,
        formula: item.formula,
        product: item.product,
        title: item.title,
        description: item.description,
        estimated_minutes: item.estimatedMinutes,
        idle_since: item.idleSince,
        notes: item.notes,
    });
    if (error) throw error;
}

export async function updateQueueItem(id: string, updates: Partial<ActivityQueueItem>): Promise<void> {
    const dbUpdates: Record<string, any> = {};
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.position !== undefined) dbUpdates.position = updates.position;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
    if (updates.scheduledAt !== undefined) dbUpdates.scheduled_at = updates.scheduledAt;
    if (updates.tankId !== undefined) dbUpdates.tank_id = updates.tankId;
    if (updates.productionOrder !== undefined) dbUpdates.production_order = updates.productionOrder;
    if (updates.formula !== undefined) dbUpdates.formula = updates.formula;
    if (updates.product !== undefined) dbUpdates.product = updates.product;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.estimatedMinutes !== undefined) dbUpdates.estimated_minutes = updates.estimatedMinutes;
    if (updates.idleSince !== undefined) dbUpdates.idle_since = updates.idleSince;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;

    const { error } = await supabase.from('activity_queue').update(dbUpdates).eq('id', id);
    if (error) throw error;
}

export async function removeFromQueue(id: string): Promise<void> {
    const { error } = await supabase.from('activity_queue').delete().eq('id', id);
    if (error) throw error;
}

/** Reordena a fila de um colaborador por prioridade e data de criação, atualizando o campo position */
export async function reorderQueue(employeeId: string): Promise<ActivityQueueItem[]> {
    const { data, error } = await supabase
        .from('activity_queue')
        .select('*')
        .eq('assigned_to', employeeId)
        .not('status', 'in', '("concluido","cancelado")')
        .order('created_at', { ascending: true });
    if (error) throw error;

    const PRIORITY_ORDER: Record<string, number> = { critica: 1, alta: 2, media: 3, baixa: 4 };
    const sorted = (data as any[])
        .map(rowToQueueItem)
        .sort((a, b) => {
            const pa = PRIORITY_ORDER[a.priority] ?? 99;
            const pb = PRIORITY_ORDER[b.priority] ?? 99;
            if (pa !== pb) return pa - pb;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

    // Atualiza positions em batch
    await Promise.all(
        sorted.map((item, idx) =>
            supabase.from('activity_queue').update({ position: idx }).eq('id', item.id)
        )
    );

    return sorted.map((item, idx) => ({ ...item, position: idx }));
}

// ─── QUEUE RULES ──────────────────────────────────────────────────────────────

function rowToRule(row: any): QueueRule {
    return {
        id: row.id,
        name: row.name,
        triggerEvent: row.trigger_event,
        conditionData: row.condition_data ?? null,
        action: row.action,
        actionData: row.action_data ?? null,
        active: row.active,
        createdAt: row.created_at,
    };
}

export async function fetchRules(): Promise<QueueRule[]> {
    const { data, error } = await supabase
        .from('queue_rules')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as any[]).map(rowToRule);
}

export async function saveRule(rule: QueueRule): Promise<void> {
    const { error } = await supabase.from('queue_rules').upsert({
        id: rule.id,
        name: rule.name,
        trigger_event: rule.triggerEvent,
        condition_data: rule.conditionData,
        action: rule.action,
        action_data: rule.actionData,
        active: rule.active,
    }, { onConflict: 'id' });
    if (error) throw error;
}

export async function deleteRule(id: string): Promise<void> {
    const { error } = await supabase.from('queue_rules').delete().eq('id', id);
    if (error) throw error;
}

export async function toggleRule(id: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('queue_rules').update({ active }).eq('id', id);
    if (error) throw error;
}

// ─── LOAD BALANCE SUGGESTIONS ─────────────────────────────────────────────────

export async function fetchLoadSuggestions(): Promise<LoadBalanceSuggestion[]> {
    const { data, error } = await supabase
        .from('load_balance_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as any[]).map(row => ({
        id: row.id,
        availableEmployeeId: row.available_employee_id,
        overloadedEmployeeId: row.overloaded_employee_id,
        suggestedTaskId: row.suggested_task_id ?? null,
        estimatedDelayMins: row.estimated_delay_mins ?? 0,
        status: row.status,
        createdAt: row.created_at,
    })) as LoadBalanceSuggestion[];
}

export async function addLoadSuggestion(sug: Omit<LoadBalanceSuggestion, 'createdAt'>): Promise<void> {
    const { error } = await supabase.from('load_balance_suggestions').insert({
        id: sug.id,
        available_employee_id: sug.availableEmployeeId,
        overloaded_employee_id: sug.overloadedEmployeeId,
        suggested_task_id: sug.suggestedTaskId,
        estimated_delay_mins: sug.estimatedDelayMins,
        status: sug.status,
    });
    if (error) throw error;
}

export async function updateSuggestionStatus(id: string, status: 'accepted' | 'rejected'): Promise<void> {
    const { error } = await supabase
        .from('load_balance_suggestions')
        .update({ status })
        .eq('id', id);
    if (error) throw error;
}
