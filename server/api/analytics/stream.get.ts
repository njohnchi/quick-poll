// filepath: c:\www\quick-poll\server\api\analytics\stream.get.ts
import { sendStream, setHeaders } from 'h3'
import { useRealtimeHub, computeAnalyticsSnapshot } from '../../utils/realtime'

export default defineEventHandler(async (event) => {
  setHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const hub = useRealtimeHub()
  const stream = hub.addClient()

  // Send initial snapshot
  const snapshot = await computeAnalyticsSnapshot()
  stream.write(`data: ${JSON.stringify({ type: 'snapshot', payload: snapshot })}\n\n`)

  return sendStream(event, stream)
})

