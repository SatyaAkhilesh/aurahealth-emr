import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  Alert, TouchableOpacity
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import Button from '@/components/Button'
import Input from '@/components/Input'

const N = {
  forest:    '#1A3C2E',
  moss:      '#2D5A3D',
  sage:      '#4A7C59',
  leaf:      '#A8C97F',
  mist:      '#E8F0E4',
  cream:     '#FAF7F2',
  stone:     '#8A8A7A',
  white:     '#FFFFFF',
  parchment: '#EDE8DF',
  danger:    '#B45309',
}

export default function NewPatient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<any>({})

  const validate = () => {
    const e: any = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format'
    if (!form.password.trim()) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Minimum 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (authError) throw authError
      const { error: insertError } = await supabase.from('patients').insert({
        name: form.name,
        email: form.email,
        password: form.password,
        auth_user_id: authData.user?.id,
      })
      if (insertError) throw insertError
      Alert.alert('Success! 🌿', 'Patient created successfully!', [
        { text: 'OK', onPress: () => router.push('/admin') }
      ])
    } catch (error: any) {
      Alert.alert('Error ❌', error.message || 'Failed to create patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Patient</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
      >
        {/* Page Title */}
        <View style={s.pageTitleRow}>
          <Text style={s.pageEye}>CREATE RECORD</Text>
          <Text style={s.pageTitle}>Add New Patient</Text>
          <Text style={s.pageSub}>Fill in the details below to create a new patient account.</Text>
        </View>

        {/* Info Card */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardIcon}>👤</Text>
            <Text style={s.cardTitle}>Patient Information</Text>
          </View>
          <View style={s.cardDivider} />

          <Input
            label="Full Name *"
            value={form.name}
            onChangeText={t => setForm({ ...form, name: t })}
            placeholder="Mark Johnson"
            error={errors.name}
          />
          <Input
            label="Email Address *"
            value={form.email}
            onChangeText={t => setForm({ ...form, email: t })}
            placeholder="mark@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
        </View>

        {/* Credentials Card */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardIcon}>🔐</Text>
            <Text style={s.cardTitle}>Login Credentials</Text>
          </View>
          <View style={s.cardDivider} />

          <Input
            label="Password *"
            value={form.password}
            onChangeText={t => setForm({ ...form, password: t })}
            placeholder="Minimum 8 characters"
            secureTextEntry
            error={errors.password}
          />

          <View style={s.hint}>
            <Text style={s.hintTxt}>🌿  The patient will use these credentials to log in to the portal.</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
          <Button title="Create Patient" onPress={handleSubmit} loading={loading} />
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: N.cream },

  header: {
    backgroundColor: N.forest,
    paddingHorizontal: 24,
    paddingVertical: 18,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backTxt: { color: N.leaf, fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  headerTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: N.white },

  scroll: { flex: 1 },

  pageTitleRow: { marginBottom: 24 },
  pageEye: { color: N.sage, fontFamily: 'Nunito_700Bold', fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  pageTitle: { fontSize: 24, fontFamily: 'Nunito_800ExtraBold', color: N.forest },
  pageSub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: N.stone, marginTop: 4 },

  card: {
    backgroundColor: N.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: N.parchment,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: N.forest },
  cardDivider: { height: 1, backgroundColor: N.parchment, marginBottom: 16 },

  hint: { backgroundColor: N.mist, borderRadius: 10, padding: 12, marginTop: 4 },
  hintTxt: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: N.moss },

  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
})