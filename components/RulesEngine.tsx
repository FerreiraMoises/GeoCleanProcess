/**
 * components/RulesEngine.tsx
 * Motor de Regras configurável — crie, edite e ative/desative regras de produção.
 */
import React, { useState } from 'react';
import {
  Settings2, Plus, Trash2, ToggleLeft, ToggleRight, ChevronRight,
  Zap, X, Save, Info, CheckCircle2,
} from 'lucide-react';
import { QueueRule, RuleTrigger, RuleAction } from '../types';
import { saveRule, deleteRule, toggleRule } from '../dbService';

interface RulesEngineProps {
  rules: QueueRule[];
  onRulesChange: (updated: QueueRule[]) => void;
}

// ─── Labels legíveis para triggers e ações ───────────────────────────────────
const TRIGGER_LABELS: Record<RuleTrigger, { label: string; desc: string; icon: string }> = {
  task_completed:          { label: 'Tarefa Concluída',          desc: 'Quando uma atividade é marcada como concluída', icon: '✅' },
  tank_maintenance:        { label: 'Tanque em Manutenção',      desc: 'Quando um tanque entra em modo de manutenção',  icon: '🔧' },
  missing_material:        { label: 'Falta de Matéria-Prima',    desc: 'Quando é registrada falta de matéria-prima',   icon: '📦' },
  equipment_unavailable:   { label: 'Equipamento Indisponível',  desc: 'Quando um equipamento fica indisponível',      icon: '🚫' },
  activity_started:        { label: 'Atividade Iniciada',        desc: 'Quando uma atividade é iniciada',              icon: '▶️'  },
  activity_cancelled:      { label: 'Atividade Cancelada',       desc: 'Quando uma atividade é cancelada',             icon: '❌' },
};

const ACTION_LABELS: Record<RuleAction, { label: string; desc: string; color: string }> = {
  release_next:   { label: 'Liberar Próxima',       desc: 'Inicia automaticamente a próxima atividade da fila', color: 'text-green-400' },
  block_tank:     { label: 'Bloquear Tanque',        desc: 'Move todas as atividades do tanque para "aguardando"', color: 'text-orange-400' },
  hold_related:   { label: 'Aguardar Matéria-Prima', desc: 'Coloca atividades do produto em espera de material', color: 'text-amber-400' },
  block_activity: { label: 'Bloquear Atividade',     desc: 'Impede o início de uma atividade específica',       color: 'text-red-400' },
  notify_admin:   { label: 'Notificar Admin',         desc: 'Envia uma notificação para o painel do administrador', color: 'text-blue-400' },
};

// ─── Regras padrão de fábrica ─────────────────────────────────────────────────
const DEFAULT_RULES: Omit<QueueRule, 'createdAt'>[] = [
  {
    id: 'rule-default-1',
    name: 'Auto-avançar após conclusão',
    triggerEvent: 'task_completed',
    conditionData: null,
    action: 'release_next',
    actionData: null,
    active: true,
  },
  {
    id: 'rule-default-2',
    name: 'Bloquear atividades em manutenção',
    triggerEvent: 'tank_maintenance',
    conditionData: null,
    action: 'block_tank',
    actionData: null,
    active: true,
  },
  {
    id: 'rule-default-3',
    name: 'Suspender por falta de material',
    triggerEvent: 'missing_material',
    conditionData: null,
    action: 'hold_related',
    actionData: null,
    active: true,
  },
  {
    id: 'rule-default-4',
    name: 'Notificar admin em cancelamento',
    triggerEvent: 'activity_cancelled',
    conditionData: null,
    action: 'notify_admin',
    actionData: null,
    active: false,
  },
];

// ─── Formulário de nova regra ─────────────────────────────────────────────────
interface RuleFormProps {
  onSave: (rule: QueueRule) => void;
  onCancel: () => void;
  initial?: QueueRule;
}

