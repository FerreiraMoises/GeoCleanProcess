import React, { useState } from 'react';
import { Tag, X, Save, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';

interface Tank {
  id: string;
  label: string;
  capacity: number;
}

const TANKS: Tank[] = [
  { id: 'T1', label: 'T1', capacity: 15 },
  { id: 'T2', label: 'T2', capacity: 15 },
  { id: 'T3', label: 'T3', capacity: 15 },
  { id: 'T4', label: 'T4', capacity: 10 },
  { id: 'T5', label: 'T5', capacity: 10 },
];

type VolumeMap = Record<string, string>;
type ProductMap = Record<string, string>;

function getLevelColor(pct: number): { fill: string; wave: string; glow: string; gradient: string } {
  if (pct < 25) return {
    fill: '#ef4444', wave: '#dc2626',
    glow: 'rgba(239,68,68,0.3)',
    gradient: 'from-red-600 to-red-400',
  };
  if (pct < 60) return {
    fill: '#3b82f6', wave: '#2563eb',
    glow: 'rgba(59,130,246,0.3)',
    gradient: 'from-blue-600 to-blue-400',
  };
  return {
    fill: '#22c55e', wave: '#16a34a',
    glow: 'rgba(34,197,94,0.3)',
    gradient: 'from-green-600 to-green-400',
  };
}

/* ── Pump SVG (dark theme) ── */
interface PumpSVGProps { pumpOn: boolean; }
const PumpSVG: React.FC<PumpSVGProps> = ({ pumpOn }) => (
  <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <radialGradient id="pump-body-grad-d" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor={pumpOn ? '#60a5fa' : '#475569'} />
        <stop offset="100%" stopColor={pumpOn ? '#1d4ed8' : '#1e293b'} />
      </radialGradient>
      <filter id="pump-glow-d">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* Motor body */}
    <rect x="62" y="30" width="50" height="30" rx="5" fill={pumpOn ? '#1e40af' : '#334155'} stroke={pumpOn ? '#3b82f6' : '#475569'} strokeWidth="1.5" />
    <rect x="70" y="30" width="6" height="30" fill="rgba(255,255,255,0.05)" />
    <rect x="82" y="30" width="6" height="30" fill="rgba(255,255,255,0.05)" />
    <rect x="94" y="30" width="6" height="30" fill="rgba(255,255,255,0.05)" />
    <text x="87" y="48" textAnchor="middle" fontSize="7" fontWeight="bold" fill={pumpOn ? '#bfdbfe' : '#64748b'}>MOTOR</text>

    {/* Pump volute */}
    <circle cx="42" cy="50" r="28" fill="url(#pump-body-grad-d)"
      stroke={pumpOn ? '#3b82f6' : '#334155'} strokeWidth="2"
      filter={pumpOn ? 'url(#pump-glow-d)' : undefined}
    />
    <circle cx="42" cy="50" r="20" fill="none" stroke={pumpOn ? '#93c5fd' : '#475569'} strokeWidth="1" opacity="0.4" />

    {/* Impeller */}
    <g>
      {pumpOn && (
        <animateTransform attributeName="transform" type="rotate"
          from="0 42 50" to="360 42 50" dur="0.5s" repeatCount="indefinite" />
      )}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={i}
            x1={42 + 6 * Math.cos(rad)} y1={50 + 6 * Math.sin(rad)}
            x2={42 + 17 * Math.cos(rad)} y2={50 + 17 * Math.sin(rad)}
            stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
        );
      })}
      <circle cx="42" cy="50" r="5.5" fill={pumpOn ? '#93c5fd' : '#64748b'} />
    </g>

    {/* Shaft */}
    <rect x="60" y="44" width="4" height="12" fill={pumpOn ? '#60a5fa' : '#475569'} />

    {/* Inlet pipe */}
    <rect x="0" y="44" width="16" height="12" rx="3" fill={pumpOn ? '#2563eb' : '#334155'} />
    <ellipse cx="16" cy="50" rx="2" ry="6" fill={pumpOn ? '#1d4ed8' : '#1e293b'} />
    <polygon points="5,50 11,45 11,55" fill={pumpOn ? '#93c5fd' : '#64748b'} opacity="0.8" />

    {/* Discharge pipe */}
    <rect x="36" y="0" width="12" height="24" rx="3" fill={pumpOn ? '#2563eb' : '#334155'} />
    <ellipse cx="42" cy="24" rx="6" ry="2" fill={pumpOn ? '#1d4ed8' : '#1e293b'} />
    <polygon points="42,4 37,12 47,12" fill={pumpOn ? '#93c5fd' : '#64748b'} opacity="0.8" />

    {/* Flow particles */}
    {pumpOn && (
      <>
        <circle cx="8" cy="50" r="3" fill="#bfdbfe" opacity="0.9">
          <animate attributeName="cx" from="0" to="16" dur="0.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="42" cy="12" r="3" fill="#bfdbfe" opacity="0.9">
          <animate attributeName="cy" from="22" to="0" dur="0.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="42" cy="6" r="3" fill="#bfdbfe" opacity="0.9">
          <animate attributeName="cy" from="22" to="0" dur="0.5s" begin="0.25s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="0.5s" begin="0.25s" repeatCount="indefinite" />
        </circle>
      </>
    )}

    {/* Status dot */}
    <circle cx="107" cy="24" r="5" fill={pumpOn ? '#22c55e' : '#ef4444'} stroke="white" strokeWidth="1">
      {pumpOn && <animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite" />}
    </circle>
  </svg>
);

