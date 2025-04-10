import { ethers } from 'ethers'

// Transaction data from the context
const txData = {
  chainId: 1,
  to: '0x6a000f20005980200259b80c5102003040001068',
  value: '0x0',
  data: '0xe3ead59e000000000000000000000000000010036c0190e009a000d0fc3541100a07380a000000000000000000000000018008bfb33d285247a21d44e50697654f754e63000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000f404c00000000000000000000000000000000000000000000000000000000000f4240cfc1ca4f8da64b8c9d32e20e8d794ca100000000000000000000000001535254000000000000000000000000000000000000000000000000000000000000000008a3c2a819e3de7aca384c798269b3ce1cd0e43790000000000000000000000000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001a087870bca3f3fd6335c3f4ce8392d69350b4fa4e20000008000240004ff00000b0000000000000000000000000000000000000000000000000000000069328dec0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000010036c0190e009a000d0fc3541100a07380af6e72db5454dd049d0788e411b06cfaf16853042000000a000000000ff030000000000000000000000000000000000000000000000000000000000008d7ef9bb0000000000000000000000006a000f20005980200259b80c510200304000106800000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e8d4a51000',
  gas: '0x7d049',
  maxFeePerGas: '0x3b9aca00',
  maxPriorityFeePerGas: '0x3b9aca00',
  nonce: '0x43',
}

// Function to calculate transaction hash with different parameters
function calculateTransactionHash(txData, options = {}) {
  try {
    // Default options
    const {
      type = 2, // EIP-1559 transaction type
      useLegacyGasPrice = false,
      gasPrice = '0x0',
      chainId = parseInt(txData.chainId, 16),
      nonce = parseInt(txData.nonce, 16),
    } = options

    // Create a transaction object with the parameters
    const txParams = {
      to: txData.to,
      data: txData.data,
      value: txData.value,
      nonce: nonce,
      chainId: chainId,
    }

    // Add gas parameters based on transaction type
    if (type === 2) {
      // EIP-1559
      txParams.gas = txData.gas
      txParams.maxFeePerGas = txData.maxFeePerGas
      txParams.maxPriorityFeePerGas = txData.maxPriorityFeePerGas
    } else if (type === 1) {
      // EIP-2930
      txParams.gas = txData.gas
      txParams.gasPrice = txData.maxFeePerGas
    } else {
      // Legacy
      txParams.gas = txData.gas
      txParams.gasPrice = useLegacyGasPrice ? gasPrice : txData.maxFeePerGas
    }

    // Create the transaction object
    const tx = ethers.Transaction.from(txParams)

    return tx.unsignedHash
  } catch (error) {
    console.error('Error calculating transaction hash:', error)
    return null
  }
}

// Expected hash from Ledger
const expectedHash = '0x74…B75'

// Try different combinations of parameters
console.log('Trying different transaction parameter combinations...\n')

// Try EIP-1559 (type 2)
console.log('1. EIP-1559 (type 2):')
const hash1 = calculateTransactionHash(txData, { type: 2 })
console.log('Hash:', hash1)
console.log(
  'Match:',
  hash1.startsWith(expectedHash.slice(0, 2)) &&
    hash1.endsWith(expectedHash.slice(-2))
    ? '✅'
    : '❌'
)

// Try EIP-2930 (type 1)
console.log('\n2. EIP-2930 (type 1):')
const hash2 = calculateTransactionHash(txData, { type: 1 })
console.log('Hash:', hash2)
console.log(
  'Match:',
  hash2.startsWith(expectedHash.slice(0, 2)) &&
    hash2.endsWith(expectedHash.slice(-2))
    ? '✅'
    : '❌'
)

// Try Legacy transaction (type 0)
console.log('\n3. Legacy transaction (type 0):')
const hash3 = calculateTransactionHash(txData, { type: 0 })
console.log('Hash:', hash3)
console.log(
  'Match:',
  hash3.startsWith(expectedHash.slice(0, 2)) &&
    hash3.endsWith(expectedHash.slice(-2))
    ? '✅'
    : '❌'
)

// Try Legacy transaction with custom gas price
console.log('\n4. Legacy transaction with custom gas price:')
const hash4 = calculateTransactionHash(txData, {
  type: 0,
  useLegacyGasPrice: true,
  gasPrice: '0x4a817c800', // 20 Gwei
})
console.log('Hash:', hash4)
console.log(
  'Match:',
  hash4.startsWith(expectedHash.slice(0, 2)) &&
    hash4.endsWith(expectedHash.slice(-2))
    ? '✅'
    : '❌'
)

