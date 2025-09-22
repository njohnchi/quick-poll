<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/composables/useAuth'

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

const selected = ref<string | null>(null)
const voted = ref(false)
const voteError = ref<string | null>(null)

const optionsList = computed(() => {
  const opts = poll.value?.options
  return Array.isArray(opts) ? opts : []
})

const totalVotes = computed(() => optionsList.value.reduce((sum: number, o: any) => sum + (o?.votes || 0), 0))
function percent(votes: number) {
  const t = totalVotes.value
  return t > 0 ? Math.round(((votes || 0) / t) * 100) : 0
}

const requestURL = useRequestURL()
const shareUrl = computed(() => (poll.value ? new URL(`/polls/${poll.value.id}`, `${requestURL.protocol}//${requestURL.host}`).toString() : ''))
const copyOk = ref<string | null>(null)
async function copyShareLink() {
  copyOk.value = null
  try {
    if (!shareUrl.value) return
    await navigator.clipboard.writeText(shareUrl.value)
    copyOk.value = 'Link copied!'
    setTimeout(() => (copyOk.value = null), 2000)
  } catch {
    copyOk.value = 'Failed to copy'
    setTimeout(() => (copyOk.value = null), 2000)
  }
}

async function onVote(optionId: string) {
  if (!poll.value || poll.value.closedAt) return
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

const closing = ref(false)
const closeError = ref<string | null>(null)
async function closePoll() {
  if (!poll.value) return
  closing.value = true
  closeError.value = null
  try {
    await $fetch(`/api/polls/${poll.value.id}/close`, { method: 'POST' })
    await refresh()
  } catch (e: any) {
    closeError.value = e?.data?.statusMessage || e?.message || 'Failed to close poll.'
  } finally {
    closing.value = false
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
        <CardTitle>
          {{ poll.title }}
          <span v-if="poll.closedAt" class="ml-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground align-middle">Closed</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid gap-2">
          <div v-for="opt in optionsList" :key="opt.id" class="flex items-center justify-between gap-4">
            <Button :variant="selected === opt.id ? 'default' : 'outline'"
                    class="flex-1 justify-start"
                    :disabled="!!poll.closedAt"
                    @click="onVote(opt.id)">
              {{ opt.text }}
            </Button>
            <span class="text-sm text-muted-foreground min-w-12 text-right">{{ opt.votes }} ({{ percent(opt.votes) }}%)</span>
          </div>
          <p class="text-xs text-muted-foreground">Total votes: {{ totalVotes }}</p>
        </div>
        <p v-if="voteError" class="mt-3 text-sm text-destructive">{{ voteError }}</p>

        <div class="mt-6 grid gap-3">
          <div class="flex items-center gap-2">
            <Input :value="shareUrl" readonly class="flex-1" />
            <Button variant="outline" @click="copyShareLink" :disabled="!shareUrl">Copy link</Button>
            <span v-if="copyOk" class="text-xs text-muted-foreground">{{ copyOk }}</span>
          </div>
          <div class="flex items-center gap-4" v-if="shareUrl">
            <BaseQrCode :value="shareUrl" :size="128" />
            <p class="text-xs text-muted-foreground">Scan this QR code to open the poll.</p>
          </div>
        </div>

        <div v-if="user?.id === poll.authorId" class="mt-6 flex items-center gap-2">
          <Button variant="destructive" :disabled="!!poll.closedAt || closing" @click="closePoll">
            {{ poll.closedAt ? 'Poll is closed' : (closing ? 'Closing…' : 'Close poll') }}
          </Button>
          <p v-if="closeError" class="text-sm text-destructive">{{ closeError }}</p>
        </div>
      </CardContent>
      <CardFooter>
        <p v-if="voted" class="text-sm text-muted-foreground">Thanks for voting!</p>
      </CardFooter>
    </Card>

    <div v-else class="text-muted-foreground">Poll not found.</div>
  </div>
</template>
