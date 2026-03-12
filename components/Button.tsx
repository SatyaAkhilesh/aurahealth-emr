import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { theme } from '../theme'

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
      style={[
        styles.button,
        { backgroundColor: bgColor, borderColor, opacity: disabled ? 0.6 : 1 }
      ]}
    >
      {loading
        ? <ActivityIndicator color={textColor} />
        : <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  text: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  }
})
