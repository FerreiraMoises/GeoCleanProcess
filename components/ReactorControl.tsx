import React from 'react';
import { ReactorState, ProductType, ReactorStatus, ReactorId } from '../types';
import { PRODUCTS } from '../constants';
import { Thermometer, Clock, Power, Settings, Hammer, Zap } from 'lucide-react';

// ── Gráfico SVG do Reator ─────────────────────────────────────────────────────
const ReactorGraphic: React.FC<{ status: ReactorStatus }> = ({ status }) => {
  const isOperating = status === 'Operando';
  const isMaintenance = status === 'Manutenção';
  const isCleaning = status === 'Limpeza';

  return (
    <div className="relative w-24 h-32 flex items-center justify-center">
      <svg viewBox="0 0 100 140" className={`w-full h-full drop-shadow-md transition-opacity duration-300 ${isMaintenance ? 'opacity-70' : 'opacity-100'}`}>
        {/* Motor Superior */}
        <rect x="35" y="5" width="30" height="15" rx="2" fill={isMaintenance ? "#334155" : "#1e293b"} />
        <rect x="30" y="20" width="40" height="8" rx="1" fill="#0f172a" />

        {/* Tubulações superiores */}
        <path d="M70 24 L85 24 L85 40" stroke="#475569" strokeWidth="3" fill="none" />
        <path d="M30 24 L15 24 L15 40" stroke="#475569" strokeWidth="3" fill="none" />

        {/* Corpo do Reator */}
        <rect x="18" y="35" width="64" height="85" rx="4" fill={isMaintenance ? "#1e293b" : "#0f172a"} stroke="#334155" strokeWidth="2" />

        {/* Visor */}
        <rect x="24" y="45" width="52" height="65" rx="2" fill="#0f172a" stroke="#1e3a5f" strokeWidth="1" />

        {/* Líquido */}
        <rect x="24" y="60" width="52" height="50" rx="1"
          fill={isCleaning ? "#0ea5e9" : isOperating ? "#3b82f6" : "#1e3a5f"}
          fillOpacity={isMaintenance ? "0.15" : "0.6"}>
          {(isOperating || isCleaning) && (
            <animate attributeName="fill-opacity" values="0.5;0.75;0.5" dur="2s" repeatCount="indefinite" />
          )}
        </rect>

        {/* Brilho do líquido */}
        {(isOperating || isCleaning) && (
          <rect x="28" y="65" width="8" height="40" rx="4" fill="white" opacity="0.06" />
        )}

        {/* Engrenagem manutenção */}
        {isMaintenance && (
          <g transform="translate(50, 75)">
            <path d="M-8,-2 L-8,2 L-2,8 L2,8 L8,2 L8,-2 L2,-8 L-2,-8 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
            </path>
            <circle r="3" fill="#fff" />
          </g>
        )}

        {/* Eixo do Agitador */}
        <line x1="50" y1="28" x2="50" y2="100" stroke="#334155" strokeWidth="3" opacity={isMaintenance ? 0.3 : 0.8} />

        {/* Hélice */}
        <g transform="translate(50, 100)" opacity={isMaintenance ? 0.3 : 1}>
          <g className={(isOperating || isCleaning) ? "animate-spin-slow origin-center" : ""}>
            <path d="M-15 0 L15 0 M0 -5 L0 5" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="0" cy="0" rx="4" ry="2" fill="#0f172a" />
          </g>
        </g>

        {/* Pernas */}
        <rect x="25" y="120" width="6" height="15" fill="#1e293b" />
        <rect x="69" y="120" width="6" height="15" fill="#1e293b" />
        <rect x="20" y="132" width="16" height="4" rx="1" fill="#0f172a" />
        <rect x="64" y="132" width="16" height="4" rx="1" fill="#0f172a" />

        {/* Painel lateral */}
        <rect x="84" y="55" width="14" height="25" rx="1" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
        <circle cx="88" cy="60" r="1.5" fill={isMaintenance ? "#f59e0b" : "#ef4444"} />
        <circle cx="91" cy="60" r="1.5" fill={isOperating ? "#22c55e" : "#1e293b"}>
          {isOperating && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
        </circle>
        <rect x="87" y="65" width="8" height="10" fill={isCleaning ? "#0ea5e9" : "#1d4ed8"} fillOpacity="0.4" />
      </svg>
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 1s linear infinite; }
      `}</style>
    </div>
  );
};

interface ReactorControlProps {
  reactors: ReactorState[];
  onUpdateReactor: (id: ReactorId, updates: Partial<ReactorState>) => void;
}

const REACTOR_CAPACITY: Record<string, string> = {
  R1: '5 M³', R2: '5 M³', R3: '10 M³', R4: '10 M³', R5: '1 M³', R6: '1,6 M³',
};

const STATUS_CONFIG: Record<ReactorStatus, { dot: string; text: string; bg: string; border: string; btnActive: string }> = {
  'Operando':   { dot: 'bg-green-500',  text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  btnActive: 'bg-green-600 text-white border-green-600' },
  'Parado':     { dot: 'bg-slate-500',  text: 'text-slate-400',  bg: 'bg-slate-800/50',  border: 'border-slate-700',     btnActive: 'bg-slate-600 text-white border-slate-600' },
  'Manutenção': { dot: 'bg-amber-500',  text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  btnActive: 'bg-amber-600 text-white border-amber-600' },
  'Limpeza':    { dot: 'bg-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   btnActive: 'bg-blue-600 text-white border-blue-600' },
};

const getStatusIcon = (status: ReactorStatus) => {
  switch (status) {
    case 'Operando': return <Power size={12} />;
    case 'Parado':   return <Power size={12} />;
    case 'Manutenção': return <Hammer size={12} />;
    case 'Limpeza':  return <Settings size={12} />;
  }
};

export const ReactorControl: React.FC<ReactorControlProps> = ({ reactors, onUpdateReactor }) => {
  const activeCount = reactors.filter(r => r.status === 'Operando').length;

  return (
    <div className="p-6 min-h-screen bg-slate-950">

      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Zap size={16} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Controle de Reatores</h2>
          </div>
          <p className="text-slate-500 text-sm pl-11">Monitoramento e controle dos reatores industriais (R1–R6)</p>
        </div>

        {/* Status strip */}
        <div className="flex gap-3">
          {(['Operando', 'Manutenção', 'Limpeza', 'Parado'] as ReactorStatus[]).map(s => {
            const count = reactors.filter(r => r.status === s).length;
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className={`${cfg.bg} border ${cfg.border} rounded-xl px-3 py-2 text-center`}>
                <p className={`text-lg font-black font-mono ${cfg.text}`}>{count}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{s}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BARRA DE UTILIZAÇÃO ────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 mb-6 flex items-center gap-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex-shrink-0">Utilização da Planta</span>
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-1000"
            style={{ width: `${(activeCount / Math.max(reactors.length, 1)) * 100}%` }}
          />
        </div>
        <span className="text-sm font-black text-green-400 font-mono flex-shrink-0">
          {activeCount}/{reactors.length}
        </span>
      </div>

      {/* ── GRID DE REATORES ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reactors.map((reactor) => {
          const cfg = STATUS_CONFIG[reactor.status] ?? STATUS_CONFIG['Parado'];
          return (
            <div
              key={reactor.id}
              className={`bg-slate-900 rounded-2xl border transition-all duration-300 overflow-hidden hover:border-slate-600 ${
                reactor.status === 'Operando'   ? 'border-green-500/30' :
                reactor.status === 'Manutenção' ? 'border-amber-500/30' :
                reactor.status === 'Limpeza'    ? 'border-blue-500/30'  :
                'border-slate-800'
              }`}
            >
              <div className="p-5">
                {/* Reactor ID + status */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <ReactorGraphic status={reactor.status} />
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tighter font-mono">{reactor.id}</h3>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Misturador Vertical</p>
                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        Cap.: <span className="text-blue-400 font-bold">{REACTOR_CAPACITY[reactor.id] ?? '—'}</span>
                      </p>
                      <div className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded-full border w-fit ${cfg.bg} ${cfg.border}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${reactor.status === 'Operando' ? 'animate-pulse' : ''}`} />
                        <span className={`text-[9px] font-bold ${cfg.text}`}>{reactor.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Product */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Fertilizante em Processo</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      value={reactor.currentProduct || ''}
                      disabled={reactor.status === 'Manutenção' || reactor.status === 'Limpeza'}
                      onChange={(e) => onUpdateReactor(reactor.id, {
                        currentProduct: e.target.value as ProductType,
                        lastUpdate: new Date().toISOString()
                      })}
                    >
                      <option value="">— Nenhum Processo —</option>
                      {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Quick actions */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Ação Rápida</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['Operando', 'Parado', 'Manutenção', 'Limpeza'] as ReactorStatus[]).map((s) => {
                        const sCfg = STATUS_CONFIG[s];
                        const isActive = reactor.status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => onUpdateReactor(reactor.id, {
                              status: s,
                              lastUpdate: new Date().toISOString()
                            })}
                            className={`text-[9px] font-bold py-2 rounded-lg border transition-all duration-200 flex items-center justify-center gap-1 ${
                              isActive
                                ? `${sCfg.btnActive} shadow-lg scale-[1.02]`
                                : `bg-slate-800 text-slate-400 border-slate-700 hover:${sCfg.bg} hover:${sCfg.text} hover:${sCfg.border}`
                            }`}
                          >
                            {getStatusIcon(s)}
                            {s.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Temperatura + última atualização */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <Thermometer size={16} className={reactor.temperature > 60 ? 'text-red-400' : 'text-orange-400'} />
                      <span className="text-base font-black font-mono text-white">{reactor.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock size={12} />
                      <span className="text-xs font-mono">
                        {new Date(reactor.lastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div className="px-5 pb-4">
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 rounded-full ${
                      reactor.status === 'Operando'   ? 'bg-green-500' :
                      reactor.status === 'Manutenção' ? 'bg-amber-500' :
                      reactor.status === 'Limpeza'    ? 'bg-blue-500'  :
                      'bg-slate-700'
                    }`}
                    style={{ width: reactor.status === 'Parado' ? '0%' : '100%' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};