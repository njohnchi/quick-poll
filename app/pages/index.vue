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

// Live analytics
type Snapshot = { totalPolls: number; totalVotes: number; votesLast5m: number; topPoll?: { id: string; title: string; votes: number } | null }
const analytics = reactive<Snapshot>({ totalPolls: 0, totalVotes: 0, votesLast5m: 0, topPoll: null })
let es: EventSource | null = null

async function loadSnapshot() {
  try {
    const snap = await $fetch<Snapshot>('/api/analytics/snapshot')
    Object.assign(analytics, snap)
  } catch (e) {
    console.error('Failed to load analytics snapshot', e)
  }
}

onMounted(async () => {
  await loadSnapshot()
  try {
    es = new EventSource('/api/analytics/stream')
    es.onmessage = async (ev) => {
      try {
        const evt = JSON.parse(ev.data)
        if (evt.type === 'snapshot') {
          Object.assign(analytics, evt.payload)
        } else {
          // For all live events, refresh a snapshot to keep numbers consistent
          await loadSnapshot()
        }
      } catch (e) {
        console.error('SSE event parse error', e)
      }
    }
    es.onerror = (err) => {
      console.warn('SSE error', err)
    }
  } catch (e) {
    console.error('Failed to connect analytics stream', e)
  }
})

onBeforeUnmount(() => {
  es?.close()
  es = null
})
</script>

<template>
  <div class="container mx-auto max-w-4xl p-4 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Dashboard</h1>
      <NuxtLink to="/polls/new">
        <Button>Create Poll</Button>
      </NuxtLink>
    </div>

    <!-- Live Analytics -->
    <Card>
      <CardHeader>
        <CardTitle>Live Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="rounded border p-3">
            <div class="text-sm text-muted-foreground">Total Polls</div>
            <div class="text-2xl font-semibold">{{ analytics.totalPolls }}</div>
          </div>
          <div class="rounded border p-3">
            <div class="text-sm text-muted-foreground">Total Votes</div>
            <div class="text-2xl font-semibold">{{ analytics.totalVotes }}</div>
          </div>
          <div class="rounded border p-3">
            <div class="text-sm text-muted-foreground">Votes (last 5 min)</div>
            <div class="text-2xl font-semibold">{{ analytics.votesLast5m }}</div>
          </div>
        </div>
        <div class="mt-4" v-if="analytics.topPoll">
          <div class="text-sm text-muted-foreground mb-1">Top Poll</div>
          <NuxtLink :to="{ name: 'polls-id', params: { id: analytics.topPoll.id } }" class="hover:underline">
            {{ analytics.topPoll.title }}
          </NuxtLink>
          <span class="ml-2 text-sm text-muted-foreground">({{ analytics.topPoll.votes }} votes)</span>
        </div>
        <div class="mt-4 text-sm text-muted-foreground" v-else>
          No votes yet.
        </div>
      </CardContent>
    </Card>

    <!-- Polls list -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Your Polls</h2>
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
  </div>
</template>

<style scoped>

</style>
