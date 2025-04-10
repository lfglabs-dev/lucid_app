import { ethers } from 'ethers'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

// Function to format data for delegateCallExecute
function formatDelegateCallData(target, data) {
  // Function selector for delegateCallExecute
  const functionSelector = '0x9fe83978'

  // Pad target address to 32 bytes and ensure it's lowercase
  const paddedTarget = target.toLowerCase().replace('0x', '').padStart(64, '0')

  // Offset (0x40 in hex = 64 in decimal)
  const offset =
    '0000000000000000000000000000000000000000000000000000000000000040'

  // Calculate data length in hex (remove 0x prefix if present)
  const dataWithoutPrefix = data.startsWith('0x') ? data.slice(2) : data
  const dataLength = (dataWithoutPrefix.length / 2)
    .toString(16)
    .padStart(64, '0')

  // Combine all parts and ensure it starts with 0x
  return `0x${functionSelector.slice(2)}${paddedTarget}${offset}${dataLength}${dataWithoutPrefix}`
}

async function parseSimulation() {
  const url = 'https://docs-demo.quiknode.pro/' // Quick node is the only one working

  // The transaction we want to simulate
  const tx = {
    from: '0x1CA30326F0aB9Ab8F30435D32eA39c275C660D9e',
    to: '0x35d8949372d46b7a3d5a56006ae77b215fc69bc0',
    data: '0x95ea7b3000000000000000000000000111111125421ca6dc452d289314280a0f8842a650000000000000000000000000000000000000000000000a2a15d09519be00000',
    value: '0x0',
    gas: '0x11b48',
    maxFeePerGas: '0x14c16428e',
    maxPriorityFeePerGas: '0x395f7e',
  }

  const request = {
    blockStateCalls: [
      {
        blockOverrides: {
          baseFeePerGas: tx.maxFeePerGas,
        },
        // stateOverrides: {
        //   // Override the Safe address with our proxy contract
        //   '0x676ad4839a3cbb3739000153e4802bf4ce6aef3f': {
        //     code: '0x6080604052600436106100225760003560e01c80639fe839781461004957610023565b5b629205153660008037600080366000845af43d6000803e80610044573d6000fd5b3d6000f35b610063600480360381019061005e91906102eb565b610079565b60405161007091906103c6565b60405180910390f35b60606000808473ffffffffffffffffffffffffffffffffffffffff16846040516100a39190610424565b600060405180830381855af49150503d80600081146100de576040519150601f19603f3d011682016040523d82523d6000602084013e6100e3565b606091505b509150915081610128576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161011f90610498565b60405180910390fd5b809250505092915050565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061017282610147565b9050919050565b61018281610167565b811461018d57600080fd5b50565b60008135905061019f81610179565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101f8826101af565b810181811067ffffffffffffffff82111715610217576102166101c0565b5b80604052505050565b600061022a610133565b905061023682826101ef565b919050565b600067ffffffffffffffff821115610256576102556101c0565b5b61025f826101af565b9050602081019050919050565b82818337600083830152505050565b600061028e6102898461023b565b610220565b9050828152602081018484840111156102aa576102a96101aa565b5b6102b584828561026c565b509392505050565b600082601f8301126102d2576102d16101a5565b5b81356102e284826020860161027b565b91505092915050565b600080604083850312156103025761030161013d565b5b600061031085828601610190565b925050602083013567ffffffffffffffff81111561033157610330610142565b5b61033d858286016102bd565b9150509250929050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610381578082015181840152602081019050610366565b60008484015250505050565b600061039882610347565b6103a28185610352565b93506103b2818560208601610363565b6103bb816101af565b840191505092915050565b600060208201905081810360008301526103e0818461038d565b905092915050565b600081905092915050565b60006103fe82610347565b61040881856103e8565b9350610418818560208601610363565b80840191505092915050565b600061043082846103f3565b915081905092915050565b600082825260208201905092915050565b7f44656c65676174652063616c6c206661696c6564000000000000000000000000600082015250565b600061048260148361043b565b915061048d8261044c565b602082019050919050565b600060208201905081810360008301526104b181610475565b9050919050565b60006104c98261043b565b91506104d48261044c565b602082019050919050565b600060208201905081810360008301526104f8816104b1565b905091905056fea26469706673582212203e96f34ac95ff29da01f27c2e715937c3b3829ae9ffeb1111dd78145a79362dc64736f6c63430008120033',
        //   },
        //   // The original Gnosis Safe implementation
        //   '0x0000000000000000000000000000000000920515': {
        //     code: '0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea2646970667358221220d1429297349653a4918076d650332de1a1068c5f3e07c5c82360c277770b955264736f6c63430007060033',
        //   },
        // },
        calls: [tx],
      },
    ],
    validation: false, // Set to false to bypass signature validation
    traceTransfers: true,
  }

  try {
    console.log('Simulating Safe multicall on Ethereum:')
    console.log('- tx:', tx)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_simulateV1',
        params: [request, 'latest'],
        id: 1,
      }),
    })

    const data = await response.json()

    // Check for errors in the response
    if (data.error) {
      console.error('API Error:', data.error)
      return
    }

    // Check if we have valid results
    if (
      !data.result ||
      !Array.isArray(data.result) ||
      data.result.length === 0
    ) {
      console.error('Invalid response structure:', data)
      return
    }

    const block = data.result[0]
    console.log('\nSimulation Results:')
    console.log('==================')
    console.log(`Block Number: ${parseInt(block.number, 16)}`)
    console.log(`Base Fee Per Gas: ${parseInt(block.baseFeePerGas, 16)} wei`)
    console.log(`Total Gas Used: ${parseInt(block.gasUsed, 16)}`)
    console.log(
      `Timestamp: ${new Date(parseInt(block.timestamp, 16) * 1000).toISOString()}`
    )

    // Write the full simulation data to a JSON file
    const outputPath = path.join(
      process.cwd(),
      'scripts',
      '../results/simulation-data.json'
    )
    fs.writeFileSync(
      outputPath,
      JSON.stringify(data.result[0].calls[0], null, 2)
    )
    console.log(`\nFull simulation data has been written to: ${outputPath}`)
  } catch (error) {
    console.error('Error:', error)
    if (error.response) {
      console.error('Response data:', await error.response.text())
    }
  }
}

// Run the script
parseSimulation()
