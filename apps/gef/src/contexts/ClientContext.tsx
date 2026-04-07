import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  idbLoadClients,
  idbSaveClients,
  idbDeleteAllClientData,
  type Client,
} from '@/lib/storage/indexedDb';

const ACTIVE_CLIENT_KEY = 'gef_active_client';

// ─── Context Types ────────────────────────────────────────────────────────────

interface ClientContextValue {
  clients: Client[];
  activeClient: Client | null;
  isReady: boolean;
  createClient: (name: string) => Promise<Client>;
  renameClient: (id: string, name: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  switchClient: (id: string) => void;
}

const ClientContext = createContext<ClientContextValue>({
  clients: [],
  activeClient: null,
  isReady: false,
  createClient: async () => ({ id: '', name: '', createdAt: '' }),
  renameClient: async () => {},
  deleteClient: async () => {},
  switchClient: () => {},
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    idbLoadClients()
      .then(async (loaded) => {
        let list = loaded;

        // Se não há clientes, cria o default
        if (list.length === 0) {
          const defaultClient: Client = {
            id: generateId(),
            name: 'Cliente 1',
            createdAt: new Date().toISOString(),
          };
          list = [defaultClient];
          await idbSaveClients(list);
        }

        setClients(list);

        // Recupera o último cliente ativo do localStorage
        const savedId = localStorage.getItem(ACTIVE_CLIENT_KEY);
        const validId =
          savedId && list.find((c) => c.id === savedId) ? savedId : list[0].id;
        setActiveClientId(validId);
        localStorage.setItem(ACTIVE_CLIENT_KEY, validId);
      })
      .catch(console.error)
      .finally(() => setIsReady(true));
  }, []);

  const persistClients = useCallback(async (next: Client[]) => {
    setClients(next);
    await idbSaveClients(next);
  }, []);

  const createClient = useCallback(
    async (name: string): Promise<Client> => {
      const client: Client = {
        id: generateId(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };
      await persistClients([...clients, client]);
      return client;
    },
    [clients, persistClients],
  );

  const renameClient = useCallback(
    async (id: string, name: string) => {
      const next = clients.map((c) => (c.id === id ? { ...c, name: name.trim() } : c));
      await persistClients(next);
    },
    [clients, persistClients],
  );

  const deleteClient = useCallback(
    async (id: string) => {
      if (clients.length <= 1) return; // Não pode deletar o único cliente

      await idbDeleteAllClientData(id);
      const next = clients.filter((c) => c.id !== id);
      await persistClients(next);

      // Se era o cliente ativo, troca para o primeiro disponível
      if (activeClientId === id) {
        const newId = next[0].id;
        setActiveClientId(newId);
        localStorage.setItem(ACTIVE_CLIENT_KEY, newId);
      }
    },
    [clients, activeClientId, persistClients],
  );

  const switchClient = useCallback(
    (id: string) => {
      if (clients.find((c) => c.id === id)) {
        setActiveClientId(id);
        localStorage.setItem(ACTIVE_CLIENT_KEY, id);
      }
    },
    [clients],
  );

  const activeClient = clients.find((c) => c.id === activeClientId) ?? null;

  return (
    <ClientContext.Provider
      value={{ clients, activeClient, isReady, createClient, renameClient, deleteClient, switchClient }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export const useClient = () => useContext(ClientContext);
