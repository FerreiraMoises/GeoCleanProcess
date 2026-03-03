import { createClient } from '@supabase/supabase-js';
import { Employee, ProductionLog, Task, ReactorState, ReactorId } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Funcionários ────────────────────────────────────────────────
export async function fetchEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) throw error;
    return data as Employee[];
}

export async function seedEmployees(employees: Employee[]): Promise<void> {
    const { error } = await supabase.from('employees').insert(employees);
    if (error) throw error;
}

// ─── Logs de Produção ────────────────────────────────────────────
export async function fetchLogs(): Promise<ProductionLog[]> {
    const { data, error } = await supabase
        .from('production_logs')
        .select('*')
        .order('timestamp', { ascending: false });
    if (error) throw error;
    return data as ProductionLog[];
}

export async function addLog(log: ProductionLog): Promise<void> {
    const { error } = await supabase.from('production_logs').insert(log);
    if (error) throw error;
}

export async function seedLogs(logs: ProductionLog[]): Promise<void> {
    const { error } = await supabase.from('production_logs').insert(logs);
    if (error) throw error;
}

// ─── Tarefas ─────────────────────────────────────────────────────
export async function fetchTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Task[];
}

export async function addTask(task: Task): Promise<void> {
    const { error } = await supabase.from('tasks').insert(task);
    if (error) throw error;
}

export async function updateTaskStatus(taskId: string, status: string): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);
    if (error) throw error;
}

export async function seedTasks(tasks: Task[]): Promise<void> {
    const { error } = await supabase.from('tasks').insert(tasks);
    if (error) throw error;
}

// ─── Reatores ────────────────────────────────────────────────────
export async function fetchReactors(): Promise<ReactorState[]> {
    const { data, error } = await supabase.from('reactors').select('*');
    if (error) throw error;
    return data as ReactorState[];
}

export async function updateReactor(id: ReactorId, updates: Partial<ReactorState>): Promise<void> {
    const { error } = await supabase
        .from('reactors')
        .update(updates)
        .eq('id', id);
    if (error) throw error;
}

export async function seedReactors(reactors: ReactorState[]): Promise<void> {
    const { error } = await supabase.from('reactors').insert(reactors);
    if (error) throw error;
}
