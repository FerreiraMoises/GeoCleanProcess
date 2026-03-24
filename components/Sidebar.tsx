import React, { useState } from 'react';
import { Factory, ClipboardList, Cylinder, PieChart, AlertTriangle, X, Wrench, PackageX, Clock, Droplets, CheckCircle2 } from 'lucide-react';
import { Observacao, ObservacaoTipo } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  observacoes: Observacao[];
  onAddObservacao: (obs: Observacao) => void;
  onDeleteObservacao: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, observacoes, onAddObservacao, onDeleteObservacao }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [tipo, setTipo] = useState<ObservacaoTipo>('quebra_equipamento');
  const [descricao, setDescricao] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'production', label: 'Controle de Produção', icon: Factory },
    { id: 'roadmap', label: 'Roteiro de Equipe', icon: ClipboardList },
    { id: 'reactors', label: 'Status Reatores', icon: Cylinder },
    { id: 'tanks', label: 'Tanque de Armazenagem', icon: Droplets },
  ];

  const handleSubmit = () => {
    if (!descricao.trim()) return;
    const nova: Observacao = {
      id: Date.now().toString(),
      tipo,
      descricao: descricao.trim(),
      timestamp: new Date().toLocaleString('pt-BR'),
    };
    onAddObservacao(nova);
    setDescricao('');
    setSucesso(true);
    setTimeout(() => setSucesso(false), 2500);
  };

  const handleClose = () => {
    setModalOpen(false);
    setDescricao('');
    setSucesso(false);
  };

  return (
    <>
      <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800 z-10">
        {/* Header com Logo */}
        <div className="h-24 flex items-center px-6 border-b border-slate-800 bg-white overflow-hidden">
          <div className="elementor-widget-image w-full flex justify-center">
            <img
              decoding="async"
              src="https://geoclean.ind.br/wp-content/uploads/elementor/thumbs/cropped-logo_geoclean_2024-qsp8wbij0soy46lf0m7guta4jg02w7k0s5nahuw4cg.png"
              title="cropped-logo_geoclean_2024.png"
              alt="cropped-logo_geoclean_2024.png"
              loading="lazy"
              className="max-h-16 object-contain"
              style={{ display: 'inline-block', verticalAlign: 'middle' }}
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/400x120/16a34a/white?text=GEOCLEAN";
              }}
            />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${isActive
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Botão Observação */}
          <div className="pt-3 mt-3 border-t border-slate-700">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/20 hover:border-amber-400/40"
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Observação</span>
              {observacoes.length > 0 && (
                <span className="ml-auto bg-amber-500 text-slate-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {observacoes.length > 9 ? '9+' : observacoes.length}
                </span>
              )}
            </button>
          </div>
        </nav>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">OP</div>
            <div className="text-xs">
              <p className="font-semibold text-white">Operador Ativo</p>
              <p className="text-slate-500">Turno Matutino</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Observação */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Registrar Observação</h2>
                  <p className="text-xs text-slate-500">Informe quebra de equipamento ou falta de matéria-prima</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tipo de Ocorrência */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tipo de Ocorrência
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTipo('quebra_equipamento')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-center ${tipo === 'quebra_equipamento'
                      ? 'border-red-400 bg-red-50 text-red-600'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    <Wrench className="w-6 h-6" />
                    <span className="text-xs font-semibold">Quebra de Equipamento</span>
                  </button>
                  <button
                    onClick={() => setTipo('falta_materia_prima')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-center ${tipo === 'falta_materia_prima'
                      ? 'border-orange-400 bg-orange-50 text-orange-600'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    <PackageX className="w-6 h-6" />
                    <span className="text-xs font-semibold">Falta de Matéria-Prima</span>
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    tipo === 'quebra_equipamento'
                      ? 'Ex: Agitador do Reator R3 parou de funcionar...'
                      : 'Ex: Falta de ácido fosfórico para produção...'
                  }
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
              </div>

              {/* Feedback de sucesso */}
              {sucesso && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-green-700 text-sm font-medium">
                  ✓ Observação registrada com sucesso!
                </div>
              )}

              {/* Botão de Envio */}
              <button
                onClick={handleSubmit}
                disabled={!descricao.trim()}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md"
              >
                Registrar Observação
              </button>
            </div>

            {/* Histórico de Observações */}
            {observacoes.length > 0 && (
              <div className="border-t border-slate-100 px-6 pb-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-3">
                  Observações desta sessão
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {observacoes.map((obs) => (
                    <div
                      key={obs.id}
                      className={`rounded-lg p-3 border text-xs ${obs.tipo === 'quebra_equipamento'
                        ? 'bg-red-50 border-red-100 text-red-700'
                        : 'bg-orange-50 border-orange-100 text-orange-700'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold uppercase tracking-wide text-[10px]">
                          {obs.tipo === 'quebra_equipamento' ? '🔧 Quebra de Equipamento' : '📦 Falta de Matéria-Prima'}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] opacity-60">
                          <Clock className="w-3 h-3" />
                          {obs.timestamp}
                        </span>
                      </div>
                      <p className="leading-snug opacity-90 mb-2">{obs.descricao}</p>
                      {/* Resolvido button */}
                      <button
                        onClick={() => onDeleteObservacao(obs.id)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-600 text-white text-[11px] font-bold hover:bg-green-700 transition-colors shadow-sm w-full justify-center mt-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolvido?
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};