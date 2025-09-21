<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/composables/useAuth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const { login } = useAuth()
const route = useRoute()
const router = useRouter()

const redirectTo = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') ? r : '/polls'
})

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    await login(email.value, password.value)
    router.push(redirectTo.value)
  } catch (e) {
    const msg = (e as any)?.message || 'Login failed. Please try again.'
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto max-w-md p-4">
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Access your polls and create new ones.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" autocomplete="email" v-model="email" required />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input id="password" type="password" autocomplete="current-password" v-model="password" required />
          </div>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <Button type="submit" :disabled="loading" class="w-full">
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <div class="flex w-full items-center justify-between text-sm">
          <NuxtLink to="/auth/register" class="text-primary underline">Need an account? Register</NuxtLink>
          <NuxtLink to="/auth/forgot-password" class="text-muted-foreground hover:underline">Forgot password?</NuxtLink>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
