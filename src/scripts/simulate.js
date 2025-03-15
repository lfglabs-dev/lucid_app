import { simulateRpcCall } from './rpc/simulateRpcTx.js';
import { simulateTransaction as simulateTenderlyTx } from './tenderly/simulateTenderlyTx.js';

// Get command line arguments
const args = process.argv.slice(2);
const simulationType = args.includes('--tenderly') ? 'tenderly' : 'rpc';

async function main() {
    console.log(`Running ${simulationType.toUpperCase()} simulation...`);
    
    try {
        if (simulationType === 'tenderly') {
            await simulateTenderlyTx();
        } else {
            await simulateRpcCall();
        }
    } catch (error) {
        console.error(`Error during ${simulationType} simulation:`, error);
        process.exit(1);
    }
}

main(); 