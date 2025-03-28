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
  nonce: string
}

export interface SimulationData {
  type: 'transfer' | 'approval'
  contractAddress: string
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

  static fromResponse(error: { message: string; code?: number; data?: string }): SimulationError {
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
  private readonly DOMAIN_SEPARATOR_TYPEHASH = "0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218";
  private readonly DOMAIN_SEPARATOR_TYPEHASH_OLD = "0x035aff83d86937d35b32e04f0ddc6ff469290eef2f1b692d8a815c89404d4749";
  private readonly SAFE_TX_TYPEHASH = "0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8";

  // TODO: In the future, we should decode method names from contract ABIs instead of hardcoding signatures
  // This would allow us to handle any contract interaction, not just predefined ones
  private readonly COMMON_METHOD_SIGNATURES: { [key: string]: string } = {
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
    '0xfb3bdb41': 'swapETHForExactTokens'
  }

  // Class properties for transaction data
  private readonly from: string; // This is the Safe contract address
  private readonly to: string;
  private readonly data: string;
  private readonly value: string;
  private readonly gas: string;
  private readonly maxFeePerGas: string;
  private readonly maxPriorityFeePerGas: string;
  private readonly chainId: string;
  private readonly nonce: string;
  
  constructor(
    transaction: SafeTxSimulationRequest,
    private tokenInfoService: TokenInfoService = TokenInfoService.getInstance()
  ) {
    // Initialize properties from the transaction request
    this.from = transaction.from; // This is the Safe contract address
    this.to = transaction.to;
    this.data = transaction.data;
    this.value = transaction.value;
    this.gas = transaction.gas;
    this.maxFeePerGas = transaction.maxFeePerGas;
    this.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas;
    this.chainId = transaction.chainId;
    this.nonce = transaction.nonce;
    console.log('SimulationParser initialized')
  }

  private getSafeVersion(): string {
    // Mock: always return version 1.3.0 for now
    return "1.3.0";
  }

  private getDomainSeparatorTypeHash(): string {
    const version = this.getSafeVersion();
    const cleanVersion = version.split('+')[0];
    
    // For version 1.2.0 and below, use the old typehash
    // For version 1.3.0 and above, use the new typehash
    return this.compareVersions(cleanVersion, '1.3.0') < 0 
      ? this.DOMAIN_SEPARATOR_TYPEHASH_OLD 
      : this.DOMAIN_SEPARATOR_TYPEHASH;
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      const diff = (parts1[i] || 0) - (parts2[i] || 0);
      if (diff !== 0) return diff;
    }
    
    return 0;
  }

  calculateDomainHash(): string {
    try {
      const domainSeparatorTypeHash = this.getDomainSeparatorTypeHash();
      
      // For legacy versions (<=1.2.0), we don't include chainId
      const version = this.getSafeVersion();
      const cleanVersion = version.split('+')[0];
      const isLegacyVersion = this.compareVersions(cleanVersion, '1.2.0') <= 0;
      
      if (isLegacyVersion) {
        const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'address'],
          [domainSeparatorTypeHash, this.from]
        );
        const hash = ethers.keccak256(encodedData);
        return hash;
      }

