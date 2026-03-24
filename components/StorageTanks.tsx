import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';

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

function getLevelColor(pct: number): { fill: string; wave: string; glow: string } {
  if (pct < 25) return { fill: '#ef4444', wave: '#dc2626', glow: 'rgba(239,68,68,0.35)' };
  if (pct < 60) return { fill: '#3b82f6', wave: '#2563eb', glow: 'rgba(59,130,246,0.35)' };
  return { fill: '#22c55e', wave: '#16a34a', glow: 'rgba(34,197,94,0.35)' };
}

/* ── Pump SVG (standalone, big and clear) ── */
interface PumpSVGProps {
  pumpOn: boolean;
}
const PumpSVG: React.FC<PumpSVGProps> = ({ pumpOn }) => (
  <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <radialGradient id="pump-body-grad" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor={pumpOn ? '#60a5fa' : '#94a3b8'} />
        <stop offset="100%" stopColor={pumpOn ? '#1d4ed8' : '#334155'} />
      </radialGradient>
      <filter id="pump-glow">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* ── Motor body (rectangle) ── */}
    <rect x="62" y="30" width="50" height="30" rx="5" fill={pumpOn ? '#1e40af' : '#475569'} stroke={pumpOn ? '#3b82f6' : '#64748b'} strokeWidth="1.5" />
    {/* motor stripes */}
    <rect x="70" y="30" width="6" height="30" fill="rgba(255,255,255,0.06)" />
    <rect x="82" y="30" width="6" height="30" fill="rgba(255,255,255,0.06)" />
    <rect x="94" y="30" width="6" height="30" fill="rgba(255,255,255,0.06)" />
    {/* motor label */}
    <text x="87" y="48" textAnchor="middle" fontSize="7" fontWeight="bold" fill={pumpOn ? '#bfdbfe' : '#94a3b8'}>MOTOR</text>

    {/* ── Pump volute (circle) ── */}
    <circle cx="42" cy="50" r="28" fill="url(#pump-body-grad)"
      stroke={pumpOn ? '#3b82f6' : '#475569'} strokeWidth="2"
      filter={pumpOn ? 'url(#pump-glow)' : undefined}
    />
    {/* inner detail ring */}
    <circle cx="42" cy="50" r="20" fill="none" stroke={pumpOn ? '#93c5fd' : '#64748b'} strokeWidth="1" opacity="0.5" />

    {/* ── Impeller blades (spin when on) ── */}
    <g>
      {pumpOn && (
        <animateTransform attributeName="transform" type="rotate"
          from="0 42 50" to="360 42 50" dur="0.5s" repeatCount="indefinite" />
      )}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 42 + 6 * Math.cos(rad);
        const y1 = 50 + 6 * Math.sin(rad);
        const x2 = 42 + 17 * Math.cos(rad);
        const y2 = 50 + 17 * Math.sin(rad);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
        );
      })}
      {/* hub */}
      <circle cx="42" cy="50" r="5.5" fill={pumpOn ? '#93c5fd' : '#94a3b8'} />
    </g>

    {/* ── Shaft connecting motor to pump ── */}
    <rect x="60" y="44" width="4" height="12" fill={pumpOn ? '#60a5fa' : '#64748b'} />

    {/* ── Inlet pipe (left) ── */}
    <rect x="0" y="44" width="16" height="12" rx="3" fill={pumpOn ? '#2563eb' : '#475569'} />
    <ellipse cx="16" cy="50" rx="2" ry="6" fill={pumpOn ? '#1d4ed8' : '#334155'} />
    {/* inlet arrow */}
    <polygon points="5,50 11,45 11,55" fill={pumpOn ? '#93c5fd' : '#94a3b8'} opacity="0.8" />

    {/* ── Discharge pipe (top) ── */}
    <rect x="36" y="0" width="12" height="24" rx="3" fill={pumpOn ? '#2563eb' : '#475569'} />
    <ellipse cx="42" cy="24" rx="6" ry="2" fill={pumpOn ? '#1d4ed8' : '#334155'} />
    {/* discharge arrow */}
    <polygon points="42,4 37,12 47,12" fill={pumpOn ? '#93c5fd' : '#94a3b8'} opacity="0.8" />

    {/* ── Flow particles (only when on) ── */}
    {pumpOn && (
      <>
        {/* inlet flow */}
        <circle cx="8" cy="50" r="3" fill="#bfdbfe" opacity="0.9">
          <animate attributeName="cx" from="0" to="16" dur="0.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="0.5s" repeatCount="indefinite" />
        </circle>
        {/* discharge flow */}
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

    {/* ── Status indicator dot ── */}
    <circle cx="107" cy="24" r="5" fill={pumpOn ? '#22c55e' : '#ef4444'} stroke="white" strokeWidth="1">
      {pumpOn && <animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite" />}
    </circle>
  </svg>
);

/* ── Animated Wave Tank SVG ── */
interface TankSVGProps {
  pct: number;
  tankId: string;
}

const TankSVG: React.FC<TankSVGProps> = ({ pct, tankId }) => {
  const clampedPct = Math.min(100, Math.max(0, pct));
  const colors = getLevelColor(clampedPct);
  const tankH = 180;
  const tankW = 100;
  const fillH = (clampedPct / 100) * tankH;
  const fillY = tankH - fillH;
  const uid = tankId;

  return (
    <svg viewBox="0 0 130 230" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={`metal-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="30%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id={`liquid-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.wave} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colors.fill} stopOpacity="1" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <rect x="15" y="30" width={tankW} height={tankH} rx="4" />
        </clipPath>
      </defs>

      {/* Top cap */}
      <ellipse cx="65" cy="30" rx="50" ry="10" fill={`url(#metal-${uid})`} stroke="#64748b" strokeWidth="1" />
      {/* Body */}
      <rect x="15" y="30" width={tankW} height={tankH} rx="4" fill={`url(#metal-${uid})`} stroke="#64748b" strokeWidth="1.5" />

      {/* Liquid */}
      <g clipPath={`url(#clip-${uid})`}>
        {clampedPct > 0 && (
          <>
            <rect x="15" y={30 + fillY} width={tankW} height={fillH} fill={`url(#liquid-${uid})`} opacity="0.92" />
            <path fill={colors.wave} opacity="0.7">
              <animate
                attributeName="d"
                dur="2.5s"
                repeatCount="indefinite"
                values={`
                  M15,${30 + fillY} Q32,${30 + fillY - 6} 50,${30 + fillY} Q82,${30 + fillY + 6} 115,${30 + fillY} L115,${tankH + 30} L15,${tankH + 30} Z;
                  M15,${30 + fillY} Q32,${30 + fillY + 6} 50,${30 + fillY} Q82,${30 + fillY - 6} 115,${30 + fillY} L115,${tankH + 30} L15,${tankH + 30} Z;
                  M15,${30 + fillY} Q32,${30 + fillY - 6} 50,${30 + fillY} Q82,${30 + fillY + 6} 115,${30 + fillY} L115,${tankH + 30} L15,${tankH + 30} Z
                `}
              />
            </path>
            <rect x="22" y={30 + fillY + 4} width="12" height={Math.max(0, fillH - 8)} rx="6" fill="white" opacity="0.15" />
          </>
        )}
      </g>

      {/* Bottom cap */}
      <ellipse cx="65" cy={tankH + 30} rx="50" ry="10" fill={`url(#metal-${uid})`} stroke="#64748b" strokeWidth="1" />

      {/* Structural rings */}
      {[0.33, 0.66].map((f, i) => (
        <line key={i} x1="15" y1={30 + tankH * f} x2="115" y2={30 + tankH * f}
          stroke="#94a3b8" strokeWidth="1.5" opacity="0.4" />
      ))}

      {/* Bottom exit pipe */}
      <rect x="58" y={tankH + 37} width="14" height="12" fill="#64748b" />
      <rect x="45" y={tankH + 47} width="40" height="7" rx="3" fill="#64748b" />
    </svg>
  );
};

/* ── Produto Modal ── */
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
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <Tag className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Produto — {tankId}</h2>
              <p className="text-xs text-slate-500">Informe o nome do produto armazenado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Nome do Produto
            </label>
            <input
              type="text"
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { onSave(value.trim()); } }}
              placeholder="Ex: Ácido Fosfórico, Inoculante AZ..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { if (value.trim()) onSave(value.trim()); }}
              disabled={!value.trim()}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
}

