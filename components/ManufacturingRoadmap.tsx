import React, { useState } from 'react';
import { Employee, Task, ProductType, ProcessStatus } from '../types';
import { EMPLOYEES, PRODUCTS, STATUS_OPTIONS } from '../constants';
import { generateTaskDescription } from '../services/geminiService';
import { User, Calendar, Briefcase, Plus, Sparkles, ClipboardList, Trash2, AlertTriangle, X } from 'lucide-react';

interface RoadmapProps {
  employees: Employee[];
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, status: ProcessStatus) => void;
  onDeleteTask: (taskId: string) => void;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  'Pendente':               { bg: 'bg-slate-700/50',   text: 'text-slate-300',  border: 'border-slate-600' },
  'Em Andamento':           { bg: 'bg-blue-500/15',    text: 'text-blue-400',   border: 'border-blue-500/30' },
  'Controle de Qualidade':  { bg: 'bg-purple-500/15',  text: 'text-purple-400', border: 'border-purple-500/30' },
  'Concluído':              { bg: 'bg-green-500/15',   text: 'text-green-400',  border: 'border-green-500/30' },
  'Atrasado':               { bg: 'bg-red-500/15',     text: 'text-red-400',    border: 'border-red-500/30' },
  'Colaborador de Férias':  { bg: 'bg-amber-500/15',   text: 'text-amber-400',  border: 'border-amber-500/30' },
};

/* ── Modal de Confirmação de Delete ── */
interface DeleteModalProps {
  task: Task;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({ task, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
  >
    <div className="bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Deletar Produção</h2>
            <p className="text-xs text-slate-500">Esta ação não pode ser desfeita</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <p className="text-slate-300 text-sm leading-relaxed">
          Você está prestes a deletar permanentemente a produção:
        </p>

        {/* Task preview */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-1.5">
          <p className="font-bold text-white text-sm">{task.title}</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><Briefcase size={10} /> {task.product}</span>
          </div>
          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 font-semibold hover:bg-slate-800 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-900/40"
          >
            <Trash2 size={14} />
            Deletar Produção
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const ManufacturingRoadmap: React.FC<RoadmapProps> = ({ employees, tasks, onAddTask, onUpdateStatus, onDeleteTask }) => {
  const [newTask, setNewTask] = useState<Partial<Task>>({
    assignedTo: EMPLOYEES[0].id,
    product: PRODUCTS[0],
    status: 'Pendente',
    deadline: new Date().toISOString().slice(0, 16)
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const handleGenerateDescription = async () => {
    if (!newTask.product || !newTask.title) return;
    setIsGenerating(true);
    const desc = await generateTaskDescription(newTask.product, newTask.title);
    setNewTask(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

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

  const handleConfirmDelete = () => {
    if (deletingTask) {
      onDeleteTask(deletingTask.id);
      setDeletingTask(null);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-slate-950">

      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <ClipboardList size={16} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Roteiro de Produção</h2>
          </div>
          <p className="text-slate-500 text-sm pl-11">Distribuição de tarefas por colaborador</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Tarefas</p>
            <p className="text-lg font-black text-white font-mono">{tasks.length}</p>
          </div>
          <div className="bg-slate-900 border border-green-500/20 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Concluídas</p>
            <p className="text-lg font-black text-green-400 font-mono">{tasks.filter(t => t.status === 'Concluído').length}</p>
          </div>
          <div className="bg-slate-900 border border-blue-500/20 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Em Andamento</p>
            <p className="text-lg font-black text-blue-400 font-mono">{tasks.filter(t => t.status === 'Em Andamento').length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── FORMULÁRIO ─────────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sticky top-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-5">
              <Plus size={14} className="text-blue-400" />
              Nova Atribuição
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Colaborador</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                  value={newTask.assignedTo}
                  onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Produto</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                  value={newTask.product}
                  onChange={e => setNewTask({ ...newTask, product: e.target.value as ProductType })}
                >
                  {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Etapa / Título</label>
                <input
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition placeholder-slate-600"
                  placeholder="Ex: Mistura, Ensacamento..."
                  value={newTask.title || ''}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descrição</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating || !newTask.title}
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-40 transition-colors"
                  >
                    <Sparkles size={10} />
                    {isGenerating ? 'Gerando...' : 'Gerar com IA'}
                  </button>
                </div>
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition resize-none placeholder-slate-600"
                  rows={3}
                  value={newTask.description || ''}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Descrição da tarefa..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Prazo</label>
                <input
                  type="datetime-local"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                  value={newTask.deadline}
                  onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/30"
              >
                Atribuir Tarefa
              </button>
            </form>
          </div>
        </div>

        {/* ── LISTAS POR COLABORADOR ─────────────────────────── */}
        <div className="lg:col-span-8 space-y-4">
          {employees.map(employee => {
            const employeeTasks = tasks.filter(t => t.assignedTo === employee.id);
            const done = employeeTasks.filter(t => t.status === 'Concluído').length;
            const pct = employeeTasks.length > 0 ? Math.round((done / employeeTasks.length) * 100) : 0;

            return (
              <div key={employee.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
                {/* Employee header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{employee.name}</h4>
                      <p className="text-[10px] text-slate-500">{employee.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progresso</p>
                      <p className="text-sm font-black font-mono text-white">{done}/{employeeTasks.length}</p>
                    </div>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full">
                      {employeeTasks.length} tarefa{employeeTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-4 space-y-2.5">
                  {employeeTasks.length === 0 ? (
                    <p className="text-sm text-slate-600 text-center py-4">Nenhuma tarefa atribuída.</p>
                  ) : (
                    employeeTasks.map(task => {
                      const s = STATUS_STYLE[task.status] ?? STATUS_STYLE['Pendente'];
                      return (
                        <div
                          key={task.id}
                          className={`border rounded-xl p-4 transition-all duration-200 ${s.bg} ${s.border} hover:brightness-110`}
                        >
                          <div className="flex justify-between items-start gap-3 mb-2">
                            <h5 className="font-bold text-white text-sm flex-1">{task.title}</h5>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <select
                                value={task.status}
                                onChange={(e) => onUpdateStatus(task.id, e.target.value as ProcessStatus)}
                                className={`text-[10px] font-bold rounded-full px-3 py-1.5 border-0 cursor-pointer outline-none ${s.bg} ${s.text}`}
                                style={{ WebkitAppearance: 'none' }}
                              >
                                {STATUS_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              {/* ── BOTÃO DELETAR PRODUÇÃO ── */}
                              <button
                                onClick={() => setDeletingTask(task)}
                                title="Deletar Produção"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all duration-200 text-[10px] font-bold uppercase tracking-wider"
                              >
                                <Trash2 size={11} />
                                Deletar Produção
                              </button>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-400 mb-3 leading-relaxed">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Briefcase size={10} /> {task.product}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={10} /> {new Date(task.deadline).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Modal de confirmação de delete ── */}
      {deletingTask && (
        <DeleteConfirmModal
          task={deletingTask}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
};
