import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { RootTabParamList } from '../navigation/AppNavigator'

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<any>,
  BottomTabNavigationProp<RootTabParamList>
>

interface SuccessViewProps {
  title: string
  description: string
  onComplete?: () => void
  autoNavigate?: boolean
  navigateToTab?: keyof RootTabParamList
  delay?: number
}

export const SuccessView = ({
  title,
  description,
  onComplete,
  autoNavigate = true,
  navigateToTab = 'Transactions',
  delay = 2500,
}: SuccessViewProps) => {
  const navigation = useNavigation<NavigationProp>()
  const hasNavigated = useRef(false)

  useEffect(() => {
    if (!autoNavigate) return

    const timer = setTimeout(() => {
      if (!hasNavigated.current) {
        hasNavigated.current = true
        if (onComplete) {
          onComplete()
        } else {
          navigation.getParent()?.reset({
            index: 1,
            routes: [{ name: 'Link' }, { name: navigateToTab }, { name: 'Settings' }],
          })
        }
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [navigation, autoNavigate, onComplete, navigateToTab, delay])

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <LottieView
          source={require('../../assets/verifiedLottie.json')}
          autoPlay
          loop={false}
          style={styles.animation}
        />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    padding: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 200,
    height: 200,
  },
  title: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  description: {
    color: '#56CA77',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
})
