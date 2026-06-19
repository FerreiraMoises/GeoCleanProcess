import React, { useState } from 'react';
import { ReactorState, ProductType, ReactorStatus, ReactorId } from '../types';
import { PRODUCTS } from '../constants';
import { Thermometer, Clock, Power, Settings, Hammer, Zap, FlaskConical } from 'lucide-react';

// ── Gráfico SVG do Reator com Nível Animado ───────────────────────────────────
interface ReactorGraphicProps {
  status: ReactorStatus;
  levelPct: number; // 0–100
}

const ReactorGraphic: React.FC<ReactorGraphicProps> = ({ status, levelPct }) => {
  const isOperating = status === 'Operando';
  const isMaintenance = status === 'Manutenção';
  const isCleaning = status === 'Limpeza';

  // Liquid level inside the reactor body (visor area: y=45..110, height=65)
  const visorTop = 45;
  const visorHeight = 65;
  const clampedPct = Math.min(100, Math.max(0, levelPct));
  const liquidH = (clampedPct / 100) * visorHeight;
  const liquidY = visorTop + (visorHeight - liquidH);

  const liquidColor =
    isCleaning   ? '#0ea5e9' :
    isOperating  ? '#3b82f6' :
    isMaintenance? '#f59e0b' :
                   '#1e3a5f';

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

        {/* Visor (clip area for liquid) */}
        <defs>
          <clipPath id={`visor-clip-${status}`}>
            <rect x="24" y="45" width="52" height="65" rx="2" />
          </clipPath>
        </defs>
        {/* Visor background */}
        <rect x="24" y="45" width="52" height="65" rx="2" fill="#0f172a" stroke="#1e3a5f" strokeWidth="1" />

        {/* ── Animated liquid level ── */}
        {clampedPct > 0 && (
          <g clipPath={`url(#visor-clip-${status})`}>
            {/* Static fill */}
            <rect
              x="24" y={liquidY} width="52" height={liquidH}
              fill={liquidColor}
              fillOpacity={isMaintenance ? "0.2" : "0.55"}
            />
            {/* Animated wave on top of liquid */}
            {(isOperating || isCleaning) && (
              <path fill={liquidColor} opacity="0.5">
                <animate
                  attributeName="d"
                  dur="2s"
                  repeatCount="indefinite"
                  values={`
                    M24,${liquidY} Q37,${liquidY - 4} 50,${liquidY} Q63,${liquidY + 4} 76,${liquidY} L76,${liquidY + liquidH} L24,${liquidY + liquidH} Z;
                    M24,${liquidY} Q37,${liquidY + 4} 50,${liquidY} Q63,${liquidY - 4} 76,${liquidY} L76,${liquidY + liquidH} L24,${liquidY + liquidH} Z;
                    M24,${liquidY} Q37,${liquidY - 4} 50,${liquidY} Q63,${liquidY + 4} 76,${liquidY} L76,${liquidY + liquidH} L24,${liquidY + liquidH} Z
                  `}
                />
              </path>
            )}
            {/* Shine */}
            {(isOperating || isCleaning) && (
              <rect x="28" y={liquidY + 3} width="6" height={Math.max(0, liquidH - 6)} rx="3" fill="white" opacity="0.1" />
            )}
          </g>
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

const REACTOR_CAPACITY_NUM: Record<string, number> = {
  R1: 5, R2: 5, R3: 10, R4: 10, R5: 1, R6: 1.6,
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

  // Local state for production quantities per reactor (M³)
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    reactors.forEach(r => { init[r.id] = ''; });
    return init;
  });

  const getLevelPct = (reactorId: string): number => {
    const val = parseFloat(quantities[reactorId]);
    if (isNaN(val) || val <= 0) return 0;
    const cap = REACTOR_CAPACITY_NUM[reactorId] ?? 1;
    return Math.min(100, (val / cap) * 100);
  };

  const handleQuantityChange = (id: string, value: string) => {
    const cap = REACTOR_CAPACITY_NUM[id] ?? 1;
    const num = parseFloat(value);
    if (value === '' || value === '.') {
      setQuantities(prev => ({ ...prev, [id]: value }));
      return;
    }
    if (!isNaN(num) && num >= 0 && num <= cap) {
      setQuantities(prev => ({ ...prev, [id]: value }));
    }
  };

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
          const levelPct = getLevelPct(reactor.id);
          const cap = REACTOR_CAPACITY_NUM[reactor.id] ?? 1;

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
                {/* Reactor ID + status + level graphic side-by-side */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <ReactorGraphic status={reactor.status} levelPct={levelPct} />
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

                  {/* Animated vertical level bar */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Nível</span>
                    <div className="relative w-5 h-20 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-700 ${
                          reactor.status === 'Operando'   ? 'bg-gradient-to-t from-green-600 to-green-400' :
                          reactor.status === 'Manutenção' ? 'bg-gradient-to-t from-amber-600 to-amber-400' :
                          reactor.status === 'Limpeza'    ? 'bg-gradient-to-t from-blue-600 to-blue-400'  :
                          'bg-gradient-to-t from-slate-600 to-slate-500'
                        }`}
                        style={{ height: `${levelPct}%` }}
                      >
                        {reactor.status === 'Operando' && levelPct > 0 && (
                          <div
                            className="absolute top-0 left-0 right-0 h-1 bg-green-300/60 rounded-full"
                            style={{ animation: 'waveLevel 1.5s ease-in-out infinite' }}
                          />
                        )}
                      </div>
                    </div>
                    <span className={`text-[9px] font-black font-mono ${
                      levelPct > 75 ? 'text-green-400' :
                      levelPct > 0  ? 'text-blue-400'  :
                      'text-slate-600'
                    }`}>
                      {levelPct.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Quantity of production */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                      <FlaskConical size={10} className="text-cyan-400" />
                      Quantidade em Produção (M³)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={cap}
                        step="0.1"
                        value={quantities[reactor.id]}
                        onChange={e => handleQuantityChange(reactor.id, e.target.value)}
                        placeholder="0.0"
                        disabled={reactor.status === 'Manutenção' || reactor.status === 'Limpeza' || reactor.status === 'Parado'}
                        className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition disabled:opacity-30 disabled:cursor-not-allowed text-right placeholder-slate-600"
                      />
                      <span className="text-[10px] text-slate-500 font-medium">/ {REACTOR_CAPACITY[reactor.id]}</span>
                    </div>
                    {/* Mini progress bar for quantity */}
                    <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          levelPct > 75 ? 'bg-green-500' :
                          levelPct > 0  ? 'bg-cyan-500'  :
                          'bg-slate-700'
                        }`}
                        style={{ width: `${levelPct}%` }}
                      />
                    </div>
                  </div>

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

      <style>{`
        @keyframes waveLevel {
          0%, 100% { transform: scaleX(1) translateY(0); opacity: 0.6; }
          50%       { transform: scaleX(0.7) translateY(1px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};