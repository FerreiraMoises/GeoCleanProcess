import React, { useState } from 'react';
import { Employee, Task, ProductType, ProcessStatus } from '../types';
import { EMPLOYEES, PRODUCTS, STATUS_OPTIONS } from '../constants';
import { generateTaskDescription } from '../services/geminiService';
import { User, Calendar, Briefcase, Plus, Sparkles } from 'lucide-react';

interface RoadmapProps {
  employees: Employee[];
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, status: ProcessStatus) => void;
}

export const ManufacturingRoadmap: React.FC<RoadmapProps> = ({ employees, tasks, onAddTask, onUpdateStatus }) => {
  const [newTask, setNewTask] = useState<Partial<Task>>({
    assignedTo: EMPLOYEES[0].id,
    product: PRODUCTS[0],
    status: 'Pendente',
    deadline: new Date().toISOString().slice(0, 16)
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDescription = async () => {
    if (!newTask.product || !newTask.title) return;
    setIsGenerating(true);
    const desc = await generateTaskDescription(newTask.product, newTask.title);
    setNewTask(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.title && newTask.assignedTo && newTask.product) {
      onAddTask({
        id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description || '',
        assignedTo: newTask.assignedTo,
        product: newTask.product as ProductType,
        status: (newTask.status as ProcessStatus) || 'Pendente',
        deadline: newTask.deadline || ''
      });
      setNewTask(prev => ({ ...prev, title: '', description: '' }));
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Roteiro de Fabricação</h2>
        <p className="text-slate-500">Distribuição de tarefas por colaborador</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Assignment Form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Nova Atribuição
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Colaborador</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={newTask.assignedTo}
                onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Produto</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-md"
                value={newTask.product}
                onChange={e => setNewTask({ ...newTask, product: e.target.value as ProductType })}
              >
                {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Etapa / Título</label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded-md"
                placeholder="Ex: Mistura, Ensacamento..."
                value={newTask.title || ''}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Descrição</label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating || !newTask.title}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                >
                  <Sparkles size={12} />
                  {isGenerating ? 'Gerando...' : 'Gerar com IA'}
                </button>
              </div>
              <textarea
                className="w-full p-2 border border-slate-300 rounded-md"
                rows={3}
                value={newTask.description || ''}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prazo</label>
              <input
                type="datetime-local"
                className="w-full p-2 border border-slate-300 rounded-md"
                value={newTask.deadline}
                onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Atribuir Tarefa
            </button>
          </form>
        </div>

        {/* Employee Task Lists */}
        <div className="lg:col-span-8 space-y-6">
          {employees.map(employee => {
            const employeeTasks = tasks.filter(t => t.assignedTo === employee.id);
            return (
              <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-200 p-2 rounded-full">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{employee.name}</h4>
                      <p className="text-xs text-slate-500">{employee.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-white border border-slate-300 px-3 py-1 rounded-full text-slate-600">
                    {employeeTasks.length} tarefas
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {employeeTasks.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">Nenhuma tarefa atribuída.</p>
                  ) : (
                    employeeTasks.map(task => (
                      <div key={task.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold text-slate-800">{task.title}</h5>
                          <select
                            value={task.status}
                            onChange={(e) => onUpdateStatus(task.id, e.target.value as ProcessStatus)}
                            className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${task.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                              task.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
                                task.status === 'Atrasado' ? 'bg-red-100 text-red-800' :
                                  task.status === 'Colaborador de Férias' ? 'bg-purple-100 text-purple-800' :
                                    'bg-slate-100 text-slate-800'
                              }`}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Briefcase size={12} /> {task.product}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {new Date(task.deadline).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
