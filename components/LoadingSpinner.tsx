import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { theme } from '@/theme'

export default function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={styles.msg}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  msg: { marginTop: 12, fontSize: 13, fontFamily: 'Nunito_400Regular', color: theme.muted }
})