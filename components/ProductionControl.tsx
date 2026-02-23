import React, { useState } from 'react';
import { ProductionLog, ProductType } from '../types';
import { PRODUCTS } from '../constants';
import { PlusCircle, Save } from 'lucide-react';

interface ProductionControlProps {
  logs: ProductionLog[];
  onAddLog: (log: ProductionLog) => void;
}

export const ProductionControl: React.FC<ProductionControlProps> = ({ logs, onAddLog }) => {
  const [formData, setFormData] = useState<Partial<ProductionLog>>({
    product: PRODUCTS[0],
    shift: 'Matutino',
    quantityM3: 0,
    notes: ''
  });

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
      // Reset non-fixed fields
      setFormData(prev => ({ ...prev, quantityM3: 0, notes: '' }));
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Controle de Processo</h2>
        <p className="text-slate-500">Registro diário de produção por produto</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 sticky top-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-green-600" />
              Novo Registro
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Produto</label>
                <select
                  className="w-full border-slate-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                  value={formData.product}
                  onChange={e => setFormData({ ...formData, product: e.target.value as ProductType })}
                >
                  {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade (M³)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border-slate-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                  value={formData.quantityM3 || ''}
                  onChange={e => setFormData({ ...formData, quantityM3: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Turno</label>
                <select
                  className="w-full border-slate-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border bg-slate-50"
                  value={formData.shift}
                  onChange={e => setFormData({ ...formData, shift: e.target.value as any })}
                >
                  <option value="Matutino">Matutino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                <textarea
                  className="w-full border-slate-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Registrar Produção
              </button>
            </form>
          </div>
        </div>

        {/* Logs Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Qtd (M³)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Turno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Obs</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {[...logs].reverse().map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{log.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{log.product}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{log.quantityM3}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {log.shift}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 truncate max-w-xs" title={log.notes}>
                        {log.notes || '-'}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        Nenhum registro encontrado. Comece adicionando um novo registro.
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