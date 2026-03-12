import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/Avatar'
import Button from '@/components/Button'
import Input from '@/components/Input'
import LoadingSpinner from '@/components/LoadingSpinner'
import Card from '@/components/Card'
import { exportAppointmentsPdf } from '@/lib/pdf/exportAppointmentsPdf'
import { exportPrescriptionsPdf } from '@/lib/pdf/exportPrescriptionsPdf'
import { exportPatientSummaryPdf } from '@/lib/pdf/exportPatientSummaryPdf'

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

type Patient = { id: string; name: string; email: string; created_at: string }
type Appointment = { id: string; provider: string; datetime: string; repeat: string }
type Prescription = { id: string; medication: string; dosage: string; quantity: number; refill_on: string; refill_schedule: string }

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
    if (error) Alert.alert('Error ❌', 'Failed to update patient')
    else {
      Alert.alert('Success 🌿', 'Patient updated!')
      setPatient(prev => prev ? { ...prev, name: editName, email: editEmail } : prev)
      setEditMode(false)
    }
    setSaving(false)
  }

  const handleDeleteAppointment = (apptId: string) => {
    Alert.alert('Delete Appointment', 'Are you sure?', [
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

  const handleDeletePrescription = (presId: string) => {
    Alert.alert('Delete Prescription', 'Are you sure?', [
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

  const formatDateTime = (dt: string) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  if (loading) return <LoadingSpinner message="Loading patient..." />

  return (
    <View style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.push('/admin')} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Patient Record</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Hero */}
      <View style={s.hero}>
        <Avatar name={patient?.name || ''} size={64} />
        <View style={s.heroInfo}>
          <Text style={s.heroEye}>PATIENT</Text>
          <Text style={s.heroName}>{patient?.name}</Text>
          <Text style={s.heroEmail}>{patient?.email}</Text>
        </View>
        <View style={s.heroBadge}>
          <View style={s.heroBadgeDot} />
          <Text style={s.heroBadgeTxt}>Active</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {([
          { key: 'info', label: '👤 Info' },
          { key: 'appointments', label: `📅 Appointments (${appointments.length})` },
          { key: 'prescriptions', label: `💊 Prescriptions (${prescriptions.length})` },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabTxt, activeTab === tab.key && s.tabTxtActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <View>
            <Card>
              <View style={s.infoHeader}>
                <Text style={s.cardTitle}>Patient Information</Text>
                {!editMode && (
                  <TouchableOpacity style={s.editBtn} onPress={() => setEditMode(true)} activeOpacity={0.7}>
                    <Text style={s.editBtnTxt}>✏️ Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {editMode ? (
                <>
                  <Input label="Full Name" value={editName} onChangeText={setEditName} />
                  <Input label="Email" value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" />
                  <View style={s.editActions}>
                    <Button title="Cancel" variant="secondary" onPress={() => setEditMode(false)} />
                    <Button title="Save Changes" onPress={handleSave} loading={saving} />
                  </View>
                </>
              ) : (
                <>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Full Name</Text>
                    <Text style={s.infoValue}>{patient?.name}</Text>
                  </View>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Email</Text>
                    <Text style={s.infoValue}>{patient?.email}</Text>
                  </View>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Member Since</Text>
                    <Text style={s.infoValue}>
                      {patient?.created_at ? new Date(patient.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                    </Text>
                  </View>
                  <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={s.infoLabel}>Patient ID</Text>
                    <Text style={s.infoValue}>#{patient?.id.slice(0, 8).toUpperCase()}</Text>
                  </View>
                </>
              )}
            </Card>

            {/* PDF Button */}
            <TouchableOpacity
              style={s.pdfBtn}
              onPress={() => exportPatientSummaryPdf(patient, appointments, prescriptions)}
              activeOpacity={0.8}
            >
              <Text style={s.pdfBtnTxt}>⬇️  Download Patient Summary PDF</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <View>
            <View style={s.tabActionRow}>
              <Text style={s.sectionTitle}>All Appointments</Text>
              <TouchableOpacity
                style={s.manageBtn}
                onPress={() => router.push(`/admin/${id}/appointments`)}
                activeOpacity={0.7}
              >
                <Text style={s.manageBtnTxt}>＋ Manage</Text>
              </TouchableOpacity>
            </View>

            {/* PDF Button */}
            <TouchableOpacity
              style={s.pdfBtn}
              onPress={() => exportAppointmentsPdf(patient?.name || '', appointments)}
              activeOpacity={0.8}
            >
              <Text style={s.pdfBtnTxt}>⬇️  Download Appointments PDF</Text>
            </TouchableOpacity>

            {appointments.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyIcon}>📅</Text>
                <Text style={s.emptyTxt}>No appointments yet</Text>
                <Text style={s.emptySub}>Add the first appointment for this patient</Text>
              </View>
            ) : appointments.map(appt => (
              <View key={appt.id} style={s.recordCard}>
                <View style={s.recordLeft}>
                  <View style={s.recordIconBox}>
                    <Text style={s.recordIcon}>📅</Text>
                  </View>
                  <View style={s.recordInfo}>
                    <Text style={s.recordTitle}>{appt.provider}</Text>
                    <Text style={s.recordSub}>{formatDateTime(appt.datetime)}</Text>
                    <View style={s.repeatBadge}>
                      <Text style={s.repeatTxt}>🔄 {appt.repeat}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteAppointment(appt.id)} activeOpacity={0.7}>
                  <Text style={s.deleteTxt}>🗑</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === 'prescriptions' && (
          <View>
            <View style={s.tabActionRow}>
              <Text style={s.sectionTitle}>All Prescriptions</Text>
              <TouchableOpacity
                style={s.manageBtn}
                onPress={() => router.push(`/admin/${id}/prescriptions`)}
                activeOpacity={0.7}
              >
                <Text style={s.manageBtnTxt}>＋ Manage</Text>
              </TouchableOpacity>
            </View>

            {/* PDF Button */}
            <TouchableOpacity
              style={s.pdfBtn}
              onPress={() => exportPrescriptionsPdf(patient?.name || '', prescriptions)}
              activeOpacity={0.8}
            >
              <Text style={s.pdfBtnTxt}>⬇️  Download Prescriptions PDF</Text>
            </TouchableOpacity>

            {prescriptions.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyIcon}>💊</Text>
                <Text style={s.emptyTxt}>No prescriptions yet</Text>
                <Text style={s.emptySub}>Add the first prescription for this patient</Text>
              </View>
            ) : prescriptions.map(pres => (
              <View key={pres.id} style={s.recordCard}>
                <View style={s.recordLeft}>
                  <View style={[s.recordIconBox, { backgroundColor: '#E8F4F8' }]}>
                    <Text style={s.recordIcon}>💊</Text>
                  </View>
                  <View style={s.recordInfo}>
                    <Text style={s.recordTitle}>{pres.medication}</Text>
                    <Text style={s.recordSub}>{pres.dosage} · Qty: {pres.quantity}</Text>
                    <Text style={s.recordSub}>Refill: {pres.refill_on}</Text>
                    <View style={s.repeatBadge}>
                      <Text style={s.repeatTxt}>🔄 {pres.refill_schedule}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeletePrescription(pres.id)} activeOpacity={0.7}>
                  <Text style={s.deleteTxt}>🗑</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: N.cream },
  header: { backgroundColor: N.forest, paddingHorizontal: 24, paddingVertical: 18, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backTxt: { color: N.leaf, fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  headerTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: N.white },
  hero: { backgroundColor: N.moss, paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroInfo: { flex: 1 },
  heroEye: { color: N.leaf, fontFamily: 'Nunito_700Bold', fontSize: 10, letterSpacing: 2, marginBottom: 2 },
  heroName: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: N.white },
  heroEmail: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: N.mint },
  heroBadgeTxt: { color: N.white, fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  tabs: { flexDirection: 'row', backgroundColor: N.white, borderBottomWidth: 1, borderBottomColor: N.parchment },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: N.moss },
  tabTxt: { fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: N.stone },
  tabTxtActive: { color: N.moss },
  scroll: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: N.forest },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  editBtn: { backgroundColor: N.mist, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: N.parchment },
  editBtnTxt: { color: N.moss, fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: N.parchment },
  infoLabel: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: N.stone },
  infoValue: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: N.forest },
  pdfBtn: { backgroundColor: N.mist, borderWidth: 1, borderColor: N.parchment, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', marginBottom: 16 },
  pdfBtnTxt: { color: N.moss, fontFamily: 'Nunito_700Bold', fontSize: 13 },
  tabActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: N.forest },
  manageBtn: { backgroundColor: N.moss, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  manageBtnTxt: { color: N.white, fontFamily: 'Nunito_700Bold', fontSize: 13 },
  emptyCard: { backgroundColor: N.white, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: N.parchment },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTxt: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: N.forest, marginBottom: 4 },
  emptySub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: N.stone, textAlign: 'center' },
  recordCard: { backgroundColor: N.white, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: N.parchment, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  recordIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: N.mist, alignItems: 'center', justifyContent: 'center' },
  recordIcon: { fontSize: 18 },
  recordInfo: { flex: 1 },
  recordTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: N.forest, marginBottom: 3 },
  recordSub: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: N.stone, marginBottom: 2 },
  repeatBadge: { backgroundColor: N.mist, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20, alignSelf: 'flex-start', marginTop: 4 },
  repeatTxt: { color: N.moss, fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
  deleteBtn: { padding: 8, backgroundColor: N.dangerLight, borderRadius: 10 },
  deleteTxt: { fontSize: 16 },
})