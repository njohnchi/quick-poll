import { computed } from 'vue'

export type AuthUser = {
  id: string
  name: string
  email: string
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth:user', () => null)

  const isAuthenticated = computed(() => !!user.value)

  async function login(email: string, _password: string) {
    // Placeholder: simulate login
    user.value = {
      id: 'u_' + Math.random().toString(36).slice(2, 9),
            name: 'Anonymous User',
      email,
    }
    return true
  }

  async function register(name: string, email: string, _password: string) {
    // Placeholder: simulate registration, then auto-login
    user.value = {
      id: 'u_' + Math.random().toString(36).slice(2, 9),
      name,
      email,
    }
    return true
  }

  async function logout() {
    user.value = null
  }

  return { user, isAuthenticated, login, register, logout }
}

