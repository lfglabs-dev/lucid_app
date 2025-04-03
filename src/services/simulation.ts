import { ethers } from 'ethers'
import { TokenInfoService } from './tokenInfo'
import { useStore } from '../store/useStore'

// Types
interface EthereumLog {
  address: string
  topics: string[]
  data: string
  blockNumber?: string
  transactionHash?: string
  logIndex?: string
}

interface SimulationResponse {
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

export interface SafeTxSimulationRequest {
  from: string
  to: string
  data: string
  value: string
  gas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  chainId: string
  nonce: string
}
type AssetChangeDirection = 'decrease' | 'increase'
type AssetChangeType = 'approval' | 'transfer'

type AssetChanges = {
  type: AssetChangeType
  direction: AssetChangeDirection
  assetIcon: string
  assetSymbol: string
  amount: string
  from?: string
  to?: string
  warning?: string
}

export interface SimulationData {
  contractAddress: string
  from: string
  to: string
  changes: AssetChanges[]
  chainId: string
  operation: string
}

export class SimulationError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly data?: string
  ) {
    super(message)
    this.name = 'SimulationError'
  }

  static fromResponse(error: {
    message: string
    code?: number
    data?: string
  }): SimulationError {
    console.error('SimulationError fromResponse:', error)
    return new SimulationError(error.message, error.code, error.data)
  }

  static fromError(error: unknown): SimulationError {
    if (error instanceof SimulationError) {
      return error
    }
    if (error instanceof Error) {
      return new SimulationError(error.message)
    }
    return new SimulationError('Unknown simulation error')
  }
}

export class SimulationParser {
  private readonly TRANSFER_EVENT_SIGNATURE =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  private readonly APPROVAL_EVENT_SIGNATURE =
    '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'
  private readonly DOMAIN_SEPARATOR_TYPEHASH =
    '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218'
  private readonly DOMAIN_SEPARATOR_TYPEHASH_OLD =
    '0x035aff83d86937d35b32e04f0ddc6ff469290eef2f1b692d8a815c89404d4749'
  private readonly SAFE_TX_TYPEHASH =
    '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8'
  private readonly MULTICALL_SELECTOR = '0x8d80ff0a' // Function selector for multicall
  private readonly SAFE_DELEGATE_CALL_ADDRESS =
    '0x40a2accbd92bca938b02010e17a5b8929b49130d' // Safe delegate call contract
  private readonly SAFE_ORIGINAL_BYTECODE_IMP =
    '0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea2646970667358221220d1429297349653a4918076d650332de1a1068c5f3e07c5c82360c277770b955264736f6c63430007060033'
  private readonly SAFE_PROXY_BYTECODE_IMP =
    '0x6080604052600436106100225760003560e01c80639fe839781461004957610023565b5b629205153660008037600080366000845af43d6000803e80610044573d6000fd5b3d6000f35b610063600480360381019061005e91906102eb565b610079565b60405161007091906103c6565b60405180910390f35b60606000808473ffffffffffffffffffffffffffffffffffffffff16846040516100a39190610424565b600060405180830381855af49150503d80600081146100de576040519150601f19603f3d011682016040523d82523d6000602084013e6100e3565b606091505b509150915081610128576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161011f90610498565b60405180910390fd5b809250505092915050565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061017282610147565b9050919050565b61018281610167565b811461018d57600080fd5b50565b60008135905061019f81610179565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101f8826101af565b810181811067ffffffffffffffff82111715610217576102166101c0565b5b80604052505050565b600061022a610133565b905061023682826101ef565b919050565b600067ffffffffffffffff821115610256576102556101c0565b5b61025f826101af565b9050602081019050919050565b82818337600083830152505050565b600061028e6102898461023b565b610220565b9050828152602081018484840111156102aa576102a96101aa565b5b6102b584828561026c565b509392505050565b600082601f8301126102d2576102d16101a5565b5b81356102e284826020860161027b565b91505092915050565b600080604083850312156103025761030161013d565b5b600061031085828601610190565b925050602083013567ffffffffffffffff81111561033157610330610142565b5b61033d858286016102bd565b9150509250929050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610381578082015181840152602081019050610366565b60008484015250505050565b600061039882610347565b6103a28185610352565b93506103b2818560208601610363565b6103bb816101af565b840191505092915050565b600060208201905081810360008301526103e0818461038d565b905092915050565b600081905092915050565b60006103fe82610347565b61040881856103e8565b9350610418818560208601610363565b80840191505092915050565b600061043082846103f3565b915081905092915050565b600082825260208201905092915050565b7f44656c65676174652063616c6c206661696c6564000000000000000000000000600082015250565b600061048260148361043b565b915061048d8261044c565b602082019050919050565b600060208201905081810360008301526104b181610475565b9050919050565b60006104c98261043b565b91506104d48261044c565b602082019050919050565b600060208201905081810360008301526104f8816104b1565b905091905056fea26469706673582212203e96f34ac95ff29da01f27c2e715937c3b3829ae9ffeb1111dd78145a79362dc64736f6c63430008120033'

