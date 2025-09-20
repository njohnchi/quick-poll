<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/composables/useAuth'

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const { register } = useAuth()
const router = useRouter()

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    await register(name.value, email.value, password.value)
    router.push('/polls')
  } catch (e) {
    error.value = 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto max-w-md p-4">
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Sign up to start creating and voting on polls.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" v-model="name" required />
          </div>
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" autocomplete="email" v-model="email" required />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input id="password" type="password" autocomplete="new-password" v-model="password" required />
          </div>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <Button type="submit" :disabled="loading" class="w-full">
            {{ loading ? 'Creating account…' : 'Create account' }}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <NuxtLink to="/auth/login" class="text-sm text-primary underline">Already have an account? Sign in</NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>

