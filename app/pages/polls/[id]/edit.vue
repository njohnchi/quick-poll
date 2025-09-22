<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/composables/useAuth'

definePageMeta({ middleware: 'auth' })

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

const route = useRoute()
const router = useRouter()
const pollId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))

const { user } = useAuth()

const { data: poll, status, error, refresh, execute } = await useLazyFetch(() => (pollId.value ? `/api/polls/${pollId.value}` : ''), {
  immediate: false,
})

watch(
  pollId,
  (id) => {
    if (id && isUuid(id)) execute()
  },
  { immediate: true }
)

// Redirect non-authors away
watch(
  () => poll.value?.authorId,
  (authorId) => {
    const uid = (user.value as any)?.id as string | undefined
    if (poll.value && uid && authorId && authorId !== uid) {
      const pid = (poll.value as any)?.id as string
      router.push(`/polls/${pid}`)
    }
  },
  { immediate: true }
)

const title = ref('')
const description = ref('')

watch(
  () => (poll.value as any)?.id,
  () => {
    const pv = poll.value as any
    if (!pv) return
    title.value = pv.title || ''
    description.value = pv.description || ''
    // initialize options editor from current poll options
    options.value = (pv.options || []).map((o: any) => ({ id: o.id as string, text: o.text as string }))
  },
  { immediate: true }
)

const saving = ref(false)
const saveError = ref<string | null>(null)

const canSave = computed(() => title.value.trim().length > 0)

// Helpers for template-safe access
const currentPollId = computed(() => (poll.value as any)?.id as string | undefined)
const isClosed = computed(() => !!((poll.value as any)?.closedAt))

async function onSave() {
  if (!poll.value || !canSave.value) return
  saving.value = true
  saveError.value = null
  try {
    await $fetch(`/api/polls/${poll.value.id}`, {
      method: 'PUT',
      body: { title: title.value.trim(), description: description.value.trim() || null },
    })
    await router.push(`/polls/${poll.value.id}`)
  } catch (e: any) {
    saveError.value = e?.data?.statusMessage || e?.message || 'Failed to save changes.'
  } finally {
    saving.value = false
  }
}

// Options editor
const options = ref<{ id?: string; text: string }[]>([])

function addOption() {
  options.value.push({ text: '' })
}

function removeOption(i: number) {
  if (options.value.length <= 2) return
  options.value.splice(i, 1)
}

function moveUp(i: number) {
  if (i <= 0) return
  const arr = options.value
  ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
}

function moveDown(i: number) {
  const arr = options.value
  if (i >= arr.length - 1) return
  ;[arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]
}

const optionsError = ref<string | null>(null)
const savingOptions = ref(false)
const canSaveOptions = computed(() => options.value.map(o => o.text.trim()).filter(Boolean).length >= 2)

async function onSaveOptions() {
  if (!poll.value || !canSaveOptions.value) return
  optionsError.value = null
  savingOptions.value = true
  try {
    const payload = { options: options.value.map(o => ({ id: o.id, text: o.text.trim() })).filter(o => o.text) }
    await $fetch(`/api/polls/${poll.value.id}/options`, { method: 'PUT', body: payload })
    await refresh()
  } catch (e: any) {
    optionsError.value = e?.data?.statusMessage || e?.message || 'Failed to save options.'
  } finally {
    savingOptions.value = false
  }
}
</script>

<template>
  <div class="container mx-auto max-w-3xl p-4 space-y-6">
    <Button variant="ghost" class="mb-2" @click="router.push('/polls')">← Back to polls</Button>

    <div v-if="status === 'pending'" class="text-muted-foreground">Loading…</div>
    <div v-else-if="error" class="text-destructive">Failed to load poll.</div>

    <template v-else-if="poll">
      <Card>
        <CardHeader>
          <CardTitle>Edit Poll</CardTitle>
          <CardDescription>Update the title and description.</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="onSave" class="space-y-6">
            <div class="space-y-2">
              <Label for="title">Title</Label>
              <Input id="title" v-model="title" required />
            </div>
            <div class="space-y-2">
              <Label for="description">Description (optional)</Label>
              <Textarea id="description" v-model="description" />
            </div>
            <p v-if="saveError" class="text-sm text-destructive">{{ saveError }}</p>
          </form>
        </CardContent>
        <CardFooter class="gap-2">
          <Button variant="outline" @click="router.push('/polls/' + (currentPollId || ''))">Cancel</Button>
          <Button :disabled="saving || !canSave" @click="onSave">{{ saving ? 'Saving…' : 'Save changes' }}</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
          <CardDescription>Reorder, add, or remove options. Provide at least two non-empty options.</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="isClosed" class="mb-3 text-sm text-muted-foreground">This poll is closed. Options cannot be edited.</div>

          <div class="grid gap-2" :class="{ 'opacity-50 pointer-events-none': isClosed }">
            <div v-for="(opt, i) in options" :key="opt.id || i" class="flex items-center gap-2">
              <Input v-model="opt.text" :placeholder="`Option #${i + 1}`" class="flex-1" />
              <div class="flex items-center gap-1">
                <Button type="button" variant="outline" size="sm" @click="moveUp(i)" :disabled="i===0">↑</Button>
                <Button type="button" variant="outline" size="sm" @click="moveDown(i)" :disabled="i===options.length-1">↓</Button>
                <Button type="button" variant="ghost" size="sm" @click="removeOption(i)" :disabled="options.length <= 2">Remove</Button>
              </div>
            </div>
            <div class="pt-2">
              <Button type="button" variant="outline" size="sm" @click="addOption">Add option</Button>
            </div>
            <p class="text-xs text-muted-foreground">At least two options are required.</p>
            <p v-if="optionsError" class="text-sm text-destructive">{{ optionsError }}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button :disabled="isClosed || savingOptions || !canSaveOptions" @click="onSaveOptions">
            {{ savingOptions ? 'Saving…' : 'Save options' }}
          </Button>
        </CardFooter>
      </Card>
    </template>

    <div v-else class="text-muted-foreground">Poll not found.</div>
  </div>
</template>