  // TODO: In the future, we should decode method names from contract ABIs instead of hardcoding signatures
  // This would allow us to handle any contract interaction, not just predefined ones
  private readonly COMMON_METHOD_SIGNATURES: { [key: string]: string } = {
    '0x8d80ff0a': 'multicall',
    '0xa9059cbb': 'transfer',
    '0x23b872dd': 'transferFrom',
    '0x095ea7b3': 'approve',
    '0x40c10f19': 'mint',
    '0x42966c68': 'burn',
    '0x79cc6790': 'burnFrom',
    '0x2e1a7d4d': 'withdraw',
    '0x3ccfd60b': 'withdrawAll',
    '0xdb2e21bc': 'deposit',
    '0xde0e9a3e': 'depositAll',
    '0x853828b6': 'stake',
    '0x9e1a00aa': 'unstake',
    '0x1c69d141': 'claim',
    '0x372500ab': 'claimAll',
    '0x4e71d92d': 'compound',
    '0x4e71e0c8': 'harvest',
    '0x38ed1739': 'swapExactTokensForTokens',
    '0x8803dbee': 'swapTokensForExactTokens',
    '0x7ff36ab5': 'swapExactETHForTokens',
    '0x4a25d94a': 'swapTokensForExactETH',
    '0x4f2be91f': 'swapExactTokensForETH',
    '0xfb3bdb41': 'swapETHForExactTokens',
  }

  // Class properties for transaction data
  private readonly from: string // This is the Safe contract address
  private readonly to: string
  private readonly data: string
  private readonly value: string
  private readonly gas: string
  private readonly maxFeePerGas: string
  private readonly maxPriorityFeePerGas: string
  private readonly chainId: string
  private readonly nonce: string

  constructor(
    transaction: SafeTxSimulationRequest,
    private tokenInfoService: TokenInfoService = TokenInfoService.getInstance()
  ) {
    // Initialize properties from the transaction request
    this.from = transaction.from // This is the Safe contract address
    this.to = transaction.to
    this.data = transaction.data
    this.value = transaction.value
    this.gas = transaction.gas
    this.maxFeePerGas = transaction.maxFeePerGas
    this.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas
    this.chainId = transaction.chainId
    this.nonce = transaction.nonce
  }

  private getSafeVersion(): string {
    // Mock: always return version 1.3.0 for now
    return '1.3.0'
  }

  private getDomainSeparatorTypeHash(): string {
    const version = this.getSafeVersion()
    const cleanVersion = version.split('+')[0]

    // For version 1.2.0 and below, use the old typehash
    // For version 1.3.0 and above, use the new typehash
    return this.compareVersions(cleanVersion, '1.3.0') < 0
      ? this.DOMAIN_SEPARATOR_TYPEHASH_OLD
      : this.DOMAIN_SEPARATOR_TYPEHASH
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < 3; i++) {
      const diff = (parts1[i] || 0) - (parts2[i] || 0)
      if (diff !== 0) return diff
    }

