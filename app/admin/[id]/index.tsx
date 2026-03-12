import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Clipboard
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { showAlert, showConfirm } from '@/lib/webUtils'
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
  danger:      '#B45309',
  warning:     '#D97706',
  warningLight:'#FEF9C3',
}

type Patient = { id: string; name: string; email: string; created_at: string }
type Appointment = { id: string; provider: string; datetime: string; repeat: string }
type Prescription = { id: string; medication: string; dosage: string; quantity: number; refill_on: string; refill_schedule: string }

function isRefillSoon(refillDate: string) {
  if (!refillDate) return false
  const today = new Date()
  const refill = new Date(refillDate)
  const diff = (refill.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 7
}

function StatsCard({ appointments, prescriptions }: { appointments: Appointment[], prescriptions: Prescription[] }) {
  const upcomingAppts = appointments.filter(a => new Date(a.datetime) >= new Date()).length
  const soonRefills = prescriptions.filter(p => isRefillSoon(p.refill_on)).length
  return (
    <View style={st.row}>
      <View style={[st.card, { borderLeftColor: N.moss }]}>
        <Text style={st.val}>{appointments.length}</Text>
        <Text style={st.lbl}>Total Appointments</Text>
        <Text style={st.sub}>{upcomingAppts} upcoming</Text>
      </View>
      <View style={[st.card, { borderLeftColor: '#0891B2' }]}>
        <Text style={st.val}>{prescriptions.length}</Text>
        <Text style={st.lbl}>Prescriptions</Text>
        <Text style={[st.sub, soonRefills > 0 && { color: N.warning }]}>
          {soonRefills > 0 ? `⚠️ ${soonRefills} refill soon` : 'All up to date'}
        </Text>
      </View>
    </View>
  )
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: { flex: 1, backgroundColor: N.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: N.parchment, borderLeftWidth: 3 },
  val: { fontSize: 26, fontFamily: 'Nunito_800ExtraBold', color: N.forest },
  lbl: { fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: N.stone, marginTop: 2 },
  sub: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: N.sage, marginTop: 3 },
})

