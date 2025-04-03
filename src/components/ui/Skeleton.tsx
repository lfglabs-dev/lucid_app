import React from 'react'
import { View, StyleSheet, Animated } from 'react-native'

interface SkeletonProps {
  width: number
  height: number
  borderRadius?: number
  style?: any
}

export const Skeleton = ({
  width,
  height,
  borderRadius = 0,
  style,
}: SkeletonProps) => {
  const animatedValue = new Animated.Value(0)

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
})
