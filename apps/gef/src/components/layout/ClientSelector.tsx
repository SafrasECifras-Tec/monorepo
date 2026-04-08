import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Pencil, Trash2, Check, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClient } from '@/contexts/ClientContext';
import type { Client } from '@/lib/storage/indexedDb';

interface ClientSelectorProps {
  isCollapsed?: boolean;
}

export function ClientSelector({ isCollapsed = false }: ClientSelectorProps) {
  const { clients, activeClient, createClient, renameClient, deleteClient, switchClient } = useClient();

  const [isOpen, setIsOpen]           = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreating, setIsCreating]   = useState(false);
  const [newName, setNewName]         = useState('');

  const dropdownRef  = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const newInputRef  = useRef<HTMLInputElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        cancelEdit();
        cancelCreate();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foca o input ao abrir edição/criação
  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (isCreating && newInputRef.current) newInputRef.current.focus();
  }, [isCreating]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function startEdit(client: Client) {
    setEditingId(client.id);
    setEditingName(client.name);
    setIsCreating(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
  }

  async function confirmEdit() {
    if (!editingId || !editingName.trim()) return cancelEdit();
    await renameClient(editingId, editingName);
    cancelEdit();
  }

  function startCreate() {
    setIsCreating(true);
    setNewName('');
    cancelEdit();
  }

  function cancelCreate() {
    setIsCreating(false);
    setNewName('');
  }

  async function confirmCreate() {
    if (!newName.trim()) return cancelCreate();
    const client = await createClient(newName);
    switchClient(client.id);
    cancelCreate();
    setIsOpen(false);
  }

  async function handleDelete(id: string) {
    if (clients.length <= 1) return;
    await deleteClient(id);
  }

  function handleSwitch(id: string) {
    if (id === activeClient?.id) return;
    switchClient(id);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent, onConfirm: () => void, onCancel: () => void) {
    if (e.key === 'Enter') onConfirm();
    if (e.key === 'Escape') onCancel();
  }

  // ── Collapsed: apenas ícone ──────────────────────────────────────────────────

  if (isCollapsed) {
    return (
      <div className="flex justify-center px-2 py-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={activeClient?.name ?? 'Selecionar cliente'}
          className="p-2 rounded-xl text-slate-500 hover:bg-white/40 hover:text-emerald-600 transition-all"
        >
          <Users className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // ── Expanded ─────────────────────────────────────────────────────────────────

  return (
    <div ref={dropdownRef} className="relative px-4 py-2">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left",
          isOpen
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-white/40 border-white/50 text-slate-700 hover:bg-white/60 hover:border-slate-200"
        )}
      >
        <div className="h-6 w-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <Users className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <span className="flex-1 text-sm font-medium truncate">
          {activeClient?.name ?? '—'}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-4 right-4 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden">
          {/* Lista de clientes */}
          <div className="max-h-56 overflow-y-auto py-1">
            {clients.map((client) => (
              <div
                key={client.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 transition-colors",
                  client.id === activeClient?.id ? "bg-emerald-50" : "hover:bg-slate-50"
                )}
              >
                {editingId === client.id ? (
                  /* Modo edição inline */
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      ref={editInputRef}
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => handleKeyDown(e, confirmEdit, cancelEdit)}
                      className="flex-1 text-sm px-2 py-0.5 rounded-lg border border-emerald-300 bg-white outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    <button onClick={confirmEdit} className="p-1 text-emerald-600 hover:text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={cancelEdit} className="p-1 text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  /* Modo normal */
                  <>
                    <button
                      onClick={() => handleSwitch(client.id)}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                    >
                      {client.id === activeClient?.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm truncate",
                        client.id === activeClient?.id ? "font-semibold text-emerald-800" : "text-slate-700"
                      )}>
                        {client.name}
                      </span>
                    </button>

                    {/* Ações — aparecem no hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => startEdit(client)}
                        title="Renomear"
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        title={clients.length <= 1 ? 'Não é possível remover o único cliente' : 'Remover'}
                        disabled={clients.length <= 1}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Criar novo cliente */}
          <div className="border-t border-slate-100 p-2">
            {isCreating ? (
              <div className="flex items-center gap-1 px-1">
                <input
                  ref={newInputRef}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, confirmCreate, cancelCreate)}
                  placeholder="Nome do cliente..."
                  className="flex-1 text-sm px-2 py-1 rounded-lg border border-emerald-300 bg-white outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <button onClick={confirmCreate} className="p-1.5 text-emerald-600 hover:text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={cancelCreate} className="p-1.5 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={startCreate}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                Novo cliente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
