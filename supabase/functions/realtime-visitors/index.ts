// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// In-memory store for active sessions (session_id -> last_seen timestamp)
// Note: This is ephemeral and will reset on function cold starts
// For production, consider using Redis or a database table
const activeSessions = new Map<string, { lastSeen: number; page: string }>()

// Session timeout in milliseconds (60 seconds)
const SESSION_TIMEOUT = 60 * 1000

// Clean up expired sessions
function cleanupExpiredSessions() {
  const now = Date.now()
  for (const [sessionId, data] of activeSessions.entries()) {
    if (now - data.lastSeen > SESSION_TIMEOUT) {
      activeSessions.delete(sessionId)
    }
  }
}

// Generate a realistic baseline count (simulates organic traffic patterns)
function getBaselineCount(): number {
  const hour = new Date().getHours()
  // Peak hours: 10am-2pm and 6pm-10pm (Mexican time zones)
  const isPeakHour = (hour >= 10 && hour <= 14) || (hour >= 18 && hour <= 22)
  const baseMin = isPeakHour ? 12 : 6
  const baseMax = isPeakHour ? 24 : 14
  return Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // Clean up expired sessions on each request
    cleanupExpiredSessions()

    if (action === 'heartbeat' && req.method === 'POST') {
      // Update session timestamp
      const body = await req.json()
      const sessionId = body.sessionId
      const page = url.searchParams.get('page') || '/'

      if (sessionId) {
        activeSessions.set(sessionId, {
          lastSeen: Date.now(),
          page
        })
      }

      return new Response(
        JSON.stringify({ success: true, activeSessions: activeSessions.size }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    if (action === 'count' && req.method === 'GET') {
      // Return active user count (real sessions + baseline)
      const realSessions = activeSessions.size
      const baseline = getBaselineCount()
      const activeUsers = Math.max(realSessions + baseline, baseline)

      return new Response(
        JSON.stringify({
          activeUsers,
          realSessions,
          timestamp: Date.now()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Default response for unknown actions
    return new Response(
      JSON.stringify({ error: 'Unknown action. Use ?action=heartbeat or ?action=count' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )

  } catch (error) {
    console.error('Error in realtime-visitors function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
