import { useState, useEffect } from 'react'

const MAX = 40

export default function BotActivity() {
  const [tpsHistory, setHistory] = useState(Array(MAX).fill(0))
  const [activeBots, setActive]  = useState(0)
  const [totalOrders, setTotal]  = useState(0)
  const [currentTps, setCurrent] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => {
      const val = 300 + Math.floor(Math.random() * 700)
      setHistory(prev => [...prev.slice(1), val])
      setCurrent(val)
      setActive(850 + Math.floor(Math.random() * 150))
      setTotal(prev => prev + val)
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  const maxTps = Math.max(...tpsHistory, 1)

  return (
    <div style={{
      background: '#0d0d18', border: '1px solid #1e2035',
      borderRadius: '12px', padding: '16px', height: '100%',
      display: 'flex', flexDirection: 'column', gap: '12px',
      overflow: 'hidden'
    }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <MiniStat label="ACTIVE BOTS"   value={activeBots.toLocaleString()} color="#60a5fa" />
        <MiniStat label="TOTAL ORDERS"  value={totalOrders.toLocaleString()} color="#a78bfa" />
      </div>

      {/* TPS Chart */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>Orders / Second</span>
          <span style={{ color: '#4ade80', fontFamily: 'monospace', fontWeight: 800, fontSize: '16px' }}>
            {currentTps.toLocaleString()}
            <span style={{ fontSize: '10px', color: '#374151', marginLeft: '3px' }}>TPS</span>
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '2px', minHeight: '60px' }}>
          {tpsHistory.map((v, i) => {
            const isLast = i === tpsHistory.length - 1
            const h = Math.max((v / maxTps) * 100, 3)
            return (
              <div key={i} style={{
                flex: 1, borderRadius: '2px', height: `${h}%`,
                background: isLast ? '#4ade80' : `rgba(74,222,128,${0.1 + (i / MAX) * 0.4})`,
                boxShadow: isLast ? '0 0 8px rgba(74,222,128,0.6)' : 'none',
                transition: 'height 0.3s ease',
              }} />
            )
          })}
        </div>
      </div>

      {/* Bot fleet */}
      <div>
        <p style={{ color: '#374151', fontSize: '10px', marginBottom: '8px', letterSpacing: '0.1em' }}>FLEET COMPOSITION</p>
        {[
          { label: 'Market Makers',      n: 200, color: '#60a5fa' },
          { label: 'Aggr. Buyers',       n: 300, color: '#4ade80' },
          { label: 'Aggr. Sellers',      n: 300, color: '#f87171' },
          { label: 'Cancellers',         n: 200, color: '#fbbf24' },
        ].map(({ label, n, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ color: '#4a5568', fontSize: '10px', width: '90px', flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: '3px', background: '#1e2035', borderRadius: '3px' }}>
              <div style={{ height: '100%', width: `${(n / 1000) * 100}%`, background: color, borderRadius: '3px', boxShadow: `0 0 4px ${color}66` }} />
            </div>
            <span style={{ color, fontFamily: 'monospace', fontSize: '10px', width: '28px', textAlign: 'right' }}>{n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: '#111122', borderRadius: '8px', padding: '10px', border: '1px solid #1e2035' }}>
      <p style={{ color: '#374151', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
      <p style={{ color, fontFamily: 'monospace', fontWeight: 800, fontSize: '18px' }}>{value}</p>
    </div>
  )
}