      // Modern version (>=1.3.0) with chainId
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'uint256', 'address'],
        [domainSeparatorTypeHash, BigInt(this.chainId), this.from]
      );
      const hash = ethers.keccak256(encodedData);
      return hash;
    } catch (error) {
      console.error('Error calculating domain hash:', error);
      throw new SimulationError('Failed to calculate domain hash');
    }
  }

  private async ethSimulateTxs(): Promise<SimulationResponse> {
    console.log('ethSimulateTxs:', {
      from: this.from,
      to: this.to,
      data: this.data,
      value: this.value,
      gas: this.gas,
      maxFeePerGas: this.maxFeePerGas,
      maxPriorityFeePerGas: this.maxPriorityFeePerGas,
      chainId: this.chainId
    })

    // Prepare simulation request
    const simulationRequest = {
      jsonrpc: '2.0',
      method: 'eth_simulateV1',
      params: [
        {
          blockStateCalls: [
            {
              blockOverrides: {
                baseFeePerGas: this.maxFeePerGas.startsWith('0x') ? this.maxFeePerGas : `0x${this.maxFeePerGas}`,
              },
              calls: [
                {
                  from: this.from,
                  to: this.to,
                  data: this.data,
                  value: this.value,
                  gas: this.gas.startsWith('0x') ? this.gas : `0x${this.gas}`,
                  maxFeePerGas: this.maxFeePerGas.startsWith('0x') ? this.maxFeePerGas : `0x${this.maxFeePerGas}`,
                  maxPriorityFeePerGas: this.maxPriorityFeePerGas.startsWith('0x') ? this.maxPriorityFeePerGas : `0x${this.maxPriorityFeePerGas}`,
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

    const response = await fetch('https://docs-demo.quiknode.pro/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simulationRequest),
    })

    if (!response.ok) {
      throw new SimulationError('Simulation request failed', response.status)
    }

    const result: SimulationResponse = await response.json()

    console.log('Simulation response 0:', result.result?.[0]?.calls?.[0])
    console.log('Simulation response logs:', result.result?.[0]?.calls?.[0].logs)

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
      console.log('Starting transaction simulation:', {
        from: this.from,
        to: this.to,
        data: this.data,
        value: this.value,
        gas: this.gas,
        maxFeePerGas: this.maxFeePerGas,
        maxPriorityFeePerGas: this.maxPriorityFeePerGas,
        chainId: this.chainId
      })

      const rawSimulationResponse = await this.ethSimulateTxs()
      const parsedSimulationResponse = await this.parseSimulation(rawSimulationResponse, this.chainId)
      if (!parsedSimulationResponse) {
        throw new SimulationError('No valid transaction data found in simulation')
      }
      return parsedSimulationResponse
    } catch (error) {
      throw SimulationError.fromError(error)
    }
  }

  private getOperationName(tokenAddress: string): string {
    try {
      // For ETH transfers, we know it's always a transfer operation if data is 0x
      if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' && this.data === '0x') {
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

      if (call.error) {
        console.error('Call error:', call.error)
        return null
      }

      // Look for Transfer or Approval events in the logs
      const transferEvents = call.logs?.filter(log => log.topics[0] === this.TRANSFER_EVENT_SIGNATURE) || []
      const approvalEvents = call.logs?.filter(log => log.topics[0] === this.APPROVAL_EVENT_SIGNATURE) || []

      if (transferEvents.length === 0 && approvalEvents.length === 0) {
        console.error('No transfer or approval events found in logs')
        return null
      }

      // Get token information from the first event (assuming all events are for the same token)
      const tokenAddress = (transferEvents[0]?.address || approvalEvents[0]?.address)
      if (!tokenAddress) {
        console.error('No token address found in events')
        return null
      }

      const token = await this.tokenInfoService.getTokenMetadata(chainId, tokenAddress)
      if (!token) {
        console.error('Token metadata not found for:', tokenAddress)
        return null
      }

      const operation = this.getOperationName(tokenAddress)

      // Handle multiple transfer events
      if (transferEvents.length > 0) {
        const changes = transferEvents.map(event => {
          const from = '0x' + event.topics[1].slice(26)
          const to = '0x' + event.topics[2].slice(26) === this.from ? 'yourself' : '0x' + event.topics[2].slice(26)
          const amount = BigInt(event.data)
          const formattedAmount = ethers.formatUnits(amount, token.decimals)
          const isIncrease = to.toLowerCase() === this.from.toLowerCase()
          
          return {
            type: (isIncrease ? 'increase' : 'decrease') as 'increase' | 'decrease',
            assetIcon: token.icon,
            assetSymbol: token.symbol,
            amount: formattedAmount,
            warning: token.warning,
            from: from,
            to: to,
          }
        })

        return {
          type: 'transfer',
          contractAddress: tokenAddress,
          from: this.from,
          to: this.to,
          operation,
          changes,
          chainId,
        }
      }

      // Handle multiple approval events
      if (approvalEvents.length > 0) {
        const changes = approvalEvents.map(event => {
          const amount = BigInt(event.data)
          const formattedAmount = ethers.formatUnits(amount, token.decimals)
          
          return {
            type: 'increase' as const,
            assetIcon: token.icon,
            assetSymbol: token.symbol,
            amount: formattedAmount,
          }
        })

        return {
          type: 'approval',
          contractAddress: tokenAddress,
          from: approvalEvents[0].topics[1].slice(26),
          to: approvalEvents[0].topics[2].slice(26),
          operation,
          changes,
          chainId,
        }
      }

      return null
    } catch (error) {
      console.error('Parse simulation error:', error)
      return null
    }
  }

  calculateMessageHash(): string {
    try {
      console.log('calculateMessageHash:', {
        to: this.to,
        value: this.value,
        data: this.data,
        gas: this.gas,
        maxFeePerGas: this.maxFeePerGas,
        maxPriorityFeePerGas: this.maxPriorityFeePerGas,
        chainId: this.chainId
      });

      // 1. Calculate data hash
      const dataHash = ethers.keccak256(this.data);

      // 2. Encode the SafeTx struct
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        [
          'bytes32', // typeHash
          'address', // to
          'uint256', // value
          'bytes32', // dataHash
          'uint8',   // operation
          'uint256', // safeTxGas
          'uint256', // baseGas
          'uint256', // gasPrice
          'address', // gasToken
          'address', // refundReceiver
          'uint256'  // nonce
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
          BigInt(this.nonce) // nonce (will be set by the Safe contract)
        ]
      );

      // 3. Calculate final message hash
      const messageHash = ethers.keccak256(encodedData);

      return messageHash;
    } catch (error) {
      console.error('Error calculating message hash:', error);
      throw new SimulationError('Failed to calculate message hash');
    }
  }
}
