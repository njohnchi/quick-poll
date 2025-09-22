<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

definePageMeta({ middleware: 'auth' })

const title = ref('')
const description = ref('') // optional
const optionInputs = ref<string[]>(['', ''])
const loading = ref(false)
const error = ref<string | null>(null)

const router = useRouter()

const canSubmit = computed(() => {
  const validOptions = optionInputs.value.map(o => o.trim()).filter(Boolean)
  return title.value.trim().length > 0 && validOptions.length >= 2
})

function addOption() {
  optionInputs.value.push('')
}

function removeOption(index: number) {
  if (optionInputs.value.length <= 2) return
  optionInputs.value.splice(index, 1)
}

async function onSubmit() {
  if (!canSubmit.value) return
  error.value = null
  loading.value = true
  try {
    const options = optionInputs.value.map(o => o.trim()).filter(Boolean)
    const payload = { title: title.value.trim(), description: description.value.trim() || null, options }
    const res = await $fetch<{ id: string }>('/api/polls', { method: 'POST', body: payload })
    await router.push(`/polls/${res.id}`)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Failed to create poll. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto max-w-3xl p-4">
    <Card>
      <CardHeader>
        <CardTitle>New Poll</CardTitle>
        <CardDescription>Create a new poll with at least two options.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="onSubmit" class="space-y-6">
          <div class="space-y-2">
            <Label for="title">Title</Label>
            <Input id="title" v-model="title" placeholder="What should we vote on?" required />
          </div>

          <div class="space-y-2">
            <Label for="description">Description (optional)</Label>
            <Textarea id="description" v-model="description" placeholder="Add context or details (optional)" />
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <Label>Options</Label>
              <Button type="button" variant="outline" size="sm" @click="addOption">Add option</Button>
            </div>
            <div class="grid gap-2">
              <div v-for="(_, i) in optionInputs" :key="i" class="flex items-center gap-2">
                <Input :id="`option-${i}`" v-model="optionInputs[i]" :placeholder="`Option #${i + 1}`" />
                <Button type="button" variant="ghost" size="sm" @click="removeOption(i)" :disabled="optionInputs.length <= 2">Remove</Button>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">Provide at least two options.</p>
          </div>

          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        </form>
      </CardContent>
      <CardFooter class="gap-2">
        <Button variant="outline" @click="router.push('/polls')">Cancel</Button>
        <Button :disabled="loading || !canSubmit" @click="onSubmit">{{ loading ? 'Creating…' : 'Create poll' }}</Button>
      </CardFooter>
    </Card>
  </div>
</template>
