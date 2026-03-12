import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Modal, TextInput
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { theme } from '../../../theme'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Card from '../../../components/Card'
import LoadingSpinner from '../../../components/LoadingSpinner'
import EmptyState from '../../../components/EmptyState'

type Appointment = {
  id: string
  patient_id: string
  provider: string
  datetime: string
  repeat: string
}

const REPEAT_OPTIONS = ['daily', 'weekly', 'monthly', 'yearly', 'none']

export default function AppointmentsCRUD() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    provider: '',
    datetime: '',
    repeat: 'weekly',
  })
  const [errors, setErrors] = useState<any>({})

  useEffect(() => { fetchAppointments() }, [id])

  const fetchAppointments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', id)
      .order('datetime', { ascending: true })
    if (error) Alert.alert('Error ❌', 'Failed to load appointments')
    else setAppointments(data || [])
    setLoading(false)
  }

  const validate = () => {
    const newErrors: any = {}
    if (!form.provider.trim()) newErrors.provider = 'Provider is required'
    if (!form.datetime.trim()) newErrors.datetime = 'Date & time is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm({ provider: '', datetime: '', repeat: 'weekly' })
    setErrors({})
    setModalVisible(true)
  }

  const openEditModal = (appt: Appointment) => {
    setEditingId(appt.id)
    setForm({
      provider: appt.provider,
      datetime: appt.datetime ? new Date(appt.datetime).toISOString().slice(0, 16) : '',
      repeat: appt.repeat,
    })
    setErrors({})
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('appointments')
          .update({
            provider: form.provider,
            datetime: form.datetime,
            repeat: form.repeat,
          })
          .eq('id', editingId)
        if (error) throw error
        Alert.alert('Success ✅', 'Appointment updated!')
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert({
            patient_id: id,
            provider: form.provider,
            datetime: form.datetime,
            repeat: form.repeat,
          })
        if (error) throw error
        Alert.alert('Success ✅', 'Appointment added!')
      }
      setModalVisible(false)
      fetchAppointments()
    } catch (error: any) {
      Alert.alert('Error ❌', error.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (apptId: string) => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const { error } = await supabase.from('appointments').delete().eq('id', apptId)
            if (error) Alert.alert('Error ❌', 'Failed to delete')
            else {
              Alert.alert('Deleted ✅', 'Appointment deleted!')
              setAppointments(prev => prev.filter(a => a.id !== apptId))
            }
          }
        }
      ]
    )
  }

  const formatDateTime = (dt: string) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <LoadingSpinner message="Loading appointments..." />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No appointments yet"
          message="Add the first appointment for this patient"
        />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {appointments.map(appt => (
            <Card key={appt.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.providerText}>{appt.provider}</Text>
                  <Text style={styles.dateText}>📅 {formatDateTime(appt.datetime)}</Text>
                  <View style={styles.repeatBadge}>
                    <Text style={styles.repeatText}>🔄 {appt.repeat}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEditModal(appt)}
                  >
                    <Text style={styles.editBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(appt.id)}
                  >
                    <Text style={styles.deleteBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? '✏️ Edit Appointment' : '➕ New Appointment'}
            </Text>

            <Input
              label="Provider *"
              value={form.provider}
              onChangeText={t => setForm({ ...form, provider: t })}
              placeholder="Dr Kim West"
              error={errors.provider}
            />

            <Input
              label="Date & Time * (YYYY-MM-DDTHH:MM)"
              value={form.datetime}
              onChangeText={t => setForm({ ...form, datetime: t })}
              placeholder="2025-09-16T16:30"
              error={errors.datetime}
            />

            <Text style={styles.selectLabel}>Repeat</Text>
            <View style={styles.repeatOptions}>
              {REPEAT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.repeatOption,
                    form.repeat === opt && styles.repeatOptionActive
                  ]}
                  onPress={() => setForm({ ...form, repeat: opt })}
                >
                  <Text style={[
                    styles.repeatOptionText,
                    form.repeat === opt && styles.repeatOptionTextActive
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalVisible(false)}
              />
              <Button
                title={editingId ? 'Save Changes' : 'Add Appointment'}
                onPress={handleSave}
                loading={saving}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: { color: theme.white, fontFamily: 'Nunito_600SemiBold', fontSize: 15 },
  headerTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: theme.white },
  addBtn: { backgroundColor: theme.white, paddingVertical: 8, paddingHorizontal: 16, borderRadius: theme.radiusFull },
  addBtnText: { color: theme.primary, fontFamily: 'Nunito_700Bold', fontSize: 14 },
  list: { flex: 1, padding: 16 },
  card: { marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  providerText: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: theme.text, marginBottom: 4 },
  dateText: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: theme.muted, marginBottom: 6 },
  repeatBadge: { backgroundColor: theme.primaryLight, paddingVertical: 4, paddingHorizontal: 10, borderRadius: theme.radiusFull, alignSelf: 'flex-start' },
  repeatText: { color: theme.primary, fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 8, backgroundColor: theme.primaryLight, borderRadius: theme.radiusMd },
  editBtnText: { fontSize: 16 },
  deleteBtn: { padding: 8, backgroundColor: theme.dangerLight, borderRadius: theme.radiusMd },
  deleteBtnText: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: theme.text, marginBottom: 20 },
  selectLabel: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: theme.text, marginBottom: 8 },
  repeatOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  repeatOption: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: theme.radiusFull, borderWidth: 1.5, borderColor: theme.border },
  repeatOptionActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  repeatOptionText: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: theme.muted },
  repeatOptionTextActive: { color: theme.white },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
})