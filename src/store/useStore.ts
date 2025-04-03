import { create } from 'zustand'
import { Transaction, Settings, createTransactionFromSafeTx } from '../types'
import { fetchTransactions as fetchTransactionsFromApi } from '../services/api'
import { QUICKNODE_RPC } from '../constants/api'

interface AppState {
  transactions: Transaction[]
  settings: Settings
  toggleLedgerHashCheck: () => void
  toggleSafeHashCheck: () => void
  removePairedDevice: (id: string) => void
  updateTransactionStatus: (id: string, status: Transaction['status']) => void
  fetchTransactions: (token: string) => Promise<void>
  getTransactionStatus: (id: string) => Transaction['status']
  setCustomRpcUrl: (url: string | null) => void
  getActiveRpcUrl: () => string
}

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  settings: {
    clearSigningEnabled: true,
    ledgerHashCheckEnabled: false,
    safeHashCheckEnabled: false,
    pairedDevices: [],
    customRpcUrl: null,
  },

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

  removePairedDevice: (id: string) =>
    set((state) => ({
      settings: {
        ...state.settings,
        pairedDevices: state.settings.pairedDevices.filter((d) => d.id !== id),
      },
    })),

  updateTransactionStatus: (id: string, status: Transaction['status']) =>
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id ? { ...tx, status } : tx
      ),
    })),

  fetchTransactions: async (token: string) => {
    try {
      const requests = await fetchTransactionsFromApi(token)
      const transactionMap = new Map<string, Transaction>()

      // First, add existing transactions to the map
      get().transactions.forEach((tx) => {
        transactionMap.set(tx.id, tx)
      })

      // Then add new transactions, overwriting any duplicates
      requests.forEach((request) => {
        const tx = createTransactionFromSafeTx(
          request.content,
          request.request_id,
          request.creation_date
        )
        transactionMap.set(tx.id, tx)
      })

      // Convert map values back to array
      const uniqueTransactions = Array.from(transactionMap.values())
      set({ transactions: uniqueTransactions })
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  },

  getTransactionStatus: (id: string): Transaction['status'] => {
    const transaction = get().transactions.find((tx) => tx.id === id)

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    return transaction.status
  },

  setCustomRpcUrl: (url: string | null) =>
    set((state) => ({
      settings: {
        ...state.settings,
        customRpcUrl: url,
      },
    })),

  getActiveRpcUrl: () => {
    const { settings } = get()
    return settings.customRpcUrl || QUICKNODE_RPC
  },
}))
