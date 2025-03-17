import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC_URL = 'https://docs-demo.quiknode.pro/';

const rpcPayload = {
    jsonrpc: "2.0",
    method: "eth_simulateV1",
    params: [
        {
            blockStateCalls: [
                {
                    blockOverrides: {
                        baseFeePerGas: "0x9"
                    },
                    stateOverrides: {
                        "0x90bc0b43fa89027b2f2df93fa7028357370a026a": {
                            balance: "0x4a817c420"
                        }
                    },
                    calls: [
                        {
                            chainId: "0x2105", // 8453 in hex
                            from: "0x90bc0b43fa89027b2f2df93fa7028357370a026a",
                            to: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
                            value: "0x0",
                            data: "0xa9059cbb000000000000000000000000ff5361f2d4ab046409ace2e69926d7fac78b2be700000000000000000000000000000000000000000000000000000000000f4240",
                            gas: "0x17114",
                            maxFeePerGas: "0x33e140",
                            maxPriorityFeePerGas: "0x33e140",
                            nonce: "0x3c"
                        }
                    ]
                }
            ],
            validation: true,
            traceTransfers: true
        },
        "latest"
    ],
    id: 1
};

export async function simulateRpcCall() {
    try {
        console.log('\n=== Starting RPC Simulation ===');
        console.log('\nEndpoint:', RPC_URL);
        console.log('\nRequest payload:', JSON.stringify(rpcPayload, null, 2));
        console.log('\nTransaction details:');
        const tx = rpcPayload.params[0].blockStateCalls[0].calls[0];
        console.log('- Chain ID:', parseInt(tx.chainId, 16));
        console.log('- From:', tx.from);
        console.log('- To:', tx.to);
        console.log('- Value:', parseInt(tx.value, 16) / 1e18, 'ETH');
        console.log('- Gas:', parseInt(tx.gas, 16));
        console.log('- Max Fee Per Gas:', parseInt(tx.maxFeePerGas, 16));
        console.log('- Max Priority Fee Per Gas:', parseInt(tx.maxPriorityFeePerGas, 16));
        console.log('- Nonce:', parseInt(tx.nonce, 16));
        console.log('- Data:', tx.data);
        console.log('- State override: Added balance to from address');
        
        console.log('\nSending request...');
        const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            body: JSON.stringify(rpcPayload),
        });

        console.log('\nResponse status:', response.status);
        console.log('Response headers:', JSON.stringify(response.headers.raw(), null, 2));

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json();
        
        // Create results directory if it doesn't exist
        const resultsDir = path.join(__dirname, '../../../results/rpc');
        await fs.mkdir(resultsDir, { recursive: true });
        
        // Save simulation result to a JSON file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultPath = path.join(resultsDir, `rpc-simulation-${timestamp}.json`);
        
        const fullResult = {
            request: rpcPayload,
            response: result,
            timestamp: new Date().toISOString(),
            provider: 'quiknode',
            network: 'base',
            debug: {
                responseStatus: response.status,
                responseHeaders: response.headers.raw()
            }
        };

        await fs.writeFile(
            resultPath,
            JSON.stringify(fullResult, null, 2),
            'utf8'
        );

        console.log(`\nResults saved to: ${resultPath}`);
        console.log('\nRPC Response:', JSON.stringify(result, null, 2));

        // If there's an error in the RPC response
        if (result.error) {
            console.error('\nRPC Error:', result.error);
            process.exit(1);
        }

        // If we got a result, try to interpret it
        if (result.result) {
            console.log('\nResult interpretation:');
            if (result.result === '0x') {
                console.log('- Got empty result (0x). This could mean:');
                console.log('  1. The call was successful but returned no data');
                console.log('  2. The target address is not a contract');
                console.log('  3. The contract method returned void');
            } else {
                console.log('- Raw result:', result.result);
                console.log('- Hex length:', result.result.length - 2, 'bytes');
                // Try to decode if it looks like a number
                try {
                    const numericResult = parseInt(result.result, 16);
                    console.log('- As number:', numericResult);
                } catch (e) {
                    console.log('- Result is not a simple number');
                }
            }
        }

    } catch (error) {
        console.error('\n=== Error during RPC simulation ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run directly if this is the main module
if (import.meta.url === fileURLToPath(import.meta.url)) {
    simulateRpcCall();
}
