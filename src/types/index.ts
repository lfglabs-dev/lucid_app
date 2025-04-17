export interface TokenInfo {
  chainId: string
  address: string
  name: string
  symbol: string
  decimals: number
  icon: string
  warning?: string // Optional warning message for unknown or unverified tokens
}

export interface ChainInfo {
  chainId: string
  name: string
  currency: TokenInfo
  icon: string
}

export type RequestType = 'eip712' | 'eoa_transaction'

export interface Transaction {
  id: string
  status: 'pending' | 'signed' | 'rejected'
  requestType: RequestType
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
  originalSigner: string
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

export interface EoaTx {
  nonce: string
  chainId: string
  from: string
  to: string
  value: string
  data: string
  gas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
}

export interface PairedDevice {
  id: string
  name: string
  lastConnected: string
  token: string
}

export interface Settings {
  ledgerHashCheckEnabled: boolean
  pairedDevices: PairedDevice[]
  customRpcUrl: string | null
}

export interface OnboardingState {
  hasCompletedOnboarding: boolean
}

// Types
export interface EthereumLog {
  address: string
  topics: string[]
  data: string
  blockNumber?: string
  transactionHash?: string
  logIndex?: string
}

export interface SimulationResponse {
  result?: Array<{
    number: string
    baseFeePerGas: string
    gasUsed: string
    timestamp: string
    calls?: Array<{
      status: string
      logs?: EthereumLog[]
      gasUsed: string
      error?: {
        code?: number
        message: string
        data?: string
      }
    }>
  }>
  error?: {
    code?: number
    message: string
    data?: string
  }
}

export type AssetChangeDirection = 'decrease' | 'increase'
export type AssetChangeType = 'approval' | 'transfer'

export type AssetChange = {
  type: AssetChangeType
  direction: AssetChangeDirection
  assetIcon: string
  assetSymbol: string
  assetDecimals: number
  amount: string
  from?: string
  to?: string
  warning?: string
}

export interface SimulationData {
  contractAddress: string
  from: string
  to: string
  changes: AssetChange[]
  chainId: string
  operation: string
  requestType: RequestType
}

export type VerificationStep = 'simulation' | 'verification' | 'success'

export interface CurrencyValue {
  amount: string
  currency: string
}

export interface CoverResult {
  policyId: string
  policyExpiry: number
  estimatedTxValue: CurrencyValue
  coveredTxValue: CurrencyValue
  coveredWallet: string
  signature: string
}
