import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Transaction, Settings } from '../types'
import { fetchTransactions as fetchTransactionsFromApi } from '../services/api'
import { QUICKNODE_RPC } from '../constants/api'
import { forgeTransaction } from '../services/utils'

interface AddressLabel {
  address: string
  label: string
}

interface AppState {
  transactions: Transaction[]
  settings: Settings
  addressLabels: AddressLabel[]
  toggleLedgerHashCheck: () => void
  removePairedDevice: (id: string) => void
  updateTransactionStatus: (id: string, status: Transaction['status']) => void
  fetchTransactions: (token: string) => Promise<void>
  getTransactionStatus: (id: string) => Transaction['status']
  setCustomRpcUrl: (url: string | null) => void
  getActiveRpcUrl: () => string
  addAddressLabel: (address: string, label: string) => void
  removeAddressLabel: (address: string) => void
  getAddressLabel: (address: string) => string | undefined
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      transactions: [],
      settings: {
        ledgerHashCheckEnabled: true,
        pairedDevices: [],
        customRpcUrl: null,
      },
      addressLabels: [],

      toggleLedgerHashCheck: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            ledgerHashCheckEnabled: !state.settings.ledgerHashCheckEnabled,
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
          // Get transactions from API
          const apiTransactions = await fetchTransactionsFromApi(token)

          // Get current transactions from store
          const currentTransactions = get().transactions

          // Create a map of current transactions by ID for quick lookup
          const currentTransactionsMap = new Map<string, Transaction>()
          currentTransactions.forEach((tx) => {
            currentTransactionsMap.set(tx.id, tx)
          })

          // Process transactions from API
          const newTransactions: Transaction[] = []
          const existingTransactions: Transaction[] = []
          const newAddresses = new Set<string>()

          apiTransactions.forEach((request) => {
            const tx = forgeTransaction(
              request.content,
              request.request_id,
              request.creation_date
            )

            // Collect addresses from the transaction
            newAddresses.add(tx.from.toLowerCase())

            // Check if this transaction already exists in our store
            if (currentTransactionsMap.has(tx.id)) {
              // Keep the existing transaction's status
              const existingTx = currentTransactionsMap.get(tx.id)!
              existingTransactions.push({
                ...tx,
                status: existingTx.status,
              })
            } else {
              // This is a new transaction
              newTransactions.push(tx)
            }
          })

          // Combine transactions with new ones at the top
          const combinedTransactions = [...newTransactions, ...existingTransactions]

          // Sort transactions by creation date in descending order (most recent first)
          const sortedTransactions = combinedTransactions.sort((a, b) => {
            return b.timestamp - a.timestamp
          })

          // Get current address labels
          const currentLabels = get().addressLabels
          const currentLabelAddresses = new Set(
            currentLabels.map((label) => label.address.toLowerCase())
          )

          // Add new addresses with default labels
          const newLabels: AddressLabel[] = []
          let eoaCounter = currentLabels.length + 1

          newAddresses.forEach((address) => {
            if (!currentLabelAddresses.has(address)) {
              newLabels.push({
                address,
                label: `Account ${eoaCounter++}`,
              })
            }
          })

          // Update the store with new transactions and labels
          set((state) => ({
            transactions: sortedTransactions,
            addressLabels: [...state.addressLabels, ...newLabels],
          }))
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

      addAddressLabel: (address: string, label: string) =>
        set((state) => {
          // Check if address already has a label
          const existingIndex = state.addressLabels.findIndex(
            (item) => item.address.toLowerCase() === address.toLowerCase()
          )

          if (existingIndex >= 0) {
            // Update existing label
            const updatedLabels = [...state.addressLabels]
            updatedLabels[existingIndex] = { address, label }
            return { addressLabels: updatedLabels }
          } else {
            // Add new label
            return {
              addressLabels: [...state.addressLabels, { address, label }],
            }
          }
        }),

      removeAddressLabel: (address: string) =>
        set((state) => ({
          addressLabels: state.addressLabels.filter(
            (item) => item.address.toLowerCase() !== address.toLowerCase()
          ),
        })),

      getAddressLabel: (address: string) => {
        const { addressLabels } = get()
        const labelItem = addressLabels.find(
          (item) => item.address.toLowerCase() === address.toLowerCase()
        )
        return labelItem?.label
      },
    }),
    {
      name: 'lucid-app-permanent-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these parts of the state
        settings: state.settings,
        addressLabels: state.addressLabels,
      }),
    }
  )
)
