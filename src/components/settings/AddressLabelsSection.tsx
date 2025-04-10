import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native'
import { useStore } from '../../store/useStore'
import { formatAddress } from '../../services/utils'
import { MaterialIcons } from '@expo/vector-icons'
import { SvgXml } from 'react-native-svg'

const safeLogoXml = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="50" cy="50" r="50" fill="#68FF7A"/>
<path d="M74.8947 50.8828H68.7888C66.9651 50.8828 65.4876 52.406 65.4876 54.2856V63.4209C65.4876 65.3006 64.0098 66.8238 62.1864 66.8238H37.8951C36.0715 66.8238 34.5938 68.347 34.5938 70.2268V76.5207C34.5938 78.4003 36.0715 79.9235 37.8951 79.9235H63.5923C65.416 79.9235 66.8725 78.4003 66.8725 76.5207V71.4709C66.8725 69.5913 68.3502 68.2578 70.1739 68.2578H74.8935C76.717 68.2578 78.1947 66.7346 78.1947 64.8548V54.2462C78.1947 52.3665 76.7182 50.8828 74.8947 50.8828Z" fill="black"/>
<path d="M34.5833 38.3777C34.5833 36.4979 36.0611 34.9747 37.8847 34.9747H62.161C63.9847 34.9747 65.4622 33.4515 65.4622 31.5719V25.2779C65.4622 23.3982 63.9847 21.875 62.161 21.875H36.4773C34.6539 21.875 33.1761 23.3982 33.1761 25.2779V30.1277C33.1761 32.0073 31.6986 33.5305 29.8749 33.5305H25.1763C23.3527 33.5305 21.875 35.0537 21.875 36.9335V47.5536C21.875 49.4334 23.3588 50.8801 25.1824 50.8801H31.2882C33.1119 50.8801 34.5896 49.357 34.5896 47.4772L34.5833 38.3777Z" fill="black"/>
<path d="M47.1561 44.2715H53.0211C54.9325 44.2715 56.4831 45.871 56.4831 47.84V53.8856C56.4831 55.8556 54.9313 57.4539 53.0211 57.4539H47.1561C45.2449 57.4539 43.6943 55.8543 43.6943 53.8856V47.84C43.6943 45.8698 45.2461 44.2715 47.1561 44.2715Z" fill="black"/>
</svg>`

export const AddressLabelsSection = () => {
  const { addressLabels, addAddressLabel } = useStore()

  const handleEditLabel = (address: string, currentLabel?: string) => {
    Alert.prompt(
      'Edit Label',
      'Enter a new label for this wallet',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: (newLabel) => {
            if (newLabel) {
              addAddressLabel(address, newLabel)
            }
          },
        },
      ],
      'plain-text',
      currentLabel
    )
  }

  const renderItem = ({
    item,
    index,
  }: {
    item: { address: string; label: string }
    index: number
  }) => {
    const isSafe = item.address.toLowerCase().includes('safe')
    const defaultLabel = `${isSafe ? 'Safe' : 'EOA'} ${index + 1}`
    const displayLabel = item.label || defaultLabel

    return (
      <TouchableOpacity
        style={styles.walletItem}
        onPress={() => handleEditLabel(item.address, item.label)}
        activeOpacity={0.7}
      >
        <View style={styles.walletContent}>
          {isSafe ? (
            <View style={styles.iconContainer}>
              <SvgXml xml={safeLogoXml} width={24} height={24} />
            </View>
          ) : (
            <View style={styles.iconContainer}>
              <MaterialIcons name="key" size={24} color="#1A1D1F" />
            </View>
          )}
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>{displayLabel}</Text>
            <Text style={styles.walletAddress}>
              {formatAddress(item.address)}
            </Text>
          </View>
          <MaterialIcons
            name="edit"
            size={16}
            color="#666"
            style={styles.editIcon}
          />
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Wallets</Text>

      {addressLabels.length === 0 ? (
        <Text style={styles.emptyText}>No wallets added yet</Text>
      ) : (
        <FlatList
          data={addressLabels}
          renderItem={renderItem}
          keyExtractor={(item) => item.address}
          scrollEnabled={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  walletItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  walletContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D1F',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  editIcon: {
    marginLeft: 8,
  },
})
