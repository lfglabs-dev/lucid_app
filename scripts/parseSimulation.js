import { ethers } from 'ethers'
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

async function parseSimulation() {
    const url = 'https://docs-demo.quiknode.pro/' // Quick node is the only one working 

    // The exact transaction we want to simulate (transfer of one USR token on Ethereum)
    const tx = {
        from: "0x1ca30326f0ab9ab8f30435d32ea39c275c660d9e",
        to: "0x66a1e37c9b0eaddca17d3662d6c05f4decf3e110", // USR token address on Ethereum
        data: "0xa9059cbb00000000000000000000000088ffb774b8583c1c9a2b71b7391861c0be2539930000000000000000000000000000000000000000000000000de0b6b3a7640000",
        value: "0x0",
        gas: "0x14f72",
        maxFeePerGas: "0x83215600",
        maxPriorityFeePerGas: "0x83215600"
    }

    const request = {
        blockStateCalls: [{
            blockOverrides: {
                baseFeePerGas: tx.maxFeePerGas
            },
            stateOverrides: {},
            calls: [tx] // Just the single transfer call
        }],
        validation: true,
        traceTransfers: true
    }

    try {
        // Decode the transfer parameters for logging
        const recipient = "0x" + tx.data.slice(34, 74)
        const amount = BigInt("0x" + tx.data.slice(74))

        console.log('Simulating token transfer on Ethereum:')
        console.log('- From:', tx.from)
        console.log('- To:', recipient)
        console.log('- Amount:', ethers.utils.formatUnits(amount, 18), 'tokens')
        console.log('- Gas Limit:', parseInt(tx.gas, 16))
        console.log('- Max Fee:', parseInt(tx.maxFeePerGas, 16), 'wei')
        console.log('\nSending request to simulate...')

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_simulateV1",
                params: [request, "latest"],
                id: 1
            })
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
        console.log(`All Data: ${parseInt(tx.gas, 16)}`)

        // Parse each call
        block.calls.forEach((call, index) => {
            console.log(`\nCall ${index + 1}:`)
            console.log(`Gas Used: ${parseInt(call.gasUsed, 16)}`)
            console.log(`Status: ${call.status === '0x1' ? 'Success' : 'Failed'}`)
            
            if (call.error) {
                console.log(`Error: ${call.error.message}`)
            }

            // Parse Transfer events
            if (call.logs && call.logs.length > 0) {
                console.log('\nEvents:')
                call.logs.forEach((log, logIndex) => {
                    // Check if it's a Transfer event by signature
                    if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
                        console.log(`\nTransfer Event ${logIndex + 1}:`)
                        // Parse from/to addresses from topics
                        const from = '0x' + log.topics[1].slice(26)
                        const to = '0x' + log.topics[2].slice(26)
                        // Parse amount from data
                        const amount = BigInt(log.data)
                        
                        console.log(`From: ${from}`)
                        console.log(`To: ${to}`)
                        console.log(`Amount: ${ethers.utils.formatUnits(amount, 18)} tokens`)
                    } else {
                        console.log(`\nOther Event ${logIndex + 1}:`)
                        console.log(`Topics: ${log.topics.join(', ')}`)
                        console.log(`Data: ${log.data}`)
                    }
                })
            }
        })

    } catch (error) {
        console.error('Error:', error)
        if (error.response) {
            console.error('Response data:', await error.response.text())
        }
    }
}

// Run the script
parseSimulation()