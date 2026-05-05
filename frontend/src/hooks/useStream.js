/**
 * useStream — WebSocket hook with exponential-backoff reconnect.
 * Connects to ws://localhost:8000/ws/stream
 */
import { useEffect, useRef } from 'react'

const WS_URL = 'ws://localhost:8000/ws/stream'
const MAX_BACKOFF = 30000

export function useStream(onMessage) {
  const ws      = useRef(null)
  const backoff = useRef(1000)
  const active  = useRef(true)

  useEffect(() => {
    active.current = true   // reset on each effect invocation (StrictMode mounts twice)
    function connect() {
      if (!active.current) return
      ws.current = new WebSocket(WS_URL)
      ws.current.onopen    = () => { backoff.current = 1000 }
      ws.current.onmessage = (e) => { try { onMessage(JSON.parse(e.data)) } catch {} }
      ws.current.onclose   = () => {
        if (!active.current) return
        setTimeout(connect, backoff.current)
        backoff.current = Math.min(backoff.current * 2, MAX_BACKOFF)
      }
      ws.current.onerror = () => ws.current?.close()
    }
    connect()
    return () => { active.current = false; ws.current?.close() }
  }, [])
}
