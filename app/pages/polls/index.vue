<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { usePolls } from '@/composables/usePolls'

const { listPolls } = usePolls()
const polls = computed(() => listPolls())
</script>

<template>
  <div class="container mx-auto max-w-3xl p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Polls</h1>
      <NuxtLink to="/polls/new">
        <Button>Create Poll</Button>
      </NuxtLink>
    </div>

    <div class="grid gap-4">
      <Card v-for="poll in polls" :key="poll.id">
        <CardHeader>
          <CardTitle>
            <NuxtLink :to="`/polls/${poll.id}`" class="hover:underline">{{ poll.title }}</NuxtLink>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">Options: {{ poll.options.length }} • Created {{ new Date(poll.createdAt).toLocaleString() }}</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

