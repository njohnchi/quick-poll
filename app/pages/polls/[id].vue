<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

const route = useRoute()
const router = useRouter()
const pollId = computed(() => String(route.params.id))

const { data: poll, status, error, refresh } = await useFetch(() => `/api/polls/${pollId.value}`)

const selected = ref<string | null>(null)
const voted = ref(false)
const voteError = ref<string | null>(null)

async function onVote(optionId: string) {
  if (!poll.value) return
  voteError.value = null
  try {
    await $fetch(`/api/polls/${poll.value.id}/vote`, { method: 'POST', body: { optionId } })
    selected.value = optionId
    voted.value = true
    await refresh()
  } catch (e: any) {
    const statusCode = e?.data?.statusCode || e?.statusCode
    if (statusCode === 401) {
      const redirect = encodeURIComponent(`/polls/${poll.value.id}`)
      return router.push(`/auth/login?redirect=${redirect}`)
    }
    voteError.value = e?.data?.statusMessage || e?.message || 'Failed to submit vote.'
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
        <CardTitle>{{ poll.title }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid gap-2">
          <div v-for="opt in poll.options" :key="opt.id" class="flex items-center justify-between gap-4">
            <Button :variant="selected === opt.id ? 'default' : 'outline'" class="flex-1 justify-start" @click="onVote(opt.id)">
              {{ opt.text }}
            </Button>
            <span class="text-sm text-muted-foreground min-w-12 text-right">{{ opt.votes }}</span>
          </div>
        </div>
        <p v-if="voteError" class="mt-3 text-sm text-destructive">{{ voteError }}</p>
      </CardContent>
      <CardFooter>
        <p v-if="voted" class="text-sm text-muted-foreground">Thanks for voting!</p>
      </CardFooter>
    </Card>

    <div v-else class="text-muted-foreground">Poll not found.</div>
  </div>
</template>
