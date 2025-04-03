import React, { ReactNode } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageSourcePropType,
  TouchableOpacity,
} from 'react-native'

interface TokenRowProps {
  label: string
  value: string | ReactNode
  icon?: ImageSourcePropType
  onPress?: () => void
  rightIcon?: boolean
  warning?: boolean
}

export const TokenRow = ({
  label,
  value,
  icon,
  onPress,
  rightIcon,
  warning,
}: TokenRowProps) => {
  const content = (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        {icon && !warning && <Image source={icon} style={styles.icon} />}
        {warning && <Text style={styles.warning}>？</Text>}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.rightContent}>
        {typeof value === 'string' ? (
          <Text style={styles.value}>{value}</Text>
        ) : (
          value
        )}
        {rightIcon && <Text style={styles.chevron}>›</Text>}
      </View>
    </View>
  )

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  label: {
    fontSize: 16,
    color: '#1A1D1F',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#1A1D1F',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: '#1A1D1F',
  },
  warning: {
    marginLeft: 4,
    fontSize: 18,
    color: 'black',
  },
})
