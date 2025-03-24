import { ethers } from 'ethers';
import { TokenInfo } from '../types';
import { formatAddress } from './utils';

export class TokenInfoService {
    private static instance: TokenInfoService;
    private tokenCache: Map<string, TokenInfo> = new Map();
    private chainCache: Map<string, TokenInfo> = new Map();
    private readonly TRUST_WALLET_COMMIT = "fa2403278ad8487d5be412381718194e810449cd";

    private constructor() {}

    public static getInstance(): TokenInfoService {
        if (!TokenInfoService.instance) {
            TokenInfoService.instance = new TokenInfoService();
        }
        return TokenInfoService.instance;
    }

    public clearCache(): void {
        this.tokenCache.clear();
        this.chainCache.clear();
    }

    private async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
        try {
            const baseUrl = `https://raw.githubusercontent.com/trustwallet/assets/${this.TRUST_WALLET_COMMIT}/blockchains/ethereum/assets/${ethers.getAddress(tokenAddress)}`;
            const infoUrl = `${baseUrl}/info.json`;
            const iconUrl = `${baseUrl}/logo.png`;

            const response = await fetch(infoUrl);

            if (!response.ok) {
                console.log('Token metadata not found in Trust Wallet, using default values');
                return {
                    chainId: '0x1',
                    address: tokenAddress,
                    name: `Token ${formatAddress(tokenAddress)}`,
                    symbol: `${formatAddress(tokenAddress)}`,
                    decimals: 18,
                    icon: '﹖',
                    warning: 'Unknown token - verify contract address'
                };
            }

            const data = await response.json();
            
            const tokenInfo: TokenInfo = {
                chainId: '0x1',
                address: tokenAddress,
                name: data.name,
                symbol: data.symbol,
                decimals: data.decimals,
                icon: iconUrl
            };

            return tokenInfo;
        } catch (error) {
            console.error('Error fetching token info:', error);
            return null;
        }
    }

    public async getTokenMetadata(chainId: string, tokenAddress: string): Promise<TokenInfo | null> {
        try {
            if (chainId !== '0x1') {
                console.error('Unsupported chain ID:', chainId);
                return null;
            }

            if (!tokenAddress) {
                console.error('Token address is required');
                return null;
            }

            const cacheKey = `${chainId}-${tokenAddress.toLowerCase()}`;
            
            if (this.tokenCache.has(cacheKey)) {
                return this.tokenCache.get(cacheKey)!;
            }

            const tokenInfo = await this.getTokenInfo(tokenAddress);
            if (!tokenInfo) {
                console.error('Token not found:', tokenAddress);
                return null;
            }

            this.tokenCache.set(cacheKey, tokenInfo);
            return tokenInfo;
        } catch (error) {
            console.error('Error in getTokenMetadata:', error);
            return null;
        }
    }

    public async getChainMetadata(chainId: string): Promise<TokenInfo | null> {
        try {
            if (chainId !== '0x1') {
                console.error('Unsupported chain ID:', chainId);
                return null;
            }

            if (this.chainCache.has(chainId)) {
                return this.chainCache.get(chainId)!;
            }

            const metadata: TokenInfo = {
                chainId: '0x1',
                address: '0x0000000000000000000000000000000000000000',
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
                icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
            };
            this.chainCache.set(chainId, metadata);
            return metadata;
        } catch (error) {
            console.error('Error in getChainMetadata:', error);
            return null;
        }
    }
} 