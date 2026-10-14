/**
 * components/TVMode.tsx
 * Tela de monitoramento para televisores da fábrica.
 * Layout em tela cheia, auto-refresh a cada 10s, fontes grandes.
 */
import React, { useState, useEffect } from 'react';
import {
  Tv2, Clock, Droplets, Zap, Activity, AlertTriangle,
  CheckCircle2, Package, User, Timer, TrendingUp, Cylinder,
} from 'lucide-react';
import {
  ActivityQueueItem, Employee, ReactorState, PRIORITY_CONFIG,
} from '../types';
import { getEmployeeQueue, getCurrentActivity, getRemainingMinutes, getProgressPercent } from '../services/queueService';

interface TVModeProps {
  queue: ActivityQueueItem[];
  employees: Employee[];
  reactors: ReactorState[];
  logs: { quantityM3: number; product: string; date: string }[];
}

// ─── Clock em tempo real ──────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right">
      <p className="text-5xl font-black text-white font-mono tracking-tight">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-lg text-slate-400 mt-1">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}

// ─── Cartão de colaborador para TV ────────────────────────────────────────────
function EmployeeTVCard({ employee, queue }: { key?: React.Key; employee: Employee; queue: ActivityQueueItem[] }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const myQueue = getEmployeeQueue(queue, employee.id);
  const current = getCurrentActivity(queue, employee.id);
  const next = myQueue.find(i => i.id !== current?.id) ?? null;
  const remaining = current ? getRemainingMinutes(current) : 0;
  const progress = current ? getProgressPercent(current) : 0;
  const isOverdue = current?.startedAt && remaining === 0;
  const p = current ? PRIORITY_CONFIG[current.priority] : null;

  return (
    <div className={`
      rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all duration-300
      ${isOverdue ? 'border-red-500 bg-red-950/30' :
        current?.status === 'em_andamento' ? 'border-green-500/60 bg-slate-800/80' :
        current ? 'border-blue-500/40 bg-slate-800/60' : 'border-slate-700 bg-slate-800/30'}
    `}>
      {/* Colaborador */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-lg
          ${isOverdue ? 'bg-red-600' : current?.status === 'em_andamento' ? 'bg-green-600' : 'bg-slate-600'}`}>
          {employee.name.charAt(0)}
        </div>
        <div>
          <p className="text-xl font-bold text-white">{employee.name}</p>
          <p className="text-sm text-slate-400">{employee.role}</p>
        </div>
        {p && (
          <span className={`ml-auto text-sm font-bold px-3 py-1 rounded-full ${p.bgColor} ${p.color} border border-current/20`}>
            {p.emoji} {p.label}
          </span>
        )}
      </div>

      {/* Atividade atual */}
      {current ? (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Atividade Atual</p>
          <p className="text-lg font-bold text-white leading-snug mb-2">{current.title}</p>
          {current.product && (
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Package className="w-4 h-4 text-amber-400" />
              <span>{current.product}</span>
              {current.tankId && <span className="text-slate-600">· {current.tankId}</span>}
            </div>
          )}

          {/* Barra de progresso */}
          {current.startedAt && (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1.5">
                <span className={isOverdue ? 'text-red-400 font-bold' : 'text-slate-400'}>
                  {isOverdue ? '⚠️ Em atraso' : `${Math.round(remaining)} min restantes`}
                </span>
                <span className="text-slate-500">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${isOverdue ? 'bg-red-500' : progress > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-500">
          <CheckCircle2 className="w-5 h-5 text-green-500/50" />
          <span className="text-base">Aguardando atividade</span>
        </div>
      )}

      {/* Próxima atividade */}
      {next && (
        <div className="bg-slate-700/40 rounded-xl px-3 py-2 border border-slate-600/40">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5">Próxima</p>
          <p className="text-sm text-slate-300 font-medium truncate">{next.title}</p>
        </div>
      )}

      {/* Total na fila */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{myQueue.length} na fila</span>
        {myQueue.length > 0 && (
          <span>
            {Math.round(myQueue.reduce((s, i) => s + i.estimatedMinutes, 0))} min total
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Indicador de reator ──────────────────────────────────────────────────────
function ReactorIndicator({ reactor }: { key?: React.Key; reactor: ReactorState }) {
  const colors: Record<string, string> = {
    'Operando': 'bg-green-500',
    'Parado': 'bg-slate-600',
    'Manutenção': 'bg-orange-500',
    'Limpeza': 'bg-blue-500',
  };
  return (
    <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-700/60">
      <div className={`w-2 h-2 rounded-full ${colors[reactor.status] ?? 'bg-slate-500'} ${reactor.status === 'Operando' ? 'animate-pulse' : ''}`} />
      <span className="text-sm font-bold text-slate-300">{reactor.id}</span>
      <span className="text-xs text-slate-500">{reactor.status}</span>
      {reactor.temperature > 0 && (
        <span className="text-xs text-orange-400 ml-auto">{reactor.temperature}°C</span>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export const TVMode: React.FC<TVModeProps> = ({ queue, employees, reactors, logs }) => {
  const [tick, setTick] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // Auto-refresh a cada 10s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  // Alertas críticos
  const criticalItems = queue.filter(
    i => i.priority === 'critica' && i.status !== 'concluido' && i.status !== 'cancelado'
  );
  const delayedItems = queue.filter(i => {
    if (!i.startedAt || i.status === 'concluido') return false;
    const elapsed = (Date.now() - new Date(i.startedAt).getTime()) / 60_000;
    return elapsed > i.estimatedMinutes;
  });

  // KPIs produção
  const totalVolume = logs.reduce((s, l) => s + l.quantityM3, 0);
  const activeReactors = reactors.filter(r => r.status === 'Operando').length;
  const activeEmployees = employees.filter(e =>
    queue.some(i => i.assignedTo === e.id && i.status === 'em_andamento')
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Header TV */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-slate-400 text-sm font-medium uppercase tracking-widest">AO VIVO</span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Tv2 className="w-6 h-6 text-green-400" />
            GEOCLEAN — MONITORAMENTO DA PRODUÇÃO
          </h1>
        </div>
        <LiveClock />
      </div>

      {/* Alertas críticos — banner no topo */}
      {(criticalItems.length > 0 || delayedItems.length > 0) && (
        <div className="bg-red-950/60 border-b border-red-500/30 px-8 py-2.5 flex items-center gap-3 overflow-hidden">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
          <div className="flex gap-6 overflow-x-auto text-sm">
            {criticalItems.map(item => (
              <span key={item.id} className="text-red-300 font-medium whitespace-nowrap">
                🔴 {item.title} {item.tankId ? `· ${item.tankId}` : ''}
              </span>
            ))}
            {delayedItems.map(item => (
              <span key={item.id} className="text-orange-300 font-medium whitespace-nowrap">
                ⏰ ATRASO: {item.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KPIs globais */}
      <div className="grid grid-cols-4 gap-0 border-b border-slate-800">
        {[
          { icon: Activity, label: 'Reatores Ativos', value: `${activeReactors} / ${reactors.length}`, color: 'text-green-400' },
          { icon: User, label: 'Em Produção', value: `${activeEmployees} colaboradores`, color: 'text-blue-400' },
          { icon: TrendingUp, label: 'Volume Produzido', value: `${totalVolume.toFixed(1)} m³`, color: 'text-amber-400' },
          { icon: AlertTriangle, label: 'Alertas Ativos', value: criticalItems.length + delayedItems.length, color: criticalItems.length + delayedItems.length > 0 ? 'text-red-400' : 'text-green-400' },
        ].map((kpi, i) => (
          <div key={i} className="flex items-center gap-4 px-8 py-4 border-r border-slate-800 last:border-0">
            <kpi.icon className={`w-7 h-7 ${kpi.color} flex-shrink-0`} />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{kpi.label}</p>
              <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-12 gap-0 h-full">
        {/* Colaboradores — 8 colunas */}
        <div className="col-span-8 p-6 border-r border-slate-800">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            COLABORADORES EM PRODUÇÃO
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {employees.map(emp => (
              <EmployeeTVCard key={emp.id} employee={emp} queue={queue} />
            ))}
          </div>
        </div>

        {/* Sidebar — 4 colunas */}
        <div className="col-span-4 p-6 space-y-6">
          {/* Status dos reatores */}
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              STATUS DOS REATORES
            </h2>
            <div className="space-y-2">
              {reactors.map(r => <ReactorIndicator key={r.id} reactor={r} />)}
            </div>
          </div>

          {/* Atividades críticas */}
          {criticalItems.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">
                ⚠️ PRIORIDADE CRÍTICA
              </h2>
              <div className="space-y-2">
                {criticalItems.slice(0, 4).map(item => {
                  const emp = employees.find(e => e.id === item.assignedTo);
                  return (
                    <div key={item.id} className="bg-red-950/40 border border-red-500/30 rounded-xl px-3 py-2">
                      <p className="text-sm font-bold text-white truncate">{item.title}</p>
                      <p className="text-xs text-slate-400">{emp?.name} {item.tankId ? `· ${item.tankId}` : ''}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Última produção */}
          {logs.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                ÚLTIMOS REGISTROS
              </h2>
              <div className="space-y-2">
                {logs.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/40">
                    <span className="text-slate-300 truncate flex-1 mr-2">{log.product || '—'}</span>
                    <span className="text-amber-400 font-bold whitespace-nowrap">{log.quantityM3} m³</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-slate-600 text-center pt-4 border-t border-slate-800">
            Atualização automática a cada 10s · Tick #{tick}
          </div>
        </div>
      </div>
    </div>
  );
};
