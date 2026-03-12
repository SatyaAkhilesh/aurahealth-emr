import { View, Text, TextInput, StyleSheet } from 'react-native'
import { theme } from '../theme'

type InputProps = {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  error?: string
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: InputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          error ? styles.inputError : null
        ]}
        placeholderTextColor={theme.muted}
      />
      {error && (
        <Text style={styles.error}>⚠️ {error}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: theme.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: theme.radiusMd,
    padding: 12,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: theme.text,
  },
  inputError: {
    borderColor: theme.danger,
  },
  error: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: theme.danger,
    marginTop: 4,
  }
})