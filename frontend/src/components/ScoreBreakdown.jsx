import { useState, useEffect } from 'react'

export default function ScoreBreakdown() {
  const [tps, setTps]         = useState(0)
  const [speed, setSpeed]     = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal]     = useState(0)

  useEffect(() => {
    const iv = setInterval(() => {
      const t = 400 + Math.random() * 600
      const s = 100 / (5 + Math.random() * 20) * 1000
      const c = 85 + Math.random() * 15
      const score = t * 0.4 + s * 0.3 + c * 0.3
      setTps(t)
      setSpeed(s)
      setCorrect(c)
      setTotal(score)
    }, 1500)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{
      background: '#0d0d18', border: '1px solid #1e2035',
      borderRadius: '12px', padding: '16px', height: '100%',
      display: 'flex', flexDirection: 'column', gap: '12px'
    }}>
      <div>
        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>Score Breakdown</h3>
        <p style={{ color: '#374151', fontSize: '10px' }}>Top team · live</p>
      </div>

      {/* Total score ring */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ScoreRing value={total} max={1000} />
      </div>

      {/* Component scores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <MiniBar label="TPS Weight (40%)"    value={Math.min(tps * 0.4, 400)}    max={400} color="#4ade80" />
        <MiniBar label="Speed Weight (30%)"  value={Math.min(speed * 0.3, 300)}  max={300} color="#fbbf24" />
        <MiniBar label="Correct Weight (30%)" value={Math.min(correct * 0.3, 100)} max={100} color="#60a5fa" />
      </div>
    </div>
  )
}

function ScoreRing({ value, max }) {
  const pct = Math.min(value / max, 1)
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = pct * circ

  const color = pct > 0.7 ? '#4ade80' : pct > 0.4 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ position: 'relative', width: '110px', height: '110px' }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        {/* Track */}
        <circle cx="55" cy="55" r={r} fill="none" stroke="#1e2035" strokeWidth="8" />
        {/* Progress */}
        <circle cx="55" cy="55" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          strokeDashoffset={circ * 0.25}
          style={{
            transition: 'stroke-dasharray 0.8s ease',
            filter: `drop-shadow(0 0 6px ${color})`
          }}
          transform="rotate(-90 55 55)"
        />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ color, fontFamily: 'monospace', fontWeight: 800, fontSize: '20px', lineHeight: 1 }}>
          {value.toFixed(0)}
        </div>
        <div style={{ color: '#374151', fontSize: '9px', letterSpacing: '0.1em' }}>SCORE</div>
      </div>
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: '#4a5568', fontSize: '10px' }}>{label}</span>
        <span style={{ color, fontFamily: 'monospace', fontSize: '10px', fontWeight: 700 }}>
          {value.toFixed(0)}
        </span>
      </div>
      <div style={{ height: '3px', background: '#1e2035', borderRadius: '3px' }}>
        <div style={{
          height: '100%', borderRadius: '3px',
          width: `${(value / max) * 100}%`,
          background: color,
          boxShadow: `0 0 4px ${color}88`,
          transition: 'width 0.8s ease'
        }} />
      </div>
    </div>
  )
}
