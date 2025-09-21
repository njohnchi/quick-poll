import { useSupabaseSession } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  const session = useSupabaseSession()
  if (!session.value) {
    const redirect = encodeURIComponent(to.fullPath)
    return navigateTo(`/auth/login?redirect=${redirect}`)
  }
})
