import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { theme } from '@/theme'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'

type Prescription = { id: string; patient_id: string; medication: string; dosage: string; quantity: number; refill_on: string; refill_schedule: string }
const MEDICATIONS = ['Diovan', 'Lexapro', 'Metformin', 'Ozempic', 'Prozac', 'Seroquel', 'Tegretol']
const DOSAGES = ['1mg', '2mg', '3mg', '5mg', '10mg', '25mg', '50mg', '100mg', '250mg', '500mg', '1000mg']
const REFILL_SCHEDULES = ['weekly', 'monthly', 'quarterly', 'yearly']

export default function PrescriptionsCRUD() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ medication: 'Lexapro', dosage: '5mg', quantity: '1', refill_on: '', refill_schedule: 'monthly' })
  const [errors, setErrors] = useState<any>({})

  useEffect(() => { fetchPrescriptions() }, [id])

  const fetchPrescriptions = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('prescriptions').select('*').eq('patient_id', id).order('created_at', { ascending: false })
    if (error) Alert.alert('Error ❌', 'Failed to load prescriptions')
    else setPrescriptions(data || [])
    setLoading(false)
  }

  const validate = () => {
    const newErrors: any = {}
    if (!form.medication.trim()) newErrors.medication = 'Medication is required'
    if (!form.refill_on.trim()) newErrors.refill_on = 'Refill date is required'
    if (!form.quantity || isNaN(Number(form.quantity))) newErrors.quantity = 'Valid quantity is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const openAddModal = () => {
    setEditingId(null)
    setForm({ medication: 'Lexapro', dosage: '5mg', quantity: '1', refill_on: '', refill_schedule: 'monthly' })
    setErrors({})
    setModalVisible(true)
  }

  const openEditModal = (pres: Prescription) => {
    setEditingId(pres.id)
    setForm({ medication: pres.medication, dosage: pres.dosage, quantity: String(pres.quantity), refill_on: pres.refill_on, refill_schedule: pres.refill_schedule })
    setErrors({})
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { medication: form.medication, dosage: form.dosage, quantity: Number(form.quantity), refill_on: form.refill_on, refill_schedule: form.refill_schedule }
      if (editingId) {
        const { error } = await supabase.from('prescriptions').update(payload).eq('id', editingId)
        if (error) throw error
        Alert.alert('Success ✅', 'Prescription updated!')
      } else {
        const { error } = await supabase.from('prescriptions').insert({ ...payload, patient_id: id })
        if (error) throw error
        Alert.alert('Success ✅', 'Prescription added!')
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
    Alert.alert('Delete Prescription', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('prescriptions').delete().eq('id', presId)
        if (error) Alert.alert('Error ❌', 'Failed to delete')
        else { Alert.alert('Deleted ✅', 'Prescription deleted!'); setPrescriptions(prev => prev.filter(p => p.id !== presId)) }
      }}
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Prescriptions</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity>
      </View>

      {loading ? <LoadingSpinner message="Loading prescriptions..." /> : prescriptions.length === 0 ? (
        <EmptyState icon="💊" title="No prescriptions yet" message="Add the first prescription for this patient" />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {prescriptions.map(pres => (
            <Card key={pres.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.medicationText}>{pres.medication}</Text>
                  <Text style={styles.dosageText}>💊 {pres.dosage} — Qty: {pres.quantity}</Text>
                  <Text style={styles.refillText}>🔄 Refill: {pres.refill_on}</Text>
                  <View style={styles.scheduleBadge}><Text style={styles.scheduleText}>{pres.refill_schedule}</Text></View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(pres)}><Text style={styles.editBtnText}>✏️</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(pres.id)}><Text style={styles.deleteBtnText}>🗑</Text></TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingId ? '✏️ Edit Prescription' : '➕ New Prescription'}</Text>
              <Text style={styles.selectLabel}>Medication *</Text>
              <View style={styles.optionsGrid}>
                {MEDICATIONS.map(med => (
                  <TouchableOpacity key={med} style={[styles.optionBtn, form.medication === med && styles.optionBtnActive]} onPress={() => setForm({ ...form, medication: med })}>
                    <Text style={[styles.optionText, form.medication === med && styles.optionTextActive]}>{med}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.selectLabel}>Dosage *</Text>
              <View style={styles.optionsGrid}>
                {DOSAGES.map(dose => (
                  <TouchableOpacity key={dose} style={[styles.optionBtn, form.dosage === dose && styles.optionBtnActive]} onPress={() => setForm({ ...form, dosage: dose })}>
                    <Text style={[styles.optionText, form.dosage === dose && styles.optionTextActive]}>{dose}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input label="Quantity *" value={form.quantity} onChangeText={t => setForm({ ...form, quantity: t })} placeholder="1" keyboardType="numeric" error={errors.quantity} />
              <Input label="Refill Date * (YYYY-MM-DD)" value={form.refill_on} onChangeText={t => setForm({ ...form, refill_on: t })} placeholder="2025-10-05" error={errors.refill_on} />
              <Text style={styles.selectLabel}>Refill Schedule</Text>
              <View style={styles.optionsGrid}>
                {REFILL_SCHEDULES.map(sched => (
                  <TouchableOpacity key={sched} style={[styles.optionBtn, form.refill_schedule === sched && styles.optionBtnActive]} onPress={() => setForm({ ...form, refill_schedule: sched })}>
                    <Text style={[styles.optionText, form.refill_schedule === sched && styles.optionTextActive]}>{sched}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} />
                <Button title={editingId ? 'Save Changes' : 'Add Prescription'} onPress={handleSave} loading={saving} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { color: theme.white, fontFamily: 'Nunito_600SemiBold', fontSize: 15 },
  headerTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: theme.white },
  addBtn: { backgroundColor: theme.white, paddingVertical: 8, paddingHorizontal: 16, borderRadius: theme.radiusFull },
  addBtnText: { color: theme.primary, fontFamily: 'Nunito_700Bold', fontSize: 14 },
  list: { flex: 1, padding: 16 },
  card: { marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  medicationText: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: theme.text, marginBottom: 4 },
  dosageText: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: theme.muted, marginBottom: 4 },
  refillText: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: theme.muted, marginBottom: 6 },
  scheduleBadge: { backgroundColor: theme.successLight, paddingVertical: 4, paddingHorizontal: 10, borderRadius: theme.radiusFull, alignSelf: 'flex-start' },
  scheduleText: { color: theme.success, fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 8, backgroundColor: theme.primaryLight, borderRadius: theme.radiusMd },
  editBtnText: { fontSize: 16 },
  deleteBtn: { padding: 8, backgroundColor: theme.dangerLight, borderRadius: theme.radiusMd },
  deleteBtnText: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: theme.text, marginBottom: 20 },
  selectLabel: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: theme.text, marginBottom: 8 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radiusFull, borderWidth: 1.5, borderColor: theme.border },
  optionBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  optionText: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: theme.muted },
  optionTextActive: { color: theme.white },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 32 },
})