/* ── Animated Wave Tank SVG (dark themed) ── */
interface TankSVGProps {
  pct: number;
  tankId: string;
  pumpOn: boolean;
  hasPump: boolean;
}

const TankSVG: React.FC<TankSVGProps> = ({ pct, tankId, pumpOn, hasPump }) => {
  const clampedPct = Math.min(100, Math.max(0, pct));
  const colors = getLevelColor(clampedPct);
  const tankH = 180;
  const tankW = 100;
  const fillH = (clampedPct / 100) * tankH;
  const fillY = tankH - fillH;
  const uid = tankId;

  return (
    <svg viewBox="0 0 150 245" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={`metal-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="30%" stopColor="#475569" />
          <stop offset="70%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id={`liquid-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.wave} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colors.fill} stopOpacity="1" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <rect x="15" y="30" width={tankW} height={tankH} rx="4" />
        </clipPath>
        <filter id={`glow-${uid}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Top cap */}
      <ellipse cx="65" cy="30" rx="50" ry="10" fill={`url(#metal-${uid})`} stroke="#475569" strokeWidth="1" />
      {/* Body */}
      <rect x="15" y="30" width={tankW} height={tankH} rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

      {/* Liquid */}
      <g clipPath={`url(#clip-${uid})`}>
        {clampedPct > 0 && (
          <>
            <rect x="15" y={30 + fillY} width={tankW} height={fillH} fill={`url(#liquid-${uid})`} opacity="0.85" />
            <path fill={colors.wave} opacity="0.5">
              <animate
                attributeName="d"
                dur={pumpOn ? "1.2s" : "2.5s"}
                repeatCount="indefinite"
                values={`
                  M15,${30 + fillY} Q32,${30 + fillY - (pumpOn ? 10 : 6)} 50,${30 + fillY} Q82,${30 + fillY + (pumpOn ? 10 : 6)} 115,${30 + fillY} L115,${tankH + 30} L15,${tankH + 30} Z;
                  M15,${30 + fillY} Q32,${30 + fillY + (pumpOn ? 10 : 6)} 50,${30 + fillY} Q82,${30 + fillY - (pumpOn ? 10 : 6)} 115,${30 + fillY} L115,${tankH + 30} L15,${tankH + 30} Z;
                  M15,${30 + fillY} Q32,${30 + fillY - (pumpOn ? 10 : 6)} 50,${30 + fillY} Q82,${30 + fillY + (pumpOn ? 10 : 6)} 115,${30 + fillY} L115,${tankH + 30} L15,${tankH + 30} Z
                `}
              />
            </path>
            <rect x="22" y={30 + fillY + 4} width="12" height={Math.max(0, fillH - 8)} rx="6" fill="white" opacity="0.08" />
          </>
        )}
      </g>

      {/* Bubbles */}
      {hasPump && pumpOn && clampedPct > 0 && (
        <g clipPath={`url(#clip-${uid})`}>
          <circle cx="40" cy="210" r="2.5" fill="white" opacity="0.6">
            <animate attributeName="cy" from="210" to={30 + fillY} dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="cx" values="37;43;37" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.8;0" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="65" cy="210" r="3.5" fill="white" opacity="0.5">
            <animate attributeName="cy" from="210" to={30 + fillY} dur="1.6s" begin="0.4s" repeatCount="indefinite" />
            <animate attributeName="cx" values="68;62;68" dur="1.6s" begin="0.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.7;0" dur="1.6s" begin="0.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="85" cy="210" r="2" fill="white" opacity="0.7">
            <animate attributeName="cy" from="210" to={30 + fillY} dur="1.0s" begin="0.8s" repeatCount="indefinite" />
            <animate attributeName="cx" values="83;87;83" dur="1.0s" begin="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.9;0" dur="1.0s" begin="0.8s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* Bottom cap */}
      <ellipse cx="65" cy={tankH + 30} rx="50" ry="10" fill={`url(#metal-${uid})`} stroke="#475569" strokeWidth="1" />

      {/* Structural rings */}
      {[0.33, 0.66].map((f, i) => (
        <line key={i} x1="15" y1={30 + tankH * f} x2="115" y2={30 + tankH * f}
          stroke="#475569" strokeWidth="1.5" opacity="0.3" />
      ))}

      {/* Bottom exit pipe */}
      <rect x="58" y={tankH + 37} width="14" height="12" fill="#334155" />
      <rect x="45" y={tankH + 47} width="40" height="7" rx="3" fill="#334155" />

      {/* Recirculation Loop (T4 & T5) */}
      {hasPump && (
        <>
          <path d="M 65,227 L 65,234 L 132,234 L 132,45 L 80,45 L 80,32" fill="none" stroke="#475569" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 65,227 L 65,234 L 132,234 L 132,45 L 80,45 L 80,32" fill="none" stroke={pumpOn ? colors.wave : '#334155'} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {pumpOn && (
            <path d="M 65,227 L 65,234 L 132,234 L 132,45 L 80,45 L 80,32" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,12">
              <animate attributeName="stroke-dashoffset" from="36" to="0" dur="0.9s" repeatCount="indefinite" />
            </path>
          )}
          <circle cx="132" cy="140" r="10" fill={pumpOn ? '#2563eb' : '#334155'} stroke="#475569" strokeWidth="1.5" />
          <circle cx="132" cy="140" r="6" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="3,3">
            {pumpOn && (
              <animateTransform attributeName="transform" type="rotate" from="0 132 140" to="360 132 140" dur="0.8s" repeatCount="indefinite" />
            )}
          </circle>
          {pumpOn && clampedPct > 0 && (
            <>
              <circle cx="80" cy="35" r="2.5" fill={colors.wave}>
                <animate attributeName="cy" from="35" to={30 + fillY} dur="0.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;1;0" dur="0.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="77" cy="35" r="1.8" fill={colors.wave}>
                <animate attributeName="cy" from="35" to={30 + fillY} dur="0.7s" begin="0.15s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;1;0" dur="0.7s" begin="0.15s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </>
      )}
    </svg>
  );
};

/* ── Produto Modal (dark themed) ── */
interface ProductModalProps {
  tankId: string;
  current: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ tankId, current, onSave, onClose }) => {
  const [value, setValue] = useState(current);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Tag className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Produto — {tankId}</h2>
              <p className="text-xs text-slate-500">Informe o nome do produto armazenado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Nome do Produto
            </label>
            <input
              type="text"
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { onSave(value.trim()); } }}
              placeholder="Ex: Ácido Fosfórico, Inoculante AZ..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 font-semibold hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { if (value.trim()) onSave(value.trim()); }}
              disabled={!value.trim()}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
export interface StorageTanksState {
  volumes: VolumeMap;
  products: ProductMap;
  pumpOn: boolean;
  pumpOnT5: boolean;
}

export const INITIAL_TANKS_STATE: StorageTanksState = {
  volumes: { T1: '', T2: '', T3: '', T4: '', T5: '' },
  products: { T1: '', T2: '', T3: '', T4: '', T5: '' },
  pumpOn: false,
  pumpOnT5: false,
};

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

interface StorageTanksProps extends StorageTanksState {
  onVolumesChange: (v: VolumeMap) => void;
  onProductsChange: (p: ProductMap) => void;
  onPumpChange: (tankId: string, on: boolean) => void;
  onSaveAll?: () => Promise<void>;
}

export const StorageTanks: React.FC<StorageTanksProps> = ({
  volumes, products, pumpOn, pumpOnT5,
  onVolumesChange, onProductsChange, onPumpChange, onSaveAll,
}) => {
  const [editingProduct, setEditingProduct] = React.useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const handleSaveAll = async () => {
    if (!onSaveAll || saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await onSaveAll();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleVolumeChange = (id: string, value: string) => {
    const tank = TANKS.find(t => t.id === id)!;
    const num = parseFloat(value);
    if (value === '' || value === '.' || value === '0') {
      onVolumesChange({ ...volumes, [id]: value });
      return;
    }
    if (!isNaN(num) && num >= 0 && num <= tank.capacity) {
      onVolumesChange({ ...volumes, [id]: value });
    }
  };

  const getPercentage = (id: string) => {
    const tank = TANKS.find(t => t.id === id)!;
    const val = parseFloat(volumes[id]);
    if (isNaN(val) || val <= 0) return 0;
    return Math.min(100, (val / tank.capacity) * 100);
  };

  const getStatusLabel = (pct: number) => {
    if (pct === 0) return { label: 'Vazio',  color: 'text-slate-500' };
    if (pct < 25)  return { label: 'Baixo',  color: 'text-red-400'   };
    if (pct < 60)  return { label: 'Normal', color: 'text-blue-400'  };
    if (pct < 90)  return { label: 'Alto',   color: 'text-green-400' };
    return               { label: 'Cheio',  color: 'text-green-300' };
  };

  // Summary stats
  const totalVol = TANKS.reduce((s, t) => s + (parseFloat(volumes[t.id]) || 0), 0);
  const totalCap = TANKS.reduce((s, t) => s + t.capacity, 0);
  const totalPct = (totalVol / totalCap) * 100;

  return (
    <div className="p-6 min-h-screen bg-slate-950">

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Database size={16} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Tanques de Armazenagem</h2>
          </div>
          <p className="text-slate-500 text-sm pl-11">Monitoramento de nível e produto por tanque</p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cap. Total</p>
            <p className="text-lg font-black text-white font-mono">{totalCap} M³</p>
          </div>
          <div className="bg-slate-900 border border-blue-500/20 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Em Uso</p>
            <p className="text-lg font-black text-blue-400 font-mono">{totalVol.toFixed(1)} M³</p>
          </div>
          <div className={`bg-slate-900 border rounded-xl px-4 py-2 text-center ${
            totalPct < 25 ? 'border-red-500/20' : totalPct < 75 ? 'border-green-500/20' : 'border-amber-500/20'
          }`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ocupação</p>
            <p className={`text-lg font-black font-mono ${
              totalPct < 25 ? 'text-red-400' : totalPct < 75 ? 'text-green-400' : 'text-amber-400'
            }`}>{totalPct.toFixed(0)}%</p>
          </div>

          {/* Save button */}
          {onSaveAll && (
            <button
              onClick={handleSaveAll}
              disabled={saveStatus === 'saving'}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${
                saveStatus === 'saving'
                  ? 'bg-blue-500/40 text-blue-300 cursor-not-allowed'
                  : saveStatus === 'success'
                  ? 'bg-green-600 text-white shadow-green-900/40'
                  : saveStatus === 'error'
                  ? 'bg-red-600 text-white shadow-red-900/40'
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/30 hover:-translate-y-0.5'
              }`}
            >
              {saveStatus === 'saving'  && <Loader2 className="w-4 h-4 animate-spin" />}
              {saveStatus === 'success' && <CheckCircle className="w-4 h-4" />}
              {saveStatus === 'error'   && <AlertCircle className="w-4 h-4" />}
              {saveStatus === 'idle'    && <Save className="w-4 h-4" />}
              {saveStatus === 'saving'  && 'Salvando...'}
              {saveStatus === 'success' && 'Salvo!'}
              {saveStatus === 'error'   && 'Erro ao salvar'}
              {saveStatus === 'idle'    && 'Salvar Dados'}
            </button>
          )}
        </div>
      </div>

      {/* ── OVERALL LEVEL BAR ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 mb-6 flex items-center gap-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex-shrink-0">Ocupação Geral</span>
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${getLevelColor(totalPct).gradient}`}
            style={{ width: `${Math.min(100, totalPct)}%` }}
          />
        </div>
        <span className={`text-sm font-black font-mono flex-shrink-0 ${
          totalPct < 25 ? 'text-red-400' : totalPct < 75 ? 'text-green-400' : 'text-amber-400'
        }`}>
          {totalVol.toFixed(1)}/{totalCap} M³
        </span>
      </div>

      {/* ── TANKS GRID ── */}
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-5">
        {TANKS.map(tank => {
          const pct = getPercentage(tank.id);
          const colors = getLevelColor(pct);
          const status = getStatusLabel(pct);
          const isT4 = tank.id === 'T4';
          const isT5 = tank.id === 'T5';
          const hasPump = isT4 || isT5;
          const isPumpOn = isT4 ? pumpOn : isT5 ? pumpOnT5 : false;
          const product = products[tank.id];

          return (
            <div
              key={tank.id}
              className={`bg-slate-900 rounded-2xl border flex flex-col items-center p-4 transition-all duration-300 ${
                pct > 0
                  ? hasPump
                    ? 'border-blue-500/30 hover:border-blue-500/50'
                    : 'border-slate-700 hover:border-slate-600'
                  : 'border-slate-800'
              }`}
              style={pct > 0 ? { boxShadow: `0 4px 24px 0 ${colors.glow}` } : undefined}
            >
              {/* Tank header */}
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-lg font-mono">{tank.label}</span>
                  {hasPump && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      isPumpOn
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>BOMBA</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{tank.capacity} M³</span>
              </div>

              {/* Produto badge */}
              <div className="w-full mb-3">
                <button
                  onClick={() => setEditingProduct(tank.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                    product
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25'
                      : 'bg-slate-800 border-dashed border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{product || 'Produto — clique para adicionar'}</span>
                </button>
              </div>

              {/* SVG Tank */}
              <div className="w-full h-52 flex items-center justify-center">
                <TankSVG pct={pct} tankId={tank.id} pumpOn={isPumpOn} hasPump={hasPump} />
              </div>

              {/* Level indicators */}
              <div className="w-full mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-bold ${status.color}`}>{status.label}</span>
                  <span className="font-black text-white font-mono">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${colors.fill}, ${colors.wave})`,
                      boxShadow: pct > 0 ? `0 0 8px ${colors.glow}` : undefined,
                    }}
                  />
                </div>
              </div>

              {/* Volume input */}
              <div className="w-full mt-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Volume atual (M³)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max={tank.capacity}
                    step="0.1"
                    value={volumes[tank.id]}
                    onChange={e => handleVolumeChange(tank.id, e.target.value)}
                    placeholder="0.0"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition text-right font-mono placeholder-slate-600"
                  />
                  <span className="text-xs text-slate-500 font-medium">M³</span>
                </div>
                <div className="flex items-center justify-between mt-1 px-0.5">
                  <span className="text-[10px] text-slate-600">0 M³</span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: pct > 0 ? colors.fill : '#475569' }}>
                    {volumes[tank.id] ? `${parseFloat(volumes[tank.id] || '0').toFixed(2)} M³` : '— M³'}
                  </span>
                  <span className="text-[10px] text-slate-600">{tank.capacity} M³</span>
                </div>
              </div>

              {/* Pump section (T4 & T5) */}
              {hasPump && (
                <div className="w-full mt-4 pt-3 border-t border-slate-800">
                  {/* Pump diagram */}
                  <div className={`w-full h-24 rounded-xl p-2 mb-3 transition-all duration-300 border ${
                    isPumpOn ? 'bg-blue-950 border-blue-500/30' : 'bg-slate-800 border-slate-700'
                  }`}>
                    <PumpSVG pumpOn={isPumpOn} />
                  </div>

                  {/* Toggle button */}
                  <button
                    onClick={() => onPumpChange(tank.id, !isPumpOn)}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      isPumpOn
                        ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:text-red-300'
                        : 'bg-blue-600 text-white hover:bg-blue-500 border border-blue-500'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full border-2 ${
                      isPumpOn ? 'border-red-400 bg-red-400' : 'border-white bg-blue-300'
                    }`}
                      style={isPumpOn ? { animation: 'pulse 0.8s infinite' } : undefined}
                    />
                    {isPumpOn ? '⏹ Desligar Bomba' : '▶ Ligar Bomba'}
                  </button>

                  {/* Status */}
                  <div className={`mt-2 flex items-center justify-center gap-2 text-xs font-medium rounded-lg py-1.5 ${
                    isPumpOn ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isPumpOn ? 'bg-green-500' : 'bg-slate-600'}`}
                      style={isPumpOn ? { animation: 'pulse 1s infinite' } : undefined}
                    />
                    {isPumpOn ? 'Bomba em operação — circulando produto' : 'Bomba desligada'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── SUMMARY TABLE ── */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Resumo Geral dos Tanques</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800">
                <th className="pb-2 text-left">Tanque</th>
                <th className="pb-2 text-left">Produto</th>
                <th className="pb-2 text-center">Capacidade</th>
                <th className="pb-2 text-center">Volume Atual</th>
                <th className="pb-2 text-center">Disponível</th>
                <th className="pb-2 text-center">Nível</th>
                <th className="pb-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {TANKS.map(tank => {
                const pct = getPercentage(tank.id);
                const vol = parseFloat(volumes[tank.id]) || 0;
                const avail = tank.capacity - vol;
                const colors = getLevelColor(pct);
                const status = getStatusLabel(pct);
                return (
                  <tr key={tank.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono">{tank.id}</span>
                        {(tank.id === 'T4' || tank.id === 'T5') && (
                          <span className="text-[9px] bg-blue-500/15 border border-blue-500/25 text-blue-400 px-1.5 py-0.5 rounded-full font-semibold">BOMBA</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5">
                      {products[tank.id] ? (
                        <span className="text-xs font-semibold text-blue-400 bg-blue-500/15 border border-blue-500/25 px-2 py-0.5 rounded-full">
                          {products[tank.id]}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center text-slate-400 font-mono">{tank.capacity} M³</td>
                    <td className="py-2.5 text-center font-mono font-semibold" style={{ color: pct > 0 ? colors.fill : '#475569' }}>
                      {vol.toFixed(2)} M³
                    </td>
                    <td className="py-2.5 text-center text-slate-500 font-mono">{avail.toFixed(2)} M³</td>
                    <td className="py-2.5 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-1.5 w-20 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors.fill}, ${colors.wave})` }} />
                        </div>
                        <span className="text-xs text-slate-500 font-mono w-10 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-700">
              <tr>
                <td colSpan={2} className="pt-3 font-bold text-slate-400 text-xs">TOTAL</td>
                <td className="pt-3 text-center font-bold text-slate-400 text-xs font-mono">{totalCap} M³</td>
                <td className="pt-3 text-center font-bold text-xs font-mono text-blue-400">{totalVol.toFixed(2)} M³</td>
                <td className="pt-3 text-center font-bold text-slate-500 text-xs font-mono">{(totalCap - totalVol).toFixed(2)} M³</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Global pump banners ── */}
      <div className="space-y-3 mt-4">
        {pumpOn && (
          <div className="flex items-center gap-3 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-xl px-5 py-3">
            <span className="text-lg">⚙️</span>
            <span className="font-bold text-sm">Bomba T4 em operação</span>
            <span className="text-blue-400/60 text-xs ml-1">— Circulação de produto ativa</span>
            <div className="ml-auto flex gap-1.5">
              {[0, 0.2, 0.4].map((d, i) => (
                <div key={i} className="w-2 h-2 bg-blue-400 rounded-full"
                  style={{ animation: `bounce 0.8s ${d}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        {pumpOnT5 && (
          <div className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 text-green-400 rounded-xl px-5 py-3">
            <span className="text-lg">⚙️</span>
            <span className="font-bold text-sm">Bomba T5 em operação</span>
            <span className="text-green-400/60 text-xs ml-1">— Circulação/Agitação de produto ativa</span>
            <div className="ml-auto flex gap-1.5">
              {[0, 0.2, 0.4].map((d, i) => (
                <div key={i} className="w-2 h-2 bg-green-400 rounded-full"
                  style={{ animation: `bounce 0.8s ${d}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product modal */}
      {editingProduct && (
        <ProductModal
          tankId={editingProduct}
          current={products[editingProduct]}
          onSave={name => {
            onProductsChange({ ...products, [editingProduct]: name });
            setEditingProduct(null);
          }}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
};
