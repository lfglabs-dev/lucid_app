import React from 'react'
import { RefreshControl, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface CustomRefreshControlProps {
  refreshing: boolean
  onRefresh: () => void
  tintColor?: string
  colors?: string[]
}

export const CustomRefreshControl: React.FC<CustomRefreshControlProps> = ({
  refreshing,
  onRefresh,
  tintColor = '#0000ff',
  colors = ['#0000ff'],
}) => {
  const rotateAnim = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start()
    } else {
      rotateAnim.setValue(0)
    }
  }, [refreshing])

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={tintColor}
      colors={colors}
      progressViewOffset={10}
      style={{ backgroundColor: 'transparent' }}
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Ionicons name='refresh' size={24} color={tintColor} />
      </Animated.View>
    </RefreshControl>
  )
}
