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

  private async handleNativeTransfer(): Promise<SimulationData | null> {
    try {
      const chainInfo = await this.tokenInfoService.getChainMetadata(this.chainId)
      if (!chainInfo) {
        throw new SimulationError('Chain metadata not found')
      }

      return {
        type: 'transfer',
        contractAddress: '0x0000000000000000000000000000000000000000',
        amount: ethers.formatEther(this.value),
        from: this.from,
        to: this.to,
        changes: [
          {
            type: 'decrease',
            assetIcon: chainInfo.icon,
            assetSymbol: chainInfo.symbol || 'ETH',
            amount: ethers.formatEther(this.value),
          },
        ],
        chainId: this.chainId,
      }
    } catch (error) {
      console.error('Error handling native transfer:', error)
      return null
    }
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

      // Check for native transfer first
      if (
        (!this.data || this.data === '0x') &&
        this.value &&
        BigInt(this.value) > 0
      ) {
        const nativeTransfer = await this.handleNativeTransfer()
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
                  baseFeePerGas: this.maxFeePerGas,
                },
                calls: [
                  {
                    from: this.from,
                    to: this.to,
                    data: this.data,
                    value: this.value,
                    gas: this.gas,
                    maxFeePerGas: this.maxFeePerGas,
                    maxPriorityFeePerGas: this.maxPriorityFeePerGas,
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

      const simulationData = await this.parseSimulationResult(result, this.chainId)
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
      const transferEvent = call.logs?.find(log => log.topics[0] === this.TRANSFER_EVENT_SIGNATURE)

      const approvalEvent = call.logs?.find(log => log.topics[0] === this.APPROVAL_EVENT_SIGNATURE)

      if (!transferEvent && !approvalEvent) {
        console.error('No transfer or approval events found in logs')
        return null
      }

      // Get token information
      const tokenAddress = transferEvent?.address || approvalEvent?.address
      if (!tokenAddress) {
        console.error('No token address found in events')
        return null
      }

      const token = await this.tokenInfoService.getTokenMetadata(chainId, tokenAddress)

      if (!token) {
        console.error('Token metadata not found for:', tokenAddress)
        return null
      }

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
