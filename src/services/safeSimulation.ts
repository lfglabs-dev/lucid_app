import { ethers } from 'ethers'
import { TokenInfoService } from './tokenInfo'
import { useStore } from '../store/useStore'
import { SimulationResponse, SimulationData, Transaction } from '../types'
import { BaseSimulation, SimulationError } from './baseSimulation'
import { toHexAddress } from './utils'

export class SafeSimulation extends BaseSimulation {
  private readonly DOMAIN_SEPARATOR_TYPEHASH =
    '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218'
  private readonly DOMAIN_SEPARATOR_TYPEHASH_OLD =
    '0x035aff83d86937d35b32e04f0ddc6ff469290eef2f1b692d8a815c89404d4749'
  private readonly SAFE_TX_TYPEHASH =
    '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8'
  private readonly MULTICALL_SELECTOR = '0x8d80ff0a' // Function selector for multicall
  private readonly SAFE_DELEGATE_CALL_ADDRESS = toHexAddress(
    '0x40a2accbd92bca938b02010e17a5b8929b49130d'
  ) // Safe delegate call contract
  private readonly SAFE_ORIGINAL_BYTECODE_IMP =
    '0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea2646970667358221220d1429297349653a4918076d650332de1a1068c5f3e07c5c82360c277770b955264736f6c63430007060033'
  private readonly SAFE_PROXY_BYTECODE_IMP =
    '0x6080604052600436106100225760003560e01c80639fe839781461004957610023565b5b629205153660008037600080366000845af43d6000803e80610044573d6000fd5b3d6000f35b610063600480360381019061005e91906102eb565b610079565b60405161007091906103c6565b60405180910390f35b60606000808473ffffffffffffffffffffffffffffffffffffffff16846040516100a39190610424565b600060405180830381855af49150503d80600081146100de576040519150601f19603f3d011682016040523d82523d6000602084013e6100e3565b606091505b509150915081610128576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161011f90610498565b60405180910390fd5b809250505092915050565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061017282610147565b9050919050565b61018281610167565b811461018d57600080fd5b50565b60008135905061019f81610179565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101f8826101af565b810181811067ffffffffffffffff82111715610217576102166101c0565b5b80604052505050565b600061022a610133565b905061023682826101ef565b919050565b600067ffffffffffffffff821115610256576102556101c0565b5b61025f826101af565b9050602081019050919050565b82818337600083830152505050565b600061028e6102898461023b565b610220565b9050828152602081018484840111156102aa576102a96101aa565b5b6102b584828561026c565b509392505050565b600082601f8301126102d2576102d16101a5565b5b81356102e284826020860161027b565b91505092915050565b600080604083850312156103025761030161013d565b5b600061031085828601610190565b925050602083013567ffffffffffffffff81111561033157610330610142565b5b61033d858286016102bd565b9150509250929050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610381578082015181840152602081019050610366565b60008484015250505050565b600061039882610347565b6103a28185610352565b93506103b2818560208601610363565b6103bb816101af565b840191505092915050565b600060208201905081810360008301526103e0818461038d565b905092915050565b600081905092915050565b60006103fe82610347565b61040881856103e8565b9350610418818560208601610363565b80840191505092915050565b600061043082846103f3565b915081905092915050565b600082825260208201905092915050565b7f44656c65676174652063616c6c206661696c6564000000000000000000000000600082015250565b600061048260148361043b565b915061048d8261044c565b602082019050919050565b600060208201905081810360008301526104b181610475565b9050919050565b60006104c98261043b565b91506104d48261044c565b602082019050919050565b600060208201905081810360008301526104f8816104b1565b905091905056fea26469706673582212203e96f34ac95ff29da01f27c2e715937c3b3829ae9ffeb1111dd78145a79362dc64736f6c63430008120033'

  constructor(
    transaction: Transaction,
    tokenInfoService: TokenInfoService = TokenInfoService.getInstance(
      transaction.chainId
    )
  ) {
    super(transaction, tokenInfoService)
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

  private isMulticall(): boolean {
    return (
      this.data.startsWith(this.MULTICALL_SELECTOR) &&
      this.to === this.SAFE_DELEGATE_CALL_ADDRESS
    )
  }

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

  protected override async ethSimulateTxs(): Promise<SimulationResponse> {
    const chainId = this.chainId || '0x1' // Default to Ethereum mainnet if not specified
    const rpcUrl = useStore.getState().getRpcUrlByChainId(chainId)

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

    const callContent = {
      from: this.from,
      to: contractCalled, // If it's a multicall, we need to use the self Safe contract address
      data: formattedData,
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
              stateOverrides,
              calls: [
                {
                  from: this.from,
                  to: contractCalled, // If it's a multicall, we need to use the self Safe contract address
                  data: formattedData,
                  value: this.value,
                  gas: this.gas,
                  maxFeePerGas: this.maxFeePerGas,
                  maxPriorityFeePerGas: this.maxPriorityFeePerGas,
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

    if (result.error) {
      throw SimulationError.fromResponse({ ...result.error, callContent })
    }

    if (!result.result?.[0]?.calls?.[0]) {
      throw new SimulationError('Invalid simulation response structure')
    }

    const call = result.result[0].calls[0]

    if (call.error) {
      throw SimulationError.fromResponse({ ...call.error, callContent })
    }

    return result
  }

  async simulateTransaction(): Promise<SimulationData> {
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
          this.isMulticall() ? 1 : 0, // operation (0 for CALL)
          0n,
          0n, // baseGas
          0n,
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
