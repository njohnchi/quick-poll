// filepath: c:\www\quick-poll\server\api\analytics\snapshot.get.ts
import { computeAnalyticsSnapshot } from '../../utils/realtime'

export default defineEventHandler(async () => {
  return await computeAnalyticsSnapshot()
})