// Try with different chainId
console.log('\n5. Different chainId (Ethereum Mainnet):')
const hash5 = calculateTransactionHash(txData, {
  type: 2,
  chainId: 1,
})
console.log('Hash:', hash5)
console.log(
  'Match:',
  hash5.startsWith(expectedHash.slice(0, 2)) &&
    hash5.endsWith(expectedHash.slice(-2))
    ? '✅'
    : '❌'
)

// Try with different nonce
console.log('\n6. Different nonce:')
const hash6 = calculateTransactionHash(txData, {
  type: 2,
  nonce: parseInt(txData.nonce, 16) + 1,
})
console.log('Hash:', hash6)
console.log(
  'Match:',
  hash6.startsWith(expectedHash.slice(0, 2)) &&
    hash6.endsWith(expectedHash.slice(-2))
    ? '✅'
    : '❌'
)

// Try with RLP encoding similar to Ledger's approach
console.log('\n7. RLP encoding approach (similar to Ledger):')
function calculateHashWithRLP(txData, type = 2) {
  try {
    // Create a transaction object
    const txParams = {
      to: txData.to,
      data: txData.data,
      value: txData.value,
      nonce: parseInt(txData.nonce, 16),
      chainId: parseInt(txData.chainId, 16),
    }

    // Add gas parameters based on transaction type
    if (type === 2) {
      // EIP-1559
      txParams.gas = txData.gas
      txParams.maxFeePerGas = txData.maxFeePerGas
      txParams.maxPriorityFeePerGas = txData.maxPriorityFeePerGas
    } else if (type === 1) {
      // EIP-2930
      txParams.gas = txData.gas
      txParams.gasPrice = txData.maxFeePerGas
    } else {
      // Legacy
      txParams.gas = txData.gas
      txParams.gasPrice = txData.maxFeePerGas
    }

    // Create the transaction object
    const tx = ethers.Transaction.from(txParams)

    // Get the raw RLP encoded transaction (using unsignedSerialized instead of serialized)
    const rlpEncoded = tx.unsignedSerialized

    // Calculate keccak256 hash of the RLP encoded transaction
    const hash = ethers.keccak256(rlpEncoded)

    return hash
  } catch (error) {
    console.error('Error calculating RLP hash:', error)
    return null
  }
}

const hash7 = calculateHashWithRLP(txData, 2)
console.log('Hash:', hash7)
console.log(
  'Match:',
  hash7.startsWith(expectedHash.slice(0, 2)) &&
    hash7.endsWith(expectedHash.slice(-2))
    ? '✅'
    : '❌'
)

// Try with raw RLP encoding
console.log('\n8. Raw RLP encoding approach:')
function calculateHashWithRawRLP(txData, type = 2) {
  try {
    // Create a transaction object
    const txParams = {
      to: txData.to,
      data: txData.data,
      value: txData.value,
      nonce: parseInt(txData.nonce, 16),
      chainId: parseInt(txData.chainId, 16),
    }

    // Add gas parameters based on transaction type
    if (type === 2) {
      // EIP-1559
      txParams.gas = txData.gas
      txParams.maxFeePerGas = txData.maxFeePerGas
      txParams.maxPriorityFeePerGas = txData.maxPriorityFeePerGas
    } else if (type === 1) {
      // EIP-2930
      txParams.gas = txData.gas
      txParams.gasPrice = txData.maxFeePerGas
    } else {
      // Legacy
      txParams.gas = txData.gas
      txParams.gasPrice = txData.maxFeePerGas
    }

    // Create the transaction object
    const tx = ethers.Transaction.from(txParams)

    // Get the raw RLP encoded transaction
    const rlpEncoded = tx.unsignedSerialized

    // Calculate keccak256 hash of the RLP encoded transaction
    const hash = ethers.keccak256(rlpEncoded)

    return hash
  } catch (error) {
    console.error('Error calculating raw RLP hash:', error)
    return null
  }
}

const hash8 = calculateHashWithRawRLP(txData, 2)
console.log('Hash:', hash8)
console.log(
  'Match:',
  hash8.startsWith(expectedHash.slice(0, 2)) &&
    hash8.endsWith(expectedHash.slice(-2))
    ? '✅'
    : '❌'
)
