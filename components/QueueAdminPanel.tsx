/**
 * components/QueueAdminPanel.tsx
 * Painel de administração da Fila Inteligente — visão completa do gestor.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Clock, AlertTriangle, TrendingUp, BarChart3, RefreshCw,
  CheckCircle2, Zap, ArrowRightLeft, X, ChevronDown, ChevronUp,
  Timer, ListTodo, UserX, Activity, Bell, Package,
} from 'lucide-react';
import {
  ActivityQueueItem, Employee, LoadBalanceSuggestion, IdleAlert,
  Priority, PRIORITY_CONFIG, KANBAN_COLUMNS,
} from '../types';
import {
  getEmployeeQueue, sortQueueItems, detectIdleEmployees, checkLoadBalance,
} from '../services/queueService';
import {
  updateQueueItem, reorderQueue, updateSuggestionStatus, addLoadSuggestion,
  fetchLoadSuggestions,
} from '../dbService';

interface QueueAdminPanelProps {
  queue: ActivityQueueItem[];
  employees: Employee[];
  suggestions: LoadBalanceSuggestion[];
  onQueueChange: (updated: ActivityQueueItem[]) => void;
  onSuggestionsChange: (updated: LoadBalanceSuggestion[]) => void;
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
function fmtMin(mins: number) {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function avgMinutes(items: ActivityQueueItem[]) {
  if (!items.length) return 0;
  const completed = items.filter(i => i.startedAt && i.completedAt);
  if (!completed.length) return Math.round(items.reduce((s, i) => s + i.estimatedMinutes, 0) / items.length);
  const avg = completed.reduce((s, i) => {
    const ms = new Date(i.completedAt!).getTime() - new Date(i.startedAt!).getTime();
    return s + ms / 60_000;
  }, 0) / completed.length;
  return Math.round(avg);
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: string | number; color: string; sub?: string;
}) {
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/60 p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Cartão de fila por colaborador ──────────────────────────────────────────
function EmployeeQueueCard({
  employee, items, isIdle, idleMinutes, onPriorityChange,
}: {
  key?: React.Key;
  employee: Employee;
  items: ActivityQueueItem[];
  isIdle: boolean;
  idleMinutes: number;
  onPriorityChange: (itemId: string, priority: Priority) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const active = items.find(i => i.status === 'em_andamento');
  const pending = items.filter(i => i.status !== 'concluido' && i.status !== 'cancelado').length;
  const totalMins = items.reduce((s, i) => s + i.estimatedMinutes, 0);

  return (
    <div className={`rounded-xl border transition-all duration-200 ${isIdle ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-700/60 bg-slate-800/40'}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${isIdle ? 'bg-amber-500/20 text-amber-400' : 'bg-green-600/20 text-green-400'}`}>
            {employee.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{employee.name}</p>
            <p className="text-xs text-slate-500">{employee.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isIdle && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <UserX className="w-3 h-3" /> Ocioso {idleMinutes}min
            </span>
          )}
          <div className="flex gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><ListTodo className="w-3 h-3" />{pending}</span>
            <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{fmtMin(totalMins)}</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {/* Items da fila */}
      {expanded && (
        <div className="border-t border-slate-700/40 px-4 pb-3 space-y-2 pt-2">
          {items.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-3">Sem atividades na fila</p>
          ) : (
            sortQueueItems(items).map((item, idx) => {
              const p = PRIORITY_CONFIG[item.priority];
              const statusCol = KANBAN_COLUMNS.find(c => c.id === item.status);
              return (
                <div key={item.id} className="flex items-center gap-2 py-1.5 rounded-lg hover:bg-slate-700/30 px-1 group">
                  <span className="text-slate-600 text-xs w-4 text-center font-mono">{idx + 1}</span>
                  <span className={`text-xs font-bold ${p.color}`}>{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      {item.tankId && <span>{item.tankId}</span>}
                      {item.product && <span className="truncate">{item.product}</span>}
                      <span>{item.estimatedMinutes}min</span>
                    </div>
                  </div>
                  {statusCol && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusCol.bgColor} ${statusCol.color} hidden group-hover:inline-flex`}>
                      {statusCol.label}
                    </span>
                  )}
                  {/* Seletor de prioridade inline */}
                  <select
                    value={item.priority}
                    onChange={e => onPriorityChange(item.id, e.target.value as Priority)}
                    className="text-[10px] bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-slate-300 focus:outline-none"
                    title="Alterar prioridade"
                  >
                    <option value="critica">🔴 Crítica</option>
                    <option value="alta">🟠 Alta</option>
                    <option value="media">🟡 Média</option>
                    <option value="baixa">🟢 Baixa</option>
                  </select>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Painel de Sugestões de Balanceamento ─────────────────────────────────────
function LoadBalanceSection({
  suggestions, employees, queue, onAccept, onReject, onRefresh,
}: {
  suggestions: LoadBalanceSuggestion[];
  employees: Employee[];
  queue: ActivityQueueItem[];
  onAccept: (sug: LoadBalanceSuggestion) => void;
  onReject: (id: string) => void;
  onRefresh: () => void;
}) {
  const getName = (id: string) => employees.find(e => e.id === id)?.name ?? id;

  return (
    <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-blue-400" />
          Balanceamento de Carga
        </h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-all"
        >
          <RefreshCw className="w-3 h-3" /> Verificar
        </button>
      </div>

      {suggestions.length === 0 ? (
        <div className="flex items-center gap-3 text-sm text-slate-500 py-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          Carga bem distribuída entre os colaboradores
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map(sug => {
            const item = queue.find(i => i.id === sug.suggestedTaskId);
            return (
              <div key={sug.id} className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="text-sm">
                    <p className="text-white font-medium mb-1">Sugestão de Realocação</p>
                    <div className="space-y-1 text-xs text-slate-300">
                      <p>👤 <span className="text-green-400 font-medium">{getName(sug.availableEmployeeId)}</span> — disponível</p>
                      <p>🔥 <span className="text-red-400 font-medium">{getName(sug.overloadedEmployeeId)}</span> — sobrecarregado</p>
                      {item && <p>📋 Mover: <span className="text-amber-400">{item.title}</span></p>}
                      <p>⏱ Atraso estimado: <span className="text-orange-400 font-bold">{fmtMin(sug.estimatedDelayMins)}</span></p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(sug)}
                    className="flex-1 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors"
                  >
                    ✓ Aceitar
                  </button>
                  <button
                    onClick={() => onReject(sug.id)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-700 hover:bg-red-600/30 text-slate-300 hover:text-red-400 text-xs font-bold transition-colors border border-slate-600 hover:border-red-500/30"
                  >
                    ✗ Rejeitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export const QueueAdminPanel: React.FC<QueueAdminPanelProps> = ({
  queue, employees, suggestions, onQueueChange, onSuggestionsChange,
}) => {
  const [idleAlerts, setIdleAlerts] = useState<IdleAlert[]>([]);
  const [localSuggestions, setLocalSuggestions] = useState<LoadBalanceSuggestion[]>(suggestions);
  const [tab, setTab] = useState<'overview' | 'queues' | 'tanks' | 'critical'>('overview');

  useEffect(() => setLocalSuggestions(suggestions), [suggestions]);

  // Detecta ociosidade a cada 60s
  useEffect(() => {
    const check = () => setIdleAlerts(detectIdleEmployees(queue, employees));
    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [queue, employees]);

  const handlePriorityChange = async (itemId: string, priority: Priority) => {
    await updateQueueItem(itemId, { priority });
    const updated = queue.map(i => i.id === itemId ? { ...i, priority } : i);
    onQueueChange(updated);
    // Reordena a fila do colaborador afetado
    const item = queue.find(i => i.id === itemId);
    if (item) await reorderQueue(item.assignedTo);
  };

  const handleRefreshBalance = () => {
    const newSugs = checkLoadBalance(queue, employees);
    const formatted: LoadBalanceSuggestion[] = newSugs.map(s => ({
      id: `lbs-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      availableEmployeeId: s.available.id,
      overloadedEmployeeId: s.overloaded.id,
      suggestedTaskId: s.suggestedItem.id,
      estimatedDelayMins: s.estimatedDelay,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }));
    setLocalSuggestions(formatted);
    onSuggestionsChange(formatted);
  };

  const handleAcceptSuggestion = async (sug: LoadBalanceSuggestion) => {
    if (sug.suggestedTaskId) {
      await updateQueueItem(sug.suggestedTaskId, { assignedTo: sug.availableEmployeeId });
      onQueueChange(queue.map(i =>
        i.id === sug.suggestedTaskId ? { ...i, assignedTo: sug.availableEmployeeId } : i
      ));
    }
    await updateSuggestionStatus(sug.id, 'accepted');
    setLocalSuggestions(prev => prev.filter(s => s.id !== sug.id));
    onSuggestionsChange(localSuggestions.filter(s => s.id !== sug.id));
  };

  const handleRejectSuggestion = async (id: string) => {
    await updateSuggestionStatus(id, 'rejected');
    setLocalSuggestions(prev => prev.filter(s => s.id !== id));
    onSuggestionsChange(localSuggestions.filter(s => s.id !== id));
  };

  // KPIs globais
  const totalActive = queue.filter(i => i.status !== 'concluido' && i.status !== 'cancelado').length;
  const totalCritical = queue.filter(i => i.priority === 'critica' && i.status !== 'concluido' && i.status !== 'cancelado').length;
  const totalDelayed = queue.filter(i => {
    if (!i.startedAt || i.status === 'concluido') return false;
    const elapsed = (Date.now() - new Date(i.startedAt).getTime()) / 60_000;
    return elapsed > i.estimatedMinutes;
  }).length;
  const avgExec = avgMinutes(queue);

  // Fila por tanque
  const tankMap: Record<string, ActivityQueueItem[]> = {};
  queue.forEach(i => {
    if (i.tankId && i.status !== 'concluido' && i.status !== 'cancelado') {
      if (!tankMap[i.tankId]) tankMap[i.tankId] = [];
      tankMap[i.tankId].push(i);
    }
  });

  // Atividades críticas e atrasadas
  const criticalItems = sortQueueItems(
    queue.filter(i => i.priority === 'critica' && i.status !== 'concluido' && i.status !== 'cancelado')
  );
  const delayedItems = queue.filter(i => {
    if (!i.startedAt || i.status === 'concluido') return false;
    const elapsed = (Date.now() - new Date(i.startedAt).getTime()) / 60_000;
    return elapsed > i.estimatedMinutes;
  });

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'queues', label: 'Filas' },
    { id: 'tanks', label: 'Por Tanque' },
    { id: 'critical', label: `Crítico ${totalCritical + totalDelayed > 0 ? `(${totalCritical + totalDelayed})` : ''}` },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            Painel de Administração
          </h1>
          <p className="text-slate-400 text-sm mt-1 ml-13">Gestão de filas e produção em tempo real</p>
        </div>

        {/* Alertas de ociosidade */}
        {idleAlerts.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
            <UserX className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-300 font-medium">
              {idleAlerts.length} colaborador{idleAlerts.length > 1 ? 'es' : ''} ocioso{idleAlerts.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Activity} label="Atividades Ativas" value={totalActive} color="bg-blue-500/20 text-blue-400" />
        <KpiCard icon={AlertTriangle} label="Críticas" value={totalCritical} color="bg-red-500/20 text-red-400" sub="Alta prioridade" />
        <KpiCard icon={Clock} label="Em Atraso" value={totalDelayed} color="bg-orange-500/20 text-orange-400" />
        <KpiCard icon={Timer} label="Tempo Médio" value={fmtMin(avgExec)} color="bg-green-500/20 text-green-400" sub="por atividade" />
      </div>

      {/* Alertas de ociosidade detalhados */}
      {idleAlerts.length > 0 && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4" /> Colaboradores Ociosos há mais de 5 minutos
          </h3>
          <div className="flex flex-wrap gap-2">
            {idleAlerts.map(alert => {
              const emp = employees.find(e => e.id === alert.employeeId);
              return (
                <div key={alert.employeeId} className="flex items-center gap-2 bg-amber-500/20 rounded-lg px-3 py-1.5 text-xs text-amber-300">
                  <UserX className="w-3 h-3" />
                  <span className="font-medium">{emp?.name ?? alert.employeeId}</span>
                  <span className="text-amber-500">— {alert.idleMinutes}min</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800/40 rounded-xl p-1 border border-slate-700/40">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${tab === t.id
              ? 'bg-slate-700 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das tabs */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Atividades por colaborador */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-4">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Carga por Colaborador
            </h3>
            <div className="space-y-3">
              {employees.map(emp => {
                const empItems = queue.filter(i => i.assignedTo === emp.id && i.status !== 'concluido' && i.status !== 'cancelado');
                const maxLoad = Math.max(...employees.map(e =>
                  queue.filter(i => i.assignedTo === e.id && i.status !== 'concluido' && i.status !== 'cancelado').length
                ), 1);
                const idle = idleAlerts.find(a => a.employeeId === emp.id);
                return (
                  <div key={emp.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium ${idle ? 'text-amber-400' : 'text-white'}`}>{emp.name}</span>
                      <span className="text-slate-400">{empItems.length} atividades</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${idle ? 'bg-amber-500' : empItems.length > 4 ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${(empItems.length / maxLoad) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Balanceamento */}
          <LoadBalanceSection
            suggestions={localSuggestions}
            employees={employees}
            queue={queue}
            onAccept={handleAcceptSuggestion}
            onReject={handleRejectSuggestion}
            onRefresh={handleRefreshBalance}
          />
        </div>
      )}

      {tab === 'queues' && (
        <div className="space-y-3">
          {employees.map(emp => {
            const empItems = queue.filter(i =>
              i.assignedTo === emp.id && i.status !== 'concluido' && i.status !== 'cancelado'
            );
            const idle = idleAlerts.find(a => a.employeeId === emp.id);
            return (
              <EmployeeQueueCard
                key={emp.id}
                employee={emp}
                items={empItems}
                isIdle={!!idle}
                idleMinutes={idle?.idleMinutes ?? 0}
                onPriorityChange={handlePriorityChange}
              />
            );
          })}
        </div>
      )}

      {tab === 'tanks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(tankMap).length === 0 ? (
            <div className="col-span-full text-center py-16 text-slate-500">
              Nenhuma atividade vinculada a tanques no momento.
            </div>
          ) : (
            Object.entries(tankMap)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([tankId, items]) => (
                <div key={tankId} className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-4">
                  <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">{tankId}</div>
                    Tanque {tankId}
                    <span className="ml-auto text-xs text-slate-400">{items.length} ativ.</span>
                  </h3>
                  <div className="space-y-2">
                    {sortQueueItems(items).map(item => {
                      const p = PRIORITY_CONFIG[item.priority];
                      const emp = employees.find(e => e.id === item.assignedTo);
                      return (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          <span className={p.color}>{p.emoji}</span>
                          <span className="text-slate-300 flex-1 truncate">{item.title}</span>
                          <span className="text-slate-500">{emp?.name.split(' ')[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {tab === 'critical' && (
        <div className="space-y-4">
          {criticalItems.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> Atividades Críticas
              </h3>
              <div className="space-y-2">
                {criticalItems.map(item => {
                  const emp = employees.find(e => e.id === item.assignedTo);
                  return (
                    <div key={item.id} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <span className="text-xl">🔴</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.title}</p>
                        <p className="text-xs text-slate-400">{emp?.name} {item.tankId ? `· ${item.tankId}` : ''} · {item.estimatedMinutes}min</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KANBAN_COLUMNS.find(c => c.id === item.status)?.color ?? 'text-slate-400'} ${KANBAN_COLUMNS.find(c => c.id === item.status)?.bgColor ?? ''}`}>
                        {KANBAN_COLUMNS.find(c => c.id === item.status)?.label ?? item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {delayedItems.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" /> Atividades Atrasadas
              </h3>
              <div className="space-y-2">
                {delayedItems.map(item => {
                  const emp = employees.find(e => e.id === item.assignedTo);
                  const elapsed = item.startedAt ? Math.round((Date.now() - new Date(item.startedAt).getTime()) / 60_000) : 0;
                  const delay = elapsed - item.estimatedMinutes;
                  return (
                    <div key={item.id} className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
                      <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.title}</p>
                        <p className="text-xs text-slate-400">{emp?.name}</p>
                      </div>
                      <span className="text-xs text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                        +{delay}min atraso
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {criticalItems.length === 0 && delayedItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500/40 mb-3" />
              <p className="text-slate-400 font-medium">Tudo sob controle</p>
              <p className="text-slate-500 text-sm">Sem atividades críticas ou atrasadas.</p>
            </div>
          )}
        </div>
      )}

      <style>{`.ml-13 { margin-left: 3.25rem; }`}</style>
    </div>
  );
};
