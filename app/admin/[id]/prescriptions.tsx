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
  warning:     '#D97706',
}

type Prescription = {
  id: string
  patient_id: string
  medication: string
  dosage: string
  quantity: number
  refill_on: string
  refill_schedule: string
  notes?: string
}

const MEDICATIONS = ['Diovan', 'Lexapro', 'Metformin', 'Ozempic', 'Prozac', 'Seroquel', 'Tegretol']
const DOSAGES = ['1mg', '2mg', '3mg', '5mg', '10mg', '25mg', '50mg', '100mg', '250mg', '500mg', '1000mg']
const SCHEDULES = ['weekly', 'monthly', 'quarterly', 'yearly']

export default function PrescriptionsCRUD() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const id = params.id as string

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [medSearch, setMedSearch] = useState('')
  const [form, setForm] = useState({
    medication: '',
    dosage: '5mg',
    quantity: '1',
    refill_on: '',
    refill_schedule: 'monthly',
    notes: '',
  })
  const [errors, setErrors] = useState<any>({})

  useEffect(() => { if (id) fetchPrescriptions() }, [id])

  const fetchPrescriptions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })
    if (error) showAlert('Error ❌', 'Failed to load prescriptions')
    else setPrescriptions(data || [])
    setLoading(false)
  }

  const validate = () => {
    const e: any = {}
    if (!form.medication.trim()) e.medication = 'Please select a medication'
    if (!form.refill_on.trim()) e.refill_on = 'Refill date is required'
    if (!form.quantity || isNaN(Number(form.quantity))) e.quantity = 'Valid quantity required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openAddModal = () => {
    setEditingId(null)
    setMedSearch('')
    setForm({ medication: '', dosage: '5mg', quantity: '1', refill_on: '', refill_schedule: 'monthly', notes: '' })
    setErrors({})
    setModalVisible(true)
  }

  const openEditModal = (pres: Prescription) => {
    setEditingId(pres.id)
    setMedSearch(pres.medication)
    setForm({
      medication: pres.medication,
      dosage: pres.dosage,
      quantity: String(pres.quantity),
      refill_on: pres.refill_on,
      refill_schedule: pres.refill_schedule,
      notes: pres.notes || '',
    })
    setErrors({})
    setModalVisible(true)
  }

  const selectMedication = (med: string) => {
    setForm({ ...form, medication: med })
    setMedSearch(med)
  }

  const filteredMeds = MEDICATIONS.filter(m =>
    m.toLowerCase().includes(medSearch.toLowerCase())
  )

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload: any = {
        medication: form.medication,
        dosage: form.dosage,
        quantity: Number(form.quantity),
        refill_on: form.refill_on,
        refill_schedule: form.refill_schedule,
      }
      // Only add notes if column exists
      if (form.notes) payload.notes = form.notes
      if (editingId) {
        const { error } = await supabase.from('prescriptions').update(payload).eq('id', editingId)
        if (error) throw error
        showAlert('Success 🌿', 'Prescription updated!')
      } else {
        const { error } = await supabase.from('prescriptions').insert({ ...payload, patient_id: id })
        if (error) throw error
        showAlert('Success 🌿', 'Prescription added!')
      }
      setModalVisible(false)
      fetchPrescriptions()
    } catch (error: any) {
      showAlert('Error ❌', error.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (presId: string) => {
    const confirmed = await showConfirm('Delete Prescription', 'Are you sure you want to delete this prescription?')
    if (!confirmed) return
    const { error } = await supabase.from('prescriptions').delete().eq('id', presId)
    if (error) showAlert('Error ❌', 'Failed to delete')
    else {
      showAlert('Deleted 🌿', 'Prescription removed!')
      setPrescriptions(prev => prev.filter(p => p.id !== presId))
    }
  }

  const isRefillSoon = (date: string) => {
    if (!date) return false
    const diff = (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  }

  return (
    <View style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Prescriptions</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <Text style={s.addBtnTxt}>＋ Prescribe</Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={s.banner}>
        <Text style={s.bannerTxt}>
          {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} on record
        </Text>
      </View>

      {loading ? (
        <LoadingSpinner message="Loading prescriptions..." />
      ) : prescriptions.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyState icon="💊" title="No prescriptions yet" message="Tap '+ Prescribe' to add the first prescription" />
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        >
          {prescriptions.map(pres => (
            <View key={pres.id} style={[s.card, isRefillSoon(pres.refill_on) && s.cardAlert]}>
              <View style={s.cardTop}>
                <View style={[s.cardIconBox, { backgroundColor: isRefillSoon(pres.refill_on) ? '#FEF9C3' : '#E8F4F8' }]}>
                  <Text style={s.cardIcon}>💊</Text>
                </View>
                <View style={s.cardInfo}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>{pres.medication}</Text>
                    {isRefillSoon(pres.refill_on) && (
                      <View style={s.alertBadge}>
                        <Text style={s.alertBadgeTxt}>⚠️ Refill Soon</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.cardSub}>{pres.dosage} · Qty: {pres.quantity}</Text>
                  <Text style={[s.cardSub, isRefillSoon(pres.refill_on) && { color: N.warning, fontFamily: 'Nunito_700Bold' }]}>
                    🔄 Refill: {pres.refill_on} · {pres.refill_schedule}
                  </Text>
                  {pres.notes ? (
                    <View style={s.noteBox}>
                      <Text style={s.noteIcon}>📝</Text>
                      <Text style={s.noteTxt}>{pres.notes}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity style={s.editBtn} onPress={() => openEditModal(pres)} activeOpacity={0.7}>
                    <Text style={s.editTxt}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(pres.id)} activeOpacity={0.7}>
                    <Text style={s.deleteTxt}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>
                {editingId ? '✏️ Edit Prescription' : '💊 New Prescription'}
              </Text>
              <Text style={s.modalSub}>Search and select a medication, then fill in details</Text>
              <View style={s.modalDivider} />

              {/* Medicine Search */}
              <Text style={s.selectLabel}>Search Medication *</Text>
              <View style={s.medSearchBox}>
                <Text style={s.medSearchIco}>🔍</Text>
                <TextInput
                  style={s.medSearchInp}
                  placeholder="Type to search medicines..."
                  placeholderTextColor={N.stone}
                  value={medSearch}
                  onChangeText={t => {
                    setMedSearch(t)
                    setForm({ ...form, medication: t })
                  }}
                />
                {medSearch.length > 0 && (
                  <TouchableOpacity onPress={() => { setMedSearch(''); setForm({ ...form, medication: '' }) }}>
                    <Text style={{ color: N.stone, fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {errors.medication && <Text style={s.errorTxt}>⚠ {errors.medication}</Text>}

              {/* Medicine Suggestions */}
              {medSearch.length > 0 && filteredMeds.length > 0 && (
                <View style={s.suggestionsBox}>
                  {filteredMeds.map(med => (
                    <TouchableOpacity
                      key={med}
                      style={[s.suggestionItem, form.medication === med && s.suggestionItemActive]}
                      onPress={() => selectMedication(med)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.suggestionIcon}>💊</Text>
                      <Text style={[s.suggestionTxt, form.medication === med && s.suggestionTxtActive]}>
                        {med}
                      </Text>
                      {form.medication === med && <Text style={{ color: N.moss }}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Selected Medicine Badge */}
              {form.medication ? (
                <View style={s.selectedMedBadge}>
                  <Text style={s.selectedMedIcon}>✅</Text>
                  <Text style={s.selectedMedTxt}>Selected: {form.medication}</Text>
                </View>
              ) : null}

              {/* Dosage */}
              <Text style={[s.selectLabel, { marginTop: 16 }]}>Dosage *</Text>
              <View style={s.optionsGrid}>
                {DOSAGES.map(dose => (
                  <TouchableOpacity
                    key={dose}
                    style={[s.optionBtn, form.dosage === dose && s.optionBtnActive]}
                    onPress={() => setForm({ ...form, dosage: dose })}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.optionTxt, form.dosage === dose && s.optionTxtActive]}>{dose}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Quantity *"
                value={form.quantity}
                onChangeText={t => setForm({ ...form, quantity: t })}
                placeholder="1"
                keyboardType="numeric"
                error={errors.quantity}
              />

              {/* Refill Date with Quick Buttons */}
              <Text style={s.selectLabel}>Refill Date *</Text>
              <View style={s.dateInputBox}>
                <TextInput
                  style={s.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={N.stone}
                  value={form.refill_on}
                  onChangeText={t => setForm({ ...form, refill_on: t })}
                />
                {[
                  { label: '+1 Week', months: 0, days: 7 },
                  { label: '+1 Month', months: 1, days: 0 },
                  { label: '+3 Months', months: 3, days: 0 },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.label}
                    style={s.dateQuickBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      const d = new Date()
                      if (opt.days) d.setDate(d.getDate() + opt.days)
                      if (opt.months) d.setMonth(d.getMonth() + opt.months)
                      setForm({ ...form, refill_on: d.toISOString().split('T')[0] })
                    }}
                  >
                    <Text style={s.dateQuickTxt}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.refill_on && <Text style={s.errorTxt}>⚠ {errors.refill_on}</Text>}

              {/* Refill Schedule */}
              <Text style={s.selectLabel}>Refill Schedule</Text>
              <View style={s.optionsGrid}>
                {SCHEDULES.map(sched => (
                  <TouchableOpacity
                    key={sched}
                    style={[s.optionBtn, form.refill_schedule === sched && s.optionBtnActive]}
                    onPress={() => setForm({ ...form, refill_schedule: sched })}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.optionTxt, form.refill_schedule === sched && s.optionTxtActive]}>{sched}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={s.selectLabel}>📝 Doctor's Notes (optional)</Text>
              <View style={s.notesInputBox}>
                <TextInput
                  style={s.notesInput}
                  placeholder="e.g. Take with food, avoid alcohol, monitor blood pressure..."
                  placeholderTextColor={N.stone}
                  value={form.notes}
                  onChangeText={t => setForm({ ...form, notes: t })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={s.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} />
                <Button
                  title={editingId ? 'Save Changes' : '💊 Prescribe'}
                  onPress={handleSave}
                  loading={saving}
                />
              </View>
              <View style={{ height: 32 }} />
            </View>
          </ScrollView>
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
  banner: { backgroundColor: N.moss, paddingHorizontal: 24, paddingVertical: 10, paddingBottom: 16 },
  bannerTxt: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Nunito_400Regular', fontSize: 12 },
  scroll: { flex: 1 },

  // Cards
  card: { backgroundColor: N.white, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: N.parchment },
  cardAlert: { borderColor: '#FDE68A', backgroundColor: '#FFFDF5' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 },
  cardTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: N.forest },
  alertBadge: { backgroundColor: '#FEF9C3', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  alertBadgeTxt: { color: N.warning, fontFamily: 'Nunito_600SemiBold', fontSize: 10 },
  cardSub: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: N.stone, marginBottom: 4 },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: N.mist, borderRadius: 8, padding: 8, marginTop: 6 },
  noteIcon: { fontSize: 12 },
  noteTxt: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: N.moss, flex: 1 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 9, backgroundColor: N.mist, borderRadius: 10 },
  editTxt: { fontSize: 15 },
  deleteBtn: { padding: 9, backgroundColor: N.dangerLight, borderRadius: 10 },
  deleteTxt: { fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,60,46,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: N.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: N.parchment, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: N.forest, marginBottom: 4 },
  modalSub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: N.stone, marginBottom: 16 },
  modalDivider: { height: 1, backgroundColor: N.parchment, marginBottom: 20 },
  selectLabel: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: N.forest, marginBottom: 10 },
  errorTxt: { fontSize: 12, color: '#B45309', fontFamily: 'Nunito_400Regular', marginTop: 4, marginBottom: 8 },

  // Medicine search
  medSearchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: N.cream, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: N.parchment, marginBottom: 4 },
  medSearchIco: { fontSize: 16 },
  medSearchInp: { flex: 1, fontSize: 14, fontFamily: 'Nunito_400Regular', color: N.forest },

  // Suggestions dropdown
  suggestionsBox: { backgroundColor: N.white, borderRadius: 12, borderWidth: 1, borderColor: N.parchment, marginBottom: 12, overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: N.parchment },
  suggestionItemActive: { backgroundColor: N.mist },
  suggestionIcon: { fontSize: 16 },
  suggestionTxt: { flex: 1, fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: N.stone },
  suggestionTxtActive: { color: N.forest },

  // Selected badge
  selectedMedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: N.mist, borderRadius: 10, padding: 10, marginBottom: 4 },
  selectedMedIcon: { fontSize: 16 },
  selectedMedTxt: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: N.moss },

  // Date picker
  dateInputBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  dateInput: { flex: 1, backgroundColor: N.cream, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: 'Nunito_400Regular', color: N.forest, borderWidth: 1.5, borderColor: N.parchment, minWidth: 130 },
  dateQuickBtn: { backgroundColor: N.mist, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: N.parchment },
  dateQuickTxt: { color: N.moss, fontFamily: 'Nunito_600SemiBold', fontSize: 12 },

  // Options
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: N.parchment, backgroundColor: N.cream },
  optionBtnActive: { backgroundColor: N.moss, borderColor: N.moss },
  optionTxt: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: N.stone },
  optionTxtActive: { color: N.white },

  // Notes
  notesInputBox: { backgroundColor: N.cream, borderRadius: 12, borderWidth: 1.5, borderColor: N.parchment, padding: 12, marginBottom: 20 },
  notesInput: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: N.forest, minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
})