function RuleForm({ onSave, onCancel, initial }: RuleFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [trigger, setTrigger] = useState<RuleTrigger>(initial?.triggerEvent ?? 'task_completed');
  const [action, setAction] = useState<RuleAction>(initial?.action ?? 'release_next');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const rule: QueueRule = {
      id: initial?.id ?? `rule-${Date.now()}`,
      name: name.trim(),
      triggerEvent: trigger,
      conditionData: null,
      action,
      actionData: null,
      active: initial?.active ?? true,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    try {
      await saveRule(rule);
      onSave(rule);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">{initial ? 'Editar Regra' : 'Nova Regra'}</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nome */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Nome da Regra</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Liberar próxima após conclusão..."
          className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Trigger */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
          Quando (Gatilho)
        </label>
        <div className="space-y-2">
          {(Object.entries(TRIGGER_LABELS) as [RuleTrigger, typeof TRIGGER_LABELS[RuleTrigger]][]).map(([key, cfg]) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                trigger === key
                  ? 'border-green-500/50 bg-green-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-700/30'
              }`}
            >
              <input
                type="radio"
                name="trigger"
                value={key}
                checked={trigger === key}
                onChange={() => setTrigger(key)}
                className="accent-green-500"
              />
              <span className="text-lg">{cfg.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{cfg.label}</p>
                <p className="text-xs text-slate-400">{cfg.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Ação */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
          Então (Ação)
        </label>
        <div className="space-y-2">
          {(Object.entries(ACTION_LABELS) as [RuleAction, typeof ACTION_LABELS[RuleAction]][]).map(([key, cfg]) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                action === key
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-700/30'
              }`}
            >
              <input
                type="radio"
                name="action"
                value={key}
                checked={action === key}
                onChange={() => setAction(key)}
                className="accent-blue-500"
              />
              <div>
                <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
                <p className="text-xs text-slate-400">{cfg.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-all disabled:opacity-40"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Regra'}
        </button>
      </div>
    </div>
  );
}

// ─── Cartão de regra ──────────────────────────────────────────────────────────
interface RuleCardProps {
  key?: React.Key;
  rule: QueueRule;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (rule: QueueRule) => void;
  onDelete: (id: string) => void;
}

function RuleCard({ rule, onToggle, onEdit, onDelete }: RuleCardProps) {
  const trig = TRIGGER_LABELS[rule.triggerEvent];
  const act = ACTION_LABELS[rule.action];
  const [delConfirm, setDelConfirm] = useState(false);

  return (
    <div className={`
      rounded-xl border transition-all duration-200 overflow-hidden
      ${rule.active ? 'border-slate-600/80 bg-slate-800/60' : 'border-slate-700/40 bg-slate-800/20 opacity-60'}
    `}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status toggle */}
        <button
          onClick={() => onToggle(rule.id, !rule.active)}
          className={`flex-shrink-0 transition-colors ${rule.active ? 'text-green-400 hover:text-green-300' : 'text-slate-600 hover:text-slate-400'}`}
          title={rule.active ? 'Desativar' : 'Ativar'}
        >
          {rule.active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
        </button>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate">{rule.name}</span>
            {!rule.active && (
              <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">Inativa</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1">
              <span>{trig?.icon}</span>
              <span className="text-slate-300">{trig?.label}</span>
            </span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className={`font-medium ${act?.color}`}>{act?.label}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(rule)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
            title="Editar"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          {delConfirm ? (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(rule.id)}
                className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-all"
              >
                Confirmar
              </button>
              <button
                onClick={() => setDelConfirm(false)}
                className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded-lg transition-all"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDelConfirm(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export const RulesEngine: React.FC<RulesEngineProps> = ({ rules, onRulesChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<QueueRule | null>(null);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  const handleSaveRule = (rule: QueueRule) => {
    const updated = editingRule
      ? rules.map(r => r.id === rule.id ? rule : r)
      : [rule, ...rules];
    onRulesChange(updated);
    setShowForm(false);
    setEditingRule(null);
  };

  const handleToggle = async (id: string, active: boolean) => {
    await toggleRule(id, active);
    onRulesChange(rules.map(r => r.id === id ? { ...r, active } : r));
  };

  const handleEdit = (rule: QueueRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteRule(id);
    onRulesChange(rules.filter(r => r.id !== id));
  };

  const handleLoadDefaults = async () => {
    setLoadingDefaults(true);
    try {
      const newRules: QueueRule[] = [];
      for (const r of DEFAULT_RULES) {
        if (!rules.find(ex => ex.id === r.id)) {
          const full: QueueRule = { ...r, createdAt: new Date().toISOString() };
          await saveRule(full);
          newRules.push(full);
        }
      }
      if (newRules.length > 0) onRulesChange([...rules, ...newRules]);
    } finally {
      setLoadingDefaults(false);
    }
  };

  const activeCount = rules.filter(r => r.active).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-amber-400" />
            </div>
            Motor de Regras
          </h1>
          <p className="text-slate-400 text-sm mt-1 ml-13">
            Automatize o fluxo de produção com regras configuráveis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
            {activeCount} ativa{activeCount !== 1 ? 's' : ''} / {rules.length} total
          </span>
          {rules.length === 0 && (
            <button
              onClick={handleLoadDefaults}
              disabled={loadingDefaults}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1.5 rounded-xl transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              {loadingDefaults ? 'Carregando...' : 'Carregar Padrões'}
            </button>
          )}
          <button
            onClick={() => { setEditingRule(null); setShowForm(true); }}
            className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20"
          >
            <Plus className="w-4 h-4" /> Nova Regra
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-6">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-blue-400">Como funciona:</strong> Cada regra define um <em>gatilho</em> (quando algo acontece)
          e uma <em>ação</em> (o que o sistema faz automaticamente). As regras ativas são executadas em tempo real
          sempre que o gatilho correspondente é disparado.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de regras */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Regras Configuradas
          </h2>

          {showForm && (
            <RuleForm
              initial={editingRule ?? undefined}
              onSave={handleSaveRule}
              onCancel={() => { setShowForm(false); setEditingRule(null); }}
            />
          )}

          {!showForm && rules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 border border-slate-700/40 border-dashed rounded-2xl">
              <Settings2 className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 font-medium">Nenhuma regra configurada</p>
              <p className="text-slate-500 text-sm mb-4">Crie uma regra ou carregue as regras padrão</p>
              <button
                onClick={handleLoadDefaults}
                disabled={loadingDefaults}
                className="flex items-center gap-2 text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-xl transition-all"
              >
                <Zap className="w-4 h-4" /> Carregar Regras Padrão
              </button>
            </div>
          )}

          {!showForm && rules.length > 0 && (
            <div className="space-y-2">
              {rules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Referência rápida */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Referência — Gatilhos e Ações
          </h2>

          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gatilhos Disponíveis</p>
            {(Object.entries(TRIGGER_LABELS) as [RuleTrigger, typeof TRIGGER_LABELS[RuleTrigger]][]).map(([key, cfg]) => (
              <div key={key} className="flex items-start gap-3 text-xs">
                <span className="text-base flex-shrink-0">{cfg.icon}</span>
                <div>
                  <p className="text-slate-300 font-medium">{cfg.label}</p>
                  <p className="text-slate-500">{cfg.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ações Disponíveis</p>
            {(Object.entries(ACTION_LABELS) as [RuleAction, typeof ACTION_LABELS[RuleAction]][]).map(([key, cfg]) => (
              <div key={key} className="flex items-start gap-3 text-xs">
                <ChevronRight className={`w-3 h-3 flex-shrink-0 mt-0.5 ${cfg.color}`} />
                <div>
                  <p className={`font-medium ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-slate-500">{cfg.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`.ml-13 { margin-left: 3.25rem; }`}</style>
    </div>
  );
};
