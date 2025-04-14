import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { TransactionsScreen } from '../screens/TransactionsScreen'
import { LinkDeviceScreen } from '../screens/LinkDeviceScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { TransactionSimulation } from '../screens/TransactionSimulation'
import { FirstTimeOnboardingFlow } from '../screens/FirstTimeOnboardingFlow'
import { Ionicons } from '@expo/vector-icons'
import { Transaction } from '../types'
import { useStore } from '../store/useStore'
import { PostHogProvider } from 'posthog-react-native'

export type RootTabParamList = {
  Transactions: undefined
  Link: undefined
  Settings: undefined
}

export type LinkStackParamList = {
  ScanQR: undefined
}

export type TransactionStackParamList = {
  TransactionsList: undefined
  TransactionSimulation: { transaction: Transaction }
}

const Tab = createBottomTabNavigator<RootTabParamList>()
const LinkStack = createNativeStackNavigator<LinkStackParamList>()
const TransactionStack = createNativeStackNavigator<TransactionStackParamList>()

const LinkNavigator = () => {
  return (
    <LinkStack.Navigator screenOptions={{ headerShown: false }}>
      <LinkStack.Screen name="ScanQR" component={LinkDeviceScreen} />
    </LinkStack.Navigator>
  )
}

const TransactionNavigator = () => {
  return (
    <TransactionStack.Navigator>
      <TransactionStack.Screen
        name="TransactionsList"
        component={TransactionsScreen}
        options={{ title: 'Transactions' }}
      />
      <TransactionStack.Screen
        name="TransactionSimulation"
        component={TransactionSimulation}
        options={{
          title: 'Transaction Simulation',
          presentation: 'modal',
        }}
      />
    </TransactionStack.Navigator>
  )
}

export const AppNavigator = () => {
  const { onboarding } = useStore()
  const { hasCompletedOnboarding } = onboarding

  return (
    <NavigationContainer>
      <PostHogProvider
        apiKey="phc_fOuJga1RZroxiLWMOQtWsMshfAOwnIyyr8eREwwxzYm"
        options={{
          host: 'https://us.i.posthog.com',
        }}
      >
        {!hasCompletedOnboarding ? (
          <FirstTimeOnboardingFlow />
        ) : (
          <Tab.Navigator
            initialRouteName="Transactions"
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName

                if (route.name === 'Transactions') {
                  iconName = focused ? 'list' : 'list-outline'
                } else if (route.name === 'Link') {
                  iconName = focused ? 'scan' : 'scan-outline'
                } else if (route.name === 'Settings') {
                  iconName = focused ? 'settings' : 'settings-outline'
                }

                return (
                  <Ionicons name={iconName as any} size={size} color={color} />
                )
              },
              tabBarActiveTintColor: '#007AFF',
              tabBarInactiveTintColor: 'gray',
              headerStyle: {
                backgroundColor: '#fff',
              },
              headerTintColor: '#000',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              unmountOnBlur: true,
            })}
          >
            <Tab.Screen
              name="Link"
              component={LinkNavigator}
              options={{
                headerShown: false,
              }}
            />
            <Tab.Screen
              name="Transactions"
              component={TransactionNavigator}
              options={{
                headerShown: false,
              }}
            />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        )}
      </PostHogProvider>
    </NavigationContainer>
  )
}
