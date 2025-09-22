// filepath: c:\www\quick-poll\server\utils\realtime.ts
import { PassThrough } from 'node:stream'
import { count, eq, gt, sql } from 'drizzle-orm'

export type AnalyticsEvent =
  | { type: 'poll-created'; pollId: string; title: string; createdAt: string }
  | { type: 'poll-deleted'; pollId: string }
  | { type: 'poll-updated'; pollId: string }
  | { type: 'poll-closed'; pollId: string; closedAt: string }
  | { type: 'poll-options-updated'; pollId: string }
  | { type: 'vote-cast'; pollId: string; optionId: string; createdAt: string }
  | { type: 'snapshot'; payload: AnalyticsSnapshot }

export type AnalyticsSnapshot = {
  totalPolls: number
  totalVotes: number
  votesLast5m: number
  topPoll?: { id: string; title: string; votes: number } | null
}

let _hub: ReturnType<typeof createHub> | null = null

function createHub() {
  const clients = new Set<PassThrough>()

  function broadcast(evt: AnalyticsEvent) {
    const line = `data: ${JSON.stringify(evt)}\n\n`
    for (const client of clients) {
      client.write(line)
    }
  }

  function addClient() {
    const pt = new PassThrough()
    clients.add(pt)
    // Send initial comment to flush
    pt.write(': connected\n\n')
    // Remove on close
    pt.on('close', () => {
      clients.delete(pt)
    })
    return pt
  }

  // Heartbeat every 15s to keep connections alive
  setInterval(() => {
    for (const client of clients) client.write(': ping\n\n')
  }, 15000).unref()

  return { broadcast, addClient }
}

export function useRealtimeHub() {
  if (!_hub) _hub = createHub()
  return _hub
}

export async function computeAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const db = useDb()
  const schema = useDbSchema()

  const [{ value: totalPolls }] = await db.select({ value: count() }).from(schema.polls)
  const [{ value: totalVotes }] = await db.select({ value: count() }).from(schema.pollVotes)

  const fiveMinAgo = sql`now() - interval '5 minutes'`
  const [{ value: votesLast5m }] = await db
    .select({ value: count() })
    .from(schema.pollVotes)
    .where(gt(schema.pollVotes.createdAt, fiveMinAgo))

  // Compute top poll by votes with a group-by then pick max in JS
  const grouped = await db
    .select({ pollId: schema.pollVotes.pollId, votes: count() })
    .from(schema.pollVotes)
    .groupBy(schema.pollVotes.pollId)

  let topPoll: AnalyticsSnapshot['topPoll'] = null
  if (grouped.length) {
    const top = grouped.reduce((a, b) => (Number(b.votes) > Number(a.votes) ? b : a))
    const [{ id, title }] = await db
      .select({ id: schema.polls.id, title: schema.polls.title })
      .from(schema.polls)
      .where(eq(schema.polls.id, top.pollId))
      .limit(1)
    topPoll = { id, title, votes: Number(top.votes) }
  }

  return {
    totalPolls: Number(totalPolls ?? 0),
    totalVotes: Number(totalVotes ?? 0),
    votesLast5m: Number(votesLast5m ?? 0),
    topPoll,
  }
}
