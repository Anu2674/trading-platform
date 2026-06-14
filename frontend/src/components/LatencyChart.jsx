import { useState, useEffect } from 'react'

const MAX = 50

export default function LatencyChart() {
  const [p50, setP50] = useState(Array(MAX).fill(3))
  const [p90, setP90] = useState(Array(MAX).fill(10))
  const [p99, setP99] = useState(Array(MAX).fill(25))
  const [latest, setLatest] = useState({ p50: 3, p90: 10, p99: 25 })

  useEffect(() => {
    const iv = setInterval(() => {
      const v50 = 1 + Math.random() * 6
      const v90 = 6 + Math.random() * 12
      const v99 = 18 + Math.random() * 30
      setP50(p => [...p.slice(1), v50])
      setP90(p => [...p.slice(1), v90])
      setP99(p => [...p.slice(1), v99])
      setLatest({ p50: v50, p90: v90, p99: v99 })
    }, 800)
    return () => clearInterval(iv)
  }, [])

  const maxV = Math.max(...p99, 1)
  const W = 100, H = 100
  const step = W / (MAX - 1)

  const toPoints = (data) =>
    data.map((v, i) => `${i * step},${H - (v / maxV) * (H - 5)}`).join(' ')

  const toFill = (data) =>
    `0,${H} ` + data.map((v, i) => `${i * step},${H - (v / maxV) * (H - 5)}`).join(' ') + ` ${W},${H}`

  return (
    <div style={{
      background: '#0d0d18', border: '1px solid #1e2035',
      borderRadius: '12px', padding: '16px', height: '100%',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
        <div>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>Latency Distribution</h3>
          <p style={{ color: '#374151', fontSize: '10px' }}>Real-time p50 · p90 · p99</p>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { l: 'p50', v: latest.p50, c: '#4ade80' },
            { l: 'p90', v: latest.p90, c: '#fbbf24' },
            { l: 'p99', v: latest.p99, c: '#f87171' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ textAlign: 'right' }}>
              <div style={{ color: '#374151', fontSize: '9px', letterSpacing: '0.1em' }}>{l.toUpperCase()}</div>
              <div style={{ color: c, fontFamily: 'monospace', fontWeight: 800, fontSize: '16px' }}>
                {v.toFixed(1)}<span style={{ fontSize: '9px', color: '#374151' }}>ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          {/* Grid */}
          {[25, 50, 75].map(y => (
            <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="#1a1a2e" strokeWidth="0.5" />
          ))}
          {/* p99 fill */}
          <polygon points={toFill(p99)} fill="rgba(248,113,113,0.05)" />
          {/* Lines */}
          <polyline points={toPoints(p99)} fill="none" stroke="#f87171" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <polyline points={toPoints(p90)} fill="none" stroke="#fbbf24" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <polyline points={toPoints(p50)} fill="none" stroke="#4ade80" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          {/* End dots */}
          {[
            { data: p50, c: '#4ade80' },
            { data: p90, c: '#fbbf24' },
            { data: p99, c: '#f87171' },
          ].map(({ data, c }) => {
            const last = data[data.length - 1]
            const x = (MAX - 1) * step
            const y = H - (last / maxV) * (H - 5)
            return <circle key={c} cx={x} cy={y} r="1.8" fill={c} style={{ filter: `drop-shadow(0 0 3px ${c})` }} />
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexShrink: 0 }}>
        {[['p50', '#4ade80'], ['p90', '#fbbf24'], ['p99', '#f87171']].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '16px', height: '2px', background: c, borderRadius: '2px', boxShadow: `0 0 4px ${c}` }} />
            <span style={{ color: '#374151', fontSize: '10px' }}>{l} latency</span>
          </div>
        ))}
      </div>
    </div>
  )
}
