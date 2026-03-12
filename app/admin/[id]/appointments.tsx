import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, TextInput
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { showAlert, showConfirm } from '@/lib/webUtils'
import Button from '@/components/Button'
import Input from '@/components/Input'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'

const N = {
  forest:      '#1A3C2E',
  moss:        '#2D5A3D',
  sage:        '#4A7C59',
  mint:        '#7FB069',
  leaf:        '#A8C97F',
  mist:        '#E8F0E4',
  cream:       '#FAF7F2',
  stone:       '#8A8A7A',
  white:       '#FFFFFF',
  parchment:   '#EDE8DF',
  dangerLight: '#FEF3C7',
}

type Appointment = {
  id: string
  patient_id: string
  provider: string
  datetime: string
  repeat: string
  status: string
}

const REPEAT_OPTIONS = ['daily', 'weekly', 'monthly', 'yearly', 'none']

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  scheduled:  { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', icon: '🕐', label: 'Scheduled' },
  completed:  { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', icon: '✅', label: 'Completed' },
  cancelled:  { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3', icon: '❌', label: 'Cancelled' },
  'no-show':  { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', icon: '⚠️', label: 'No Show' },
}

export default function AppointmentsCRUD() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const id = params.id as string

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ provider: '', datetime: '', repeat: 'weekly', status: 'scheduled' })
  const [errors, setErrors] = useState<any>({})
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => { if (id) fetchAppointments() }, [id])

  const fetchAppointments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', id)
      .order('datetime', { ascending: true })
    if (error) showAlert('Error ❌', 'Failed to load appointments')
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
    setForm({ provider: '', datetime: '', repeat: 'weekly', status: 'scheduled' })
    setErrors({})
    setModalVisible(true)
  }

  const openEditModal = (appt: Appointment) => {
    setEditingId(appt.id)
    setForm({
      provider: appt.provider,
      datetime: appt.datetime ? new Date(appt.datetime).toISOString().slice(0, 16) : '',
      repeat: appt.repeat,
      status: appt.status || 'scheduled',
    })
    setErrors({})
    setModalVisible(true)
  }

  const setQuickDate = (daysFromNow: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysFromNow)
    d.setHours(9, 0, 0, 0)
    setForm({ ...form, datetime: d.toISOString().slice(0, 16) })
  }

  // Quick status toggle directly from card
  const toggleStatus = async (appt: Appointment) => {
    const nextStatus = appt.status === 'scheduled' ? 'completed'
      : appt.status === 'completed' ? 'cancelled'
      : appt.status === 'cancelled' ? 'no-show'
      : 'scheduled'

    const confirmed = await showConfirm(
      'Update Status',
      `Change status to "${nextStatus}"?`
    )
    if (!confirmed) return

    const { error } = await supabase
      .from('appointments')
      .update({ status: nextStatus })
      .eq('id', appt.id)

    if (error) showAlert('Error ❌', 'Failed to update status')
    else {
      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: nextStatus } : a))
    }
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('appointments')
          .update({ provider: form.provider, datetime: form.datetime, repeat: form.repeat, status: form.status })
          .eq('id', editingId)
        if (error) throw error
        showAlert('Success 🌿', 'Appointment updated!')
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert({ patient_id: id, provider: form.provider, datetime: form.datetime, repeat: form.repeat, status: form.status })
        if (error) throw error
        showAlert('Success 🌿', 'Appointment added!')
      }
      setModalVisible(false)
      fetchAppointments()
    } catch (error: any) {
      showAlert('Error ❌', error.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (apptId: string) => {
    const confirmed = await showConfirm('Delete Appointment', 'Are you sure?')
    if (!confirmed) return
    const { error } = await supabase.from('appointments').delete().eq('id', apptId)
    if (error) showAlert('Error ❌', 'Failed to delete')
    else {
      showAlert('Deleted 🌿', 'Appointment removed!')
      setAppointments(prev => prev.filter(a => a.id !== apptId))
    }
  }

  const formatDateTime = (dt: string) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  const filteredAppts = filterStatus === 'all'
    ? appointments
    : appointments.filter(a => a.status === filterStatus)

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

      {/* Stats Banner */}
      <View style={s.banner}>
        <View style={s.bannerStats}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <View key={key} style={s.bannerStat}>
              <Text style={s.bannerStatNum}>
                {appointments.filter(a => a.status === key).length}
              </Text>
              <Text style={s.bannerStatLbl}>{cfg.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={s.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
          <TouchableOpacity
            style={[s.filterBtn, filterStatus === 'all' && s.filterBtnActive]}
            onPress={() => setFilterStatus('all')}
            activeOpacity={0.7}
          >
            <Text style={[s.filterTxt, filterStatus === 'all' && s.filterTxtActive]}>All ({appointments.length})</Text>
          </TouchableOpacity>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <TouchableOpacity
              key={key}
              style={[s.filterBtn, filterStatus === key && s.filterBtnActive]}
              onPress={() => setFilterStatus(key)}
              activeOpacity={0.7}
            >
              <Text style={[s.filterTxt, filterStatus === key && s.filterTxtActive]}>
                {cfg.icon} {cfg.label} ({appointments.filter(a => a.status === key).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingSpinner message="Loading appointments..." />
      ) : filteredAppts.length === 0 ? (
        <EmptyState icon="📅" title="No appointments" message="No appointments match this filter" />
      ) : (
        <ScrollView
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        >
          {filteredAppts.map(appt => {
            const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG['scheduled']
            return (
              <View key={appt.id} style={[s.card, { borderLeftColor: cfg.border, borderLeftWidth: 4 }]}>
                <View style={s.cardTop}>
                  <View style={[s.cardIconBox, { backgroundColor: cfg.bg }]}>
                    <Text style={s.cardIcon}>{cfg.icon}</Text>
                  </View>
                  <View style={s.cardInfo}>
                    <Text style={s.cardTitle}>{appt.provider}</Text>
                    <Text style={s.cardSub}>📅 {formatDateTime(appt.datetime)}</Text>
                    <Text style={s.cardSub}>🔄 Repeats {appt.repeat}</Text>

                    {/* Status Badge — tap to change */}
                    <TouchableOpacity
                      style={[s.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
                      onPress={() => toggleStatus(appt)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.statusTxt, { color: cfg.text }]}>
                        {cfg.icon} {cfg.label}
                      </Text>
                      <Text style={[s.statusChange, { color: cfg.text }]}>  tap to change →</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.cardActions}>
                    <TouchableOpacity style={s.editBtn} onPress={() => openEditModal(appt)} activeOpacity={0.7}>
                      <Text style={s.editTxt}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(appt.id)} activeOpacity={0.7}>
                      <Text style={s.deleteTxt}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
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

            {/* Date Picker */}
            <Text style={s.selectLabel}>Date & Time *</Text>
            <TextInput
              style={s.dateInput}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor={N.stone}
              value={form.datetime}
              onChangeText={t => setForm({ ...form, datetime: t })}
            />
            <View style={s.quickDatesRow}>
              {[
                { label: '📅 Today', days: 0 },
                { label: '➕ Tomorrow', days: 1 },
                { label: '📆 +1 Week', days: 7 },
                { label: '🗓 +1 Month', days: 30 },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.label}
                  style={s.dateQuickBtn}
                  activeOpacity={0.7}
                  onPress={() => setQuickDate(opt.days)}
                >
                  <Text style={s.dateQuickTxt}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.datetime && <Text style={s.errorTxt}>⚠ {errors.datetime}</Text>}

            {/* Repeat */}
            <Text style={s.selectLabel}>Repeat Schedule</Text>
            <View style={s.optionsRow}>
              {REPEAT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[s.optionBtn, form.repeat === opt && s.optionBtnActive]}
                  onPress={() => setForm({ ...form, repeat: opt })}
                  activeOpacity={0.7}
                >
                  <Text style={[s.optionTxt, form.repeat === opt && s.optionTxtActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status */}
            <Text style={s.selectLabel}>Status</Text>
            <View style={s.optionsRow}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[s.statusOption, form.status === key && { backgroundColor: cfg.bg, borderColor: cfg.border }]}
                  onPress={() => setForm({ ...form, status: key })}
                  activeOpacity={0.7}
                >
                  <Text style={[s.statusOptionTxt, form.status === key && { color: cfg.text }]}>
                    {cfg.icon} {cfg.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} />
              <Button title={editingId ? 'Save Changes' : 'Add Appointment'} onPress={handleSave} loading={saving} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: N.cream },
  header: { backgroundColor: N.forest, paddingHorizontal: 24, paddingVertical: 18, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backTxt: { color: N.leaf, fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  headerTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: N.white },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  addBtnTxt: { color: N.white, fontFamily: 'Nunito_700Bold', fontSize: 13 },
  banner: { backgroundColor: N.moss, paddingHorizontal: 24, paddingVertical: 12, paddingBottom: 16 },
  bannerStats: { flexDirection: 'row', gap: 20 },
  bannerStat: { alignItems: 'center' },
  bannerStatNum: { color: N.white, fontFamily: 'Nunito_800ExtraBold', fontSize: 20 },
  bannerStatLbl: { color: 'rgba(255,255,255,0.65)', fontFamily: 'Nunito_400Regular', fontSize: 10 },
  filterRow: { backgroundColor: N.white, borderBottomWidth: 1, borderBottomColor: N.parchment },
  filterBtn: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: N.parchment, backgroundColor: N.cream },
  filterBtnActive: { backgroundColor: N.moss, borderColor: N.moss },
  filterTxt: { fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: N.stone },
  filterTxtActive: { color: N.white },
  scroll: { flex: 1 },
  card: { backgroundColor: N.white, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: N.parchment },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: N.forest, marginBottom: 3 },
  cardSub: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: N.stone, marginBottom: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', marginTop: 8 },
  statusTxt: { fontSize: 12, fontFamily: 'Nunito_700Bold' },
  statusChange: { fontSize: 10, fontFamily: 'Nunito_400Regular', opacity: 0.7 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 9, backgroundColor: N.mist, borderRadius: 10 },
  editTxt: { fontSize: 15 },
  deleteBtn: { padding: 9, backgroundColor: N.dangerLight, borderRadius: 10 },
  deleteTxt: { fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,60,46,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: N.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: N.parchment, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: N.forest, marginBottom: 4 },
  modalSub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: N.stone, marginBottom: 16 },
  modalDivider: { height: 1, backgroundColor: N.parchment, marginBottom: 20 },
  selectLabel: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: N.forest, marginBottom: 8 },
  dateInput: { backgroundColor: N.cream, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'Nunito_400Regular', color: N.forest, borderWidth: 1.5, borderColor: N.parchment, marginBottom: 10 },
  quickDatesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  dateQuickBtn: { backgroundColor: N.mist, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: N.parchment },
  dateQuickTxt: { color: N.moss, fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  errorTxt: { fontSize: 12, color: '#B45309', fontFamily: 'Nunito_400Regular', marginTop: 4, marginBottom: 8 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: N.parchment, backgroundColor: N.cream },
  optionBtnActive: { backgroundColor: N.moss, borderColor: N.moss },
  optionTxt: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: N.stone },
  optionTxtActive: { color: N.white },
  statusOption: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: N.parchment, backgroundColor: N.cream },
  statusOptionTxt: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: N.stone },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
})