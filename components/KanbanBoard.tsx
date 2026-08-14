/**
 * components/KanbanBoard.tsx
 * Quadro Kanban com 7 colunas, drag-and-drop nativo e sync Realtime.
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  Columns3, Filter, User, Package, Search, X, GripVertical,
  Clock, Layers, Timer,
} from 'lucide-react';
import {
  ActivityQueueItem, Employee, QueueStatus, Priority,
  PRIORITY_CONFIG, KANBAN_COLUMNS, KanbanColumn,
} from '../types';
import { updateQueueItem } from '../dbService';
import { sortQueueItems } from '../services/queueService';

interface KanbanBoardProps {
  queue: ActivityQueueItem[];
  employees: Employee[];
  onQueueChange: (updated: ActivityQueueItem[]) => void;
}

// ─── Cartão Kanban ────────────────────────────────────────────────────────────
interface KanbanCardProps {
  item: ActivityQueueItem;
  employees: Employee[];
  onDragStart: (e: React.DragEvent, item: ActivityQueueItem) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

const KanbanCard = React.memo(function KanbanCard({
  item, employees, onDragStart, onDragEnd, isDragging,
}: KanbanCardProps) {
  const p = PRIORITY_CONFIG[item.priority];
  const emp = employees.find(e => e.id === item.assignedTo);

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      className={`
        bg-slate-800 border rounded-xl p-3 cursor-grab active:cursor-grabbing
        transition-all duration-150 select-none group
        ${isDragging ? 'opacity-30 scale-95' : 'hover:border-slate-500 hover:shadow-lg hover:shadow-black/20'}
        border-slate-700
      `}
    >
      {/* Drag handle + priority */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border border-current/20 ${p.bgColor} ${p.color}`}>
          {p.emoji} {p.label}
        </span>
        <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>

      {/* Título */}
      <p className="text-sm font-semibold text-white mb-2 leading-snug line-clamp-2">{item.title}</p>

      {/* Metadados */}
      <div className="space-y-1">
        {item.tankId && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span>{item.tankId}</span>
            {item.productionOrder && <span className="text-slate-600">· OP {item.productionOrder}</span>}
          </div>
        )}
        {item.product && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Package className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="truncate">{item.product}</span>
          </div>
        )}
        {item.scheduledAt && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>{new Date(item.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Footer: colaborador + tempo */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/60">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
            {emp?.name.charAt(0) ?? '?'}
          </div>
          <span className="text-xs text-slate-400 truncate max-w-[80px]">{emp?.name.split(' ')[0] ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Timer className="w-3 h-3" />
          <span>{item.estimatedMinutes}min</span>
        </div>
      </div>
    </div>
  );
});

// ─── Coluna Kanban ────────────────────────────────────────────────────────────
interface KanbanColumnComponentProps {
  column: KanbanColumn;
  items: ActivityQueueItem[];
  employees: Employee[];
  dragOverColumn: string | null;
  draggingItem: ActivityQueueItem | null;
  onDragStart: (e: React.DragEvent, item: ActivityQueueItem) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, columnId: string) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
}

function KanbanColumnComponent({
  column, items, employees, dragOverColumn, draggingItem,
  onDragStart, onDragEnd, onDragOver, onDrop,
}: KanbanColumnComponentProps) {
  const isOver = dragOverColumn === column.id;

  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] flex-shrink-0">
      {/* Header da coluna */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border-t border-x ${column.borderColor} ${column.bgColor}`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${column.color}`}>{column.label}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${column.bgColor} ${column.color} border ${column.borderColor}`}>
          {items.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => onDragOver(e, column.id)}
        onDrop={e => onDrop(e, column.id)}
        className={`
          flex-1 min-h-[500px] p-2 rounded-b-xl border ${column.borderColor} border-t-0
          transition-all duration-150 space-y-2
          ${isOver ? `${column.bgColor} border-dashed` : 'bg-slate-900/60'}
        `}
      >
        {items.map(item => (
          <KanbanCard
            key={item.id}
            item={item}
            employees={employees}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={draggingItem?.id === item.id}
          />
        ))}
        {isOver && draggingItem && (
          <div className={`h-20 rounded-xl border-2 border-dashed ${column.borderColor} opacity-50`} />
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  queue, employees, onQueueChange,
}) => {
  const [draggingItem, setDraggingItem] = useState<ActivityQueueItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [search, setSearch] = useState('');

  const handleDragStart = useCallback((e: React.DragEvent, item: ActivityQueueItem) => {
    setDraggingItem(item);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingItem(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!draggingItem || draggingItem.status === columnId) {
      setDraggingItem(null);
      setDragOverColumn(null);
      return;
    }

    const newStatus = columnId as QueueStatus;

    // Atualiza no Supabase
    try {
      await updateQueueItem(draggingItem.id, { status: newStatus });
      const updated = queue.map(i =>
        i.id === draggingItem.id ? { ...i, status: newStatus } : i
      );
      onQueueChange(updated);
    } catch (err) {
      console.error('[Kanban] Erro ao mover card:', err);
    }

    setDraggingItem(null);
    setDragOverColumn(null);
  }, [draggingItem, queue, onQueueChange]);

  // Filtragem
  const filtered = queue.filter(item => {
    if (filterEmployee && item.assignedTo !== filterEmployee) return false;
    if (filterPriority && item.priority !== filterPriority) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!item.title.toLowerCase().includes(q) &&
          !item.product.toLowerCase().includes(q) &&
          !(item.tankId ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const itemsByColumn = (columnId: string) =>
    sortQueueItems(filtered.filter(i => i.status === columnId));

  const hasFilters = filterEmployee || filterPriority || search;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Columns3 className="w-5 h-5 text-purple-400" />
            </div>
            Quadro Kanban
          </h1>
          <p className="text-slate-400 text-sm mt-1 ml-13">Arraste os cartões para mover entre etapas</p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2">
          {filtered.length} atividades
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />

        {/* Busca */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 w-40"
          />
        </div>

        {/* Filtro colaborador */}
        <select
          value={filterEmployee}
          onChange={e => setFilterEmployee(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">Todos os colaboradores</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        {/* Filtro prioridade */}
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as Priority | '')}
          className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">Todas as prioridades</option>
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setFilterEmployee(''); setFilterPriority(''); setSearch(''); }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-red-600/20 hover:border-red-500/30 border border-slate-600 rounded-lg px-2.5 py-1.5 transition-all"
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
      </div>

      {/* Quadro horizontal scrollável */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {KANBAN_COLUMNS.map(column => (
            <KanbanColumnComponent
              key={column.id}
              column={column}
              items={itemsByColumn(column.id)}
              employees={employees}
              dragOverColumn={dragOverColumn}
              draggingItem={draggingItem}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      <style>{`
        .ml-13 { margin-left: 3.25rem; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};
