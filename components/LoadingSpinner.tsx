import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { theme } from '../theme'

type LoadingSpinnerProps = {
  message?: string
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size="large" 
        color={theme.primary} 
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: theme.muted,
  }
})