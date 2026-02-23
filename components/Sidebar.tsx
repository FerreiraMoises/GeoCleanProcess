import React from 'react';
import { Factory, ClipboardList, Cylinder, PieChart } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'production', label: 'Controle de Produção', icon: Factory },
    { id: 'roadmap', label: 'Roteiro de Equipe', icon: ClipboardList },
    { id: 'reactors', label: 'Status Reatores', icon: Cylinder },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800 z-10">
      {/* Header com Logo - Fundo branco para destacar a marca Geoclean */}
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
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
  );
};