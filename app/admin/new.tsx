import { useState } from 'react'
import {
  View, Text, StyleSheet,
  ScrollView, Alert, TouchableOpacity
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { theme } from '../../theme'
import Button from '../../components/Button'
import Input from '../../components/Input'

export default function NewPatient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<any>({})

  const validate = () => {
    const newErrors: any = {}
    if (!form.name.trim()) newErrors.name = 'Full name is required'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format'
    if (!form.password.trim()) newErrors.password = 'Password is required'
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      // Step 1 - Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (authError) throw authError

      // Step 2 - Insert patient record
      const { error: insertError } = await supabase
        .from('patients')
        .insert({
          name: form.name,
          email: form.email,
          password: form.password,
          auth_user_id: authData.user?.id,
        })
      if (insertError) throw insertError

      Alert.alert('Success! 🎉', 'Patient created successfully!', [
        { text: 'OK', onPress: () => router.push('/admin') }
      ])
    } catch (error: any) {
      Alert.alert('Error ❌', error.message || 'Failed to create patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Patient</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>👤 Patient Information</Text>

          <Input
            label="Full Name *"
            value={form.name}
            onChangeText={t => setForm({ ...form, name: t })}
            placeholder="Mark Johnson"
            error={errors.name}
          />

          <Input
            label="Email *"
            value={form.email}
            onChangeText={t => setForm({ ...form, email: t })}
            placeholder="mark@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🔐 Login Credentials</Text>

          <Input
            label="Password *"
            value={form.password}
            onChangeText={t => setForm({ ...form, password: t })}
            placeholder="Min 8 characters"
            secureTextEntry
            error={errors.password}
          />
        </View>

        <View style={styles.buttons}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => router.back()}
          />
          <Button
            title="Create Patient"
            onPress={handleSubmit}
            loading={loading}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    color: theme.white,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
    color: theme.white,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.shadow,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: theme.text,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  }
})