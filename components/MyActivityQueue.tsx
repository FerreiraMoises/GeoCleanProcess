/**
 * components/MyActivityQueue.tsx
 * Tela "Minhas Próximas Atividades" — visão do colaborador.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock, CheckCircle2, ChevronRight, AlertTriangle, User, Package,
  Beaker, Layers, Timer, CalendarClock, ArrowRight, Play, Bell,
  TrendingUp, Target, ListTodo, Zap, X,
} from 'lucide-react';
import {
  ActivityQueueItem, Employee, Priority, QueueStatus,
  PRIORITY_CONFIG, KANBAN_COLUMNS,
} from '../types';
import {
  getEmployeeQueue, getCurrentActivity, sortQueueItems,
  completeActivity, scheduleNextActivityAlert, getRemainingMinutes,
  getProgressPercent, clearAllAlerts,
} from '../services/queueService';
import { updateQueueItem } from '../dbService';

interface MyActivityQueueProps {
  queue: ActivityQueueItem[];
  employees: Employee[];
  currentUserId: string;
  onQueueChange: (updated: ActivityQueueItem[]) => void;
  onSelectUser: (id: string) => void;
}

// ─── Toast de notificação ─────────────────────────────────────────────────────
interface ToastProps { key?: React.Key; message: string; onClose: () => void }
function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="flex items-center gap-3 bg-slate-800 border border-slate-600 rounded-xl px-5 py-3 shadow-2xl min-w-[300px]">
        <Bell className="w-5 h-5 text-green-400 flex-shrink-0" />
        <span className="text-sm text-white font-medium flex-1">{message}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Componente de cartão de atividade ────────────────────────────────────────
interface ActivityCardProps {
  key?: React.Key;
  item: ActivityQueueItem;
  index: number;
  isCurrent: boolean;
  onComplete: () => void;
  onStart: () => void;
}

function ActivityCard({ item, index, isCurrent, onComplete, onStart }: ActivityCardProps) {
  const [now, setNow] = useState(Date.now());
  const p = PRIORITY_CONFIG[item.priority];
  const remaining = getRemainingMinutes(item);
  const progress = getProgressPercent(item);
  const isOverdue = item.startedAt && remaining === 0;

  useEffect(() => {
    if (!isCurrent) return;
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, [isCurrent]);

  const statusCol = KANBAN_COLUMNS.find(c => c.id === item.status);

  return (
    <div className={`
      relative rounded-2xl border transition-all duration-300
      ${isCurrent
        ? 'border-green-500/60 bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-green-500/10 ring-1 ring-green-500/20'
        : 'border-slate-700/60 bg-slate-800/50 hover:border-slate-600/80'
      }
    `}>
      {/* Índice / Posição */}
      <div className={`
        absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg
        ${isCurrent ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300'}
      `}>
        {index === 0 ? <Play className="w-3.5 h-3.5" /> : index + 1}
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${p.bgColor} ${p.color} border-current/20`}>
                {p.emoji} {p.label}
              </span>
              {statusCol && (
                <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${statusCol.bgColor} ${statusCol.color} font-medium`}>
                  {statusCol.label}
                </span>
              )}
              {isCurrent && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  ▶ Em Execução
                </span>
              )}
            </div>
            <h3 className="font-bold text-white text-base leading-snug truncate">{item.title}</h3>
          </div>
        </div>

        {/* Detalhes em grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
          {item.tankId && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300 font-medium">{item.tankId}</span>
            </div>
          )}
          {item.productionOrder && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <ListTodo className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-300">{item.productionOrder}</span>
            </div>
          )}
          {item.product && (
            <div className="flex items-center gap-1.5 text-slate-400 col-span-2">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 truncate">{item.product}</span>
            </div>
          )}
          {item.formula && (
            <div className="flex items-center gap-1.5 text-slate-400 col-span-2">
              <Beaker className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 truncate">{item.formula}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Timer className="w-3.5 h-3.5 text-green-400" />
            <span className="text-slate-300">{item.estimatedMinutes} min</span>
          </div>
          {item.scheduledAt && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <CalendarClock className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-slate-300">
                {new Date(item.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar (atividade atual) */}
        {isCurrent && item.startedAt && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className={isOverdue ? 'text-red-400 font-bold' : 'text-slate-400'}>
                {isOverdue ? '⚠️ Atividade em atraso' : `${Math.round(remaining)} min restantes`}
              </span>
              <span className="text-slate-500">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isOverdue ? 'bg-red-500' : progress > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Descrição */}
        {item.description && (
          <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{item.description}</p>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          {isCurrent && item.status !== 'em_andamento' && (
            <button
              onClick={onStart}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <Play className="w-3.5 h-3.5" /> Iniciar
            </button>
          )}
          {isCurrent && (
            <button
              onClick={onComplete}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Painel do colaborador ────────────────────────────────────────────────────
interface CollaboratorPanelProps {
  employee: Employee | undefined;
  queue: ActivityQueueItem[];
  currentItem: ActivityQueueItem | null;
}
function CollaboratorPanel({ employee, queue, currentItem }: CollaboratorPanelProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const pending = queue.filter(i => i.status !== 'concluido' && i.status !== 'cancelado').length;
  const remaining = currentItem ? getRemainingMinutes(currentItem) : 0;
  const todayCompleted = queue.filter(i => {
    if (i.status !== 'concluido' || !i.completedAt) return false;
    const d = new Date(i.completedAt);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  }).length;
  const dailyGoal = 8;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-5 mb-6">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
          {employee?.name.charAt(0) ?? '?'}
        </div>
        <div>
          <h2 className="font-bold text-white text-lg">{employee?.name ?? 'Colaborador'}</h2>
          <p className="text-xs text-slate-400">{employee?.role ?? ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/40">
          <div className="flex items-center gap-2 mb-1.5">
            <Play className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400 font-medium">Atividade Atual</span>
          </div>
          <p className="text-sm text-white font-bold truncate">{currentItem?.title ?? '— Livre —'}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/40">
          <div className="flex items-center gap-2 mb-1.5">
            <ListTodo className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400 font-medium">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{pending}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/40">
          <div className="flex items-center gap-2 mb-1.5">
            <Timer className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400 font-medium">Tempo Restante</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {currentItem ? `${Math.round(remaining)}min` : '—'}
          </p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/40">
          <div className="flex items-center gap-2 mb-1.5">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400 font-medium">Meta Diária</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-purple-400">{todayCompleted}</p>
            <p className="text-sm text-slate-500">/ {dailyGoal}</p>
          </div>
        </div>
      </div>

      {/* Meta diária progress */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progresso do turno</span>
          <span>{Math.min(100, Math.round((todayCompleted / dailyGoal) * 100))}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (todayCompleted / dailyGoal) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export const MyActivityQueue: React.FC<MyActivityQueueProps> = ({
  queue,
  employees,
  currentUserId,
  onQueueChange,
  onSelectUser,
}) => {
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);

  const addToast = useCallback((msg: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, msg }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const employee = employees.find(e => e.id === currentUserId);
  const myQueue = getEmployeeQueue(queue, currentUserId);
  const currentItem = getCurrentActivity(queue, currentUserId);
  const nextItem = myQueue.find(i => i.id !== currentItem?.id) ?? null;

  // Agenda alerta de próxima atividade
  useEffect(() => {
    if (currentItem && nextItem) {
      scheduleNextActivityAlert(currentItem, nextItem.title, addToast);
    }
    return () => clearAllAlerts();
  }, [currentItem?.id, nextItem?.id]);

  const handleStart = async (item: ActivityQueueItem) => {
    const now = new Date().toISOString();
    await updateQueueItem(item.id, { status: 'em_andamento', startedAt: now });
    onQueueChange(queue.map(i => i.id === item.id ? { ...i, status: 'em_andamento', startedAt: now } : i));
  };

  const handleComplete = async (item: ActivityQueueItem) => {
    if (completing) return;
    setCompleting(item.id);
    try {
      await completeActivity(item, queue, onQueueChange, addToast);
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Toasts */}
      {toasts.map(t => (
        <Toast key={t.id} message={t.msg} onClose={() => removeToast(t.id)} />
      ))}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            Minhas Próximas Atividades
          </h1>
          <p className="text-slate-400 text-sm mt-1 ml-13">Fila inteligente de produção</p>
        </div>

        {/* Seletor de usuário */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <select
            value={currentUserId}
            onChange={(e) => onSelectUser(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8"
          >
            <option value="">-- Selecione --</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!currentUserId ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-300 mb-2">Selecione seu Perfil</h3>
          <p className="text-slate-500 text-sm max-w-xs">
            Use o seletor acima para escolher seu nome e visualizar sua fila de atividades.
          </p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* Painel do colaborador */}
          <CollaboratorPanel employee={employee} queue={queue} currentItem={currentItem} />

          {/* Lista de atividades */}
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Fila de Atividades ({myQueue.length})
          </h2>

          {myQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700 border-dashed">
              <CheckCircle2 className="w-12 h-12 text-green-500/40 mb-3" />
              <p className="text-slate-400 font-medium">Sem atividades pendentes</p>
              <p className="text-slate-500 text-sm">Você está livre! Aguarde novas tarefas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myQueue.map((item, idx) => (
                <ActivityCard
                  key={item.id}
                  item={item}
                  index={idx}
                  isCurrent={idx === 0}
                  onComplete={() => handleComplete(item)}
                  onStart={() => handleStart(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease; }
        .ml-13 { margin-left: 3.25rem; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};
