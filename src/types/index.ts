export interface TokenInfo {
  chainId: string
  address: string
  name: string
  symbol: string
  decimals: number
  icon: string
  warning?: string // Optional warning message for unknown or unverified tokens
}

export interface Transaction {
  id: string
  status: 'pending' | 'signed' | 'rejected'
  timestamp: number
  chainId: string
  from: string
  to: string
  value: string
  data: string
  gas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  nonce: string
  originalSafeTx?: EIP712SafeTx
}

export interface EIP712SafeTx {
  nonce: string
  chainId: string
  safeAddress: string
  from: string
  to: string
  value: string
  data: string
  operation: string
  safeTxGas: string
  baseGas: string
  gasPrice: string
  gasToken: string
  refundReceiver: string
}

// Gas constants for transaction simulation
const DEFAULT_GAS_LIMIT = '0x7A120' // 100,000 gas
const DEFAULT_GAS_PRICE = '0x2E90EDD00' // 12 Gwei

// Helper function to ensure a value is in hex format
const ensureHex = (value: string): string => {
  // If it's already hex (starts with 0x), return as is
  if (value.startsWith('0x')) {
    return value
  }
  // If it's a decimal string, convert to hex
  return `0x${parseInt(value).toString(16)}`
}

// Helper function to create a Transaction from a Safe transaction
export const createTransactionFromSafeTx = (
  safeTx: EIP712SafeTx,
  requestId: string,
  creationDate: string
): Transaction => ({
  id: requestId, // Generate a random natural number ID for the transaction
  status: 'pending',
  timestamp: new Date(creationDate).getTime(),
  chainId: ensureHex(safeTx.chainId),
  from: safeTx.safeAddress, // This is the safe address not the sender of the off-chain message
  to: safeTx.to,
  value: ensureHex(safeTx.value),
  data: safeTx.data,
  gas: DEFAULT_GAS_LIMIT,
  maxFeePerGas: DEFAULT_GAS_PRICE,
  maxPriorityFeePerGas: DEFAULT_GAS_PRICE,
  nonce: ensureHex(safeTx.nonce),
  originalSafeTx: {
    ...safeTx,
    nonce: ensureHex(safeTx.nonce),
    chainId: ensureHex(safeTx.chainId),
    value: ensureHex(safeTx.value),
    safeTxGas: DEFAULT_GAS_LIMIT,
    baseGas: ensureHex(safeTx.baseGas),
    gasPrice: DEFAULT_GAS_PRICE,
    operation: ensureHex(safeTx.operation),
  },
})

export interface PairedDevice {
  id: string
  name: string
  lastConnected: string
  token: string
}

export interface Settings {
  ledgerHashCheckEnabled: boolean
  safeHashCheckEnabled: boolean
  clearSigningEnabled: boolean
  pairedDevices: PairedDevice[]
  customRpcUrl: string | null
}
