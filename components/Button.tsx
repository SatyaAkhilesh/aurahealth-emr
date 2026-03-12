import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { theme } from '@/theme'

type ButtonProps = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  disabled?: boolean
}

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false }: ButtonProps) {
  const bgColor = variant === 'primary' ? theme.primary : variant === 'danger' ? theme.danger : theme.surface
  const textColor = variant === 'secondary' ? theme.primary : theme.white
  const borderColor = variant === 'secondary' ? theme.primary : 'transparent'

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.btn, { backgroundColor: bgColor, borderColor, opacity: disabled ? 0.5 : 1 }]}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <Text style={[styles.txt, { color: textColor }]}>{title}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  txt: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.2,
  }
})