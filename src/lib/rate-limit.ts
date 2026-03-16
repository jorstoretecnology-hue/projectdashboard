import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const isConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

// Mock si no está configurado para evitar crash en dev
const redis = isConfigured ? Redis.fromEnv() : (null as any)

export const ratelimit = isConfigured 
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: 'dashboard_ratelimit',
    })
  : { limit: async () => ({ success: true }) } as any

export const authRatelimit = isConfigured
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'auth_ratelimit',
    })
  : { limit: async () => ({ success: true }) } as any
