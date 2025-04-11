import { useStore } from '../store/useStore'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootTabParamList } from '../navigation/AppNavigator'
import { CompositeNavigationProp } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<any>,
  BottomTabNavigationProp<RootTabParamList>
>

export const useOnboarding = () => {
  const navigation = useNavigation<NavigationProp>()
  const { onboarding, setHasCompletedOnboarding } = useStore()
  const { hasCompletedOnboarding } = onboarding

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true)
    // Navigate to the main app
    navigation.getParent()?.reset({
      index: 1,
      routes: [
        { name: 'Link' },
        { name: 'Transactions' },
        { name: 'Settings' },
      ],
    })
  }

  return {
    hasCompletedOnboarding,
    completeOnboarding,
  }
}
