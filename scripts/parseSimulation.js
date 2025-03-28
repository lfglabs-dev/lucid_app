import { ethers } from 'ethers'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

async function parseSimulation() {
  const url = 'https://docs-demo.quiknode.pro/' // Quick node is the only one working

  // The exact transaction we want to simulate (transfer of one USR token on Ethereum)
  const tx = {
    from: '0x676ad4839a3cbb3739000153e4802bf4ce6aef3f',
    to: '0x40a2accbd92bca938b02010e17a5b8929b49130d', 
    data: '0x8d80ff0a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000045200a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044095ea7b30000000000000000000000006a000f20005980200259b80c5102003040001068ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff006a000f20005980200259b80c510200304000106800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000364e3ead59e000000000000000000000000000010036c0190e009a000d0fc3541100a07380a000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000000000000000000000000001bed78129de6d0000000000000000000000000000000000000000000000000001c1165612ec698914b37c35574219b7d274e72a46e48a0000000000000000000000000151d05f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001c0831bf48183b999fde45294b14b55199072f0801b000000c000440084ff00000b00000000000000000000000000000000000000000000000000000000c31b8d7a000000000000000000000000000010036c0190e009a000d0fc3541100a07380a000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000001000276a4000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000004000040000ff000007000000000000000000000000000000000000000000000000000000002e1a7d4d0000000000000000000000000000000000000000000000000001c1165612ec696a000f20005980200259b80c51020030400010680000002000000000ff04000900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    value: '0x0',
    gas: '0x7A120',              // 500,000 gas limit
    maxFeePerGas: '0x2E90EDD00', // 12 Gwei
    maxPriorityFeePerGas: '0x1DCD65000', // 8 Gwei
  }
  
  const request = {
    blockStateCalls: [
      {
        blockOverrides: {
          baseFeePerGas: tx.maxFeePerGas,
        },
        stateOverrides: {},
        calls: [tx], // Just the single transfer call
      },
    ],
    validation: true,
    traceTransfers: true,
  }

  try {
    console.log('Simulating token transfer on Ethereum:')
    console.log('- From:', tx.from)
    console.log('- To:', tx.to)
    console.log('- Data:', tx.data)


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
    if (!data.result || !Array.isArray(data.result) || data.result.length === 0) {
      console.error('Invalid response structure:', data)
      return
    }

    const block = data.result[0]
    console.log('\nSimulation Results:')
    console.log('==================')
    console.log(`Block Number: ${parseInt(block.number, 16)}`)
    console.log(`Base Fee Per Gas: ${parseInt(block.baseFeePerGas, 16)} wei`)
    console.log(`Total Gas Used: ${parseInt(block.gasUsed, 16)}`)
    console.log(`Timestamp: ${new Date(parseInt(block.timestamp, 16) * 1000).toISOString()}`)
    
    // Write the full simulation data to a JSON file
    const outputPath = path.join(process.cwd(), 'scripts', 'simulation-data.json')
    fs.writeFileSync(outputPath, JSON.stringify(data.result[0].calls[0], null, 2))
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
