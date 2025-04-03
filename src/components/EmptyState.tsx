import React from 'react'
import { ScrollView, Text, StyleSheet } from 'react-native'
import { CustomRefreshControl } from './CustomRefreshControl'

interface EmptyStateProps {
  title?: string
  subtitle?: string
  refreshing?: boolean
  onRefresh?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Transactions Yet',
  subtitle = 'Your past transactions will appear here',
  refreshing,
  onRefresh,
}) => {
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
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </ScrollView>
  )
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
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
})
