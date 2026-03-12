import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { theme } from '../../theme'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import Button from '../../components/Button'

type Patient = {
  id: string
  full_name: string
  email: string
  date_of_birth: string
  phone: string
  insurance: string
}

export default function AdminIndex() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filtered, setFiltered] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(patients)
    } else {
      setFiltered(patients.filter(p =>
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
      ))
    }
  }, [search, patients])

  const fetchPatients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      Alert.alert('Error', 'Failed to load patients')
    } else {
      setPatients(data || [])
      setFiltered(data || [])
    }
    setLoading(false)
  }

  const formatDOB = (dob: string) => {
    if (!dob) return 'N/A'
    return new Date(dob).toLocaleDateString()
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AuraHealth EMR</Text>
          <Text style={styles.headerSub}>Patient Management</Text>
        </View>
        <Button
          title="+ Add Patient"
          onPress={() => router.push('/admin/new')}
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search by name or email..."
          placeholderTextColor={theme.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading patients..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="👤"
          title="No patients found"
          message="Add a new patient to get started"
        />
      ) : (
        <ScrollView style={styles.list}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Patient</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Email</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>DOB</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Phone</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Action</Text>
          </View>

          {/* Table Rows */}
          {filtered.map((patient, index) => (
            <TouchableOpacity
              key={patient.id}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.rowEven : styles.rowOdd
              ]}
              onPress={() => router.push(`/admin/${patient.id}`)}
            >
              {/* Name + Avatar */}
              <View style={[styles.cell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                <Avatar name={patient.full_name} size={36} />
                <Text style={styles.nameText}>{patient.full_name}</Text>
              </View>

              {/* Email */}
              <View style={[styles.cell, { flex: 2 }]}>
                <Text style={styles.cellText}>{patient.email}</Text>
              </View>

              {/* DOB */}
              <View style={[styles.cell, { flex: 1 }]}>
                <Text style={styles.cellText}>{formatDOB(patient.date_of_birth)}</Text>
              </View>

              {/* Phone */}
              <View style={[styles.cell, { flex: 1 }]}>
                <Text style={styles.cellText}>{patient.phone || 'N/A'}</Text>
              </View>

              {/* Action */}
              <View style={[styles.cell, { flex: 1 }]}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => router.push(`/admin/${patient.id}`)}
                >
                  <Text style={styles.viewButtonText}>View →</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    color: theme.white,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  searchInput: {
    backgroundColor: theme.background,
    borderRadius: theme.radiusMd,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    borderRadius: theme.radiusMd,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  tableHeaderText: {
    color: theme.white,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radiusSm,
    marginBottom: 2,
    alignItems: 'center',
  },
  rowEven: {
    backgroundColor: theme.surface,
  },
  rowOdd: {
    backgroundColor: theme.primaryLight,
  },
  cell: {
    justifyContent: 'center',
  },
  nameText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: theme.text,
  },
  cellText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: theme.muted,
  },
  viewButton: {
    backgroundColor: theme.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radiusFull,
  },
  viewButtonText: {
    color: theme.primary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
  }
})