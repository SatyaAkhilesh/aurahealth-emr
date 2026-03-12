import { View, Text, StyleSheet } from 'react-native'
import { theme } from '@/theme'

type AvatarProps = {
  name: string
  size?: number
}

export default function Avatar({ name, size = 44 }: AvatarProps) {
  const initials = (name || 'U')
    .split(' ')
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <View style={[styles.av, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.txt, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  av: {
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txt: {
    color: theme.primary,
    fontFamily: 'Nunito_700Bold',
  }
})