import React from 'react'
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Share,
} from 'react-native'
import { CustomRefreshControl } from './CustomRefreshControl'
import { Ionicons } from '@expo/vector-icons'
import { SHARE_MESSAGE } from '../constants/api'
import { CHROME_EXTENSION_URL } from '../constants/api'
import { useNavigation } from '@react-navigation/native'
import { CompositeNavigationProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { RootTabParamList } from '../navigation/AppNavigator'

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<any>,
  BottomTabNavigationProp<RootTabParamList>
>

interface EmptyStateProps {
  isLinkedToLaptop: boolean
  refreshing?: boolean
  onRefresh?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  refreshing,
  onRefresh,
  isLinkedToLaptop,
}) => {
  const navigation = useNavigation<NavigationProp>()

  const handleSendLink = async () => {
    try {
      await Share.share({
        message: `${SHARE_MESSAGE} ${CHROME_EXTENSION_URL}`,
        title: 'Install Lucid Extension',
      }).then(() => {
        navigateToLinkScreen()
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const navigateToLinkScreen = () => {
    navigation.navigate('Link')
  }

  if (isLinkedToLaptop) {
    return (
      <ScrollView
        contentContainerStyle={styles.centerContainer}
        refreshControl={
          onRefresh ? (
            <CustomRefreshControl
              refreshing={refreshing || false}
              onRefresh={onRefresh}
              tintColor="#0000ff"
              colors={['#0000ff']}
            />
          ) : undefined
        }
      >
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/onboarding/no_transactions_screen.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.emptyTitle}>No Transactions Yet</Text>
        <Text style={styles.emptySubtitle}>
          Use your wallet on your laptop to send transactions and they will
          appear here
        </Text>
      </ScrollView>
    )
  } else {
    return (
      <ScrollView
        contentContainerStyle={styles.centerContainer}
        refreshControl={
          onRefresh ? (
            <CustomRefreshControl
              refreshing={refreshing || false}
              onRefresh={onRefresh}
              tintColor="#0000ff"
              colors={['#0000ff']}
            />
          ) : undefined
        }
      >
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/onboarding/extension_screen.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.emptyTitle}>
          Add the Lucid extension to your Browser
        </Text>
        <Text style={styles.emptySubtitle}>
          You need it installed on your browser to see and simulate your
          transactions.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleSendLink}>
          <Text style={styles.buttonText}>Send Link to my laptop</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginTop: -24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  imageContainer: {
    width: '120%',
    height: 250,
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
})
