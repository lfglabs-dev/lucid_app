import { ethers } from 'ethers'
import { TokenInfoService } from './tokenInfo'
import { useStore } from '../store/useStore'
import {
  SimulationResponse,
  SimulationData,
  EthereumLog,
  AssetChange,
  Transaction,
  RequestType,
} from '../types'

export class SimulationError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly callContent?: any
  ) {
    super(message)
    this.name = 'SimulationError'
  }

  static fromResponse(error: {
    message: string
    code?: number
    callContent?: any
  }): SimulationError {
    console.error(
      'SimulationError fromResponse:',
      JSON.stringify(
        {
          ...error,
          callContent: error.callContent,
        },
        null,
        2
      )
    )
    return new SimulationError(error.message, error.code, error.callContent)
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

export abstract class BaseSimulation {
  protected readonly TRANSFER_EVENT_SIGNATURE =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  protected readonly APPROVAL_EVENT_SIGNATURE =
    '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'

  // Common method signatures for contract interactions
  protected readonly COMMON_METHOD_SIGNATURES: { [key: string]: string } = {
    '0xa9059cbb': 'transfer',
    '0x23b872dd': 'transferFrom',
    '0x95ea7b3': 'approve',
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

  // Common transaction properties
  protected readonly from: string
  protected readonly to: string
  protected readonly data: string
  protected readonly value: string
  protected readonly gas: string
  protected readonly maxFeePerGas: string
  protected readonly maxPriorityFeePerGas: string
  protected readonly chainId: string
  protected readonly nonce: string
  protected readonly requestType: RequestType

  constructor(
    transaction: Transaction,
    protected tokenInfoService: TokenInfoService = TokenInfoService.getInstance(
      transaction.chainId
    )
  ) {
    this.from = transaction.from
    this.to = transaction.to
    this.data = transaction.data
    this.value = transaction.value
    this.gas = transaction.gas
    this.maxFeePerGas = transaction.maxFeePerGas
    this.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas
    this.chainId = transaction.chainId
    this.nonce = transaction.nonce
    this.requestType = transaction.requestType
  }

  protected async ethSimulateTxs(): Promise<SimulationResponse> {
    const chainId = this.chainId || '0x1' // Default to Ethereum mainnet if not specified
    const rpcUrl = useStore.getState().getRpcUrlByChainId(chainId)

    const callContent = {
      from: this.from,
      to: this.to,
      data: this.data,
      value: this.value,
      gas: this.gas,
      maxFeePerGas: this.maxFeePerGas,
      maxPriorityFeePerGas: this.maxPriorityFeePerGas,
    }

    const simulationRequest = {
      jsonrpc: '2.0',
      method: 'eth_simulateV1',
      params: [
        {
          blockStateCalls: [
            {
              blockOverrides: {
                baseFeePerGas: this.maxFeePerGas,
              },
              stateOverrides: {},
              calls: [callContent],
            },
          ],
          validation: false,
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
      throw new SimulationError(
        'Simulation request failed',
        response.status,
        callContent
      )
    }

    const result: SimulationResponse = await response.json()

    if (result.error) {
      throw SimulationError.fromResponse({ ...result.error, callContent })
    }

    if (!result.result?.[0]?.calls?.[0]) {
      throw new SimulationError(
        'Invalid simulation response structure',
        undefined,
        callContent
      )
    }

    const call = result.result[0].calls[0]

    if (call.error) {
      throw SimulationError.fromResponse({ ...call.error, callContent })
    }

    return result
  }

  protected getOperationName(): string {
    try {
      if (this.value !== '0x0' && this.data === '0x') {
        return 'transfer'
      }

      const methodSignature = this.data.slice(0, 10)
      return this.COMMON_METHOD_SIGNATURES[methodSignature] || 'Unknown'
    } catch (error) {
      console.error('Error decoding operation name:', error)
      return 'Unknown'
    }
  }

  protected async parseSimulation(
    response: SimulationResponse,
    chainId: string
  ): Promise<SimulationData | null> {
    try {
      if (!response.result?.[0]?.calls?.[0]) {
        console.error('Invalid simulation response structure:', response)
        return null
      }
      const call = response.result[0].calls[0]

      if (call.error) {
        console.error('Call error:', call.error)
        return null
      }

      // Check if we have logs
      if (!call.logs || call.logs.length === 0) {
        console.error('No logs found in simulation response')
        return null
      }

      const eventsByToken = this.groupEventsByToken(call.logs || [])
      const allChanges: AssetChange[] = []

      for (const [tokenAddress, events] of Object.entries(eventsByToken)) {
        // Update the TokenInfoService chainId before getting token metadata
        this.tokenInfoService.setChainId(chainId)
        const token = await this.tokenInfoService.getTokenMetadata(tokenAddress)
        if (!token) {
          console.error('Token metadata not found for:', tokenAddress)
          continue
        }

        const transferEvents = events.filter(
          (log) => log.topics && log.topics[0] === this.TRANSFER_EVENT_SIGNATURE
        )
        const approvalEvents = events.filter(
          (log) =>
            log.topics &&
            log.topics[0] === this.APPROVAL_EVENT_SIGNATURE &&
            log.topics.length >= 3 &&
            '0x' + log.topics[1].slice(26).toLowerCase() ===
              this.from.toLowerCase()
        )

        // Deduplicate approval events
        const uniqueApprovalEvents = approvalEvents.reduce((unique, event) => {
          // Create a key based on owner, spender, and amount
          const key = `${event.topics[1]}-${event.topics[2]}-${event.data}`
          if (!unique.has(key)) {
            unique.set(key, event)
          }
          return unique
        }, new Map())

        console.log(
          `Found ${transferEvents.length} transfer events and ${approvalEvents.length} approval events (${uniqueApprovalEvents.size} unique)`
        )

        // Use the deduplicated approval events
        for (const event of Array.from(uniqueApprovalEvents.values())) {
          // Make sure we have enough topics
          if (!event.topics || event.topics.length < 3) {
            console.error('Invalid approval event format:', event)
            continue
          }

          const amount = BigInt(event.data)
          const formattedAmount = ethers.formatUnits(amount, token.decimals)

          allChanges.push({
            type: 'approval',
            direction: 'increase',
            assetIcon: token.icon,
            assetSymbol: token.symbol,
            assetDecimals: token.decimals,
            amount: formattedAmount,
          })
        }

        for (const event of transferEvents) {
          // Make sure we have enough topics
          if (!event.topics || event.topics.length < 3) {
            console.error('Invalid transfer event format:', event)
            continue
          }

          const from = '0x' + event.topics[1].slice(26)
          const to = '0x' + event.topics[2].slice(26)
          const amount = BigInt(event.data)
          const formattedAmount = ethers.formatUnits(amount, token.decimals)

          const isIncrease = to.toLowerCase() === this.from.toLowerCase()
          const isDecrease = from.toLowerCase() === this.from.toLowerCase()

          if (isIncrease || isDecrease) {
            allChanges.push({
              type: 'transfer',
              direction: isIncrease ? 'increase' : 'decrease',
              assetIcon: token.icon,
              assetSymbol: token.symbol,
              assetDecimals: token.decimals,
              amount: formattedAmount,
              warning: token.warning,
              from: from,
              to: to,
            })
          }
        }
      }

      if (allChanges.length === 0) {
        console.error('No valid changes found in events')
        return null
      }

      const operation = this.getOperationName()

      return {
        contractAddress: this.to,
        from: this.from,
        to: this.to,
        operation,
        changes: allChanges,
        chainId,
        requestType: this.requestType,
      }
    } catch (error) {
      console.error('Parse simulation error:', error)
      return null
    }
  }

  protected groupEventsByToken(logs: EthereumLog[]): {
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

  // Abstract method that must be implemented by derived classes
  abstract simulateTransaction(): Promise<SimulationData>
}
