import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { theme } from '../../../theme'
import Avatar from '../../../components/Avatar'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import LoadingSpinner from '../../../components/LoadingSpinner'
import Card from '../../../components/Card'

type Patient = {
  id: string
  name: string
  email: string
  created_at: string
}

type Appointment = {
  id: string
  provider: string
  datetime: string
  repeat: string
}

type Prescription = {
  id: string
  medication: string
  dosage: string
  quantity: number
  refill_on: string
  refill_schedule: string
}

export default function PatientDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'appointments' | 'prescriptions'>('info')
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    setLoading(true)
    const [patientRes, apptRes, presRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase.from('appointments').select('*').eq('patient_id', id).order('datetime'),
      supabase.from('prescriptions').select('*').eq('patient_id', id),
    ])
    if (patientRes.data) {
      setPatient(patientRes.data)
      setEditName(patientRes.data.name)
      setEditEmail(patientRes.data.email)
    }
    setAppointments(apptRes.data || [])
    setPrescriptions(presRes.data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('patients')
      .update({ name: editName, email: editEmail })
      .eq('id', id)
    if (error) {
      Alert.alert('Error ❌', 'Failed to update patient')
    } else {
      Alert.alert('Success ✅', 'Patient updated successfully!')
      setPatient(prev => prev ? { ...prev, name: editName, email: editEmail } : prev)
      setEditMode(false)
    }
    setSaving(false)
  }

  const formatDateTime = (dt: string) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  const handleDeleteAppointment = (apptId: string) => {
    Alert.alert('Delete Appointment', 'Are you sure?', [
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
    ])
  }

  const handleDeletePrescription = (presId: string) => {
    Alert.alert('Delete Prescription', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('prescriptions').delete().eq('id', presId)
          if (error) Alert.alert('Error ❌', 'Failed to delete')
          else {
            Alert.alert('Deleted ✅', 'Prescription deleted!')
            setPrescriptions(prev => prev.filter(p => p.id !== presId))
          }
        }
      }
    ])
  }

  if (loading) return <LoadingSpinner message="Loading patient..." />

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/admin')}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Record</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Patient Hero */}
      <View style={styles.hero}>
        <Avatar name={patient?.name || ''} size={64} />
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{patient?.name}</Text>
          <Text style={styles.heroEmail}>{patient?.email}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['info', 'appointments', 'prescriptions'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'info' ? '👤 Info' : tab === 'appointments' ? '📅 Appointments' : '💊 Prescriptions'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <Card>
            <View style={styles.infoHeader}>
              <Text style={styles.cardTitle}>Patient Information</Text>
              {!editMode && (
                <TouchableOpacity onPress={() => setEditMode(true)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {editMode ? (
              <>
                <Input label="Full Name" value={editName} onChangeText={setEditName} />
                <Input label="Email" value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" />
                <View style={styles.editActions}>
                  <Button title="Cancel" variant="secondary" onPress={() => setEditMode(false)} />
                  <Button title="Save Changes" onPress={handleSave} loading={saving} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{patient?.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{patient?.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>
                    {patient?.created_at ? new Date(patient.created_at).toLocaleDateString() : '—'}
                  </Text>
                </View>
              </>
            )}
          </Card>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <View>
            <View style={styles.tabActionRow}>
              <Text style={styles.cardTitle}>Appointments ({appointments.length})</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push(`/admin/${id}/appointments`)}
              >
                <Text style={styles.addBtnText}>+ Manage</Text>
              </TouchableOpacity>
            </View>

            {appointments.length === 0 ? (
              <Card><Text style={styles.emptyText}>No appointments yet</Text></Card>
            ) : appointments.map(appt => (
              <Card key={appt.id}>
                <View style={styles.recordRow}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordTitle}>{appt.provider}</Text>
                    <Text style={styles.recordSub}>📅 {formatDateTime(appt.datetime)}</Text>
                    <Text style={styles.recordSub}>🔄 Repeats {appt.repeat}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteAppointment(appt.id)}
                  >
                    <Text style={styles.deleteBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === 'prescriptions' && (
          <View>
            <View style={styles.tabActionRow}>
              <Text style={styles.cardTitle}>Prescriptions ({prescriptions.length})</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push(`/admin/${id}/prescriptions`)}
              >
                <Text style={styles.addBtnText}>+ Manage</Text>
              </TouchableOpacity>
            </View>

            {prescriptions.length === 0 ? (
              <Card><Text style={styles.emptyText}>No prescriptions yet</Text></Card>
            ) : prescriptions.map(pres => (
              <Card key={pres.id}>
                <View style={styles.recordRow}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordTitle}>{pres.medication} — {pres.dosage}</Text>
                    <Text style={styles.recordSub}>Qty: {pres.quantity} | {pres.refill_schedule}</Text>
                    <Text style={styles.recordSub}>🔄 Refill on: {pres.refill_on}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeletePrescription(pres.id)}
                  >
                    <Text style={styles.deleteBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  hero: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: theme.white },
  heroEmail: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: theme.primary },
  tabText: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: theme.muted },
  tabTextActive: { color: theme.primary },
  content: { flex: 1, padding: 16 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: theme.text },
  editBtn: { backgroundColor: theme.primaryLight, paddingVertical: 6, paddingHorizontal: 14, borderRadius: theme.radiusFull },
  editBtnText: { color: theme.primary, fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  infoLabel: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: theme.muted },
  infoValue: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: theme.text },
  tabActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { backgroundColor: theme.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: theme.radiusFull },
  addBtnText: { color: theme.white, fontFamily: 'Nunito_700Bold', fontSize: 13 },
  emptyText: { color: theme.muted, fontFamily: 'Nunito_400Regular', fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordInfo: { flex: 1 },
  recordTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: theme.text, marginBottom: 4 },
  recordSub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: theme.muted, marginBottom: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 18 },
})