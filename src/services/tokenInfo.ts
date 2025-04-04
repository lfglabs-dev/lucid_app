import { ethers } from 'ethers'
import { TokenInfo } from '../types'
import { formatAddress } from './utils'
import { QUICKNODE_RPC } from '../constants/api'

export class TokenInfoService {
  private static instance: TokenInfoService
  private tokenCache: Map<string, TokenInfo> = new Map()
  private chainCache: Map<string, TokenInfo> = new Map()
  private readonly TOKEN_REPO_COMMIT =
    'c8287b6212fa26cfce025e7741998a3c70d84ec8'

  private constructor() {}

  public static getInstance(): TokenInfoService {
    if (!TokenInfoService.instance) {
      TokenInfoService.instance = new TokenInfoService()
    }
    return TokenInfoService.instance
  }

  public clearCache(): void {
    this.tokenCache.clear()
    this.chainCache.clear()
  }

  private async getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
    try {
      const url = `https://raw.githubusercontent.com/lfglabs-dev/lucid_tokens/${this.TOKEN_REPO_COMMIT}/tokens/ethereum/${ethers.getAddress(tokenAddress).toLowerCase()}.json`
      console.log('Fetching token info from:', url)
      const response = await fetch(url)

      if (!response.ok) {
        console.log(
          'Token metadata not found in lucid_tokens for address: ',
          ethers.getAddress(tokenAddress),
          ' attempting to fetch from RPC'
        )
        // Try to fetch from RPC
        return await this.getTokenInfoFromRPC(tokenAddress)
      }

      const data = await response.json()

      const tokenInfo: TokenInfo = {
        chainId: '0x1',
        address: tokenAddress,
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        decimals: data.decimals,
        icon: data.logo.src || '﹖',
      }

      return tokenInfo
    } catch (error) {
      console.error('Error fetching token info:', error)
      return null
    }
  }

  private async getTokenInfoFromRPC(tokenAddress: string): Promise<TokenInfo | null> {
    try {
      // Use RPC API for token metadata
      const provider = new ethers.JsonRpcProvider(QUICKNODE_RPC)
      
      // Call the RPC-specific endpoint
      const response = await provider.send(
        'qn_getTokenMetadataByContractAddress',
        [{contract: tokenAddress}]
      )
      
      // The response contains the token data directly
      if (response && response.name) {
        return {
          chainId: '0x1',
          address: tokenAddress,
          name: response.name,
          symbol: formatAddress(tokenAddress),
          decimals: Number(response.decimals),
          icon: '﹖', // RPC API doesn't provide an icon
          warning: 'This token is not verified, use at your own risk',
        }
      }
    } catch (error) {
      console.error('Error fetching from RPC API:', error)
    }
    
    // Single fallback for both error case and no data case
    return {
      chainId: '0x1',
      address: tokenAddress,
      name: `Token ${formatAddress(tokenAddress)}`,
      symbol: `${formatAddress(tokenAddress)}`,
      decimals: 18,
      icon: '﹖',
      warning: 'Unknown token - verify contract address',
    }
  }

  public async getTokenMetadata(
    chainId: string,
    tokenAddress: string
  ): Promise<TokenInfo | null> {
    try {
      // Handle ETH token
      if (
        tokenAddress.toLowerCase() ===
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      ) {
        const chainInfo = await this.getChainMetadata(chainId)
        if (!chainInfo) {
          throw new Error('Chain metadata not found')
        }
        return {
          chainId,
          address: tokenAddress,
          name: chainInfo.name,
          symbol: chainInfo.symbol || 'ETH',
          decimals: 18,
          icon: chainInfo.icon,
        }
      }

      // Check cache first
      const cacheKey = `${chainId}-${tokenAddress}`
      const cachedToken = this.tokenCache.get(cacheKey)
      if (cachedToken) {
        return cachedToken
      }

      if (chainId !== '0x1') {
        console.error('Unsupported chain ID:', chainId)
        return null
      }

      if (!tokenAddress) {
        console.error('Token address is required')
        return null
      }

      const tokenInfo = await this.getTokenInfo(tokenAddress)
      if (!tokenInfo) {
        console.error('Token not found:', tokenAddress)
        return null
      }

      this.tokenCache.set(cacheKey, tokenInfo)
      return tokenInfo
    } catch (error) {
      console.error('Error in getTokenMetadata:', error)
      return null
    }
  }

  public async getChainMetadata(chainId: string): Promise<TokenInfo | null> {
    try {
      if (chainId !== '0x1') {
        console.error('Unsupported chain ID:', chainId)
        return null
      }

      if (this.chainCache.has(chainId)) {
        return this.chainCache.get(chainId)!
      }

      const metadata: TokenInfo = {
        chainId: '0x1',
        address: '0x0000000000000000000000000000000000000000',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
      }
      this.chainCache.set(chainId, metadata)
      return metadata
    } catch (error) {
      console.error('Error in getChainMetadata:', error)
      return null
    }
  }
}
