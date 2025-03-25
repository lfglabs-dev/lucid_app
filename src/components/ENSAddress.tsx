import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { ethers } from 'ethers'
import { QUICKNODE_RPC } from '../services/api'
import { formatAddress } from '../services/utils'
import { Skeleton } from './ui/Skeleton'

interface ENSAddressProps {
  address: string
  chainId: string
  style?: any
}

export const ENSAddress = ({ address, chainId, style }: ENSAddressProps) => {
  const [ensName, setEnsName] = useState<string | null>(null)
  const [ensAvatar, setEnsAvatar] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const resolveENS = async () => {
      try {
        setIsLoading(true)
        // Only resolve ENS for Ethereum mainnet
        if (chainId !== '0x1') {
          setIsLoading(false)
          return
        }

        const provider = new ethers.JsonRpcProvider(QUICKNODE_RPC)
        const ensName = await provider.lookupAddress(address)

        if (ensName) {
          setEnsName(ensName)
          const avatar = await provider.getAvatar(ensName)

          if (avatar) {
            setEnsAvatar(avatar)
          }
        }
      } catch (error) {
        console.error('Error resolving ENS:', error)
      } finally {
        setIsLoading(false)
      }
    }

    resolveENS()
  }, [address, chainId])

  const displayAddress = ensName || formatAddress(address)

  return (
    <View style={[styles.container, style]}>
      {isLoading ? (
        <>
          <Skeleton width={24} height={24} borderRadius={12} style={styles.ensAvatar} />
          <Skeleton width={120} height={20} style={styles.addressSkeleton} />
        </>
      ) : (
        <>
          {ensAvatar && <Image source={{ uri: ensAvatar }} style={styles.ensAvatar} />}
          <Text style={styles.address}>{displayAddress}</Text>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ensAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  address: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  addressSkeleton: {
    marginLeft: 8,
  },
})
