<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { usePolls } from '@/composables/usePolls'

const route = useRoute()
const router = useRouter()
const pollId = computed(() => String(route.params.id))

const { getPoll, vote } = usePolls()
const poll = computed(() => getPoll(pollId.value))

const selected = ref<string | null>(null)
const voted = ref(false)

function onVote(optionId: string) {
  if (!poll.value) return
  const ok = vote(poll.value.id, optionId)
  if (ok) {
    selected.value = optionId
    voted.value = true
  }
}
</script>

<template>
  <div class="container mx-auto max-w-3xl p-4">
    <Button variant="ghost" class="mb-4" @click="router.push('/polls')">← Back to polls</Button>

    <Card v-if="poll">
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
      </CardContent>
      <CardFooter>
        <p v-if="voted" class="text-sm text-muted-foreground">Thanks for voting!</p>
      </CardFooter>
    </Card>

    <div v-else class="text-muted-foreground">Poll not found.</div>
  </div>
</template>

