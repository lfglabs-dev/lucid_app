import { TokenInfoService } from './tokenInfo'
import { SimulationData, Transaction } from '../types'
import { BaseSimulation, SimulationError } from './baseSimulation'
import { ethers } from 'ethers'

export class EoaSimulation extends BaseSimulation {
  constructor(
    transaction: Transaction,
    tokenInfoService: TokenInfoService = TokenInfoService.getInstance()
  ) {
    super(transaction, tokenInfoService)
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

  calculateTransactionHash(): string {
    try {
      // Create a transaction object with the parameters from BaseSimulation
      // Note: We don't include 'from' as it's not needed for hash calculation
      const txParams = {
        to: this.to,
        data: this.data,
        value: this.value,
        gas: this.gas,
        maxFeePerGas: this.maxFeePerGas,
        maxPriorityFeePerGas: this.maxPriorityFeePerGas,
        chainId: this.chainId,
        nonce: parseInt(this.nonce, 16), // Convert hex string to number
        type: 2, // EIP-1559 transaction type
      }

      console.log('txParams', txParams)

      // Create the transaction object
      const tx = ethers.Transaction.from(txParams)

      // Use unsignedSerialized for unsigned transactions
      const serializedTx = tx.unsignedSerialized

      // Calculate the keccak256 hash of the serialized transaction
      const txHash = ethers.keccak256(serializedTx)

      return txHash
    } catch (error) {
      console.error('Error calculating transaction hash:', error)
      throw new SimulationError('Failed to calculate transaction hash')
    }
  }
}
