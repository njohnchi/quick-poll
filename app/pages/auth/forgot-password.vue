<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

const supabase = useSupabaseClient()
const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const redirectTo = ref<string>('')

onMounted(() => {
  // Build a redirect URL back to our reset-password page on this origin.
  redirectTo.value = `${window.location.origin}/auth/reset-password`
})

async function onSubmit() {
  error.value = null
  success.value = null
  loading.value = true
  try {
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: redirectTo.value,
    })
    if (err) throw err
    success.value = 'If an account exists for that email, a reset link has been sent.'
  } catch (e) {
    error.value = (e as any)?.message || 'Failed to send reset email.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto max-w-md p-4">
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>We’ll email you a password reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" autocomplete="email" v-model="email" required />
          </div>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <p v-if="success" class="text-sm text-green-600">{{ success }}</p>
          <Button type="submit" :disabled="loading" class="w-full">
            {{ loading ? 'Sending…' : 'Send reset link' }}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <NuxtLink to="/auth/login" class="text-sm text-primary underline">Back to sign in</NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>

