// filepath: c:\www\quick-poll\app\pages\polls\[id]\edit.vue
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

const title = ref('')
const description = ref('')

watch(
  () => poll.value?.id,
  () => {
    if (!poll.value) return
    title.value = poll.value.title || ''
    description.value = poll.value.description || ''
  },
  { immediate: true }
)

const saving = ref(false)
const saveError = ref<string | null>(null)

const canSave = computed(() => title.value.trim().length > 0)

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
</script>

<template>
  <div class="container mx-auto max-w-3xl p-4">
    <Button variant="ghost" class="mb-4" @click="router.push('/polls')">← Back to polls</Button>

    <div v-if="status === 'pending'" class="text-muted-foreground">Loading…</div>
    <div v-else-if="error" class="text-destructive">Failed to load poll.</div>

    <Card v-else-if="poll">
      <CardHeader>
        <CardTitle>Edit Poll</CardTitle>
        <CardDescription>Update the title and description. Options are not editable here.</CardDescription>
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
        <Button variant="outline" @click="router.push('/polls/' + poll.id)">Cancel</Button>
        <Button :disabled="saving || !canSave" @click="onSave">{{ saving ? 'Saving…' : 'Save changes' }}</Button>
      </CardFooter>
    </Card>

    <div v-else class="text-muted-foreground">Poll not found.</div>
  </div>
</template>

