import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TENDERLY_API_URL = 'https://mainnet.gateway.tenderly.co/YOUR_API_KEY_HERE';

console.log('TENDERLY_API_URL', TENDERLY_API_URL);
const simulationPayload = {
    id: 0,
    jsonrpc: '2.0',
    method: 'tenderly_simulateTransaction',
    params: [
        {
            chainId: 1,
            data: '0xed99f46900000000000000000000000088ffb774b8583c1c9a2b71b7391861c0be2539930000000000000000000000000000000000000000000017ba2847dc0e8600ccac0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000f1c7ef04e5a65416a15562f7cece4a6723295d3a8140ee900d6831ad7168a25525fcbaa635ebfcbd3561487a33eaa692f70b4c97611c8ce6e0fdba2a5580d9a1f90404cc6c08bfb7a41ffde79931a038e7eaaca63caef37dfb284b29f27619c678ed37112a72f296fc91ef03ffdc349497756e1ec3a9c8f37e356b922737a29d93473cc29286d14553481b28b8d340bf9474da6ddf271d5ef1b6d839bd450d3d70718306fa3f93f4f3758fdf853e30308e02e6596659de852040c94babb06c39fa932952374b96b58722b3e1724f781afd7283a3dcd7c7ae20fa190c52f6472cc2a77f58bc4840ef463dac759adc5df8ba8d99d6bb89d40f09e2487244f9d673897ced0fb110f01fe655253bc1b43a3ad7a5704b5997d41090b9186bca7daf05560ef5f061af16d3767aa6c2bd5be949f2203b35cde834a1b6ce829bd1aadf1a489cfa23b52b28c6e8606ebcd97d5c9550c74ed12f582f7f5c1f6c91b9357a7c8fbd93850aa999459744ab7df004272add6462597b99fd6170a471da9a4287805777ed1075538d4a6a4acc7e7a51b345574e69d97119d7a7763745ebd101cf3286fb5c18d90654aa0afa864b91a0723ca027e1aaa669f6dc5ad0dfa8f349eff8aa0d48be82a0e0c3cfa751a40e26a9d5e40988c640423d6861213bb7b6cf4d621',
            from: '0x88Ffb774b8583c1C9A2b71b7391861c0Be253993',
            gas: '0x2c315',
            gasPrice: '0x5f5e1000',
            nonce: '0xc4',
            to: '0x75cC0C0DDD2Ccafe6EC415bE686267588011E36A'
        },
        'latest'
    ]
};

export async function simulateTransaction() {
    try {
        console.log('Simulating transaction using Tenderly...');
        
        const response = await fetch(TENDERLY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(simulationPayload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Create results directory if it doesn't exist
        const resultsDir = path.join(__dirname, '../../results/tenderly');
        await fs.mkdir(resultsDir, { recursive: true });
        
        // Save simulation result to a JSON file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultPath = path.join(resultsDir, `tenderly-${timestamp}.json`);
        
        await fs.writeFile(
            resultPath,
            JSON.stringify({
                request: simulationPayload,
                response: result,
                timestamp: new Date().toISOString(),
                provider: 'tenderly',
                network: 'mainnet'
            }, null, 2),
            'utf8'
        );

        console.log(`\nTenderly Simulation completed! Results saved to: ${resultPath}`);
        console.log('\nSimulation response:');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error during Tenderly simulation:', error);
        process.exit(1);
    }
}

// Run directly if this is the main module
if (import.meta.url === fileURLToPath(import.meta.url)) {
    simulateTransaction();
} 