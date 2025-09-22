<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const { data: polls, status, error } = await useFetch('/api/polls')
</script>

<template>
  <div class="container mx-auto max-w-3xl p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Polls</h1>
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
            <NuxtLink :to="'/polls/' + poll.id" class="hover:underline">{{ poll.title }}</NuxtLink>
            <span v-if="poll.closedAt" class="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Closed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">Options: {{ poll.options.length }} • Created {{ new Date(poll.createdAt).toLocaleString() }}</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
