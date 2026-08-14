export type Role = 'Operador de Produção' | 'Auxiliar de Produção';

export interface Employee {
  id: string;
  name: string;
  role: Role;
}

export type ProductType =
  | 'Cleanner Top'
  | 'Cleanner Fly'
  | 'Geo Mangânes'
  | 'Geo Complex Mn RR'
  | 'Geo Complex Zn'
  | 'Cleanner Star'
  | 'Geo Como'
  | 'Potence 11'
  | 'Potence Cobre'
  | 'Potence Raiz'
  | 'Potence Complex'
  | 'Cleanner Nitro 21'
  | 'Super King'
  | 'Sirius'
  | 'Potence Nitro'
  | 'Potence Nitro + H'
  | 'Potence Manganês'
  | 'Geo Potassio'
  | 'Geo Cobre'
  | 'Geo Zinco'
  | 'Geo Cab2'
  | 'Geo Raiz Leg Como'
  | 'Clean Cálcio'
  | 'Geo Boro'
  | 'Geo Como15'
  | 'Protege Crops'
  | 'Geo Fosfito'
  | 'Manganês RR'
  | 'Geo Magnésio'
  | 'Geo Kphos'
  | 'Geo Comoni'
  | 'Cleanner Cit'
  | 'Cleanner Neem'
  | 'Cleanner Mix'
  | 'Geo Molibdênio'
  | 'Potence Boro'
  | 'Potence Cálcio'
  | 'Inoculante'
  | 'Geo Ferro'
  | 'Inoculante Nitrogeo AZ'
  | 'Inoculante Soja (+/S/)'
  | 'Monarca'
  | 'Inoculante Panta Premium'
  | '';

export type ProcessStatus = 'Pendente' | 'Em Andamento' | 'Controle de Qualidade' | 'Concluído' | 'Atrasado' | 'Colaborador de Férias';

export interface ProductionLog {
  id: string;
  date: string;
  product: ProductType;
  quantityM3: number;
  shift: 'Matutino';
  notes: string;
}

/**
 * Status do fluxo de confirmação via SMS.
 * - 'pending'      → tarefa criada, SMS ainda não enviado
 * - 'sent'         → SMS enviado, aguardando resposta do colaborador
 * - 'confirmed'    → colaborador respondeu "OK"
 * - 'not_started'  → prazo expirou sem confirmação
 */
export type SmsConfirmationStatus = 'pending' | 'sent' | 'confirmed' | 'not_started';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Employee ID
  product: ProductType;
  status: ProcessStatus;
  deadline: string;

  // ── Campos de Confirmação via SMS ─────────────────────────────────────────
  /** Estado do fluxo de confirmação por SMS */
  smsStatus?: SmsConfirmationStatus;
  /** Timestamp ISO da confirmação do colaborador (quando smsStatus = 'confirmed') */
  smsConfirmedAt?: string;
  /** Número de telefone utilizado na confirmação */
  smsConfirmedPhone?: string;
}

export interface AIAnalysisResult {
  summary: string;
  recommendations: string[];
  efficiencyScore: number;
}

export type ReactorId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6';
export type ReactorStatus = 'Operando' | 'Parado' | 'Manutenção' | 'Limpeza';

export interface ReactorState {
  id: ReactorId;
  status: ReactorStatus;
  currentProduct: ProductType | null;
  temperature: number;
  lastUpdate: string;
}

export type ObservacaoTipo = 'quebra_equipamento' | 'falta_materia_prima';

export interface Observacao {
  id: string;
  tipo: ObservacaoTipo;
  descricao: string;
  timestamp: string;
}

// ─── MÓDULO FILA INTELIGENTE ──────────────────────────────────────────────────

export type Priority = 'critica' | 'alta' | 'media' | 'baixa';

export type QueueStatus =
  | 'aguardando'
  | 'em_fila'
  | 'em_andamento'
  | 'aguardando_laboratorio'
  | 'aguardando_materia_prima'
  | 'concluido'
  | 'cancelado';

export interface ActivityQueueItem {
  id: string;
  taskId: string | null;
  assignedTo: string;           // Employee ID
  priority: Priority;
  position: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: QueueStatus;
  tankId: string | null;
  productionOrder: string | null;
  formula: string | null;
  product: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  idleSince: string | null;
  notes: string;
  createdAt: string;
}

export type RuleTrigger =
  | 'task_completed'
  | 'tank_maintenance'
  | 'missing_material'
  | 'equipment_unavailable'
  | 'activity_started'
  | 'activity_cancelled';

export type RuleAction =
  | 'release_next'
  | 'block_tank'
  | 'hold_related'
  | 'block_activity'
  | 'notify_admin';

export interface QueueRule {
  id: string;
  name: string;
  triggerEvent: RuleTrigger;
  conditionData: Record<string, unknown> | null;
  action: RuleAction;
  actionData: Record<string, unknown> | null;
  active: boolean;
  createdAt: string;
}

export interface LoadBalanceSuggestion {
  id: string;
  availableEmployeeId: string;
  overloadedEmployeeId: string;
  suggestedTaskId: string | null;
  estimatedDelayMins: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface IdleAlert {
  employeeId: string;
  idleSince: string;           // ISO timestamp
  idleMinutes: number;
}

export type KanbanColumnId =
  | 'aguardando'
  | 'em_fila'
  | 'em_andamento'
  | 'aguardando_laboratorio'
  | 'aguardando_materia_prima'
  | 'concluido'
  | 'cancelado';

export interface KanbanColumn {
  id: KanbanColumnId;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; emoji: string; color: string; bgColor: string; order: number }> = {
  critica: { label: 'Crítica',  emoji: '🔴', color: 'text-red-400',    bgColor: 'bg-red-500/20',    order: 1 },
  alta:    { label: 'Alta',     emoji: '🟠', color: 'text-orange-400', bgColor: 'bg-orange-500/20', order: 2 },
  media:   { label: 'Média',    emoji: '🟡', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', order: 3 },
  baixa:   { label: 'Baixa',    emoji: '🟢', color: 'text-green-400',  bgColor: 'bg-green-500/20',  order: 4 },
};

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'aguardando',             label: 'Aguardando',            color: 'text-slate-400',  bgColor: 'bg-slate-800',   borderColor: 'border-slate-700' },
  { id: 'em_fila',                label: 'Em Fila',               color: 'text-blue-400',   bgColor: 'bg-blue-900/30', borderColor: 'border-blue-700' },
  { id: 'em_andamento',           label: 'Em Andamento',          color: 'text-green-400',  bgColor: 'bg-green-900/30',borderColor: 'border-green-700' },
  { id: 'aguardando_laboratorio', label: 'Ag. Laboratório',       color: 'text-purple-400', bgColor: 'bg-purple-900/30',borderColor: 'border-purple-700' },
  { id: 'aguardando_materia_prima',label:'Ag. Matéria-Prima',     color: 'text-orange-400', bgColor: 'bg-orange-900/30',borderColor: 'border-orange-700' },
  { id: 'concluido',              label: 'Concluído',             color: 'text-emerald-400',bgColor: 'bg-emerald-900/30',borderColor: 'border-emerald-700' },
  { id: 'cancelado',              label: 'Cancelado',             color: 'text-red-400',    bgColor: 'bg-red-900/30',  borderColor: 'border-red-700' },
];