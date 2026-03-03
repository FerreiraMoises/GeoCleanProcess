import React from 'react';
import { ReactorState, ProductType, ReactorStatus, ReactorId } from '../types';
import { PRODUCTS } from '../constants';
import { Thermometer, Clock, Power, Settings, AlertTriangle, Hammer } from 'lucide-react';

// Componente visual do Reator baseado na imagem fornecida com efeitos especiais
const ReactorGraphic: React.FC<{ status: ReactorStatus }> = ({ status }) => {
  const isOperating = status === 'Operando';
  const isMaintenance = status === 'Manutenção';
  const isCleaning = status === 'Limpeza';

  return (
    <div className="relative w-24 h-32 flex items-center justify-center">
      <svg viewBox="0 0 100 140" className={`w-full h-full drop-shadow-md transition-opacity duration-300 ${isMaintenance ? 'opacity-70' : 'opacity-100'}`}>
        {/* Motor Superior */}
        <rect x="35" y="5" width="30" height="15" rx="2" fill={isMaintenance ? "#64748b" : "#475569"} />
        <rect x="30" y="20" width="40" height="8" rx="1" fill="#1e293b" />

        {/* Tubulações superiores */}
        <path d="M70 24 L85 24 L85 40" stroke="#94a3b8" strokeWidth="3" fill="none" />
        <path d="M30 24 L15 24 L15 40" stroke="#94a3b8" strokeWidth="3" fill="none" />

        {/* Corpo do Reator - Estrutura Metálica */}
        <rect x="18" y="35" width="64" height="85" rx="4" fill={isMaintenance ? "#cbd5e1" : "#94a3b8"} stroke="#475569" strokeWidth="2" />

        {/* Visor de Vidro / Fluido */}
        <rect x="24" y="45" width="52" height="65" rx="2" fill="#e2e8f0" />

        {/* Líquido/Fluido - Cor azul padrão para limpeza e operação */}
        <rect
          x="24"
          y="60"
          width="52"
          height="50"
          rx="1"
          fill={isCleaning ? "#7dd3fc" : "#3b82f6"}
          fillOpacity={isMaintenance ? "0.2" : "0.7"}
        >
          {(isOperating || isCleaning) && (
            <animate attributeName="fill-opacity" values="0.6;0.8;0.6" dur="2s" repeatCount="indefinite" />
          )}
        </rect>

        {/* Efeito de Manutenção - Engrenagem ou Ícone Central */}
        {isMaintenance && (
          <g transform="translate(50, 75)">
            <path
              d="M-8,-2 L-8,2 L-2,8 L2,8 L8,2 L8,-2 L2,-8 L-2,-8 Z"
              fill="#f59e0b"
              stroke="#d97706"
              strokeWidth="1"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>
            <circle r="3" fill="#fff" />
          </g>
        )}

        {/* Eixo do Agitador */}
        <line x1="50" y1="28" x2="50" y2="100" stroke="#334155" strokeWidth="3" opacity={isMaintenance ? 0.3 : 1} />

        {/* Hélice do Agitador */}
        <g transform="translate(50, 100)" opacity={isMaintenance ? 0.3 : 1}>
          <g className={(isOperating || isCleaning) ? "animate-spin-slow origin-center" : ""}>
            <path d="M-15 0 L15 0 M0 -5 L0 5" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="0" cy="0" rx="4" ry="2" fill="#0f172a" />
          </g>
        </g>

        {/* Pernas de Sustentação */}
        <rect x="25" y="120" width="6" height="15" fill="#475569" />
        <rect x="69" y="120" width="6" height="15" fill="#475569" />
        <rect x="20" y="132" width="16" height="4" rx="1" fill="#1e293b" />
        <rect x="64" y="132" width="16" height="4" rx="1" fill="#1e293b" />

        {/* Painel de Controle Lateral */}
        <rect x="84" y="55" width="14" height="25" rx="1" fill="#1e293b" />
        <circle cx="88" cy="60" r="1.5" fill={isMaintenance ? "#f59e0b" : "#ef4444"} />
        <circle cx="91" cy="60" r="1.5" fill={isOperating ? "#22c55e" : "#475569"} />
        <rect x="87" y="65" width="8" height="10" fill={isCleaning ? "#7dd3fc" : "#0ea5e9"} fillOpacity="0.4" />
      </svg>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

interface ReactorControlProps {
  reactors: ReactorState[];
  onUpdateReactor: (id: ReactorId, updates: Partial<ReactorState>) => void;
}

// Capacidade em M³ por reator
const REACTOR_CAPACITY: Record<string, string> = {
  R1: '5 M³',
  R2: '5 M³',
  R3: '10 M³',
  R4: '10 M³',
  R5: '1 M³',
  R6: '1,6 M³',
};

export const ReactorControl: React.FC<ReactorControlProps> = ({ reactors, onUpdateReactor }) => {

  const getStatusColor = (status: ReactorStatus) => {
    switch (status) {
      case 'Operando': return 'bg-green-100 text-green-700 border-green-200';
      case 'Parado': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Manutenção': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Limpeza': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getQuickActionStyle = (status: ReactorStatus, isActive: boolean) => {
    if (!isActive) {
      switch (status) {
        case 'Operando': return 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100';
        case 'Parado': return 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
        case 'Manutenção': return 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100';
        case 'Limpeza': return 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100';
        default: return 'bg-white text-slate-600 border-slate-100';
      }
    }

    switch (status) {
      case 'Operando': return 'bg-green-600 text-white border-green-600 shadow-lg scale-[1.02]';
      case 'Parado': return 'bg-slate-600 text-white border-slate-600 shadow-lg scale-[1.02]';
      case 'Manutenção': return 'bg-amber-600 text-white border-amber-600 shadow-lg scale-[1.02]';
      case 'Limpeza': return 'bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]';
      default: return 'bg-slate-800 text-white border-slate-800';
    }
  };

  const getStatusIcon = (status: ReactorStatus) => {
    switch (status) {
      case 'Operando': return <Power className="w-4 h-4" />;
      case 'Parado': return <Power className="w-4 h-4" />;
      case 'Manutenção': return <Hammer className="w-4 h-4" />;
      case 'Limpeza': return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Controle de Reatores</h2>
        <p className="text-slate-500">Monitoramento e controle dos reatores industriais (R1-R6)</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reactors.map((reactor) => (
          <div key={reactor.id} className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300 ${reactor.status === 'Manutenção' ? 'border-amber-200' : reactor.status === 'Limpeza' ? 'border-blue-200' : ''}`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <ReactorGraphic status={reactor.status} />
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{reactor.id}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Misturador Vertical</p>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Capacidade: <span className="text-blue-600 font-bold">{REACTOR_CAPACITY[reactor.id] ?? '—'}</span></p>
                    <div className={`mt-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border w-fit ${getStatusColor(reactor.status)}`}>
                      {getStatusIcon(reactor.status)}
                      {reactor.status}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Product Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Nome do Fertilizante</label>
                  <select
                    className="w-full text-sm font-medium border-slate-200 rounded-lg shadow-sm focus:border-green-500 focus:ring-green-500 p-2.5 border bg-slate-50 disabled:opacity-50"
                    value={reactor.currentProduct || ''}
                    disabled={reactor.status === 'Manutenção' || reactor.status === 'Limpeza'}
                    onChange={(e) => onUpdateReactor(reactor.id, {
                      currentProduct: e.target.value as ProductType,
                      lastUpdate: new Date().toISOString()
                    })}
                  >
                    <option value="">Nenhum Processo</option>
                    {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Ação Rápida</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Operando', 'Parado', 'Manutenção', 'Limpeza'].map((status) => (
                      <button
                        key={status}
                        onClick={() => onUpdateReactor(reactor.id, {
                          status: status as ReactorStatus,
                          lastUpdate: new Date().toISOString()
                        })}
                        className={`text-[10px] font-bold py-2 rounded-lg border transition-all duration-200 ${getQuickActionStyle(status as ReactorStatus, reactor.status === status)}`}
                      >
                        {status.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Thermometer size={18} className={reactor.temperature > 60 ? "text-red-500" : "text-orange-400"} />
                    <span className="text-base font-bold tracking-tight">{reactor.temperature}°C</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-xs font-medium">
                      {new Date(reactor.lastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Health/Progress Bar */}
            <div className="px-6 pb-4">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${reactor.status === 'Operando' ? 'bg-green-500' :
                    reactor.status === 'Manutenção' ? 'bg-amber-500' :
                      reactor.status === 'Limpeza' ? 'bg-blue-500' :
                        'bg-slate-300'
                    }`}
                  style={{ width: reactor.status === 'Parado' ? '0%' : '100%' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};