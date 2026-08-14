import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { IndustrialDashboard } from './components/IndustrialDashboard';
import { ProductionControl } from './components/ProductionControl';
import { ManufacturingRoadmap } from './components/ManufacturingRoadmap';
import { ReactorControl } from './components/ReactorControl';
import { StorageTanks, INITIAL_TANKS_STATE, StorageTanksState } from './components/StorageTanks';
import { MyActivityQueue } from './components/MyActivityQueue';
import { QueueAdminPanel } from './components/QueueAdminPanel';
import { KanbanBoard } from './components/KanbanBoard';
import { TVMode } from './components/TVMode';
import { RulesEngine } from './components/RulesEngine';
import { EMPLOYEES, MOCK_LOGS, MOCK_TASKS, MOCK_REACTORS } from './constants';
import {
  ProductionLog, Task, ProcessStatus, ReactorState, ReactorId,
  Observacao, ActivityQueueItem, QueueRule, LoadBalanceSuggestion,
} from './types';
import {
  fetchEmployees, fetchLogs, fetchTasks, fetchReactors, fetchObservations,
  addLog, addTask, updateTaskStatus, updateReactor, addObservation, deleteObservation,
  seedEmployees, seedLogs, seedTasks, seedReactors, deleteCompletedTasks, deleteTask,
  fetchTanks, updateTank, seedTanks,
  fetchAllQueue, fetchRules, fetchLoadSuggestions,
  deleteLog, updateTaskSmsStatus,
} from './dbService';
import { subscribeToQueue, subscribeToRules, subscribeToSuggestions } from './services/realtimeService';
import { taskToQueueItem } from './services/queueService';
import { sendTaskNotificationSms } from './services/smsService';

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

  // ─── Fila Inteligente ──────────────────────────────────────────────────────
  const [activityQueue, setActivityQueue] = useState<ActivityQueueItem[]>([]);
  const [queueRules, setQueueRules] = useState<QueueRule[]>([]);
  const [loadSuggestions, setLoadSuggestions] = useState<LoadBalanceSuggestion[]>([]);

  // Identidade do usuário ativo (selecionado na sidebar, salvo em localStorage)
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('geoclean_current_user') ?? '';
  });

  const handleSelectUser = useCallback((id: string) => {
    setCurrentUserId(id);
    localStorage.setItem('geoclean_current_user', id);
  }, []);

  // Ref para debounce do save de volumes (evita salvar a cada tecla digitada)
  const volumeSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref que mantém sempre o estado mais recente dos tanques acessível nos callbacks
  const tanksStateRef = useRef<StorageTanksState>(INITIAL_TANKS_STATE);
  useEffect(() => { tanksStateRef.current = tanksState; }, [tanksState]);

  // ─── Carrega todos os dados do banco na inicialização ──────────────────────
  useEffect(() => {
    async function initData() {
      try {
        // Funcionários — sempre sincroniza constants.ts → Supabase (upsert)
        // Isso garante que novos colaboradores adicionados ao constants.ts
        // sejam inseridos no banco automaticamente na próxima carga.
        await seedEmployees(EMPLOYEES);
        const emps = await fetchEmployees();
        setEmployees(emps.length > 0 ? emps : EMPLOYEES);

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
            let pumpOnT5 = false;
            dbTanks.forEach(t => {
              volumes[t.id] = t.volume > 0 ? String(t.volume) : '';
              products[t.id] = t.product;
              if (t.id === 'T4') pumpOn = t.pumpOn;
              if (t.id === 'T5') pumpOnT5 = t.pumpOn;
            });
            setTanksState({ volumes, products, pumpOn, pumpOnT5 });
          }
        } catch (tankErr) {
          console.warn('[Tanques] Erro ao carregar — usando estado local.', tankErr);
        }

        // ── Módulo Fila Inteligente ─────────────────────────────────────────
        try {
          const [dbQueue, dbRules, dbSugs] = await Promise.all([
            fetchAllQueue(),
            fetchRules(),
            fetchLoadSuggestions(),
          ]);
          setActivityQueue(dbQueue);
          setQueueRules(dbRules);
          setLoadSuggestions(dbSugs);
        } catch (qErr) {
          console.warn('[Fila] Tabelas ainda não existem. Execute setup-queue-tables.mjs primeiro.', qErr);
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

  // ─── Supabase Realtime — Fila Inteligente ─────────────────────────────────
  useEffect(() => {
    const unsubQueue = subscribeToQueue(
      (item) => setActivityQueue(prev => {
        if (prev.find(i => i.id === item.id)) return prev.map(i => i.id === item.id ? item : i);
        return [...prev, item];
      }),
      (item) => setActivityQueue(prev => prev.map(i => i.id === item.id ? item : i)),
      (id) => setActivityQueue(prev => prev.filter(i => i.id !== id)),
    );
    const unsubRules = subscribeToRules(() => {
      fetchRules().then(setQueueRules).catch(() => {});
    });
    const unsubSugs = subscribeToSuggestions(() => {
      fetchLoadSuggestions().then(setLoadSuggestions).catch(() => {});
    });

    return () => {
      unsubQueue();
      unsubRules();
      unsubSugs();
    };
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

  // ─── Polling: sincroniza tanques a cada 30 s para múltiplos usuários ──────
  useEffect(() => {
    const syncTanks = async () => {
      // Se o usuário está digitando (save pendente), não sobrescreve os dados locais
      if (volumeSaveTimer.current) return;
      try {
        const dbTanks = await fetchTanks();
        if (dbTanks.length > 0) {
          const volumes: Record<string, string> = {};
          const products: Record<string, string> = {};
          let pumpOn = false;
          let pumpOnT5 = false;
          dbTanks.forEach(t => {
            volumes[t.id] = t.volume > 0 ? String(t.volume) : '';
            products[t.id] = t.product;
            if (t.id === 'T4') pumpOn = t.pumpOn;
            if (t.id === 'T5') pumpOnT5 = t.pumpOn;
          });
          setTanksState({ volumes, products, pumpOn, pumpOnT5 });
        }
      } catch (e) {
        console.warn('[Tanques] Erro na sincronização periódica:', e);
      }
    };

    const interval = setInterval(syncTanks, 30_000);
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

  const handleAddTask = async (newTask: Task, employeePhone?: string) => {
    try {
      await addTask(newTask);
      setTasks(prev => [newTask, ...prev]);

      // ── Envio automático de SMS ao criar tarefa ────────────────────────────
      // Dispara em background — não bloqueia a UX caso o SMS falhe
      (async () => {
        try {
          const assignedEmployee = employees.find(e => e.id === newTask.assignedTo);
          if (!assignedEmployee) return;

          // Número de telefone: usa o parâmetro recebido ou busca no perfil do colaborador
          const phone = employeePhone ?? (assignedEmployee as any).phone ?? '';

          if (!phone) {
            console.warn(`[SMS] Colaborador ${assignedEmployee.name} não possui telefone cadastrado.`);
            // Marca como 'pending' para revisão posterior
            await updateTaskSmsStatus(newTask.id, 'pending').catch(() => {});
            setTasks(prev => prev.map(t =>
              t.id === newTask.id ? { ...t, smsStatus: 'pending' } : t
            ));
            return;
          }

          // Atualiza status para 'sent' antes de tentar enviar
          await updateTaskSmsStatus(newTask.id, 'sent').catch(() => {});
          setTasks(prev => prev.map(t =>
            t.id === newTask.id ? { ...t, smsStatus: 'sent' } : t
          ));

          const result = await sendTaskNotificationSms(newTask, assignedEmployee, phone);

          if (!result.success) {
            // SMS falhou — reverte para 'pending'
            await updateTaskSmsStatus(newTask.id, 'pending').catch(() => {});
            setTasks(prev => prev.map(t =>
              t.id === newTask.id ? { ...t, smsStatus: 'pending' } : t
            ));
          }
        } catch (smsErr) {
          console.warn('[SMS] Erro inesperado ao enviar notificação:', smsErr);
        }
      })();

      // ── Ao criar tarefa, adiciona automaticamente à fila do colaborador ──
      try {
        const queueItem = taskToQueueItem(newTask, 'media', activityQueue.filter(i => i.assignedTo === newTask.assignedTo).length);
        const { fetchAllQueue: _f, ...rest } = await import('./dbService');
        const { addToQueue } = await import('./dbService');
        await addToQueue(queueItem);
        setActivityQueue(prev => [...prev, { ...queueItem, createdAt: new Date().toISOString() }]);
      } catch (qErr) {
        console.warn('[Fila] Não foi possível adicionar à fila automaticamente:', qErr);
      }
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

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Erro ao deletar tarefa:', err);
    }
  };

  /**
   * Remove um registro de produção do Supabase e atualiza o estado local.
   * Chamado pelo ProductionControl via prop onDeleteLog.
   */
  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteLog(logId);
      setLogs(prev => prev.filter(l => l.id !== logId));
    } catch (err) {
      console.error('Erro ao deletar registro de produção:', err);
      // Relança o erro para que o componente filho possa exibir a mensagem de erro
      throw err;
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

  /**
   * Atualiza volumes no state e persiste no Supabase com debounce de 800 ms.
   * CORREÇÃO: setTimeout fora do setTanksState para evitar side-effects em setter puro.
   */
  const handleVolumesChange = useCallback((newVolumes: Record<string, string>) => {
    const currentState = tanksStateRef.current;
    const changedIds = Object.keys(newVolumes).filter(
      id => newVolumes[id] !== currentState.volumes[id]
    );

    // Atualiza o state local imediatamente
    setTanksState(prev => ({ ...prev, volumes: newVolumes }));

    // Debounce do save: fora do setter (sem side-effects no setState)
    if (changedIds.length === 0) return;
    if (volumeSaveTimer.current) clearTimeout(volumeSaveTimer.current);
    volumeSaveTimer.current = setTimeout(() => {
      volumeSaveTimer.current = null;
      const { products, pumpOn, pumpOnT5 } = tanksStateRef.current;
      changedIds.forEach(id => {
        let pOn = false;
        if (id === 'T4') pOn = pumpOn;
        if (id === 'T5') pOn = pumpOnT5;
        saveTankNow(id, newVolumes, products, pOn);
      });
    }, 800);
  }, [saveTankNow]);

  /** Atualiza produtos no state e persiste imediatamente no Supabase. */
  const handleProductsChange = useCallback((newProducts: Record<string, string>) => {
    const { volumes, pumpOn, pumpOnT5, products: prevProducts } = tanksStateRef.current;
    const changedIds = Object.keys(newProducts).filter(id => newProducts[id] !== prevProducts[id]);
    setTanksState(prev => ({ ...prev, products: newProducts }));
    changedIds.forEach(id => {
      let pOn = false;
      if (id === 'T4') pOn = pumpOn;
      if (id === 'T5') pOn = pumpOnT5;
      saveTankNow(id, volumes, newProducts, pOn);
    });
  }, [saveTankNow]);

  /** Atualiza o estado da bomba (T4 ou T5) e persiste imediatamente no Supabase. */
  const handlePumpChange = useCallback((tankId: string, newPumpOn: boolean) => {
    const { volumes, products } = tanksStateRef.current;
    setTanksState(prev => {
      if (tankId === 'T4') {
        return { ...prev, pumpOn: newPumpOn };
      } else if (tankId === 'T5') {
        return { ...prev, pumpOnT5: newPumpOn };
      }
      return prev;
    });
    saveTankNow(tankId, volumes, products, newPumpOn);
  }, [saveTankNow]);

  /** Salva todos os 5 tanques imediatamente (chamado pelo botão Salvar Dados). */
  const handleSaveAllTanks = useCallback(async () => {
    const { volumes, products, pumpOn, pumpOnT5 } = tanksState;
    await Promise.all(
      ['T1', 'T2', 'T3', 'T4', 'T5'].map(id => {
        let pOn = false;
        if (id === 'T4') pOn = pumpOn;
        if (id === 'T5') pOn = pumpOnT5;
        return saveTankNow(id, volumes, products, pOn);
      })
    );
    console.log('[Tanques] Todos os tanques salvos via botão.');
  }, [saveTankNow, tanksState]);

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

  // ─── Modo TV — sem sidebar ─────────────────────────────────────────────────
  if (activeTab === 'tv') {
    return (
      <div className="relative">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="fixed top-4 left-4 z-50 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all"
        >
          ← Sair do Modo TV
        </button>
        <TVMode
          queue={activityQueue}
          employees={employees}
          reactors={reactors}
          logs={logs}
        />
      </div>
    );
  }

  // ─── Renderização das abas ─────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <IndustrialDashboard
            logs={logs}
            tasks={tasks}
            employees={employees}
            reactors={reactors}
            tanksState={tanksState}
          />
        );
      case 'production':
        return <ProductionControl logs={logs} onAddLog={handleAddLog} onDeleteLog={handleDeleteLog} />;
      case 'roadmap':
        return (
          <ManufacturingRoadmap
            employees={employees}
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
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
            pumpOnT5={tanksState.pumpOnT5}
            onVolumesChange={handleVolumesChange}
            onProductsChange={handleProductsChange}
            onPumpChange={handlePumpChange}
            onSaveAll={handleSaveAllTanks}
          />
        );
      // ── Novos tabs ────────────────────────────────────────────────────────
      case 'my-queue':
        return (
          <MyActivityQueue
            queue={activityQueue}
            employees={employees}
            currentUserId={currentUserId}
            onQueueChange={setActivityQueue}
            onSelectUser={handleSelectUser}
          />
        );
      case 'queue-admin':
        return (
          <QueueAdminPanel
            queue={activityQueue}
            employees={employees}
            suggestions={loadSuggestions}
            onQueueChange={setActivityQueue}
            onSuggestionsChange={setLoadSuggestions}
          />
        );
      case 'kanban':
        return (
          <KanbanBoard
            queue={activityQueue}
            employees={employees}
            onQueueChange={setActivityQueue}
          />
        );
      case 'rules':
        return (
          <RulesEngine
            rules={queueRules}
            onRulesChange={setQueueRules}
          />
        );
      default:
        return (
          <IndustrialDashboard
            logs={logs}
            tasks={tasks}
            employees={employees}
            reactors={reactors}
            tanksState={tanksState}
          />
        );
    }
  };

  return (
    <div className="flex font-sans text-slate-900 bg-slate-50 min-h-screen">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        observacoes={observacoes}
        onAddObservacao={handleAddObservacao}
        onDeleteObservacao={handleDeleteObservacao}
        currentUserId={currentUserId}
        employees={employees}
        onSelectUser={handleSelectUser}
      />
      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
