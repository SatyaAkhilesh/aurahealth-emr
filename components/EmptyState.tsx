import { View, Text, StyleSheet } from 'react-native'
import { theme } from '@/theme'

type EmptyStateProps = {
  icon?: string
  title: string
  message?: string
}

export default function EmptyState({ icon = '🌱', title, message }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.msg}>{message}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  icon: { fontSize: 44, marginBottom: 14 },
  title: { fontSize: 17, fontFamily: 'Nunito_700Bold', color: theme.text, marginBottom: 6, textAlign: 'center' },
  msg: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: theme.muted, textAlign: 'center' }
})