import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area 
} from 'recharts';
import { ProductionLog, Task, Employee } from '../types';
import { 
  TrendingUp, AlertTriangle, Activity, 
  Zap, Target, ArrowUpRight 
} from 'lucide-react';

interface DashboardProps {
  logs: ProductionLog[];
  tasks: Task[];
  employees: Employee[];
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, tasks, employees }) => {
  // Processamento de dados para os gráficos
  const productionByProduct = logs.reduce((acc, log) => {
    acc[log.product] = (acc[log.product] || 0) + log.quantityM3;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(productionByProduct)
    .map(([name, value]) => ({ name: name.split(' ')[0], full_name: name, value: Number(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

  // Dados de tendência baseados nos logs reais
  const trendData = logs.reduce((acc, log) => {
    const date = log.date;
    acc[date] = (acc[date] || 0) + log.quantityM3;
    return acc;
  }, {} as Record<string, number>);

  const lineData = Object.entries(trendData)
    .map(([date, value]) => ({ date, value: Number(value) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Concluído').length;
  const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalProduction = logs.reduce((acc, curr) => acc + curr.quantityM3, 0);

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-6">
      <header className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard de Produção</h2>
          <p className="text-sm text-slate-500 font-medium">Análise de performance e inteligência operacional Geoclean</p>
        </div>
        <div className="flex gap-2">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              SISTEMA EM TEMPO REAL
            </div>
        </div>
      </header>

      {/* Cards de KPIs Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target size={48} className="text-green-600" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produção Total</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-black text-slate-800">{totalProduction.toLocaleString()}</h3>
            <span className="text-sm font-bold text-slate-400">m³</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-green-600 text-xs font-bold">
            <ArrowUpRight size={14} />
            <span>+12.5% vs ontem</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={48} className="text-blue-600" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tarefas Ativas</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-black text-slate-800">{tasks.filter(t => t.status === 'Em Andamento').length}</h3>
            <span className="text-sm font-bold text-slate-400">em execução</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-blue-600 text-xs font-bold">
            <Activity size={14} />
            <span>Fluxo contínuo</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle size={48} className="text-amber-600" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendências</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-black text-slate-800">{tasks.filter(t => t.status === 'Pendente').length}</h3>
            <span className="text-sm font-bold text-slate-400">aguardando</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-amber-600 text-xs font-bold">
            <span>Prioridade média</span>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
             <div className="w-20 h-20 bg-green-500/10 rounded-full blur-2xl" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OEE da Planta</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-4xl font-black text-green-400">{efficiency}%</h3>
          </div>
          <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
             <div className="bg-green-500 h-full" style={{ width: `${efficiency}%` }} />
          </div>
          <p className="text-[10px] mt-2 font-medium text-slate-400">Eficiência calculada por tarefas concluídas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Tendência - Agora ocupando 3 colunas para preencher o espaço da IA */}
        <div className="lg:col-span-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={18} className="text-green-600" />
                Tendência de Produção Diária
            </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    labelStyle={{fontWeight: 'bold', marginBottom: '4px'}}
                />
                <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorProd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Produção por Produto */}
        <div className="lg:col-span-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-800 mb-8 uppercase tracking-widest">Top 6 Produtos mais Produzidos (m³)</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} axisLine={false} tickLine={false} width={80} />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}} 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white p-3 rounded-lg shadow-xl border border-slate-100">
                                            <p className="text-xs font-bold text-slate-800">{(payload[0].payload as any).full_name}</p>
                                            <p className="text-lg font-black text-green-600">{payload[0].value} m³</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                            {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>
    </div>
  );
};