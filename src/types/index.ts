export interface Transaction {
  id: string;
  title: string;
  timestamp: string;
  status: 'signed' | 'rejected' | 'pending';
}

export interface PairedDevice {
  id: string;
  name: string;
  lastConnected: string;
  token: string;
}

export interface Settings {
  ledgerHashCheckEnabled: boolean;
  safeHashCheckEnabled: boolean;
  clearSigningEnabled: boolean;
  pairedDevices: PairedDevice[];
} 