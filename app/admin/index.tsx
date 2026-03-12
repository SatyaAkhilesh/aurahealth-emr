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
  bark:      '#5C4A32',
  stone:     '#8A8A7A',
  white:     '#FFFFFF',
  sky:       '#0891B2',
  parchment: '#EDE8DF',
}

export default function AdminDashboard() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024

  const [patients, setPatients] = useState<Patient[]>([])
  const [filtered, setFiltered] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [totalAppt, setTotalAppt] = useState(0)
  const [totalPres, setTotalPres] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const Sidebar = () => (
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

      {[
        { icon: '◈', label: 'Overview', route: '/admin' },
        { icon: '◉', label: 'Patients', route: '/admin', active: true },
        { icon: '◷', label: 'Appointments', route: '/admin' },
        { icon: '◈', label: 'Prescriptions', route: '/admin' },
      ].map(item => (
        <TouchableOpacity
          key={item.label}
          style={[s.navItem, item.active && s.navItemActive]}
          onPress={() => router.push(item.route as any)}
          activeOpacity={0.7}
        >
          <Text style={[s.navIcon, item.active && s.navIconActive]}>{item.icon}</Text>
          {!isMobile && <Text style={[s.navLabel, item.active && s.navLabelActive]}>{item.label}</Text>}
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
  )

  return (
    <View style={s.root}>
      <Sidebar />

      <View style={s.main}>
        {/* Top Bar */}
        <View style={s.topbar}>
          <View>
            <Text style={s.topGreet}>Good morning 🌤</Text>
            <Text style={[s.topTitle, isMobile && { fontSize: 16 }]}>Patient Directory</Text>
          </View>
          <TouchableOpacity
            style={s.newBtn}
            onPress={() => router.push('/admin/new')}
            activeOpacity={0.8}
          >
            <Text style={s.newBtnTxt}>{isMobile ? '＋' : '＋ New Patient'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Hero */}
          <View style={[s.hero, isMobile && s.heroMobile]}>
            <View style={s.heroLeft}>
              <Text style={s.heroEye}>PATIENT OVERVIEW</Text>
              <Text style={[s.heroTitle, isMobile && { fontSize: 18, lineHeight: 26 }]}>
                {patients.length} Patients{'\n'}Under Care 🌿
              </Text>
              <Text style={s.heroSub}>All records are up to date and synced.</Text>
            </View>
            {!isMobile && <Text style={s.heroEmoji}>🌱</Text>}
          </View>

          {/* Stats */}
          <View style={[s.statsRow, isMobile && s.statsRowMobile]}>
            {[
              { icon: '🧑‍⚕️', val: patients.length, lbl: 'Patients', color: N.moss, bg: N.mist },
              { icon: '📋', val: totalAppt, lbl: 'Appointments', color: N.sky, bg: '#E0F4F8' },
              { icon: '💊', val: totalPres, lbl: 'Prescriptions', color: N.sage, bg: '#EAF4E8' },
              { icon: '🌟', val: patients.length, lbl: 'Active', color: '#D97706', bg: '#FEF3C7' },
            ].map((st, i) => (
              <View key={i} style={[s.statCard, isMobile && s.statCardMobile]}>
                <View style={[s.statIconBox, { backgroundColor: st.bg }]}>
                  <Text style={s.statIconTxt}>{st.icon}</Text>
                </View>
                <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
                <Text style={s.statLbl}>{st.lbl}</Text>
              </View>
            ))}
          </View>

          {/* Table */}
          <View style={s.tableWrap}>
            <View style={s.tableTop}>
              <View>
                <Text style={s.tableTitle}>All Patients</Text>
                <Text style={s.tableSub}>{filtered.length} records found</Text>
              </View>
              <View style={[s.searchBox, isMobile && { minWidth: 140 }]}>
                <Text style={s.searchIco}>🔍</Text>
                <TextInput
                  style={s.searchInp}
                  placeholder="Search..."
                  placeholderTextColor={N.stone}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={s.clearX}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Desktop Table */}
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
              <View style={{ padding: 32 }}>
                <LoadingSpinner message="Loading patients..." />
              </View>
            ) : filtered.length === 0 ? (
              <View style={{ padding: 32 }}>
                <EmptyState icon="🌱" title="No patients yet" message="Add your first patient" />
              </View>
            ) : filtered.map((pt, idx) => (
              <TouchableOpacity
                key={pt.id}
                style={[
                  isMobile ? s.cardRow : s.row,
                  !isMobile && idx % 2 !== 0 && s.rowAlt
                ]}
                onPress={() => router.push(`/admin/${pt.id}`)}
                activeOpacity={0.65}
              >
                {isMobile ? (
                  // Mobile card layout
                  <View style={s.mobileCard}>
                    <View style={s.mobileCardLeft}>
                      <Avatar name={pt.name || 'U'} size={44} />
                    </View>
                    <View style={s.mobileCardRight}>
                      <Text style={s.rowName}>{pt.name}</Text>
                      <Text style={s.rowEmail}>{pt.email}</Text>
                      <View style={s.mobileCardBottom}>
                        <View style={s.badge}>
                          <View style={s.badgeDot} />
                          <Text style={s.badgeTxt}>Active</Text>
                        </View>
                        <Text style={s.rowDate}>
                          {new Date(pt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.mobileArrow}>→</Text>
                  </View>
                ) : (
                  // Desktop table layout
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
                      <View style={s.viewBtn}>
                        <Text style={s.viewTxt}>View →</Text>
                      </View>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: N.cream },

  // Sidebar
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
  navIcon: { fontSize: 14, color: 'rgba(255,255,255,0.3)', width: 20, textAlign: 'center' },
  navIconActive: { color: N.leaf },
  navLabel: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  navLabelActive: { color: N.white },
  sideFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  adminCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10 },
  adminAv: { width: 30, height: 30, borderRadius: 8, backgroundColor: N.sage, alignItems: 'center', justifyContent: 'center' },
  adminAvTxt: { color: N.white, fontFamily: 'Nunito_700Bold', fontSize: 11 },
  adminName: { color: N.white, fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  adminRole: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Nunito_400Regular', fontSize: 10 },

  // Main
  main: { flex: 1 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: N.white, borderBottomWidth: 1, borderBottomColor: N.parchment },
  topGreet: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: N.stone },
  topTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: N.forest },
  newBtn: { backgroundColor: N.moss, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  newBtnTxt: { color: N.white, fontFamily: 'Nunito_700Bold', fontSize: 13 },
  scroll: { flex: 1 },

  // Hero
  hero: { margin: 20, marginBottom: 14, backgroundColor: N.moss, borderRadius: 18, padding: 24, flexDirection: 'row', alignItems: 'center' },
  heroMobile: { padding: 20 },
  heroLeft: { flex: 1 },
  heroEye: { color: N.leaf, fontFamily: 'Nunito_700Bold', fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  heroTitle: { color: N.white, fontFamily: 'Nunito_800ExtraBold', fontSize: 22, lineHeight: 30 },
  heroSub: { color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito_400Regular', fontSize: 12, marginTop: 6 },
  heroEmoji: { fontSize: 60 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 14, flexWrap: 'nowrap' },
  statsRowMobile: { flexWrap: 'wrap' },
  statCard: { flex: 1, backgroundColor: N.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: N.parchment },
  statCardMobile: { minWidth: '45%' },
  statIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statIconTxt: { fontSize: 17 },
  statVal: { fontSize: 26, fontFamily: 'Nunito_800ExtraBold' },
  statLbl: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: N.stone, marginTop: 2 },

  // Table
  tableWrap: { marginHorizontal: 20, backgroundColor: N.white, borderRadius: 18, borderWidth: 1, borderColor: N.parchment, overflow: 'hidden' },
  tableTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: N.parchment, flexWrap: 'wrap', gap: 10 },
  tableTitle: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold', color: N.forest },
  tableSub: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: N.stone, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: N.cream, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: N.parchment, minWidth: 200 },
  searchIco: { fontSize: 13 },
  searchInp: { flex: 1, fontSize: 13, fontFamily: 'Nunito_400Regular', color: N.forest, minWidth: 80 },
  clearX: { fontSize: 12, color: N.stone },
  colHead: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: N.mist, borderBottomWidth: 1, borderBottomColor: N.parchment },
  colTxt: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: N.sage, letterSpacing: 0.6 },

  // Desktop rows
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

  // Mobile card rows
  cardRow: { borderBottomWidth: 1, borderBottomColor: '#F8F5F0', padding: 14 },
  mobileCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mobileCardLeft: {},
  mobileCardRight: { flex: 1 },
  mobileCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  mobileArrow: { fontSize: 18, color: N.stone },
})