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

type Prescription = {
  id: string
  patient_id: string
  medication: string
  dosage: string
  quantity: number
  refill_on: string
  refill_schedule: string
}

const MEDICATIONS = ['Diovan', 'Lexapro', 'Metformin', 'Ozempic', 'Prozac', 'Seroquel', 'Tegretol']
const DOSAGES = ['1mg', '2mg', '3mg', '5mg', '10mg', '25mg', '50mg', '100mg', '250mg', '500mg', '1000mg']
const SCHEDULES = ['weekly', 'monthly', 'quarterly', 'yearly']

export default function PrescriptionsCRUD() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    medication: 'Lexapro',
    dosage: '5mg',
    quantity: '1',
    refill_on: '',
    refill_schedule: 'monthly',
  })
  const [errors, setErrors] = useState<any>({})

  useEffect(() => { fetchPrescriptions() }, [id])

  const fetchPrescriptions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })
    if (error) Alert.alert('Error ❌', 'Failed to load prescriptions')
    else setPrescriptions(data || [])
    setLoading(false)
  }

  const validate = () => {
    const e: any = {}
    if (!form.medication.trim()) e.medication = 'Medication is required'
    if (!form.refill_on.trim()) e.refill_on = 'Refill date is required'
    if (!form.quantity || isNaN(Number(form.quantity))) e.quantity = 'Valid quantity required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm({ medication: 'Lexapro', dosage: '5mg', quantity: '1', refill_on: '', refill_schedule: 'monthly' })
    setErrors({})
    setModalVisible(true)
  }

  const openEditModal = (pres: Prescription) => {
    setEditingId(pres.id)
    setForm({
      medication: pres.medication,
      dosage: pres.dosage,
      quantity: String(pres.quantity),
      refill_on: pres.refill_on,
      refill_schedule: pres.refill_schedule,
    })
    setErrors({})
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        medication: form.medication,
        dosage: form.dosage,
        quantity: Number(form.quantity),
        refill_on: form.refill_on,
        refill_schedule: form.refill_schedule,
      }
      if (editingId) {
        const { error } = await supabase.from('prescriptions').update(payload).eq('id', editingId)
        if (error) throw error
        Alert.alert('Success 🌿', 'Prescription updated!')
      } else {
        const { error } = await supabase.from('prescriptions').insert({ ...payload, patient_id: id })
        if (error) throw error
        Alert.alert('Success 🌿', 'Prescription added!')
      }
      setModalVisible(false)
      fetchPrescriptions()
    } catch (error: any) {
      Alert.alert('Error ❌', error.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (presId: string) => {
    Alert.alert('Delete Prescription', 'Are you sure you want to delete this prescription?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('prescriptions').delete().eq('id', presId)
          if (error) Alert.alert('Error ❌', 'Failed to delete')
          else {
            Alert.alert('Deleted 🌿', 'Prescription removed!')
            setPrescriptions(prev => prev.filter(p => p.id !== presId))
          }
        }
      }
    ])
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
          <Text style={s.addBtnTxt}>＋ Add</Text>
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
        <EmptyState icon="💊" title="No prescriptions yet" message="Add the first prescription for this patient" />
      ) : (
        <ScrollView
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        >
          {prescriptions.map(pres => (
            <View key={pres.id} style={s.card}>
              <View style={s.cardLeft}>
                <View style={s.cardIconBox}>
                  <Text style={s.cardIcon}>💊</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardTitle}>{pres.medication}</Text>
                  <Text style={s.cardSub}>{pres.dosage} · Qty: {pres.quantity}</Text>
                  <Text style={s.cardSub}>Refill: {pres.refill_on}</Text>
                  <View style={s.scheduleBadge}>
                    <Text style={s.scheduleTxt}>🔄 {pres.refill_schedule}</Text>
                  </View>
                </View>
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
          <ScrollView>
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>
                {editingId ? '✏️ Edit Prescription' : '➕ New Prescription'}
              </Text>
              <Text style={s.modalSub}>Select medication details below</Text>
              <View style={s.modalDivider} />

              {/* Medication */}
              <Text style={s.selectLabel}>Medication *</Text>
              <View style={s.optionsGrid}>
                {MEDICATIONS.map(med => (
                  <TouchableOpacity
                    key={med}
                    style={[s.optionBtn, form.medication === med && s.optionBtnActive]}
                    onPress={() => setForm({ ...form, medication: med })}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.optionTxt, form.medication === med && s.optionTxtActive]}>{med}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dosage */}
              <Text style={s.selectLabel}>Dosage *</Text>
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

              <Input
                label="Refill Date * (YYYY-MM-DD)"
                value={form.refill_on}
                onChangeText={t => setForm({ ...form, refill_on: t })}
                placeholder="2025-10-05"
                error={errors.refill_on}
              />

              {/* Schedule */}
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

              <View style={s.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} />
                <Button
                  title={editingId ? 'Save Changes' : 'Add Prescription'}
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
  header: {
    backgroundColor: N.forest,
    paddingHorizontal: 24, paddingVertical: 18, paddingTop: 48,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
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
    backgroundColor: N.white, borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: N.parchment,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  cardIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#E8F4F8', alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: N.forest, marginBottom: 3 },
  cardSub: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: N.stone, marginBottom: 2 },
  scheduleBadge: { backgroundColor: N.mist, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20, alignSelf: 'flex-start', marginTop: 4 },
  scheduleTxt: { color: N.moss, fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 9, backgroundColor: N.mist, borderRadius: 10 },
  editTxt: { fontSize: 15 },
  deleteBtn: { padding: 9, backgroundColor: N.dangerLight, borderRadius: 10 },
  deleteTxt: { fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,60,46,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: N.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: N.parchment, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: N.forest, marginBottom: 4 },
  modalSub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: N.stone, marginBottom: 16 },
  modalDivider: { height: 1, backgroundColor: N.parchment, marginBottom: 20 },
  selectLabel: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: N.forest, marginBottom: 10 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: N.parchment, backgroundColor: N.cream },
  optionBtnActive: { backgroundColor: N.moss, borderColor: N.moss },
  optionTxt: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: N.stone },
  optionTxtActive: { color: N.white },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
})