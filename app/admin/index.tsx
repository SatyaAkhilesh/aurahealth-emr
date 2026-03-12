import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, useWindowDimensions
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/Avatar'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'

type Patient = { id: string; name: string; email: string; created_at: string }

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
}

export default function AdminDashboard() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width < 768
  const [activeNav, setActiveNav] = useState('Overview')
  const [patients, setPatients] = useState<Patient[]>([])
  const [filtered, setFiltered] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [totalAppt, setTotalAppt] = useState(0)
  const [totalPres, setTotalPres] = useState(0)

  const navItems = [
    { icon: '🏠', label: 'Overview' },
    { icon: '👥', label: 'Patients' },
    { icon: '📅', label: 'Appointments' },
    { icon: '💊', label: 'Prescriptions' },
  ]

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning 🌤'
    if (h < 17) return 'Good afternoon ☀️'
    return 'Good evening 🌙'
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    setFiltered(search.trim() === '' ? patients :
      patients.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase())
      ))
  }, [search, patients])

  const fetchAll = async () => {
    setLoading(true)
    const [p, a, r] = await Promise.all([
      supabase.from('patients').select('*').order('created_at', { ascending: false }),
      supabase.from('appointments').select('id', { count: 'exact' }),
      supabase.from('prescriptions').select('id', { count: 'exact' }),
    ])
    if (p.error) Alert.alert('Error', 'Failed to load patients')
    else { setPatients(p.data || []); setFiltered(p.data || []) }
    setTotalAppt(a.count || 0)
    setTotalPres(r.count || 0)
    setLoading(false)
  }

  const goToPatient = (patientId: string) => {
    router.push({
      pathname: '/admin/[id]',
      params: { id: patientId },
    } as any)
  }

  return (
    <View style={s.root}>

      {/* Sidebar */}
      <View style={[s.sidebar, isMobile && s.sidebarMobile]}>
        <View style={s.brand}>
          <View style={s.brandIcon}>
            <Text style={s.brandIconTxt}>✦</Text>
          </View>
          {!isMobile && (
            <View>
              <Text style={s.brandName}>AuraHealth</Text>
              <Text style={s.brandSub}>Care Platform</Text>
            </View>
          )}
        </View>
        <View style={s.divider} />
        {navItems.map(item => (
          <TouchableOpacity
            key={item.label}
            style={[s.navItem, activeNav === item.label && s.navItemActive]}
            activeOpacity={0.7}
            onPress={() => setActiveNav(item.label)}
          >
            <Text style={s.navIconEmoji}>{item.icon}</Text>
            {!isMobile && (
              <Text style={[s.navLabel, activeNav === item.label && s.navLabelActive]}>
                {item.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
        <View style={s.sideFooter}>
          <View style={s.adminCard}>
            <View style={s.adminAv}>
              <Text style={s.adminAvTxt}>AD</Text>
            </View>
            {!isMobile && (
              <View>
                <Text style={s.adminName}>Admin</Text>
                <Text style={s.adminRole}>Super Admin</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Main */}
      <View style={s.main}>

        {/* Top Bar */}
        <View style={s.topbar}>
          <View>
            <Text style={s.topGreet}>{getGreeting()}</Text>
            <Text style={s.topTitle}>{activeNav}</Text>
          </View>
          <TouchableOpacity style={s.newBtn} onPress={() => router.push('/admin/new')} activeOpacity={0.8}>
            <Text style={s.newBtnTxt}>{isMobile ? '＋' : '＋ New Patient'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* ── OVERVIEW ── */}
          {activeNav === 'Overview' && (
            <View>
              {/* Hero */}
              <View style={s.overviewHero}>
                <View style={{ flex: 1 }}>
                  <Text style={s.overviewEye}>DASHBOARD</Text>
                  <Text style={s.overviewTitle}>Welcome back,{'\n'}Admin 👋</Text>
                  <Text style={s.overviewSub}>Here's what's happening across your platform today.</Text>
                </View>
                <Text style={{ fontSize: 64 }}>🌿</Text>
              </View>

              {/* Stats Grid */}
              <View style={s.overviewGrid}>
                {[
                  { icon: '👥', val: patients.length, lbl: 'Total Patients', unit: 'registered', color: N.moss, bg: N.mist, border: N.moss },
                  { icon: '📅', val: totalAppt, lbl: 'Appointments', unit: 'scheduled', color: '#0891B2', bg: '#E0F4F8', border: '#0891B2' },
                  { icon: '💊', val: totalPres, lbl: 'Prescriptions', unit: 'active', color: N.sage, bg: '#EAF4E8', border: N.sage },
                  { icon: '✅', val: patients.length, lbl: 'Active Today', unit: 'online', color: '#D97706', bg: '#FEF3C7', border: '#D97706' },
                ].map((st, i) => (
                  <View key={i} style={[s.overviewCard, { borderLeftColor: st.border }]}>
                    <View style={[s.overviewIconBox, { backgroundColor: st.bg }]}>
                      <Text style={{ fontSize: 20 }}>{st.icon}</Text>
                    </View>
                    <Text style={[s.overviewVal, { color: st.color }]}>{st.val}</Text>
                    <Text style={s.overviewLbl}>{st.lbl}</Text>
                    <Text style={s.overviewUnit}>{st.unit}</Text>
                  </View>
                ))}
              </View>

              {/* Quick Actions */}
              <View style={s.quickCard}>
                <Text style={s.quickTitle}>Quick Actions</Text>
                <View style={s.quickRow}>
                  {[
                    { icon: '➕', label: 'New Patient', action: () => router.push('/admin/new') },
                    { icon: '👥', label: 'Patients', action: () => setActiveNav('Patients') },
                    { icon: '📅', label: 'Appointments', action: () => setActiveNav('Appointments') },
                    { icon: '💊', label: 'Prescriptions', action: () => setActiveNav('Prescriptions') },
                  ].map((btn, i) => (
                    <TouchableOpacity key={i} style={s.quickBtn} onPress={btn.action} activeOpacity={0.8}>
                      <Text style={s.quickBtnIcon}>{btn.icon}</Text>
                      <Text style={s.quickBtnTxt}>{btn.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Recent Patients */}
              <View style={s.recentCard}>
                <Text style={s.recentTitle}>Recent Patients</Text>
                <Text style={s.recentSub}>Last {Math.min(3, patients.length)} registered</Text>
                {patients.slice(0, 3).map((pt, idx) => (
                  <TouchableOpacity
                    key={pt.id}
                    style={[s.simpleRow, { borderTopWidth: 1, borderTopColor: N.parchment }]}
                    onPress={() => goToPatient(pt.id)}
                    activeOpacity={0.7}
                  >
                    <Avatar name={pt.name || 'U'} size={36} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.rowName}>{pt.name}</Text>
                      <Text style={s.rowEmail}>{pt.email}</Text>
                    </View>
                    <Text style={{ color: N.moss, fontFamily: 'Nunito_600SemiBold', fontSize: 12 }}>View →</Text>
                  </TouchableOpacity>
                ))}
                {patients.length === 0 && (
                  <Text style={{ color: N.stone, fontFamily: 'Nunito_400Regular', fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
                    No patients yet. Add your first patient!
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* ── APPOINTMENTS ── */}
          {activeNav === 'Appointments' && (
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>📅 Appointments</Text>
              <Text style={s.sectionSub}>Total appointments across all patients</Text>
              <View style={[s.overviewCard, { borderLeftColor: '#0891B2', marginTop: 16 }]}>
                <View style={[s.overviewIconBox, { backgroundColor: '#E0F4F8' }]}>
                  <Text style={{ fontSize: 20 }}>📅</Text>
                </View>
                <Text style={[s.overviewVal, { color: '#0891B2', fontSize: 40 }]}>{totalAppt}</Text>
                <Text style={s.overviewLbl}>Total Appointments</Text>
              </View>
              <Text style={[s.sectionSub, { marginTop: 20, marginBottom: 8 }]}>Select a patient to manage appointments:</Text>
              {patients.map((pt, idx) => (
                <TouchableOpacity
                  key={pt.id}
                  style={[s.simpleRow, { borderTopWidth: 1, borderTopColor: N.parchment }]}
                  onPress={() => goToPatient(pt.id)}
                  activeOpacity={0.7}
                >
                  <Avatar name={pt.name || 'U'} size={32} />
                  <Text style={[s.rowName, { marginLeft: 12, flex: 1 }]}>{pt.name}</Text>
                  <Text style={{ color: '#0891B2', fontFamily: 'Nunito_600SemiBold', fontSize: 12 }}>View →</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── PRESCRIPTIONS ── */}
          {activeNav === 'Prescriptions' && (
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>💊 Prescriptions</Text>
              <Text style={s.sectionSub}>Total prescriptions across all patients</Text>
              <View style={[s.overviewCard, { borderLeftColor: N.sage, marginTop: 16 }]}>
                <View style={[s.overviewIconBox, { backgroundColor: '#EAF4E8' }]}>
                  <Text style={{ fontSize: 20 }}>💊</Text>
                </View>
                <Text style={[s.overviewVal, { color: N.sage, fontSize: 40 }]}>{totalPres}</Text>
                <Text style={s.overviewLbl}>Total Prescriptions</Text>
              </View>
              <Text style={[s.sectionSub, { marginTop: 20, marginBottom: 8 }]}>Select a patient to manage prescriptions:</Text>
              {patients.map((pt, idx) => (
                <TouchableOpacity
                  key={pt.id}
                  style={[s.simpleRow, { borderTopWidth: 1, borderTopColor: N.parchment }]}
                  onPress={() => goToPatient(pt.id)}
                  activeOpacity={0.7}
                >
                  <Avatar name={pt.name || 'U'} size={32} />
                  <Text style={[s.rowName, { marginLeft: 12, flex: 1 }]}>{pt.name}</Text>
                  <Text style={{ color: N.sage, fontFamily: 'Nunito_600SemiBold', fontSize: 12 }}>View →</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── PATIENTS ── */}
          {activeNav === 'Patients' && (
            <View>
              <View style={s.hero}>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroEye}>PATIENT OVERVIEW</Text>
                  <Text style={s.heroTitle}>{patients.length} Patients{'\n'}Under Care 🌿</Text>
                  <Text style={s.heroSub}>All records are up to date and synced.</Text>
                </View>
                {!isMobile && <Text style={{ fontSize: 60 }}>🌱</Text>}
              </View>

              <View style={s.statsRow}>
                {[
                  { icon: '🧑‍⚕️', val: patients.length, lbl: 'Patients', color: N.moss, bg: N.mist },
                  { icon: '📋', val: totalAppt, lbl: 'Appointments', color: '#0891B2', bg: '#E0F4F8' },
                  { icon: '💊', val: totalPres, lbl: 'Prescriptions', color: N.sage, bg: '#EAF4E8' },
                  { icon: '🌟', val: patients.length, lbl: 'Active', color: '#D97706', bg: '#FEF3C7' },
                ].map((st, i) => (
                  <View key={i} style={s.statCard}>
                    <View style={[s.statIconBox, { backgroundColor: st.bg }]}>
                      <Text style={{ fontSize: 17 }}>{st.icon}</Text>
                    </View>
                    <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
                    <Text style={s.statLbl}>{st.lbl}</Text>
                  </View>
                ))}
              </View>

              <View style={s.tableWrap}>
                <View style={s.tableTop}>
                  <View>
                    <Text style={s.tableTitle}>All Patients</Text>
                    <Text style={s.tableSub}>{filtered.length} records found</Text>
                  </View>
                  <View style={s.searchBox}>
                    <Text style={{ fontSize: 13 }}>🔍</Text>
                    <TextInput
                      style={s.searchInp}
                      placeholder="Search patients..."
                      placeholderTextColor={N.stone}
                      value={search}
                      onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                      <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={{ fontSize: 12, color: N.stone }}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {!isMobile && (
                  <View style={s.colHead}>
                    <Text style={[s.colTxt, { flex: 3 }]}>PATIENT</Text>
                    <Text style={[s.colTxt, { flex: 2.5 }]}>EMAIL</Text>
                    <Text style={[s.colTxt, { flex: 1 }]}>STATUS</Text>
                    <Text style={[s.colTxt, { flex: 1.2 }]}>JOINED</Text>
                    <Text style={[s.colTxt, { flex: 0.8, textAlign: 'right' }]}>ACTION</Text>
                  </View>
                )}

                {loading ? (
                  <View style={{ padding: 32 }}><LoadingSpinner message="Loading patients..." /></View>
                ) : filtered.length === 0 ? (
                  <View style={{ padding: 32 }}><EmptyState icon="🌱" title="No patients yet" message="Add your first patient" /></View>
                ) : filtered.map((pt, idx) => (
                  <TouchableOpacity
                    key={pt.id}
                    style={[s.row, !isMobile && idx % 2 !== 0 && s.rowAlt]}
                    onPress={() => goToPatient(pt.id)}
                    activeOpacity={0.65}
                  >
                    {isMobile ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar name={pt.name || 'U'} size={44} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={s.rowName}>{pt.name}</Text>
                          <Text style={s.rowEmail}>{pt.email}</Text>
                        </View>
                        <Text style={{ color: N.stone, fontSize: 18 }}>→</Text>
                      </View>
                    ) : (
                      <>
                        <View style={[s.cell, { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                          <Avatar name={pt.name || 'U'} size={36} />
                          <View style={{ flex: 1 }}>
                            <Text style={s.rowName} numberOfLines={1}>{pt.name}</Text>
                            <Text style={s.rowId}>#{pt.id.slice(0, 6).toUpperCase()}</Text>
                          </View>
                        </View>
                        <View style={[s.cell, { flex: 2.5 }]}>
                          <Text style={s.rowEmail} numberOfLines={1}>{pt.email}</Text>
                        </View>
                        <View style={[s.cell, { flex: 1 }]}>
                          <View style={s.badge}>
                            <View style={s.badgeDot} />
                            <Text style={s.badgeTxt}>Active</Text>
                          </View>
                        </View>
                        <View style={[s.cell, { flex: 1.2 }]}>
                          <Text style={s.rowDate}>
                            {new Date(pt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                        <View style={[s.cell, { flex: 0.8, alignItems: 'flex-end' }]}>
                          <TouchableOpacity style={s.viewBtn} onPress={() => goToPatient(pt.id)} activeOpacity={0.7}>
                            <Text style={s.viewTxt}>View →</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: N.cream },
  sidebar: { width: 220, backgroundColor: N.forest, paddingTop: 32, paddingHorizontal: 16 },
  sidebarMobile: { width: 64, paddingHorizontal: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  brandIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: N.sage, alignItems: 'center', justifyContent: 'center' },
  brandIconTxt: { color: N.white, fontSize: 16 },
  brandName: { color: N.white, fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  brandSub: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Nunito_400Regular', fontSize: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 18 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, marginBottom: 2 },
  navItemActive: { backgroundColor: N.moss },
  navIconEmoji: { fontSize: 16, width: 20, textAlign: 'center' },
  navLabel: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  navLabelActive: { color: N.white },
  sideFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  adminCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10 },
  adminAv: { width: 30, height: 30, borderRadius: 8, backgroundColor: N.sage, alignItems: 'center', justifyContent: 'center' },
  adminAvTxt: { color: N.white, fontFamily: 'Nunito_700Bold', fontSize: 11 },
  adminName: { color: N.white, fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  adminRole: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Nunito_400Regular', fontSize: 10 },
  main: { flex: 1 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: N.white, borderBottomWidth: 1, borderBottomColor: N.parchment },
  topGreet: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: N.stone },
  topTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: N.forest },
  newBtn: { backgroundColor: N.moss, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  newBtnTxt: { color: N.white, fontFamily: 'Nunito_700Bold', fontSize: 13 },
  scroll: { flex: 1 },

  // Overview
  overviewHero: { margin: 20, marginBottom: 16, backgroundColor: N.moss, borderRadius: 18, padding: 28, flexDirection: 'row', alignItems: 'center' },
  overviewEye: { color: N.leaf, fontFamily: 'Nunito_700Bold', fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  overviewTitle: { color: N.white, fontFamily: 'Nunito_800ExtraBold', fontSize: 24, lineHeight: 32 },
  overviewSub: { color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito_400Regular', fontSize: 12, marginTop: 8 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  overviewCard: { width: '47%', backgroundColor: N.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: N.parchment, borderLeftWidth: 3 },
  overviewIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  overviewVal: { fontSize: 30, fontFamily: 'Nunito_800ExtraBold' },
  overviewLbl: { fontSize: 12, fontFamily: 'Nunito_700Bold', color: N.forest, marginTop: 2 },
  overviewUnit: { fontSize: 10, fontFamily: 'Nunito_400Regular', color: N.stone, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: N.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: N.parchment },
  quickTitle: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold', color: N.forest, marginBottom: 14 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, backgroundColor: N.mist, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: N.parchment },
  quickBtnIcon: { fontSize: 22, marginBottom: 6 },
  quickBtnTxt: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: N.moss, textAlign: 'center' },
  recentCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: N.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: N.parchment },
  recentTitle: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold', color: N.forest, marginBottom: 4 },
  recentSub: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: N.stone, marginBottom: 8 },
  simpleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },

  // Section
  sectionCard: { margin: 20, backgroundColor: N.white, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: N.parchment },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: N.forest, marginBottom: 6 },
  sectionSub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: N.stone },

  // Hero
  hero: { margin: 20, marginBottom: 16, backgroundColor: N.moss, borderRadius: 18, padding: 24, flexDirection: 'row', alignItems: 'center' },
  heroEye: { color: N.leaf, fontFamily: 'Nunito_700Bold', fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  heroTitle: { color: N.white, fontFamily: 'Nunito_800ExtraBold', fontSize: 22, lineHeight: 30 },
  heroSub: { color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito_400Regular', fontSize: 12, marginTop: 6 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: N.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: N.parchment },
  statIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statVal: { fontSize: 26, fontFamily: 'Nunito_800ExtraBold' },
  statLbl: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: N.stone, marginTop: 2 },

  // Table
  tableWrap: { marginHorizontal: 20, backgroundColor: N.white, borderRadius: 18, borderWidth: 1, borderColor: N.parchment, overflow: 'hidden' },
  tableTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: N.parchment, flexWrap: 'wrap', gap: 10 },
  tableTitle: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold', color: N.forest },
  tableSub: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: N.stone, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: N.cream, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: N.parchment, minWidth: 200 },
  searchInp: { flex: 1, fontSize: 13, fontFamily: 'Nunito_400Regular', color: N.forest, minWidth: 80 },
  colHead: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: N.mist, borderBottomWidth: 1, borderBottomColor: N.parchment },
  colTxt: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: N.sage, letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F8F5F0' },
  rowAlt: { backgroundColor: '#FDFAF7' },
  cell: { justifyContent: 'center' },
  rowName: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: N.forest },
  rowId: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: N.stone, marginTop: 1 },
  rowEmail: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: N.stone },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#C8DCC0' },
  badgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: N.mint },
  badgeTxt: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: N.moss },
  rowDate: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: N.stone },
  viewBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: N.mist, borderWidth: 1, borderColor: '#C8DCC0' },
  viewTxt: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: N.moss },
})