    return 0
  }

  calculateDomainHash(): string {
    try {
      const domainSeparatorTypeHash = this.getDomainSeparatorTypeHash()

      // For legacy versions (<=1.2.0), we don't include chainId
      const version = this.getSafeVersion()
      const cleanVersion = version.split('+')[0]
      const isLegacyVersion = this.compareVersions(cleanVersion, '1.2.0') <= 0

      if (isLegacyVersion) {
        const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'address'],
          [domainSeparatorTypeHash, this.from]
        )
        const hash = ethers.keccak256(encodedData)
        return hash
      }

      // Modern version (>=1.3.0) with chainId
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'uint256', 'address'],
        [domainSeparatorTypeHash, BigInt(this.chainId), this.from]
      )
      const hash = ethers.keccak256(encodedData)
      return hash
    } catch (error) {
      console.error('Error calculating domain hash:', error)
      throw new SimulationError('Failed to calculate domain hash')
    }
  }

  /**
   * Checks if the transaction data is a multicall
   * @param data The transaction data to check
   * @returns boolean indicating if it's a multicall
   */
  private isMulticall(): boolean {
    return (
      this.data.startsWith(this.MULTICALL_SELECTOR) &&
      this.to === this.SAFE_DELEGATE_CALL_ADDRESS
    )
  }

  /**
   * Formats data for delegate call
   * @returns Formatted data for delegate call
   */
  private formatDelegateCallData(): string {
    // Function selector for delegateCallExecute
    const functionSelector = '0x9fe83978'

    // Pad target address to 32 bytes and ensure it's lowercase
    const paddedTarget = this.SAFE_DELEGATE_CALL_ADDRESS.toLowerCase()
      .replace('0x', '')
      .padStart(64, '0')

    // Offset (0x40 in hex = 64 in decimal)
    const offset =
      '0000000000000000000000000000000000000000000000000000000000000040'

    // Calculate data length in hex (remove 0x prefix if present)
    const dataWithoutPrefix = this.data.startsWith('0x')
      ? this.data.slice(2)
      : this.data
    const dataLength = (dataWithoutPrefix.length / 2)
      .toString(16)
      .padStart(64, '0')

    // Combine all parts and ensure it starts with 0x
    return `0x${functionSelector.slice(2)}${paddedTarget}${offset}${dataLength}${dataWithoutPrefix}`
  }

  private async ethSimulateTxs(): Promise<SimulationResponse> {
    // Get the active RPC URL from the store
    const rpcUrl = useStore.getState().getActiveRpcUrl()

    // Check if this is a multicall and format data accordingly
    let formattedData = this.data
    let stateOverrides = {}
    let contractCalled = this.to

    if (this.isMulticall()) {
      contractCalled = this.from
      formattedData = this.formatDelegateCallData()
      stateOverrides = {
        // Override the Safe address with our proxy contract
        [this.from]: {
          code: this.SAFE_PROXY_BYTECODE_IMP,
        },
        // The original Gnosis Safe implementation
        '0x0000000000000000000000000000000000920515': {
          code: this.SAFE_ORIGINAL_BYTECODE_IMP,
        },
      }
    }

    // Prepare simulation request
    const simulationRequest = {
      jsonrpc: '2.0',
      method: 'eth_simulateV1',
      params: [
        {
          blockStateCalls: [
            {
              blockOverrides: {
                baseFeePerGas: this.maxFeePerGas.startsWith('0x')
                  ? this.maxFeePerGas
                  : `0x${this.maxFeePerGas}`,
              },
              stateOverrides,
              calls: [
                {
                  from: this.from,
                  to: contractCalled, // If it's a multicall, we need to use the self Safe contract address
                  data: formattedData,
                  value: this.value,
                  gas: this.gas.startsWith('0x') ? this.gas : `0x${this.gas}`,
                  maxFeePerGas: this.maxFeePerGas.startsWith('0x')
                    ? this.maxFeePerGas
                    : `0x${this.maxFeePerGas}`,
                  maxPriorityFeePerGas: this.maxPriorityFeePerGas.startsWith(
                    '0x'
                  )
                    ? this.maxPriorityFeePerGas
                    : `0x${this.maxPriorityFeePerGas}`,
                },
              ],
            },
          ],
          validation: false, // Set to false to bypass signature validation
          traceTransfers: true,
        },
        'latest',
      ],
      id: 1,
    }

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simulationRequest),
    })

    if (!response.ok) {
      throw new SimulationError('Simulation request failed', response.status)
    }

    const result: SimulationResponse = await response.json()

    // Check for top-level RPC errors
    if (result.error) {
      throw SimulationError.fromResponse(result.error)
    }

    // Validate response structure
    if (!result.result?.[0]?.calls?.[0]) {
      throw new SimulationError('Invalid simulation response structure')
    }

    const call = result.result[0].calls[0]

    // Check for execution errors
    if (call.error) {
      throw SimulationError.fromResponse(call.error)
    }

    return result
  }

  async simulateSafeTransaction(): Promise<SimulationData> {
    try {
      const rawSimulationResponse = await this.ethSimulateTxs()
      const parsedSimulationResponse = await this.parseSimulation(
        rawSimulationResponse,
        this.chainId
      )
      if (!parsedSimulationResponse) {
        throw new SimulationError(
          'No valid transaction data found in simulation'
        )
      }
      return parsedSimulationResponse
    } catch (error) {
      throw SimulationError.fromError(error)
    }
  }

  private getOperationName(): string {
    try {
      // For ETH transfers, we know it's always a transfer operation if data is 0x
      if (
        this.to.toLowerCase() ===
          '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' &&
        this.data === '0x'
      ) {
        return 'transfer'
      }

      // Get the method signature (first 4 bytes after 0x)
      const methodSignature = this.data.slice(0, 10)
      return this.COMMON_METHOD_SIGNATURES[methodSignature] || 'Unknown'
    } catch (error) {
      console.error('Error decoding operation name:', error)
      return 'Unknown'
    }
  }

  private async parseSimulation(
    response: SimulationResponse,
    chainId: string
  ): Promise<SimulationData | null> {
    try {
      if (!response.result?.[0]?.calls?.[0]) {
        console.error('Invalid simulation response structure:', response)
        return null
      }
      const call = response.result[0].calls[0]
      console.log('call', call)

      if (call.error) {
        console.error('Call error:', call.error)
        return null
      }

      // Group events by token address
      const eventsByToken = this.groupEventsByToken(call.logs || [])

      // Process each token's events
      const allChanges: AssetChanges[] = []

      // Process each token's events
      for (const [tokenAddress, events] of Object.entries(eventsByToken)) {
        const token = await this.tokenInfoService.getTokenMetadata(
          chainId,
          tokenAddress
        )
        if (!token) {
          console.error('Token metadata not found for:', tokenAddress)
          continue
        }

        const transferEvents = events.filter(
          (log) => log.topics[0] === this.TRANSFER_EVENT_SIGNATURE
        )
        const approvalEvents = events.filter(
          (log) => log.topics[0] === this.APPROVAL_EVENT_SIGNATURE
        )

        // Process transfer events
        for (const event of transferEvents) {
          const from = '0x' + event.topics[1].slice(26)
          const to = '0x' + event.topics[2].slice(26)
          const amount = BigInt(event.data)
          const formattedAmount = ethers.formatUnits(amount, token.decimals)

          // Determine if this is an increase or decrease for our address
          const isIncrease = to === this.from
          const isDecrease = from === this.from

          if (isIncrease || isDecrease) {
            allChanges.push({
              type: 'transfer',
              direction: isIncrease ? 'increase' : 'decrease',
              assetIcon: token.icon,
              assetSymbol: token.symbol,
              amount: formattedAmount,
              warning: token.warning,
              from: from,
              to: to,
            })
          }
        }

        // Process approval events
        for (const event of approvalEvents) {
          const amount = BigInt(event.data)
          const formattedAmount = ethers.formatUnits(amount, token.decimals)

          allChanges.push({
            type: 'approval',
            direction: 'increase',
            assetIcon: token.icon,
            assetSymbol: token.symbol,
            amount: formattedAmount,
          })
        }
      }

      if (allChanges.length === 0) {
        console.error('No valid changes found in events')
        return null
      }

      // Determine the operation type based on the changes
      const operation = this.getOperationName()

      return {
        contractAddress: this.to,
        from: this.from,
        to: this.to,
        operation,
        changes: allChanges,
        chainId,
      }
    } catch (error) {
      console.error('Parse simulation error:', error)
      return null
    }
  }

  private groupEventsByToken(logs: EthereumLog[]): {
    [key: string]: EthereumLog[]
  } {
    return logs.reduce(
      (acc, log) => {
        const tokenAddress = log.address.toLowerCase()
        if (!acc[tokenAddress]) {
          acc[tokenAddress] = []
        }
        acc[tokenAddress].push(log)
        return acc
      },
      {} as { [key: string]: EthereumLog[] }
    )
  }

  calculateMessageHash(): string {
    try {
      // 1. Calculate data hash
      const dataHash = ethers.keccak256(this.data)

      // 2. Encode the SafeTx struct
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        [
          'bytes32', // typeHash
          'address', // to
          'uint256', // value
          'bytes32', // dataHash
          'uint8', // operation
          'uint256', // safeTxGas
          'uint256', // baseGas
          'uint256', // gasPrice
          'address', // gasToken
          'address', // refundReceiver
          'uint256', // nonce
        ],
        [
          this.SAFE_TX_TYPEHASH,
          this.to,
          BigInt(this.value),
          dataHash,
          0, // operation (0 for CALL)
          BigInt(this.gas),
          0n, // baseGas
          BigInt(this.maxFeePerGas),
          '0x0000000000000000000000000000000000000000', // gasToken (ETH)
          '0x0000000000000000000000000000000000000000', // refundReceiver
          BigInt(this.nonce), // nonce (will be set by the Safe contract)
        ]
      )

      // 3. Calculate final message hash
      const messageHash = ethers.keccak256(encodedData)

      return messageHash
    } catch (error) {
      console.error('Error calculating message hash:', error)
      throw new SimulationError('Failed to calculate message hash')
    }
  }
}
