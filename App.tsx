import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProductionControl } from './components/ProductionControl';
import { ManufacturingRoadmap } from './components/ManufacturingRoadmap';
import { ReactorControl } from './components/ReactorControl';
import { EMPLOYEES, MOCK_LOGS, MOCK_TASKS, MOCK_REACTORS } from './constants';
import { ProductionLog, Task, ProcessStatus, ReactorState, ReactorId } from './types';
import {
  fetchEmployees, fetchLogs, fetchTasks, fetchReactors,
  addLog, addTask, updateTaskStatus, updateReactor,
  seedEmployees, seedLogs, seedTasks, seedReactors,
} from "./dbService";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const [employees, setEmployees] = useState(EMPLOYEES);
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reactors, setReactors] = useState<ReactorState[]>([]);

  // Carrega dados do banco na inicialização. Se estiver vazio, popula com dados iniciais.
  useEffect(() => {
    async function initData() {
      try {
        // Funcionários
        let emps = await fetchEmployees();
        if (emps.length === 0) {
          await seedEmployees(EMPLOYEES);
          emps = EMPLOYEES;
        }
        setEmployees(emps);

        // Logs de produção
        let dbLogs = await fetchLogs();
        if (dbLogs.length === 0) {
          await seedLogs(MOCK_LOGS);
          dbLogs = MOCK_LOGS;
        }
        setLogs(dbLogs);

        // Tarefas
        let dbTasks = await fetchTasks();
        if (dbTasks.length === 0) {
          await seedTasks(MOCK_TASKS);
          dbTasks = MOCK_TASKS;
        }
        setTasks(dbTasks);

        // Reatores
        let dbReactors = await fetchReactors();
        if (dbReactors.length === 0) {
          await seedReactors(MOCK_REACTORS);
          dbReactors = MOCK_REACTORS;
        }
        setReactors(dbReactors);
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
        // Fallback para dados locais em caso de erro
        setLogs(MOCK_LOGS);
        setTasks(MOCK_TASKS);
        setReactors(MOCK_REACTORS);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  const handleAddLog = async (newLog: ProductionLog) => {
    try {
      await addLog(newLog);
      setLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error('Erro ao salvar log:', err);
    }
  };

  const handleAddTask = async (newTask: Task) => {
    try {
      await addTask(newTask);
      setTasks(prev => [newTask, ...prev]);
    } catch (err) {
      console.error('Erro ao salvar tarefa:', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: ProcessStatus) => {
    try {
      await updateTaskStatus(taskId, status);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    } catch (err) {
      console.error('Erro ao atualizar status da tarefa:', err);
    }
  };

  const handleUpdateReactor = async (id: ReactorId, updates: Partial<ReactorState>) => {
    try {
      await updateReactor(id, updates);
      setReactors(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (err) {
      console.error('Erro ao atualizar reator:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Conectando ao banco de dados...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard logs={logs} tasks={tasks} employees={employees} />;
      case 'production':
        return <ProductionControl logs={logs} onAddLog={handleAddLog} />;
      case 'roadmap':
        return (
          <ManufacturingRoadmap
            employees={employees}
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateStatus={handleUpdateTaskStatus}
          />
        );
      case 'reactors':
        return <ReactorControl reactors={reactors} onUpdateReactor={handleUpdateReactor} />;
      default:
        return <Dashboard logs={logs} tasks={tasks} employees={employees} />;
    }
  };

  return (
    <div className="flex font-sans text-slate-900 bg-slate-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;

function newFunction() {
  "./services/supabaseClient";
}
