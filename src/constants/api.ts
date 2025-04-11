// API configuration
export const API_BASE_URL = 'https://api.lucid.lfg.rs'
// Default RPC URL
export const RPC_URL =
  'https://eth-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE'

// Chain mapping for EVM chains
export const CHAINS: Record<string, string> = {
  'world-chain':
    'https://worldchain-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  ethereum:
    'https://eth-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  zksync:
    'https://zksync-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  optimism:
    'https://opt-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  'polygon-pos':
    'https://polygon-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  arbitrum:
    'https://arb-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  mantle:
    'https://mantle-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  berachain:
    'https://berachain-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  blast:
    'https://blast-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  linea:
    'https://linea-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  zora: 'https://zora-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  base: 'https://base-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  scroll:
    'https://scroll-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  gnosis:
    'https://gnosis-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  'binance-smart-chain':
    'https://bnb-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
  avalanche:
    'https://avax-mainnet.g.alchemy.com/v2/KmwG40UUX-Ih0ngWRLqV8nebiDIpcstE',
}

// Chrome extension URL and sharing message
export const CHROME_EXTENSION_URL =
  'https://chrome.google.com/webstore/detail/lucid/your-extension-id' // TODO: Add the actual URL
export const SHARE_MESSAGE =
  'Hey Myself ! Remember to install the Lucid Chrome Extension to make your wallet safe again.'
