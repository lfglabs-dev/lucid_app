import { ethers } from 'ethers'
import { TokenInfoService } from './tokenInfo'

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
}

export interface SimulationData {
  type: 'transfer' | 'approval'
  contractAddress: string
  amount: string
  from: string
  to: string
  changes: Array<{
    type: 'decrease' | 'increase'
    assetIcon: string
    assetSymbol: string
    amount: string
    warning?: string
  }>
  chainId: string
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

  static fromResponse(error: { message: string; code?: number; data?: string }): SimulationError {
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

  constructor(private tokenInfoService: TokenInfoService = TokenInfoService.getInstance()) {
    console.log('SimulationParser initialized')
  }

  private async handleNativeTransfer(transaction: SafeTxSimulationRequest): Promise<SimulationData | null> {
    try {
      console.log('Handling native transfer:', {
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
      })

      const chainInfo = await this.tokenInfoService.getChainMetadata(transaction.chainId)
      if (!chainInfo) {
        throw new SimulationError('Chain metadata not found')
      }

      return {
        type: 'transfer',
        contractAddress: '0x0000000000000000000000000000000000000000',
        amount: ethers.formatEther(transaction.value),
        from: transaction.from,
        to: transaction.to,
        changes: [
          {
            type: 'decrease',
            assetIcon: chainInfo.icon,
            assetSymbol: chainInfo.symbol || 'ETH',
            amount: ethers.formatEther(transaction.value),
          },
        ],
        chainId: transaction.chainId,
      }
    } catch (error) {
      console.error('Error handling native transfer:', error)
      return null
    }
  }

  async simulateSafeTransaction(transaction: SafeTxSimulationRequest): Promise<SimulationData> {
    try {
      console.log('Starting transaction simulation:', {
        from: transaction.from,
        to: transaction.to,
        chainId: transaction.chainId,
        dataLength: transaction.data.length,
        value: transaction.value,
      })

      // Check for native transfer first
      if (
        (!transaction.data || transaction.data === '0x') &&
        transaction.value &&
        BigInt(transaction.value) > 0
      ) {
        const nativeTransfer = await this.handleNativeTransfer(transaction)
        if (nativeTransfer) {
          return nativeTransfer
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
                  baseFeePerGas: transaction.maxFeePerGas,
                },
                calls: [
                  {
                    from: transaction.from,
                    to: transaction.to,
                    data: transaction.data,
                    value: transaction.value,
                    gas: transaction.gas,
                    maxFeePerGas: transaction.maxFeePerGas,
                    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
                  },
                ],
              },
            ],
            validation: true,
            traceTransfers: true,
          },
          'latest',
        ],
        id: 1,
      }

      console.log('Making RPC call to QuickNode...')
      const response = await fetch('https://docs-demo.quiknode.pro/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulationRequest),
      })

      if (!response.ok) {
        throw new SimulationError('Simulation request failed', response.status)
      }

      const result: SimulationResponse = await response.json()

      console.log('Simulation response:', result)
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

      const simulationData = await this.parseSimulationResult(result, transaction.chainId)
      if (!simulationData) {
        throw new SimulationError('No valid transaction data found in simulation')
      }

      return simulationData
    } catch (error) {
      throw SimulationError.fromError(error)
    }
  }

  private async parseSimulationResult(
    response: SimulationResponse,
    chainId: string
  ): Promise<SimulationData | null> {
    try {
      console.log('Parsing simulation result...')

      if (!response.result?.[0]?.calls?.[0]) {
        console.error('Invalid simulation response structure:', response)
        return null
      }

      const call = response.result[0].calls[0]
      console.log('Simulation call details:', {
        status: call.status,
        gasUsed: call.gasUsed,
        logsCount: call.logs?.length || 0,
      })

      if (call.error) {
        console.error('Call error:', call.error)
        return null
      }

      // Look for Transfer or Approval events in the logs
      const transferEvent = call.logs?.find(log => log.topics[0] === this.TRANSFER_EVENT_SIGNATURE)

      const approvalEvent = call.logs?.find(log => log.topics[0] === this.APPROVAL_EVENT_SIGNATURE)

      if (!transferEvent && !approvalEvent) {
        console.log('No transfer or approval events found in logs')
        return null
      }

      // Get token information
      const tokenAddress = transferEvent?.address || approvalEvent?.address
      if (!tokenAddress) {
        console.error('No token address found in events')
        return null
      }

      console.log('Fetching token metadata for:', tokenAddress)
      const token = await this.tokenInfoService.getTokenMetadata(chainId, tokenAddress)

      if (!token) {
        console.error('Token metadata not found for:', tokenAddress)
        return null
      }

      console.log('Token metadata found:', {
        symbol: token.symbol,
        decimals: token.decimals,
        icon: token.icon,
      })

      if (transferEvent) {
        console.log('Found transfer event:', {
          address: transferEvent.address,
          topics: transferEvent.topics,
          data: transferEvent.data,
        })

        // Parse transfer event data
        const from = '0x' + transferEvent.topics[1].slice(26)
        const to = '0x' + transferEvent.topics[2].slice(26)
        const amount = BigInt(transferEvent.data)
        const formattedAmount = ethers.formatUnits(amount, token.decimals)

        console.log('Parsed transfer data:', {
          from,
          to,
          amount: amount.toString(),
        })

        return {
          type: 'transfer',
          contractAddress: tokenAddress,
          amount: formattedAmount,
          from,
          to,
          changes: [
            {
              type: 'decrease' as const,
              assetIcon: token.icon,
              assetSymbol: token.symbol,
              amount: formattedAmount,
              warning: token.warning,
            },
          ],
          chainId,
        }
      }

      if (approvalEvent) {
        console.log('Found approval event:', {
          address: approvalEvent.address,
          topics: approvalEvent.topics,
          data: approvalEvent.data,
        })

        // Parse approval event data
        const owner = '0x' + approvalEvent.topics[1].slice(26)
        const spender = '0x' + approvalEvent.topics[2].slice(26)
        const amount = BigInt(approvalEvent.data)
        const formattedAmount = ethers.formatUnits(amount, token.decimals)

        console.log('Parsed approval data:', {
          owner,
          spender,
          amount: amount.toString(),
        })

        return {
          type: 'approval',
          contractAddress: tokenAddress,
          amount: formattedAmount,
          from: owner,
          to: spender,
          changes: [
            {
              type: 'increase' as const,
              assetIcon: token.icon,
              assetSymbol: token.symbol,
              amount: formattedAmount,
            },
          ],
          chainId,
        }
      }

      return null
    } catch (error) {
      console.error('Parse simulation error:', error)
      return null
    }
  }
}
