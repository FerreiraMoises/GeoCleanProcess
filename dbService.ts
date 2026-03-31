import { supabase } from './supabaseClient';
import { Employee, ProductionLog, Task, ProcessStatus, ReactorState, ReactorId, Observacao } from './types';

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

export async function updateTank(
    id: string,
    volume: number,
    product: string,
    pumpOn: boolean,
): Promise<void> {
    const { error } = await supabase
        .from('storage_tanks')
        .update({
            volume,
            product,
            pump_on: pumpOn,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    if (error) throw error;
}
