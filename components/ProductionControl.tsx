import React, { useState } from 'react';
import { ProductionLog, ProductType } from '../types';
import { PRODUCTS } from '../constants';
import { PlusCircle, Save, Trash2, Factory, AlertTriangle } from 'lucide-react';

interface ProductionControlProps {
  logs: ProductionLog[];
  onAddLog: (log: ProductionLog) => void;
  onDeleteLog?: (logId: string) => void;
}

export const ProductionControl: React.FC<ProductionControlProps> = ({ logs, onAddLog, onDeleteLog }) => {
  const [formData, setFormData] = useState<Partial<ProductionLog>>({
    product: PRODUCTS[0],
    shift: 'Matutino',
    quantityM3: 0,
    notes: ''
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.product && formData.quantityM3 && formData.shift) {
      onAddLog({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        product: formData.product,
        quantityM3: Number(formData.quantityM3),
        shift: formData.shift as any,
        notes: formData.notes || ''
      });
      setFormData(prev => ({ ...prev, quantityM3: 0, notes: '' }));
    }
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDeleteLog?.(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      // auto-cancel confirmation after 4s
      setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 4000);
    }
  };

  const totalProduction = logs.reduce((acc, l) => acc + l.quantityM3, 0);

  return (
    <div className="p-6 min-h-screen bg-slate-950">

      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Factory size={16} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Controle de Processo</h2>
          </div>
          <p className="text-slate-500 text-sm pl-11">Registro diário de produção por produto</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-green-500/20 rounded-xl px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 text-xs font-bold tracking-widest">AO VIVO</span>
        </div>
      </div>

      {/* ── KPI STRIP ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Registros</p>
          <p className="text-2xl font-black text-white font-mono mt-1">{logs.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volume Acumulado</p>
          <p className="text-2xl font-black text-green-400 font-mono mt-1">{totalProduction.toLocaleString('pt-BR')} <span className="text-sm text-slate-500">m³</span></p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Turno Atual</p>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">Matutino</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── FORMULÁRIO ─────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sticky top-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-5">
              <PlusCircle size={14} className="text-green-400" />
              Novo Registro
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Produto</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition"
                  value={formData.product}
                  onChange={e => setFormData({ ...formData, product: e.target.value as ProductType })}
                >
                  {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Quantidade (M³)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition"
                  value={formData.quantityM3 || ''}
                  onChange={e => setFormData({ ...formData, quantityM3: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Turno</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 text-slate-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition"
                  value={formData.shift}
                  onChange={e => setFormData({ ...formData, shift: e.target.value as any })}
                >
                  <option value="Matutino">Matutino</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Observações</label>
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition resize-none"
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações opcionais..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-green-900/30"
              >
                <Save size={14} />
                Registrar Produção
              </button>
            </form>
          </div>
        </div>

        {/* ── TABELA DE LOGS ──────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Registros de Produção</h3>
              <span className="text-[10px] font-bold text-slate-500 font-mono">{logs.length} entradas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Produto</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Qtd (M³)</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Turno</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Obs</th>
                    {onDeleteLog && (
                      <th className="px-5 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ação</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...logs].reverse().map((log) => (
                    <tr
                      key={log.id}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors ${confirmDeleteId === log.id ? 'bg-red-950/30' : ''}`}
                    >
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">{log.date}</td>
                      <td className="px-5 py-3 text-white font-medium text-sm">{log.product}</td>
                      <td className="px-5 py-3 text-right text-green-400 font-bold font-mono">{log.quantityM3.toLocaleString('pt-BR')}</td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {log.shift}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell truncate max-w-[160px]" title={log.notes}>
                        {log.notes || '—'}
                      </td>
                      {onDeleteLog && (
                        <td className="px-5 py-3 text-center">
                          {confirmDeleteId === log.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                                <AlertTriangle size={10} /> Confirmar?
                              </span>
                              <button
                                onClick={() => handleDelete(log.id)}
                                className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDelete(log.id)}
                              title="Deletar Produção"
                              className="flex items-center gap-1.5 mx-auto bg-red-900/30 hover:bg-red-600 border border-red-700/40 hover:border-red-500 text-red-400 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200"
                            >
                              <Trash2 size={11} />
                              Deletar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-600 text-sm">
                        Nenhum registro encontrado. Adicione um novo registro ao lado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};