import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { supabase } from './lib/supabase'

export default function App() {
  const [status, setStatus] = useState('Testing connection...')

  useEffect(() => {
    supabase
      .from('patients')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          setStatus('❌ Connection failed: ' + error.message)
        } else {
          setStatus('✅ Supabase connected!')
        }
      })
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{status}</Text>
    </View>
  )
}