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
const showPreview = ref(false)

const router = useRouter()

const validOptions = computed(() => optionInputs.value.map(o => o.trim()).filter(Boolean))
const canSubmit = computed(() => title.value.trim().length > 0 && validOptions.value.length >= 2)

function addOption() {
  optionInputs.value.push('')
}

function removeOption(index: number) {
  if (optionInputs.value.length <= 2) return
  optionInputs.value.splice(index, 1)
}

function onPreview() {
  if (!canSubmit.value) return
  showPreview.value = true
}

function backToEdit() {
  showPreview.value = false
}

async function onSubmit() {
  if (!canSubmit.value) return
  error.value = null
  loading.value = true
  try {
    const options = validOptions.value
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
    <Card v-if="!showPreview">
      <CardHeader>
        <CardTitle>New Poll</CardTitle>
        <CardDescription>Create a new poll with at least two options.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="onPreview" class="space-y-6">
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
        <Button :disabled="loading || !canSubmit" @click="onPreview">Preview</Button>
      </CardFooter>
    </Card>

    <Card v-else>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>Review your poll before publishing.</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div>
            <h2 class="text-xl font-semibold">{{ title }}</h2>
            <p v-if="description" class="text-sm text-muted-foreground mt-1">{{ description }}</p>
          </div>
          <div class="grid gap-2">
            <Button v-for="(opt, i) in validOptions" :key="i" variant="outline" class="justify-start" disabled>
              {{ opt }}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter class="gap-2">
        <Button variant="outline" @click="backToEdit">Back to edit</Button>
        <Button :disabled="loading" @click="onSubmit">{{ loading ? 'Creating…' : 'Publish poll' }}</Button>
      </CardFooter>
    </Card>
  </div>
</template>
