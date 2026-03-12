import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../theme'

type EmptyStateProps = {
  icon?: string
  title: string
  message?: string
}

export default function EmptyState({ 
  icon = '📭', 
  title, 
  message 
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: theme.muted,
    textAlign: 'center',
  }
})
