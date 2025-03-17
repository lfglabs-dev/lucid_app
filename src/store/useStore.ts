import { create } from 'zustand';
import { Transaction, Settings } from '../types';
import { mockTransactions, defaultSettings } from '../data/mockData';

interface AppState {
  transactions: Transaction[];
  settings: Settings;
  toggleLedgerHashCheck: () => void;
  toggleSafeHashCheck: () => void;
  addPairedDevice: (token: string, name: string) => void;
  removePairedDevice: (id: string) => void;
  updateTransactionStatus: (id: string, status: Transaction['status']) => void;
}

export const useStore = create<AppState>((set) => ({
  transactions: mockTransactions,
  settings: defaultSettings,
  
  toggleLedgerHashCheck: () =>
    set((state) => ({
      settings: {
        ...state.settings,
        ledgerHashCheckEnabled: !state.settings.ledgerHashCheckEnabled,
      },
    })),

  toggleSafeHashCheck: () =>
    set((state) => ({
      settings: {
        ...state.settings,
        safeHashCheckEnabled: !state.settings.safeHashCheckEnabled,
      },
    })),
    
  addPairedDevice: (token: string, name: string) =>
    set((state) => ({
      settings: {
        ...state.settings,
        pairedDevices: [
          ...state.settings.pairedDevices,
          {
            id: Date.now().toString(),
            name: name,
            token: token,
            lastConnected: new Date().toISOString(),
          },
        ],
      },
    })),
    
  removePairedDevice: (id: string) =>
    set((state) => ({
      settings: {
        ...state.settings,
        pairedDevices: state.settings.pairedDevices.filter((d) => d.id !== id),
      },
    })),

  updateTransactionStatus: (id: string, status: Transaction['status']) => 
    set((state) => ({
      transactions: state.transactions.map(tx => 
        tx.id === id ? { ...tx, status } : tx
      ),
    })),
})); 