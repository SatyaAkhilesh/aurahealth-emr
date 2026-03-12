import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { theme } from '@/theme'
import Avatar from '@/components/Avatar'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'

type Patient = {
  id: string
  name: string
  email: string
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filtered, setFiltered] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [totalPrescriptions, setTotalPrescriptions] = useState(0)

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(patients)
    } else {
      setFiltered(patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
      ))
    }
  }, [search, patients])

  const fetchAll = async () => {
    setLoading(true)
    const [patientsRes, apptRes, presRes] = await Promise.all([
      supabase.from('patients').select('*').order('created_at', { ascending: false }),
      supabase.from('appointments').select('id', { count: 'exact' }),
      supabase.from('prescriptions').select('id', { count: 'exact' }),
    ])
    if (patientsRes.error) Alert.alert('Error', 'Failed to load patients')
    else {
      setPatients(patientsRes.data || [])
      setFiltered(patientsRes.data || [])
    }
    setTotalAppointments(apptRes.count || 0)
    setTotalPrescriptions(presRes.count || 0)
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>💜 AuraHealth</Text>
          <Text style={styles.logoSub}>EMR Admin Portal</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/admin/new')}>
          <Text style={styles.addBtnText}>+ Add Patient</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.primary }]}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statNumber}>{patients.length}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#0891B2' }]}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statNumber}>{totalAppointments}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <Text style={styles.statIcon}>💊</Text>
            <Text style={styles.statNumber}>{totalPrescriptions}</Text>
            <Text style={styles.statLabel}>Prescriptions</Text>
          </View>
        </View>

        <View style={styles.searchWrapper}>
          <Text style={styles.sectionTitle}>All Patients</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍  Search by name or email..."
            placeholderTextColor={theme.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <LoadingSpinner message="Loading patients..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon="👤" title="No patients found" message="Add a new patient to get started" />
        ) : (
          <View style={styles.tableWrapper}>
            <View style={styles.tableHead}>
              <Text style={[styles.headCell, { flex: 2.5 }]}>Patient</Text>
              <Text style={[styles.headCell, { flex: 2.5 }]}>Email</Text>
              <Text style={[styles.headCell, { flex: 1, textAlign: 'center' }]}>Action</Text>
            </View>
            {filtered.map((patient, index) => (
              <TouchableOpacity
                key={patient.id}
                style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
                onPress={() => router.push(`/admin/${patient.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.cell, { flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                  <Avatar name={patient.name} size={38} />
                  <Text style={styles.nameText}>{patient.name}</Text>
                </View>
                <View style={[styles.cell, { flex: 2.5 }]}>
                  <Text style={styles.cellText}>{patient.email}</Text>
                </View>
                <View style={[styles.cell, { flex: 1, alignItems: 'center' }]}>
                  <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/admin/${patient.id}`)}>
                    <Text style={styles.viewBtnText}>View →</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  header: { backgroundColor: theme.primary, paddingHorizontal: 28, paddingVertical: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: 24, fontFamily: 'Nunito_800ExtraBold', color: theme.white },
  logoSub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addBtn: { backgroundColor: theme.white, paddingVertical: 10, paddingHorizontal: 20, borderRadius: theme.radiusFull },
  addBtnText: { color: theme.primary, fontFamily: 'Nunito_700Bold', fontSize: 14 },
  scroll: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: 12, padding: 20 },
  statCard: { flex: 1, borderRadius: theme.radiusLg, padding: 18, alignItems: 'center', ...theme.shadow },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statNumber: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold', color: theme.white },
  statLabel: { fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  searchWrapper: { paddingHorizontal: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: theme.text, marginBottom: 12 },
  searchInput: { backgroundColor: theme.surface, borderRadius: theme.radiusMd, paddingVertical: 12, paddingHorizontal: 16, fontSize: 14, fontFamily: 'Nunito_400Regular', color: theme.text, borderWidth: 1.5, borderColor: theme.border },
  tableWrapper: { marginHorizontal: 20, borderRadius: theme.radiusLg, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
  tableHead: { flexDirection: 'row', backgroundColor: theme.primary, paddingVertical: 14, paddingHorizontal: 16 },
  headCell: { color: theme.white, fontFamily: 'Nunito_700Bold', fontSize: 13 },
  tableRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.border },
  rowEven: { backgroundColor: theme.surface },
  rowOdd: { backgroundColor: '#FAF9FF' },
  cell: { justifyContent: 'center' },
  nameText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: theme.text },
  cellText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: theme.muted },
  viewBtn: { backgroundColor: theme.primary, paddingVertical: 6, paddingHorizontal: 14, borderRadius: theme.radiusFull },
  viewBtnText: { color: theme.white, fontFamily: 'Nunito_700Bold', fontSize: 12 },
})