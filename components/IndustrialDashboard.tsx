import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { ProductionLog, Task, Employee, ReactorState } from '../types';
import {
  Activity, Clock, Droplets, Target, TrendingUp,
  Users, Zap, Thermometer, Box, Factory,
} from 'lucide-react';
import { StorageTanksState } from './StorageTanks';

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Props {
  logs: ProductionLog[];
  tasks: Task[];
  employees: Employee[];
  reactors: ReactorState[];
  tanksState: StorageTanksState;
}

// ── Constantes ────────────────────────────────────────────────────────────────
const TANK_MAX  = 5000; // litros — capacidade máxima simulada por tanque
const TANK_IDS  = ['T1', 'T2', 'T3', 'T4', 'T5'];
const COLORS    = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4'];

const REACTOR_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  'Operando':   { bg: 'bg-green-500/10',  text: 'text-green-400',  dot: 'bg-green-500'  },
  'Parado':     { bg: 'bg-slate-700/40',  text: 'text-slate-400',  dot: 'bg-slate-500'  },
  'Manutenção': { bg: 'bg-amber-500/10',  text: 'text-amber-400',  dot: 'bg-amber-500'  },
  'Limpeza':    { bg: 'bg-blue-500/10',   text: 'text-blue-400',   dot: 'bg-blue-500'   },
};

// ── Helper: random walk para simulação de temperatura ────────────────────────
function rw(v: number, min: number, max: number, step: number): number {
  return Math.min(max, Math.max(min, v + (Math.random() - 0.48) * step));
}

