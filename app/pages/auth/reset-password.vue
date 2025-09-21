<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

const supabase = useSupabaseClient()
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

async function onSubmit() {
  error.value = null
  success.value = null
  if (newPassword.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    const { error: err } = await supabase.auth.updateUser({ password: newPassword.value })
    if (err) throw err
    success.value = 'Password updated. You can now sign in.'
  } catch (e) {
    error.value = (e as any)?.message || 'Failed to update password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto max-w-md p-4">
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="new">New password</Label>
            <Input id="new" type="password" v-model="newPassword" required />
          </div>
          <div class="space-y-2">
            <Label for="confirm">Confirm password</Label>
            <Input id="confirm" type="password" v-model="confirmPassword" required />
          </div>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <p v-if="success" class="text-sm text-green-600">{{ success }}</p>
          <Button type="submit" :disabled="loading" class="w-full">
            {{ loading ? 'Updating…' : 'Update password' }}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <NuxtLink to="/auth/login" class="text-sm text-primary underline">Back to sign in</NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>

