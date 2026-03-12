import { View, StyleSheet } from 'react-native'
import { theme } from '@/theme'

type CardProps = {
  children: React.ReactNode
  style?: object
}

export default function Card({ children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLg,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.shadow,
  } as any
})