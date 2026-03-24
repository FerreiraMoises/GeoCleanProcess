import React, { useState } from 'react';

interface Tank {
  id: string;
  label: string;
  capacity: number; // M3
}

const TANKS: Tank[] = [
  { id: 'T1', label: 'T1', capacity: 15 },
  { id: 'T2', label: 'T2', capacity: 15 },
  { id: 'T3', label: 'T3', capacity: 15 },
  { id: 'T4', label: 'T4', capacity: 10 },
  { id: 'T5', label: 'T5', capacity: 10 },
];

type VolumeMap = Record<string, string>;

function getLevelColor(pct: number): { fill: string; wave: string; glow: string } {
  if (pct < 25) return { fill: '#ef4444', wave: '#dc2626', glow: 'rgba(239,68,68,0.4)' };
  if (pct < 60) return { fill: '#3b82f6', wave: '#2563eb', glow: 'rgba(59,130,246,0.4)' };
  return { fill: '#22c55e', wave: '#16a34a', glow: 'rgba(34,197,94,0.4)' };
}

/* ── Animated Wave Tank SVG ── */
interface TankSVGProps {
  pct: number;
  isT4?: boolean;
  pumpOn?: boolean;
}

const TankSVG: React.FC<TankSVGProps> = ({ pct, isT4 = false, pumpOn = false }) => {
  const clampedPct = Math.min(100, Math.max(0, pct));
  const colors = getLevelColor(clampedPct);

  // The tank body height in SVG units (fill area)
  const tankH = 180;
  const tankW = 100;
  const fillH = (clampedPct / 100) * tankH;
  const fillY = tankH - fillH; // top of the fill (from top of tank body)

  // Unique IDs so multiple tanks don't conflict
  const uid = isT4 ? 'T4' : Math.random().toString(36).slice(2);

  return (
    <svg viewBox="0 0 130 240" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        {/* Metallic gradient for tank body */}
        <linearGradient id={`metal-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="30%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        {/* Liquid gradient */}
        <linearGradient id={`liquid-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.wave} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colors.fill} stopOpacity="1" />
        </linearGradient>

        {/* Clip to tank body */}
        <clipPath id={`clip-${uid}`}>
          <rect x="15" y="30" width={tankW} height={tankH} rx="4" />
        </clipPath>

        {/* Glow filter */}
        <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Tank top cap */}
      <ellipse cx="65" cy="30" rx="50" ry="10" fill={`url(#metal-${uid})`} stroke="#64748b" strokeWidth="1" />

      {/* Tank body outline */}
      <rect x="15" y="30" width={tankW} height={tankH} rx="4" fill={`url(#metal-${uid})`} stroke="#64748b" strokeWidth="1.5" />

      {/* Liquid fill */}
      <g clipPath={`url(#clip-${uid})`}>
        {clampedPct > 0 && (
          <>
            <rect
              x="15"
              y={30 + fillY}
              width={tankW}
              height={fillH}
              fill={`url(#liquid-${uid})`}
              opacity="0.92"
            />
            {/* Animated wave at surface */}
            <path
              fill={colors.wave}
              opacity="0.7"
              style={{ transformOrigin: '65px 0' }}
            >
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
            {/* Inner shine */}
            <rect x="22" y={30 + fillY + 4} width="12" height={Math.max(0, fillH - 8)} rx="6" fill="white" opacity="0.15" />
          </>
        )}
      </g>

      {/* Tank bottom cap */}
      <ellipse cx="65" cy={tankH + 30} rx="50" ry="10" fill={`url(#metal-${uid})`} stroke="#64748b" strokeWidth="1" />

      {/* Horizontal stripes (structural rings) */}
      {[0.33, 0.66].map((f, i) => (
        <line key={i} x1="15" y1={30 + tankH * f} x2="115" y2={30 + tankH * f}
          stroke="#94a3b8" strokeWidth="1.5" opacity="0.5" />
      ))}

      {/* Bottom pipe */}
      <rect x="58" y={tankH + 38} width="14" height="14" fill="#64748b" />
      <rect x="45" y={tankH + 50} width="40" height="8" rx="4" fill="#64748b" />

      {/* T4 Pump assembly */}
      {isT4 && (
        <>
          {/* Horizontal pipe from tank to pump */}
          <rect x="15" y={tankH + 52} width="30" height="6" rx="3" fill="#475569" />

          {/* Pump body */}
          <circle cx="8" cy={tankH + 55} r="12" fill="#1e40af" stroke="#3b82f6" strokeWidth="2" />
          <circle cx="8" cy={tankH + 55} r="7" fill="#2563eb" />

          {/* Pump spinning blades */}
          <g style={{ transformOrigin: '8px ' + (tankH + 55) + 'px' }}>
            {pumpOn && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 8 218"
                to="360 8 218"
                dur="0.6s"
                repeatCount="indefinite"
              />
            )}
            <line x1="8" y1={tankH + 48} x2="8" y2={tankH + 62} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="1" y1={tankH + 55} x2="15" y2={tankH + 55} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Return pipe (going back up) */}
          <rect x="0" y={tankH + 20} width="6" height="32" rx="3" fill={pumpOn ? '#3b82f6' : '#475569'} />
          <rect x="0" y={tankH + 20} width="15" height="6" rx="3" fill={pumpOn ? '#3b82f6' : '#475569'} />

          {/* Flow particles when pump is on */}
          {pumpOn && (
            <>
              <circle cx="0" cy={tankH + 30} r="3" fill="#93c5fd" opacity="0.9">
                <animate attributeName="cy" from={tankH + 55} to={tankH + 20} dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="1" to="0" dur="1s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy={tankH + 30} r="3" fill="#93c5fd" opacity="0.9">
                <animate attributeName="cy" from={tankH + 55} to={tankH + 20} dur="1s" begin="0.33s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="1" to="0" dur="1s" begin="0.33s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy={tankH + 30} r="3" fill="#93c5fd" opacity="0.9">
                <animate attributeName="cy" from={tankH + 55} to={tankH + 20} dur="1s" begin="0.66s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="1" to="0" dur="1s" begin="0.66s" repeatCount="indefinite" />
              </circle>
            </>
          )}

          {/* Pump label */}
          <text x="8" y={tankH + 80} textAnchor="middle" fontSize="7" fill="#94a3b8">BOMBA</text>

          {/* Status indicator */}
          <circle cx="8" cy={tankH + 86} r="3" fill={pumpOn ? '#22c55e' : '#ef4444'}>
            {pumpOn && (
              <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
            )}
          </circle>
        </>
      )}
    </svg>
  );
};

