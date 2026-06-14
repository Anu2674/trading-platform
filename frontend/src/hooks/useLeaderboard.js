import { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'
const WS_URL  = API_URL.replace('http', 'ws') + '/ws/scores'

export function useLeaderboard() {
  const [scores, setScores]   = useState([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    // Fetch initial scores via REST
    fetch(`${API_URL}/scores`)
      .then(r => r.json())
      .then(data => setScores(data.leaderboard || []))
      .catch(() => {})

    // Connect WebSocket for live updates
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'initial') {
        setScores(msg.data || [])
      } else if (msg.type === 'update') {
        setScores(prev => {
          const exists = prev.find(s => s.submission_id === msg.data.submission_id)
          if (exists) {
            return prev
              .map(s => s.submission_id === msg.data.submission_id ? { ...s, ...msg.data } : s)
              .sort((a, b) => b.total_score - a.total_score)
          }
          return [...prev, msg.data].sort((a, b) => b.total_score - a.total_score)
        })
      }
    }

    return () => ws.close()
  }, [])

  return { scores, connected }
}
