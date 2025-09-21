import { computed, watch } from 'vue'

export type AuthUser = {
  id: string
  name: string
  email: string
}

export function useAuth() {
  const supabase = useSupabaseClient()
  const supabaseUser = useSupabaseUser()
  const session = useSupabaseSession()

  // Optional profile name from a `profiles` table (id UUID references auth user id)
  const profileName = useState<string | null>('auth:profileName', () => null)

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single()
      if (error) throw error
      profileName.value = (data?.name as string | null) ?? null
    } catch (_e: any) {
      // Gracefully ignore if table doesn't exist or row not found
      profileName.value = profileName.value ?? null
    }
  }

  watch(
    () => supabaseUser.value?.id,
    (id) => {
      if (id) fetchProfile(id)
      else profileName.value = null
    },
    { immediate: true }
  )

  const user = computed<AuthUser | null>(() => {
    const u = supabaseUser.value
    if (!u) return null
    const baseName = (u.user_metadata?.name as string | undefined) || (u.email?.split('@')[0] ?? 'User')
    const name = profileName.value || baseName
    return { id: u.id, name, email: u.email ?? '' }
  })

  const isAuthenticated = computed(() => !!session.value && !!supabaseUser.value)

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (supabaseUser.value?.id) await fetchProfile(supabaseUser.value.id)
    return true
  }

  async function register(name: string, email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    if (error) throw error
    // Attempt to persist profile name when user id is immediately available
    const uid = data.user?.id
    if (uid) {
      try {
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert({ id: uid, name })
        if (upsertErr) throw upsertErr
        profileName.value = name
      } catch (_e: any) {
        // If table missing or other non-critical failure, ignore
      }
    }
    return true
  }

  async function logout() {
    profileName.value = null
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { user, isAuthenticated, login, register, logout }
}
