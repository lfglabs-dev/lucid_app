import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALCHEMY_RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE';
// const ALCHEMY_RPC_URL = 'https://docs-demo.quiknode.pro/';

const rpcPayload = {
    id: 1,
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
        {
            "data": "0x",
            "from": "0x88ffb774b8583c1c9a2b71b7391861c0be253993",
            "to": "0x676ad4839a3cbb3739000153e4802bf4ce6aef3f",
            "value": "0xde0b6b3a7640000"
        },
        'latest'
    ]
};

export async function simulateRpcCall() {
    try {
        console.log('\n=== Starting RPC Simulation ===');
        console.log('\nEndpoint:', ALCHEMY_RPC_URL);
        console.log('\nRequest payload:', JSON.stringify(rpcPayload, null, 2));
        console.log('\nTransaction details:');
        console.log('- From:', rpcPayload.params[0].from);
        console.log('- To:', rpcPayload.params[0].to);
        console.log('- Value:', parseInt(rpcPayload.params[0].value, 16) / 1e18, 'ETH');
        console.log('- State override: Added balance to from address');
        
        console.log('\nSending request...');
        const response = await fetch(ALCHEMY_RPC_URL, {
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
            provider: 'quicknode',
            network: 'mainnet',
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
