import { ethers } from 'ethers'

// Safe contract ABI for the execTransaction function
const SAFE_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
      { internalType: 'uint8', name: 'operation', type: 'uint8' },
      { internalType: 'uint256', name: 'safeTxGas', type: 'uint256' },
      { internalType: 'uint256', name: 'baseGas', type: 'uint256' },
      { internalType: 'uint256', name: 'gasPrice', type: 'uint256' },
      { internalType: 'address', name: 'gasToken', type: 'address' },
      { internalType: 'address', name: 'refundReceiver', type: 'address' },
      { internalType: 'bytes', name: 'signatures', type: 'bytes' },
    ],
    name: 'execTransaction',
    outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

// RPC URL from api.ts
const RPC_URL =
  'https://eth-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE'

/**
 * Converts an EIP712SafeTx to a SafeExecTransaction format
 * @param {Object} safeTx - The EIP712SafeTx object
 * @param {string} rpcUrl - The RPC URL to use for the contract call
 * @returns {Promise<Object>} - The SafeExecTransaction object
 */
async function computeSafeExecHash(safeTx, rpcUrl) {
  try {
    // Create a provider
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Create a contract instance for the Safe contract
    const safeContract = new ethers.Contract(
      safeTx.safeAddress,
      SAFE_ABI,
      provider
    )

    const signer = safeTx.from // the 'from' address

    // Generate a special signature
    const signatures = ethers.concat([
      ethers.zeroPadValue(signer, 32), // r
      ethers.toBeHex(0, 32), // s
      ethers.toBeHex(1), // v
    ])

    // Encode the execTransaction function
    const encodedData = safeContract.interface.encodeFunctionData(
      'execTransaction',
      [
        safeTx.to,
        safeTx.value,
        safeTx.data,
        safeTx.operation,
        safeTx.safeTxGas,
        safeTx.baseGas,
        safeTx.gasPrice,
        safeTx.gasToken,
        safeTx.refundReceiver,
        signatures,
      ]
    )

    // Return the SafeExecTransaction format
    return {
      from: signer,
      to: safeTx.safeAddress,
      data: encodedData,
      value: safeTx.value,
    }
  } catch (error) {
    console.error('Error computing Safe exec hash:', error)
    throw error
  }
}

/**
 * Validates that the provided object has all required fields for an EIP712SafeTx
 * @param {Object} safeTx - The object to validate
 * @returns {boolean} - Whether the object is valid
 */
function validateSafeTx(safeTx) {
  const requiredFields = [
    'chainId',
    'safeAddress',
    'from',
    'to',
    'value',
    'data',
    'operation',
    'safeTxGas',
    'baseGas',
    'gasPrice',
    'gasToken',
    'refundReceiver',
  ]

  for (const field of requiredFields) {
    if (!(field in safeTx)) {
      console.error(`Missing required field: ${field}`)
      return false
    }
  }

  return true
}

async function callTransactionCoverApi(safeExecTx) {
  try {
    const requestPayload = {
      chainId: 1, // Ethereum mainnet
      transaction: safeExecTx,
      originUrl: 'https://lucid-website-one.vercel.app',
    }

    console.log('Sending cover request to OpenCover API...', requestPayload)

    const simulationResponse = await fetch(
      `https://api-sandbox.opencover.com/v1/transactions/cover`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OC-ApiKey': 'YOUR_API_KEY', // Replace with actual API key
        },
        body: JSON.stringify(requestPayload),
      }
    )

    const responseData = await simulationResponse.json()
    console.log('Transaction cover API response:', responseData)
  } catch (error) {
    console.error('Error calling transaction cover API:', error)
  }
}

/**
 * Main function to run the script
 */
async function main() {
  // EIP712SafeTx object with the provided data
  const safeTx = {
    chainId: '1', // Assuming Ethereum mainnet
    safeAddress: '0x676ad4839a3cbb3739000153e4802bf4ce6aef3f', // Replace with actual Safe address
    from: '0x8CE19266498AcC8cE67e8D33ae479cE7932a9fE6', // This field is required but not in the provided data
    to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    value: '0x0',
    data: '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000f4240',
    operation: '0',
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
  }

  try {
    // Validate the SafeTx object
    if (!validateSafeTx(safeTx)) {
      console.error('Invalid EIP712SafeTx object')
      process.exit(1)
    }

    // Compute the SafeExecTransaction
    const result = await computeSafeExecHash(safeTx, RPC_URL)
    console.log('🔄 Result:', result)

    // Output the result
    console.log(JSON.stringify(result, null, 2))

    // Call the transaction cover API
    await callTransactionCoverApi(result)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()

export { computeSafeExecHash }
