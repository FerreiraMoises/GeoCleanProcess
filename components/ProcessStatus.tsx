import React from 'react';
import { Task, ProcessStatus, Employee } from '../types';
import { STATUS_OPTIONS } from '../constants';
import { Clock, CheckCircle2, AlertCircle, PlayCircle, PauseCircle } from 'lucide-react';

interface ProcessStatusProps {
  tasks: Task[];
  employees: Employee[];
}

export const ProcessStatusBoard: React.FC<ProcessStatusProps> = ({ tasks, employees }) => {
  
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Desconhecido';

  const getStatusIcon = (status: ProcessStatus) => {
    switch (status) {
        case 'Pendente': return <Clock size={16} />;
        case 'Em Andamento': return <PlayCircle size={16} />;
        case 'Controle de Qualidade': return <PauseCircle size={16} />;
        case 'Concluído': return <CheckCircle2 size={16} />;
        case 'Atrasado': return <AlertCircle size={16} />;
    }
  };

  const getStatusColor = (status: ProcessStatus) => {
    switch (status) {
        case 'Pendente': return 'bg-slate-100 border-slate-200 text-slate-600';
        case 'Em Andamento': return 'bg-blue-50 border-blue-200 text-blue-700';
        case 'Controle de Qualidade': return 'bg-purple-50 border-purple-200 text-purple-700';
        case 'Concluído': return 'bg-green-50 border-green-200 text-green-700';
        case 'Atrasado': return 'bg-red-50 border-red-200 text-red-700';
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen overflow-x-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Status do Processo</h2>
        <p className="text-slate-500">Acompanhamento visual do fluxo de trabalho</p>
      </header>

      <div className="flex gap-6 min-w-max pb-4">
        {STATUS_OPTIONS.map(status => {
          const statusTasks = tasks.filter(t => t.status === status);
          
          return (
            <div key={status} className="w-80 flex-shrink-0">
              <div className={`flex items-center gap-2 p-3 rounded-t-lg border-t border-l border-r font-bold ${getStatusColor(status)}`}>
                 {getStatusIcon(status)}
                 {status}
                 <span className="ml-auto bg-white/50 px-2 py-0.5 rounded text-xs">
                    {statusTasks.length}
                 </span>
              </div>
              <div className="bg-slate-200/50 p-4 rounded-b-lg min-h-[500px]">
                <div className="space-y-3">
                    {statusTasks.map(task => (
                        <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{task.product.split(' ')[0]}...</span>
                            </div>
                            <h4 className="font-semibold text-slate-800 mb-2 leading-tight">{task.title}</h4>
                            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
                            
                            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                        {getEmployeeName(task.assignedTo).charAt(0)}
                                    </div>
                                    <span className="text-xs text-slate-600 truncate max-w-[80px]">
                                        {getEmployeeName(task.assignedTo)}
                                    </span>
                                </div>
                                
                                {status === 'Atrasado' && (
                                    <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded">! Ação Necessária</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {statusTasks.length === 0 && (
                        <div className="text-center py-10 opacity-40 text-slate-500 text-sm">
                            Sem itens
                        </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
