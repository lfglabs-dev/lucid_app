import { ethers } from 'ethers'
import { TokenInfo } from '../types'
import { formatAddress } from './utils'
import { SimulationData } from './simulation'

export class TokenInfoService {
  private static instance: TokenInfoService
  private tokenCache: Map<string, TokenInfo> = new Map()
  private chainCache: Map<string, TokenInfo> = new Map()
  private readonly TOKEN_REPO_COMMIT = 'c8287b6212fa26cfce025e7741998a3c70d84ec8'

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
      const response = await fetch(url)

      if (!response.ok) {
        console.log('Token metadata not found in lucid_tokens, using default values')
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

  public async getTokenMetadata(chainId: string, tokenAddress: string): Promise<TokenInfo | null> {
    try {
      // Handle ETH token
      if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
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
          icon: chainInfo.icon
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

  public getSimulationSummary(simulationData: SimulationData): Array<{
    totalAmount: string
    assetSymbol: string
    assetIcon: string
    warning?: string
  }> {
    // Group changes by asset symbol to sum amounts
    const tokenSummaries = new Map<string, {
      totalAmount: string
      assetSymbol: string
      assetIcon: string
      warning?: string
    }>()

    simulationData.changes.forEach(change => {
      const currentSummary = tokenSummaries.get(change.assetSymbol) || {
        totalAmount: '0',
        assetSymbol: change.assetSymbol,
        assetIcon: change.assetIcon,
        warning: change.warning
      }

      // Convert amounts to numbers for addition
      const currentAmount = parseFloat(currentSummary.totalAmount)
      const changeAmount = parseFloat(change.amount)
      
      // Add or subtract based on change type
      const newAmount = change.type === 'increase' 
        ? currentAmount + changeAmount 
        : currentAmount - changeAmount

      tokenSummaries.set(change.assetSymbol, {
        ...currentSummary,
        totalAmount: newAmount.toString()
      })
    })

    return Array.from(tokenSummaries.values())
  }
}
