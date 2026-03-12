import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../theme'

type BadgeProps = {
  status: 'scheduled' | 'completed' | 'cancelled' | 'active' | 'inactive' | 'expired'
}

export default function Badge({ status }: BadgeProps) {
  const getColors = () => {
    switch (status) {
      case 'scheduled': return { bg: theme.infoLight, text: theme.info }
      case 'completed': return { bg: theme.successLight, text: theme.success }
      case 'cancelled': return { bg: theme.dangerLight, text: theme.danger }
      case 'active':    return { bg: theme.successLight, text: theme.success }
      case 'inactive':  return { bg: theme.warningLight, text: theme.warning }
      case 'expired':   return { bg: theme.dangerLight, text: theme.danger }
      default:          return { bg: theme.border, text: theme.muted }
    }
  }

  const colors = getColors()

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: theme.radiusFull,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
  }
})