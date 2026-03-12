import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Modal
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import Button from '@/components/Button'
import Input from '@/components/Input'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'

const N = {
  forest:    '#1A3C2E',
  moss:      '#2D5A3D',
  sage:      '#4A7C59',
  mint:      '#7FB069',
  leaf:      '#A8C97F',
  mist:      '#E8F0E4',
  cream:     '#FAF7F2',
  stone:     '#8A8A7A',
  white:     '#FFFFFF',
  parchment: '#EDE8DF',
  dangerLight: '#FEF3C7',
  danger:    '#B45309',
}

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
  const [form, setForm] = useState({ provider: '', datetime: '', repeat: 'weekly' })
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
    const e: any = {}
    if (!form.provider.trim()) e.provider = 'Provider is required'
    if (!form.datetime.trim()) e.datetime = 'Date & time is required'
    setErrors(e)
    return Object.keys(e).length === 0
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
          .update({ provider: form.provider, datetime: form.datetime, repeat: form.repeat })
          .eq('id', editingId)
        if (error) throw error
        Alert.alert('Success 🌿', 'Appointment updated!')
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert({ patient_id: id, provider: form.provider, datetime: form.datetime, repeat: form.repeat })
        if (error) throw error
        Alert.alert('Success 🌿', 'Appointment added!')
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
    Alert.alert('Delete Appointment', 'Are you sure you want to delete this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('appointments').delete().eq('id', apptId)
          if (error) Alert.alert('Error ❌', 'Failed to delete')
          else {
            Alert.alert('Deleted 🌿', 'Appointment removed!')
            setAppointments(prev => prev.filter(a => a.id !== apptId))
          }
        }
      }
    ])
  }

  const formatDateTime = (dt: string) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  return (
    <View style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Appointments</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <Text style={s.addBtnTxt}>＋ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Count Banner */}
      <View style={s.banner}>
        <Text style={s.bannerTxt}>
          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled
        </Text>
      </View>

      {loading ? (
        <LoadingSpinner message="Loading appointments..." />
      ) : appointments.length === 0 ? (
        <EmptyState icon="📅" title="No appointments yet" message="Add the first appointment for this patient" />
      ) : (
        <ScrollView
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        >
          {appointments.map(appt => (
            <View key={appt.id} style={s.card}>
              <View style={s.cardLeft}>
                <View style={s.cardIconBox}>
                  <Text style={s.cardIcon}>📅</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardTitle}>{appt.provider}</Text>
                  <Text style={s.cardSub}>{formatDateTime(appt.datetime)}</Text>
                  <View style={s.repeatBadge}>
                    <Text style={s.repeatTxt}>🔄 Repeats {appt.repeat}</Text>
                  </View>
                </View>
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => openEditModal(appt)}
                  activeOpacity={0.7}
                >
                  <Text style={s.editTxt}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => handleDelete(appt.id)}
                  activeOpacity={0.7}
                >
                  <Text style={s.deleteTxt}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            {/* Modal Handle */}
            <View style={s.modalHandle} />

            <Text style={s.modalTitle}>
              {editingId ? '✏️ Edit Appointment' : '➕ New Appointment'}
            </Text>
            <Text style={s.modalSub}>Fill in the appointment details below</Text>

            <View style={s.modalDivider} />

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

            <Text style={s.selectLabel}>Repeat Schedule</Text>
            <View style={s.optionsRow}>
              {REPEAT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[s.optionBtn, form.repeat === opt && s.optionBtnActive]}
                  onPress={() => setForm({ ...form, repeat: opt })}
                  activeOpacity={0.7}
                >
                  <Text style={[s.optionTxt, form.repeat === opt && s.optionTxtActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} />
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
  addBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  addBtnTxt: { color: N.white, fontFamily: 'Nunito_700Bold', fontSize: 13 },

  banner: { backgroundColor: N.moss, paddingHorizontal: 24, paddingVertical: 10, paddingBottom: 16 },
  bannerTxt: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Nunito_400Regular', fontSize: 12 },

  scroll: { flex: 1 },

  card: {
    backgroundColor: N.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: N.parchment,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  cardIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: N.mist, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: N.forest, marginBottom: 3 },
  cardSub: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: N.stone, marginBottom: 6 },
  repeatBadge: { backgroundColor: N.mist, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20, alignSelf: 'flex-start' },
  repeatTxt: { color: N.moss, fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 9, backgroundColor: N.mist, borderRadius: 10 },
  editTxt: { fontSize: 15 },
  deleteBtn: { padding: 9, backgroundColor: N.dangerLight, borderRadius: 10 },
  deleteTxt: { fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,60,46,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: N.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: N.parchment, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: N.forest, marginBottom: 4 },
  modalSub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: N.stone, marginBottom: 16 },
  modalDivider: { height: 1, backgroundColor: N.parchment, marginBottom: 20 },
  selectLabel: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: N.forest, marginBottom: 10 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: N.parchment, backgroundColor: N.cream },
  optionBtnActive: { backgroundColor: N.moss, borderColor: N.moss },
  optionTxt: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: N.stone },
  optionTxtActive: { color: N.white },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
})