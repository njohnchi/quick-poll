import { computed } from 'vue'

export type AuthUser = {
  id: string
  name: string
  email: string
}

export function useAuth() {
  const supabase = useSupabaseClient()
  const supabaseUser = useSupabaseUser()
  const session = useSupabaseSession()

  const user = computed<AuthUser | null>(() => {
    const u = supabaseUser.value
    if (!u) return null
    const name = (u.user_metadata?.name as string | undefined) || (u.email?.split('@')[0] ?? 'User')
    return { id: u.id, name, email: u.email ?? '' }
  })

  const isAuthenticated = computed(() => !!session.value && !!supabaseUser.value)

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return true
  }

  async function register(name: string, email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    if (error) throw error
    return true
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { user, isAuthenticated, login, register, logout }
}