// ── Tooltip customizado para modo escuro ─────────────────────────────────────
const DarkTooltip = {
  contentStyle: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    color: '#e2e8f0',
    fontSize: '12px',
  },
  labelStyle: { color: '#94a3b8', fontWeight: 700, marginBottom: 4 },
};

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export const IndustrialDashboard: React.FC<Props> = ({
  logs, tasks, employees, reactors, tanksState,
}) => {
  // ── Estado: relógio ao vivo ───────────────────────────────────────────────
  const [now, setNow] = useState(new Date());

  // ── Estado: temperaturas simuladas dos reatores ───────────────────────────
  const [temps, setTemps] = useState<Record<string, number>>(() =>
    Object.fromEntries(reactors.map(r => [r.id, r.temperature]))
  );

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (reactors.length === 0) return;
    const timer = setInterval(() => {
      setTemps(prev => {
        const next: Record<string, number> = {};
        reactors.forEach(r => {
          const base = prev[r.id] ?? r.temperature;
          if      (r.status === 'Operando')   next[r.id] = rw(base, 55, 85, 1.5);
          else if (r.status === 'Limpeza')    next[r.id] = rw(base, 28, 45, 1.0);
          else                                next[r.id] = rw(base, 22, 30, 0.5);
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [reactors]);

  // ── KPIs calculados dos dados reais ──────────────────────────────────────
  const totalProd     = useMemo(() => logs.reduce((s, l) => s + l.quantityM3, 0), [logs]);
  const activeReact   = useMemo(() => reactors.filter(r => r.status === 'Operando').length, [reactors]);
  const taskEff       = useMemo(() => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter(t => t.status === 'Concluído').length / tasks.length) * 100);
  }, [tasks]);
  const tankUsage     = useMemo(() => {
    const filled = TANK_IDS.reduce((s, id) => s + (parseFloat(tanksState.volumes[id] || '0') || 0), 0);
    return Math.min(100, Math.round((filled / (TANK_MAX * TANK_IDS.length)) * 100));
  }, [tanksState.volumes]);

  // ── Dados para gráficos ───────────────────────────────────────────────────
  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach(l => { map[l.date] = (map[l.date] || 0) + l.quantityM3; });
    return Object.entries(map)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    logs.forEach(l => {
      const k = String(l.product).trim();
      map.set(k, (map.get(k) || 0) + l.quantityM3);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [logs]);

  const taskPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const empStats = useMemo(() =>
    employees.map(emp => {
      const mine = tasks.filter(t => t.assignedTo === emp.id);
      const done = mine.filter(t => t.status === 'Concluído').length;
      return { name: emp.name.split(' ')[0], total: mine.length, done, role: emp.role };
    }),
  [employees, tasks]);

  // ── Alertas de atenção ────────────────────────────────────────────────────
  const alerts = useMemo(() => [
    ...tasks.filter(t => t.status === 'Atrasado').map(t => ({
      type: 'danger' as const,
      msg: `Tarefa atrasada: ${t.title}`,
    })),
    ...reactors.filter(r => r.status === 'Manutenção').map(r => ({
      type: 'warning' as const,
      msg: `Reator ${r.id} em manutenção`,
    })),
    ...TANK_IDS
      .filter(id => {
        const v = parseFloat(tanksState.volumes[id] || '0') || 0;
        return v > 0 && v / TANK_MAX > 0.9;
      })
      .map(id => ({ type: 'warning' as const, msg: `Tanque ${id} acima de 90% da capacidade` })),
  ], [tasks, reactors, tanksState.volumes]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-5">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Factory size={16} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Dashboard Industrial
            </h2>
          </div>
          <p className="text-slate-500 text-sm pl-11">
            Monitoramento em tempo real — GeoClean Process
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge ao vivo */}
          <div className="flex items-center gap-2 bg-slate-900 border border-green-500/20 rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-xs font-bold tracking-widest">AO VIVO</span>
          </div>
          {/* Relógio */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-right">
            <p className="text-white font-mono text-sm font-bold leading-none">
              {now.toLocaleTimeString('pt-BR')}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              {now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* ══ ALERTAS ══════════════════════════════════════════════════════════ */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.slice(0, 3).map((al, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium border ${
                al.type === 'danger'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
            >
              <span>{al.type === 'danger' ? '🔴' : '⚠️'}</span>
              {al.msg}
            </div>
          ))}
        </div>
      )}

      {/* ══ KPI CARDS ════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Produção Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-green-500/30 transition-colors">
          <div className="absolute right-3 top-3 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
            <Factory size={52} className="text-green-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Produção Total</p>
          <p className="text-3xl font-black text-green-400 mt-2 font-mono leading-none">
            {totalProd.toLocaleString('pt-BR')}
          </p>
          <p className="text-slate-500 text-xs mt-1.5">m³ acumulados</p>
          <div className="mt-3 flex items-center gap-1 text-green-500 text-xs font-semibold">
            <TrendingUp size={11} />
            <span>+12.5% vs. ontem</span>
          </div>
        </div>

        {/* Reatores */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
          <div className="absolute right-3 top-3 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
            <Zap size={52} className="text-blue-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reatores Ativos</p>
          <p className="text-3xl font-black text-blue-400 mt-2 font-mono leading-none">
            {activeReact}
            <span className="text-slate-600 text-xl">/{reactors.length}</span>
          </p>
          <p className="text-slate-500 text-xs mt-1.5">em operação agora</p>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${(activeReact / Math.max(reactors.length, 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* OEE / Eficiência */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
          <div className="absolute right-3 top-3 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
            <Target size={52} className="text-purple-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OEE — Eficiência</p>
          <p className={`text-3xl font-black mt-2 font-mono leading-none ${
            taskEff >= 70 ? 'text-green-400' : taskEff >= 40 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {taskEff}%
          </p>
          <p className="text-slate-500 text-xs mt-1.5">tarefas concluídas</p>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                taskEff >= 70 ? 'bg-green-500' : taskEff >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${taskEff}%` }}
            />
          </div>
        </div>

        {/* Tanques */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
          <div className="absolute right-3 top-3 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
            <Droplets size={52} className="text-cyan-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uso dos Tanques</p>
          <p className="text-3xl font-black text-cyan-400 mt-2 font-mono leading-none">
            {tankUsage}%
          </p>
          <p className="text-slate-500 text-xs mt-1.5">capacidade utilizada</p>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
              style={{ width: `${tankUsage}%` }}
            />
          </div>
        </div>
      </div>

      {/* ══ GRÁFICOS — LINHA 1 ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Tendência de Produção */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={15} className="text-green-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Tendência de Produção Diária
            </h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip {...DarkTooltip} formatter={(v: number) => [`${v} m³`, 'Produção']} />
                <Area
                  type="monotone" dataKey="value"
                  stroke="#22c55e" strokeWidth={2.5}
                  fill="url(#gcGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status das Tarefas — Pizza */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={15} className="text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Status de Tarefas
            </h3>
          </div>
          {taskPieData.length > 0 ? (
            <>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskPieData}
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {taskPieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...DarkTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-3">
                {taskPieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-slate-400 truncate max-w-[130px]">{d.name}</span>
                    </div>
                    <span className="text-white font-bold font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-600 text-sm">
              Nenhuma tarefa registrada
            </div>
          )}
        </div>
      </div>

      {/* ══ GRÁFICOS — LINHA 2 ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top Produtos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Box size={15} className="text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Top Produtos por Volume (m³)
            </h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#475569' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  dataKey="name" type="category"
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  axisLine={false} tickLine={false}
                  width={120}
                />
                <Tooltip {...DarkTooltip} formatter={(v: number) => [`${v} m³`, '']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
                  {topProducts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status dos Reatores */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Zap size={15} className="text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Status dos Reatores
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {reactors.map(r => {
              const s = REACTOR_STYLE[r.status] ?? REACTOR_STYLE['Parado'];
              const temp = temps[r.id] ?? r.temperature;
              return (
                <div
                  key={r.id}
                  className={`${s.bg} border border-slate-700/40 rounded-xl p-3 hover:border-slate-600/60 transition-colors`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-black text-sm">{r.id}</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${s.dot} ${
                          r.status === 'Operando' ? 'animate-pulse' : ''
                        }`}
                      />
                      <span className={`text-[10px] font-bold ${s.text}`}>{r.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <Thermometer size={10} className="text-slate-500 flex-shrink-0" />
                    <span className="text-slate-200 text-xs font-mono font-bold">
                      {temp.toFixed(0)}°C
                    </span>
                  </div>
                  <p className="text-slate-500 text-[10px] truncate leading-none">
                    {r.currentProduct ?? '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ TANQUES + EQUIPE ═════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tanques de Armazenagem */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Droplets size={15} className="text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Tanques de Armazenagem
            </h3>
          </div>
          <div className="space-y-4">
            {TANK_IDS.map(id => {
              const vol  = parseFloat(tanksState.volumes[id] || '0') || 0;
              const pct  = Math.min(100, Math.round((vol / TANK_MAX) * 100));
              const prod = tanksState.products[id] || '—';
              const color = pct > 75 ? '#22c55e' : pct > 40 ? '#f59e0b' : pct > 0 ? '#ef4444' : '#1e293b';
              return (
                <div key={id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-white font-bold text-xs flex-shrink-0">{id}</span>
                      <span className="text-slate-500 text-xs truncate">{prod}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="text-slate-500 text-xs font-mono">
                        {vol.toLocaleString('pt-BR')} L
                      </span>
                      <span className="text-white text-xs font-bold font-mono w-9 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desempenho da Equipe */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Users size={15} className="text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Desempenho da Equipe
            </h3>
          </div>
          <div className="space-y-3.5">
            {empStats.map((emp, i) => {
              const pct   = emp.total > 0 ? Math.round((emp.done / emp.total) * 100) : 0;
              const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#3b82f6';
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                    {emp.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-xs font-bold truncate">{emp.name}</span>
                      <span className="text-slate-500 text-[10px] flex-shrink-0 ml-2">
                        {emp.done}/{emp.total} tarefas
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold font-mono w-8 text-right flex-shrink-0"
                    style={{ color }}
                  >
                    {emp.total > 0 ? `${pct}%` : '—'}
                  </span>
                </div>
              );
            })}
            {empStats.length === 0 && employees.map((emp, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                  {emp.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-white text-xs font-bold">{emp.name}</p>
                  <p className="text-slate-500 text-[10px]">{emp.role}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-400 text-[10px] font-bold">Ativo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ REGISTROS RECENTES ═══════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={15} className="text-slate-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">
            Registros Recentes de Produção
          </h3>
        </div>

        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data</th>
                  <th className="text-left pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Produto</th>
                  <th className="text-right pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volume (m³)</th>
                  <th className="text-left pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Observações</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 6).map((log, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 text-slate-400 font-mono text-xs">{log.date}</td>
                    <td className="py-3 text-white font-medium text-sm">{log.product}</td>
                    <td className="py-3 text-right text-green-400 font-bold font-mono">
                      {log.quantityM3.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 text-slate-500 text-xs hidden md:table-cell">
                      {log.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-600 text-sm text-center py-10">
            Nenhum registro de produção encontrado.
          </p>
        )}
      </div>

    </div>
  );
};
