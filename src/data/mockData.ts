import { Transaction, PairedDevice, Settings } from '../types';

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    title: 'Transfer to Alice',
    timestamp: '2024-03-20T10:30:00Z',
    status: 'signed'
  },
  {
    id: '2',
    title: 'Contract Interaction',
    timestamp: '2024-03-20T09:15:00Z',
    status: 'rejected'
  },
  {
    id: '3',
    title: 'Token Swap',
    timestamp: '2024-03-19T15:45:00Z',
    status: 'pending'
  },
];

export const mockPairedDevices: PairedDevice[] = [
  {
    id: '1',
    name: 'Ledger Nano X',
    lastConnected: '2024-03-20T10:30:00Z',
    token: 'token-1234',
  },
  {
    id: '2',
    name: 'Trezor Model T',
    lastConnected: '2024-03-19T15:45:00Z',
    token: 'token-5678',
  },
];

export const defaultSettings: Settings = {
  clearSigningEnabled: true,
  ledgerHashCheckEnabled: false,
  safeHashCheckEnabled: false,
  pairedDevices: mockPairedDevices,
}; 