export default function PatientDetail() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const id = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'appointments' | 'prescriptions'>('info')
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (id) fetchAll()
  }, [id])

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

  const handleCopyId = () => {
    if (!patient) return
    Clipboard.setString(patient.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('patients')
      .update({ name: editName, email: editEmail })
      .eq('id', id)
    if (error) showAlert('Error ❌', 'Failed to update patient')
    else {
      showAlert('Success 🌿', 'Patient updated!')
      setPatient(prev => prev ? { ...prev, name: editName, email: editEmail } : prev)
      setEditMode(false)
    }
    setSaving(false)
  }

  const handleDeleteAppointment = async (apptId: string) => {
    const confirmed = await showConfirm('Delete Appointment', 'Are you sure you want to delete this appointment?')
    if (!confirmed) return
    const { error } = await supabase.from('appointments').delete().eq('id', apptId)
    if (error) showAlert('Error ❌', 'Failed to delete')
    else {
      showAlert('Deleted 🌿', 'Appointment removed!')
      setAppointments(prev => prev.filter(a => a.id !== apptId))
    }
  }

  const handleDeletePrescription = async (presId: string) => {
    const confirmed = await showConfirm('Delete Prescription', 'Are you sure you want to delete this prescription?')
    if (!confirmed) return
    const { error } = await supabase.from('prescriptions').delete().eq('id', presId)
    if (error) showAlert('Error ❌', 'Failed to delete')
    else {
      showAlert('Deleted 🌿', 'Prescription removed!')
      setPrescriptions(prev => prev.filter(p => p.id !== presId))
    }
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
          <TouchableOpacity style={s.copyIdBtn} onPress={handleCopyId} activeOpacity={0.7}>
            <Text style={s.copyIdTxt}>
              {copied ? '✅ Copied!' : `📋 #${patient?.id.slice(0, 8).toUpperCase()}`}
            </Text>
          </TouchableOpacity>
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
        {/* Stats Card — shown on all tabs */}
        <StatsCard appointments={appointments} prescriptions={prescriptions} />

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
                  <View style={s.infoRow}><Text style={s.infoLabel}>Full Name</Text><Text style={s.infoValue}>{patient?.name}</Text></View>
                  <View style={s.infoRow}><Text style={s.infoLabel}>Email</Text><Text style={s.infoValue}>{patient?.email}</Text></View>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Member Since</Text>
                    <Text style={s.infoValue}>{patient?.created_at ? new Date(patient.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</Text>
                  </View>
                  <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={s.infoLabel}>Patient ID</Text>
                    <Text style={s.infoValue}>#{patient?.id.slice(0, 8).toUpperCase()}</Text>
                  </View>
                </>
              )}
            </Card>
            <TouchableOpacity style={s.pdfBtn} onPress={() => exportPatientSummaryPdf(patient, appointments, prescriptions)} activeOpacity={0.8}>
              <Text style={s.pdfBtnTxt}>⬇️  Download Patient Summary PDF</Text>
            </TouchableOpacity>

            {/* Delete Patient */}
            <TouchableOpacity
              style={s.dangerBtn}
              onPress={async () => {
                const confirmed = await showConfirm(
                  'Delete Patient',
                  'This will permanently delete the patient and ALL their records. This cannot be undone!'
                )
                if (!confirmed) return
                const { error } = await supabase.from('patients').delete().eq('id', id)
                if (error) showAlert('Error ❌', 'Failed to delete patient')
                else {
                  showAlert('Deleted 🌿', 'Patient removed successfully!')
                  router.push('/admin')
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={s.dangerBtnTxt}>🗑  Delete Patient</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <View>
            <View style={s.tabActionRow}>
              <Text style={s.sectionTitle}>All Appointments</Text>
              <TouchableOpacity style={s.manageBtn} onPress={() => router.push(`/admin/${id}/appointments`)} activeOpacity={0.7}>
                <Text style={s.manageBtnTxt}>＋ Manage</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.pdfBtn} onPress={() => exportAppointmentsPdf(patient?.name || '', appointments)} activeOpacity={0.8}>
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
              <TouchableOpacity style={s.manageBtn} onPress={() => router.push(`/admin/${id}/prescriptions`)} activeOpacity={0.7}>
                <Text style={s.manageBtnTxt}>＋ Manage</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.pdfBtn} onPress={() => exportPrescriptionsPdf(patient?.name || '', prescriptions)} activeOpacity={0.8}>
              <Text style={s.pdfBtnTxt}>⬇️  Download Prescriptions PDF</Text>
            </TouchableOpacity>

            {prescriptions.some(p => isRefillSoon(p.refill_on)) && (
              <View style={s.alertBanner}>
                <Text style={s.alertIcon}>⚠️</Text>
                <Text style={s.alertTxt}>
                  {prescriptions.filter(p => isRefillSoon(p.refill_on)).length} prescription(s) need refill within 7 days!
                </Text>
              </View>
            )}

            {prescriptions.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyIcon}>💊</Text>
                <Text style={s.emptyTxt}>No prescriptions yet</Text>
                <Text style={s.emptySub}>Add the first prescription for this patient</Text>
              </View>
            ) : prescriptions.map(pres => (
              <View key={pres.id} style={[s.recordCard, isRefillSoon(pres.refill_on) && s.recordCardAlert]}>
                <View style={s.recordLeft}>
                  <View style={[s.recordIconBox, { backgroundColor: isRefillSoon(pres.refill_on) ? N.warningLight : '#E8F4F8' }]}>
                    <Text style={s.recordIcon}>💊</Text>
                  </View>
                  <View style={s.recordInfo}>
                    <View style={s.recordTitleRow}>
                      <Text style={s.recordTitle}>{pres.medication}</Text>
                      {isRefillSoon(pres.refill_on) && (
                        <View style={s.alertBadge}>
                          <Text style={s.alertBadgeTxt}>⚠️ Refill Soon</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.recordSub}>{pres.dosage} · Qty: {pres.quantity}</Text>
                    <Text style={[s.recordSub, isRefillSoon(pres.refill_on) && { color: N.warning, fontFamily: 'Nunito_700Bold' }]}>
                      Refill: {pres.refill_on}
                    </Text>
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
  copyIdBtn: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  copyIdTxt: { color: N.leaf, fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
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
  alertBanner: { backgroundColor: N.warningLight, borderWidth: 1, borderColor: '#FDE68A', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  alertIcon: { fontSize: 18 },
  alertTxt: { color: N.warning, fontFamily: 'Nunito_600SemiBold', fontSize: 13, flex: 1 },
  emptyCard: { backgroundColor: N.white, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: N.parchment },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTxt: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: N.forest, marginBottom: 4 },
  emptySub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: N.stone, textAlign: 'center' },
  recordCard: { backgroundColor: N.white, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: N.parchment, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordCardAlert: { borderColor: '#FDE68A', backgroundColor: '#FFFDF5' },
  recordLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  recordIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: N.mist, alignItems: 'center', justifyContent: 'center' },
  recordIcon: { fontSize: 18 },
  recordInfo: { flex: 1 },
  recordTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 },
  recordTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: N.forest },
  alertBadge: { backgroundColor: N.warningLight, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  alertBadgeTxt: { color: N.warning, fontFamily: 'Nunito_600SemiBold', fontSize: 10 },
  recordSub: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: N.stone, marginBottom: 2 },
  repeatBadge: { backgroundColor: N.mist, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20, alignSelf: 'flex-start', marginTop: 4 },
  repeatTxt: { color: N.moss, fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
  dangerBtn: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  dangerBtnTxt: { color: '#B45309', fontFamily: 'Nunito_700Bold', fontSize: 13 },
  deleteBtn: { padding: 8, backgroundColor: N.dangerLight, borderRadius: 10 },
  deleteTxt: { fontSize: 16 },
})