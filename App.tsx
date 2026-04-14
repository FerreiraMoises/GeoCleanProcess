import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProductionControl } from './components/ProductionControl';
import { ManufacturingRoadmap } from './components/ManufacturingRoadmap';
import { ReactorControl } from './components/ReactorControl';
import { StorageTanks, INITIAL_TANKS_STATE, StorageTanksState } from './components/StorageTanks';
import { EMPLOYEES, MOCK_LOGS, MOCK_TASKS, MOCK_REACTORS } from './constants';
import { ProductionLog, Task, ProcessStatus, ReactorState, ReactorId, Observacao } from './types';
import {
  fetchEmployees, fetchLogs, fetchTasks, fetchReactors, fetchObservations,
  addLog, addTask, updateTaskStatus, updateReactor, addObservation, deleteObservation,
  seedEmployees, seedLogs, seedTasks, seedReactors, deleteCompletedTasks,
  fetchTanks, updateTank, seedTanks,
} from "./dbService";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const [employees, setEmployees] = useState(EMPLOYEES);
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reactors, setReactors] = useState<ReactorState[]>([]);
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);

  // Tank state — persists across tab switches
  const [tanksState, setTanksState] = useState<StorageTanksState>(INITIAL_TANKS_STATE);

  // Ref para debounce do save de volumes (evita salvar a cada tecla digitada)
  const volumeSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Carrega todos os dados do banco na inicialização ──────────────────────
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

        // Observações
        const dbObs = await fetchObservations();
        setObservacoes(dbObs);

        // ── Tanques de Armazenagem ──────────────────────────────────────────
        try {
          // Garante que os 5 registros existam (ignoreDuplicates = não sobrescreve dados reais)
          await seedTanks();

          const dbTanks = await fetchTanks();
          if (dbTanks.length > 0) {
            const volumes: Record<string, string> = {};
            const products: Record<string, string> = {};
            let pumpOn = false;
            dbTanks.forEach(t => {
              volumes[t.id] = t.volume > 0 ? String(t.volume) : '';
              products[t.id] = t.product;
              if (t.id === 'T4') pumpOn = t.pumpOn;
            });
            setTanksState({ volumes, products, pumpOn });
          }
        } catch (tankErr) {
          console.warn('[Tanques] Erro ao carregar — usando estado local.', tankErr);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
        // Fallback para dados locais
        setLogs(MOCK_LOGS);
        setTasks(MOCK_TASKS);
        setReactors(MOCK_REACTORS);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // ─── Limpeza automática de tarefas concluídas a cada 12 horas ─────────────
  useEffect(() => {
    const cleanCompleted = async () => {
      try {
        const deletedIds = await deleteCompletedTasks();
        if (deletedIds.length > 0) {
          setTasks(prev => prev.filter(t => !deletedIds.includes(t.id)));
          console.log(`[Auto-limpeza] ${deletedIds.length} tarefa(s) concluída(s) removida(s).`);
        }
      } catch (err) {
        console.error('[Auto-limpeza] Erro ao deletar tarefas concluídas:', err);
      }
    };

    cleanCompleted();
    const interval = setInterval(cleanCompleted, 12 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Handlers gerais ───────────────────────────────────────────────────────

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

  const handleAddObservacao = async (nova: Observacao) => {
    try {
      await addObservation(nova);
      setObservacoes(prev => [nova, ...prev]);
    } catch (err) {
      console.error('Erro ao salvar observação:', err);
    }
  };

  const handleDeleteObservacao = async (id: string) => {
    try {
      await deleteObservation(id);
      setObservacoes(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error('Erro ao deletar observação:', err);
    }
  };

  // ─── Handlers dos Tanques (fora do renderContent para estabilidade) ─────────

  /**
   * Salva um tanque imediatamente.
   * Recebe os valores NOVOS explicitamente para evitar problemas de closure.
   */
  const saveTankNow = useCallback(async (
    id: string,
    volumes: Record<string, string>,
    products: Record<string, string>,
    pumpOn: boolean,
  ) => {
    try {
      await updateTank(
        id,
        parseFloat(volumes[id]) || 0,
        products[id] ?? '',
        pumpOn,
      );
      console.log(`[Tanques] ${id} salvo — vol=${volumes[id]}, prod=${products[id]}, pump=${pumpOn}`);
    } catch (e) {
      console.warn(`[Tanques] Erro ao salvar ${id}:`, e);
    }
  }, []);

  /** Atualiza volumes no state e persiste no Supabase com debounce de 800 ms. */
  const handleVolumesChange = useCallback((newVolumes: Record<string, string>) => {
    setTanksState(prev => {
      const changedIds = Object.keys(newVolumes).filter(id => newVolumes[id] !== prev.volumes[id]);

      // Debounce: cancela o timer anterior e agenda novo save
      if (volumeSaveTimer.current) clearTimeout(volumeSaveTimer.current);
      volumeSaveTimer.current = setTimeout(() => {
        changedIds.forEach(id => {
          saveTankNow(id, newVolumes, prev.products, prev.pumpOn);
        });
      }, 800);

      return { ...prev, volumes: newVolumes };
    });
  }, [saveTankNow]);

  /** Atualiza produtos no state e persiste imediatamente no Supabase. */
  const handleProductsChange = useCallback((newProducts: Record<string, string>) => {
    setTanksState(prev => {
      const changedIds = Object.keys(newProducts).filter(id => newProducts[id] !== prev.products[id]);
      changedIds.forEach(id => {
        saveTankNow(id, prev.volumes, newProducts, prev.pumpOn);
      });
      return { ...prev, products: newProducts };
    });
  }, [saveTankNow]);

  /** Atualiza o estado da bomba T4 e persiste imediatamente no Supabase. */
  const handlePumpChange = useCallback((newPumpOn: boolean) => {
    setTanksState(prev => {
      saveTankNow('T4', prev.volumes, prev.products, newPumpOn);
      return { ...prev, pumpOn: newPumpOn };
    });
  }, [saveTankNow]);

  // ─── Tela de carregamento ──────────────────────────────────────────────────

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

  // ─── Renderização das abas ─────────────────────────────────────────────────

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
      case 'tanks':
        return (
          <StorageTanks
            volumes={tanksState.volumes}
            products={tanksState.products}
            pumpOn={tanksState.pumpOn}
            onVolumesChange={handleVolumesChange}
            onProductsChange={handleProductsChange}
            onPumpChange={handlePumpChange}
          />
        );
      default:
        return <Dashboard logs={logs} tasks={tasks} employees={employees} />;
    }
  };

  return (
    <div className="flex font-sans text-slate-900 bg-slate-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} observacoes={observacoes} onAddObservacao={handleAddObservacao} onDeleteObservacao={handleDeleteObservacao} />
      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
