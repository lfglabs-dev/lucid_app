import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native'
import { useNavigation, useIsFocused } from '@react-navigation/native'
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
  navigateToTab?: keyof RootTabParamList
  delay?: number
}

export const SuccessView = ({
  title,
  description,
  onComplete,
  navigateToTab = 'Transactions',
  delay = 2000,
}: SuccessViewProps) => {
  const navigation = useNavigation<NavigationProp>()
  const isFocused = useIsFocused()
  const [animationKey, setAnimationKey] = useState(0)
  const lottieRef = useRef<LottieView>(null)
  const hasNavigated = useRef(false)

  // Reset state when component becomes focused
  useEffect(() => {
    if (isFocused) {
      hasNavigated.current = false
      setAnimationKey((prevKey) => prevKey + 1)

      // Manually play the animation after a short delay to ensure it's ready
      const timer = setTimeout(() => {
        if (lottieRef.current) {
          lottieRef.current.reset()
          lottieRef.current.play()
        }
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [isFocused])

  const handleAnimationFinish = () => {
    if (!hasNavigated.current) {
      hasNavigated.current = true
      if (onComplete) {
        onComplete()
      } else {
        navigation.getParent()?.reset({
          index: 1,
          routes: [
            { name: 'Link' },
            { name: navigateToTab },
            { name: 'Settings' },
          ],
        })
      }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <LottieView
          ref={lottieRef}
          key={animationKey}
          source={require('../../assets/verifiedLottie.json')}
          autoPlay
          loop={false}
          style={styles.animation}
          duration={delay}
          onAnimationFinish={handleAnimationFinish}
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
