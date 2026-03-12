import { useEffect, useRef } from 'react'
import {
  Animated, TouchableOpacity,
  StyleSheet, View
} from 'react-native'
import { theme } from '@/theme'

// ─────────────────────────────────────────
// 1. FADE + SLIDE UP on mount
// Usage: wrap any card/section
// <FadeInView delay={100}><Card /></FadeInView>
// ─────────────────────────────────────────
export function FadeInView({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode
  delay?: number
  style?: any
}) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(16)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.animNormal,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: theme.animNormal,
        delay,
        useNativeDriver: false,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  )
}

// ─────────────────────────────────────────
// 2. STAGGERED LIST — items fade in one by one
// Usage: wrap array of items
// <StaggeredList stagger={80}>{items.map(...)}</StaggeredList>
// ─────────────────────────────────────────
export function StaggeredList({
  children,
  stagger = 60,
}: {
  children: React.ReactNode[]
  stagger?: number
}) {
  return (
    <>
      {children.map((child, i) => (
        <FadeInView key={i} delay={i * stagger}>
          {child}
        </FadeInView>
      ))}
    </>
  )
}

// ─────────────────────────────────────────
// 3. PRESS SCALE — button shrinks on press
// Usage: replace TouchableOpacity with PressableScale
// <PressableScale onPress={fn}><View>...</View></PressableScale>
// ─────────────────────────────────────────
export function PressableScale({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode
  onPress: () => void
  style?: any
}) {
  const scale = useRef(new Animated.Value(1)).current

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: false,
      tension: 300,
      friction: 10,
    }).start()

  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: false,
      tension: 300,
      friction: 10,
    }).start()

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  )
}

// ─────────────────────────────────────────
// 4. MODAL FADE + SCALE
// Usage: wrap modal content
// <AnimatedModal visible={modalVisible}><View>...</View></AnimatedModal>
// ─────────────────────────────────────────
export function AnimatedModal({
  visible,
  children,
}: {
  visible: boolean
  children: React.ReactNode
}) {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: theme.animNormal,
          useNativeDriver: false,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 10,
          useNativeDriver: false,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: theme.animFast,
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 0.95,
          duration: theme.animFast,
          useNativeDriver: false,
        }),
      ]).start()
    }
  }, [visible])

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      {children}
    </Animated.View>
  )
}

// ─────────────────────────────────────────
// 5. SHIMMER SKELETON — single row
// Usage: loading placeholder
// <SkeletonRow width="60%" height={14} />
// ─────────────────────────────────────────
export function SkeletonRow({
  width = '100%',
  height = 16,
  style,
}: {
  width?: any
  height?: number
  style?: any
}) {
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ])
    ).start()
  }, [])

  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['#EDE8DF', '#F7F4EF'],
  })

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: theme.radiusSm,
          backgroundColor: bg,
          marginBottom: 8,
        },
        style,
      ]}
    />
  )
}

// ─────────────────────────────────────────
// 6. SKELETON CARD — full card placeholder
// Usage: show while loading patient data
// {loading ? <SkeletonCard /> : <PatientCard />}
// ─────────────────────────────────────────
export function SkeletonCard() {
  return (
    <View style={sk.card}>
      <View style={sk.row}>
        <SkeletonRow
          width={44}
          height={44}
          style={{ borderRadius: 22, marginRight: 12, marginBottom: 0 }}
        />
        <View style={{ flex: 1 }}>
          <SkeletonRow width="60%" height={14} />
          <SkeletonRow width="40%" height={11} />
        </View>
      </View>
      <SkeletonRow width="90%" height={12} />
      <SkeletonRow width="70%" height={12} />
    </View>
  )
}

// ─────────────────────────────────────────
// 7. SKELETON TABLE ROW
// Usage: show while loading patient table
// {loading ? [1,2,3].map(i => <SkeletonTableRow key={i} />) : rows}
// ─────────────────────────────────────────
export function SkeletonTableRow() {
  return (
    <View style={sk.tableRow}>
      <SkeletonRow width={36} height={36} style={{ borderRadius: 18, marginRight: 12, marginBottom: 0 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <SkeletonRow width="50%" height={13} />
        <SkeletonRow width="35%" height={10} />
      </View>
      <SkeletonRow width={60} height={28} style={{ borderRadius: 8, marginBottom: 0 }} />
    </View>
  )
}

// ─────────────────────────────────────────
// 8. TOAST HOOK — slide in/out notification
// Usage:
// const toast = useToast()
// toast.show('success', 'Patient saved!')
// <Toast {...toast} />
// ─────────────────────────────────────────
export function useToast() {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-60)).current
  const msgRef = useRef({ text: '', type: 'success' })
  const [_, forceUpdate] = useRef(0).current as any

  const show = (type: 'success' | 'error' | 'info', text: string) => {
    msgRef.current = { text, type }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 250, useNativeDriver: false,
      }),
      Animated.spring(translateY, {
        toValue: 0, tension: 120, friction: 10, useNativeDriver: false,
      }),
    ]).start()

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0, duration: 200, useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: -60, duration: 200, useNativeDriver: false,
        }),
      ]).start()
    }, 2500)
  }

  return { opacity, translateY, show, msg: msgRef.current }
}

// ─────────────────────────────────────────
// 9. PAGE TRANSITION — fade between screens
// Usage: wrap page content
// <PageTransition><View>page content</View></PageTransition>
// ─────────────────────────────────────────
export function PageTransition({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: theme.animNormal,
      useNativeDriver: false,
    }).start()
  }, [])

  return (
    <Animated.View style={{ flex: 1, opacity }}>
      {children}
    </Animated.View>
  )
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────
const sk = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F5F0',
  },
})