/* ── Main Component ── */
export const StorageTanks: React.FC = () => {
  const [volumes, setVolumes] = useState<VolumeMap>({
    T1: '', T2: '', T3: '', T4: '', T5: '',
  });
  const [pumpOn, setPumpOn] = useState(false);

  const handleVolumeChange = (id: string, value: string) => {
    // Only allow positive numbers up to tank capacity
    const tank = TANKS.find(t => t.id === id)!;
    const num = parseFloat(value);
    if (value === '' || value === '.' || value === '0') {
      setVolumes(prev => ({ ...prev, [id]: value }));
      return;
    }
    if (!isNaN(num) && num >= 0 && num <= tank.capacity) {
      setVolumes(prev => ({ ...prev, [id]: value }));
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

          return (
            <div
              key={tank.id}
              className={`bg-white rounded-2xl border shadow-sm flex flex-col items-center p-4 transition-all duration-300 ${
                isT4 ? 'border-blue-200 shadow-blue-100' : 'border-slate-200'
              }`}
              style={pct > 0 ? { boxShadow: `0 4px 24px 0 ${colors.glow}` } : undefined}
            >
              {/* Tank header */}
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-lg">{tank.label}</span>
                  {isT4 && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                      + BOMBA
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-medium">Cap.: {tank.capacity} M³</span>
              </div>

              {/* SVG Tank */}
              <div className={`w-full ${isT4 ? 'h-72' : 'h-60'} flex items-center justify-center`}>
                <TankSVG pct={pct} isT4={isT4} pumpOn={pumpOn && isT4} />
              </div>

              {/* Level indicators */}
              <div className="w-full mt-2 space-y-1">
                {/* Percentage bar */}
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-bold ${status.color}`}>{status.label}</span>
                  <span className="font-bold text-slate-600">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${colors.fill}, ${colors.wave})`,
                    }}
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
                {/* Volume display */}
                <div className="flex items-center justify-between mt-1 px-1">
                  <span className="text-[10px] text-slate-400">0 M³</span>
                  <span className="text-[11px] font-bold" style={{ color: colors.fill }}>
                    {volumes[tank.id] ? `${parseFloat(volumes[tank.id] || '0').toFixed(2)} M³` : '— M³'}
                  </span>
                  <span className="text-[10px] text-slate-400">{tank.capacity} M³</span>
                </div>
              </div>

              {/* Pump button for T4 */}
              {isT4 && (
                <div className="w-full mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setPumpOn(p => !p)}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      pumpOn
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full border-2 border-white ${
                        pumpOn ? 'bg-white' : 'bg-blue-300'
                      }`}
                      style={pumpOn ? { animation: 'pulse 0.8s infinite' } : undefined}
                    />
                    {pumpOn ? '⏹ Desligar Bomba' : '▶ Ligar Bomba'}
                  </button>

                  {/* Pump status */}
                  <div className={`mt-2 flex items-center justify-center gap-2 text-xs font-medium rounded-lg py-1.5 ${
                    pumpOn ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <span
                      className={`w-2 h-2 rounded-full ${pumpOn ? 'bg-green-500' : 'bg-slate-300'}`}
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

      {/* Summary panel */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Resumo Geral dos Tanques</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-2 text-left">Tanque</th>
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
                    <td className="py-2.5 font-bold text-slate-700 flex items-center gap-2">
                      {tank.id}
                      {tank.id === 'T4' && (
                        <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">BOMBA</span>
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
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors.fill}, ${colors.wave})` }}
                          />
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
                <td className="pt-3 font-bold text-slate-600 text-xs">TOTAL</td>
                <td className="pt-3 text-center font-bold text-slate-600 text-xs">
                  {TANKS.reduce((s, t) => s + t.capacity, 0)} M³
                </td>
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

      {/* Global pump status banner */}
      {pumpOn && (
        <div className="mt-4 flex items-center gap-3 bg-blue-600 text-white rounded-xl px-5 py-3 shadow-lg shadow-blue-200 animate-pulse-subtle">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <span className="font-bold text-sm">Bomba T4 em operação</span>
          </div>
          <span className="text-blue-200 text-xs ml-2">Circulação de produto ativa</span>
          <div className="ml-auto flex gap-1">
            {[0, 0.2, 0.4].map((d, i) => (
              <div key={i} className="w-2 h-2 bg-white rounded-full" style={{
                animation: `bounce 0.8s ${d}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
