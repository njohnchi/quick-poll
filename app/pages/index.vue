<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()

const { data: polls, status, error, refresh } = await useFetch('/api/polls')

const deleting = ref<string | null>(null)
async function onDelete(id: string) {
  if (!(await confirmDelete())) return
  deleting.value = id
  try {
    await $fetch<{ ok: boolean }>(`/api/polls/${id}`, { method: 'DELETE' } as any)
    await refresh()
  } catch (e: any) {
    // Optionally surface error
    console.error('Failed to delete poll', e)
  } finally {
    deleting.value = null
  }
}

async function confirmDelete() {
  // basic confirmation; could be replaced with a dialog
  return window.confirm('Delete this poll? This cannot be undone.')
}
</script>

<template>
  <div class="container mx-auto max-w-4xl p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Dashboard</h1>
      <NuxtLink to="/polls/new">
        <Button>Create Poll</Button>
      </NuxtLink>
    </div>

    <div v-if="status === 'pending'" class="text-muted-foreground">Loading…</div>
    <div v-else-if="error" class="text-destructive">Failed to load polls.</div>

    <div v-else class="grid gap-4">
      <Card v-for="poll in polls || []" :key="poll.id">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <NuxtLink :to="{ name: 'polls-id', params: { id: poll.id } }" class="hover:underline">{{ poll.title }}</NuxtLink>
            <span v-if="poll.closedAt" class="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Closed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Options: {{ poll.options.length }} • Created {{ new Date(poll.createdAt).toLocaleString() }}
          </p>
        </CardContent>
        <CardFooter class="gap-2" v-if="user?.id === poll.authorId">
          <NuxtLink :to="{ name: 'polls-id-edit', params: { id: poll.id } }">
            <Button variant="outline">Edit</Button>
          </NuxtLink>
          <Button variant="destructive" :disabled="deleting === poll.id" @click="onDelete(poll.id)">
            {{ deleting === poll.id ? 'Deleting…' : 'Delete' }}
          </Button>
        </CardFooter>
      </Card>

      <div v-if="(polls || []).length === 0" class="text-muted-foreground">No polls yet.</div>
    </div>
  </div>
</template>

<style scoped>

</style>