export const INITIAL_TANKS_STATE: StorageTanksState = {
  volumes: { T1: '', T2: '', T3: '', T4: '', T5: '' },
  products: { T1: '', T2: '', T3: '', T4: '', T5: '' },
  pumpOn: false,
};

interface StorageTanksProps extends StorageTanksState {
  onVolumesChange: (v: VolumeMap) => void;
  onProductsChange: (p: ProductMap) => void;
  onPumpChange: (on: boolean) => void;
}

export const StorageTanks: React.FC<StorageTanksProps> = ({
  volumes, products, pumpOn,
  onVolumesChange, onProductsChange, onPumpChange,
}) => {
  const [editingProduct, setEditingProduct] = React.useState<string | null>(null);

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
    if (pct === 0) return { label: 'Vazio', color: 'text-slate-400' };
    if (pct < 25) return { label: 'Baixo', color: 'text-red-500' };
    if (pct < 60) return { label: 'Normal', color: 'text-blue-500' };
    if (pct < 90) return { label: 'Alto', color: 'text-green-500' };
    return { label: 'Cheio', color: 'text-green-700' };
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white text-lg">🛢</span>
          Tanques de Armazenagem
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Monitore o nível de produto em cada tanque. Digite o volume atual para visualizar o nível.
        </p>
      </div>

      {/* Tanks Grid */}
      <div className="grid grid-cols-2 gap-6 xl:grid-cols-5">
        {TANKS.map(tank => {
          const pct = getPercentage(tank.id);
          const colors = getLevelColor(pct);
          const status = getStatusLabel(pct);
          const isT4 = tank.id === 'T4';
          const product = products[tank.id];

          return (
            <div
              key={tank.id}
              className={`bg-white rounded-2xl border shadow-sm flex flex-col items-center p-4 transition-all duration-300 ${
                isT4 ? 'border-blue-200' : 'border-slate-200'
              }`}
              style={pct > 0 ? { boxShadow: `0 4px 24px 0 ${colors.glow}` } : undefined}
            >
              {/* Tank header */}
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-lg">{tank.label}</span>
                  {isT4 && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">+ BOMBA</span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-medium">Cap.: {tank.capacity} M³</span>
              </div>

              {/* ── Produto button / badge ── */}
              <div className="w-full mb-3">
                <button
                  onClick={() => setEditingProduct(tank.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                    product
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                      : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{product || 'Produto — clique para adicionar'}</span>
                </button>
              </div>

              {/* SVG Tank */}
              <div className="w-full h-52 flex items-center justify-center">
                <TankSVG pct={pct} tankId={tank.id} />
              </div>

              {/* Level indicators */}
              <div className="w-full mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-bold ${status.color}`}>{status.label}</span>
                  <span className="font-bold text-slate-600">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors.fill}, ${colors.wave})` }}
                  />
                </div>
              </div>

              {/* Volume input */}
              <div className="w-full mt-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Volume atual (M³)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max={tank.capacity}
                    step="0.1"
                    value={volumes[tank.id]}
                    onChange={e => handleVolumeChange(tank.id, e.target.value)}
                    placeholder="0.0"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-right font-mono"
                  />
                  <span className="text-xs text-slate-400 font-medium">M³</span>
                </div>
                <div className="flex items-center justify-between mt-1 px-1">
                  <span className="text-[10px] text-slate-400">0 M³</span>
                  <span className="text-[11px] font-bold" style={{ color: pct > 0 ? colors.fill : '#94a3b8' }}>
                    {volumes[tank.id] ? `${parseFloat(volumes[tank.id] || '0').toFixed(2)} M³` : '— M³'}
                  </span>
                  <span className="text-[10px] text-slate-400">{tank.capacity} M³</span>
                </div>
              </div>

              {/* ── T4 Pump section ── */}
              {isT4 && (
                <div className="w-full mt-4 pt-3 border-t border-slate-100">
                  {/* Pump diagram */}
                  <div className={`w-full h-24 rounded-xl p-2 mb-3 transition-all duration-300 ${
                    pumpOn ? 'bg-blue-950' : 'bg-slate-800'
                  }`}>
                    <PumpSVG pumpOn={pumpOn} />
                  </div>

                  {/* Ligar Bomba button */}
                  <button
                    onClick={() => onPumpChange(!pumpOn)}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      pumpOn
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full border-2 border-white ${pumpOn ? 'bg-white' : 'bg-blue-300'}`}
                      style={pumpOn ? { animation: 'pulse 0.8s infinite' } : undefined}
                    />
                    {pumpOn ? '⏹ Desligar Bomba' : '▶ Ligar Bomba'}
                  </button>

                  {/* Status */}
                  <div className={`mt-2 flex items-center justify-center gap-2 text-xs font-medium rounded-lg py-1.5 ${
                    pumpOn ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${pumpOn ? 'bg-green-500' : 'bg-slate-300'}`}
                      style={pumpOn ? { animation: 'pulse 1s infinite' } : undefined}
                    />
                    {pumpOn ? 'Bomba em operação — circulando produto' : 'Bomba desligada'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary table */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Resumo Geral dos Tanques</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-2 text-left">Tanque</th>
                <th className="pb-2 text-left">Produto</th>
                <th className="pb-2 text-center">Capacidade</th>
                <th className="pb-2 text-center">Volume Atual</th>
                <th className="pb-2 text-center">Disponível</th>
                <th className="pb-2 text-center">Nível</th>
                <th className="pb-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {TANKS.map(tank => {
                const pct = getPercentage(tank.id);
                const vol = parseFloat(volumes[tank.id]) || 0;
                const avail = tank.capacity - vol;
                const colors = getLevelColor(pct);
                const status = getStatusLabel(pct);
                return (
                  <tr key={tank.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-bold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        {tank.id}
                        {tank.id === 'T4' && (
                          <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">BOMBA</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5">
                      {products[tank.id] ? (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          {products[tank.id]}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center text-slate-600">{tank.capacity} M³</td>
                    <td className="py-2.5 text-center font-mono font-semibold" style={{ color: pct > 0 ? colors.fill : '#94a3b8' }}>
                      {vol.toFixed(2)} M³
                    </td>
                    <td className="py-2.5 text-center text-slate-500 font-mono">{avail.toFixed(2)} M³</td>
                    <td className="py-2.5 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors.fill}, ${colors.wave})` }} />
                        </div>
                        <span className="text-xs text-slate-400 font-mono w-10 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-200">
              <tr>
                <td colSpan={2} className="pt-3 font-bold text-slate-600 text-xs">TOTAL</td>
                <td className="pt-3 text-center font-bold text-slate-600 text-xs">{TANKS.reduce((s, t) => s + t.capacity, 0)} M³</td>
                <td className="pt-3 text-center font-bold text-xs" style={{ color: '#3b82f6' }}>
                  {TANKS.reduce((s, t) => s + (parseFloat(volumes[t.id]) || 0), 0).toFixed(2)} M³
                </td>
                <td className="pt-3 text-center font-bold text-slate-500 text-xs">
                  {TANKS.reduce((s, t) => s + (t.capacity - (parseFloat(volumes[t.id]) || 0)), 0).toFixed(2)} M³
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Global pump banner */}
      {pumpOn && (
        <div className="mt-4 flex items-center gap-3 bg-blue-600 text-white rounded-xl px-5 py-3 shadow-lg shadow-blue-200">
          <span className="text-lg">⚙️</span>
          <span className="font-bold text-sm">Bomba T4 em operação</span>
          <span className="text-blue-200 text-xs ml-1">— Circulação de produto ativa</span>
          <div className="ml-auto flex gap-1.5">
            {[0, 0.2, 0.4].map((d, i) => (
              <div key={i} className="w-2 h-2 bg-white rounded-full"
                style={{ animation: `bounce 0.8s ${d}s infinite` }} />
            ))}
          </div>
        </div>
      )}

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
