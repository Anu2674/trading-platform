import { useState, useEffect } from 'react'

export default function Header({ activeTab, setActiveTab }) {
  const [time, setTime] = useState(new Date())
  const [ordersProcessed, setOrders] = useState(2847293)

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date())
      setOrders(prev => prev + Math.floor(Math.random() * 500 + 200))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header style={{
      background: '#08080f',
      borderBottom: '1px solid #1a1a2e',
      padding: '0 16px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px',
          background: 'linear-gradient(135deg, #4ade80, #16a34a)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '11px', color: '#000',
          boxShadow: '0 0 12px rgba(74,222,128,0.4)'
        }}>TP</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', lineHeight: 1.2 }}>Trading Platform</div>
          <div style={{ fontSize: '10px', color: '#374151' }}>IICPC Hackathon 2026</div>
        </div>
      </div>

      {/* Live stats ticker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <Stat label="ORDERS PROCESSED" value={ordersProcessed.toLocaleString()} color="#4ade80" />
        <Stat label="UPTIME" value="99.9%" color="#4ade80" />
        <Stat label="BOTS ACTIVE" value="1,000" color="#60a5fa" />
        <Stat label="SANDBOXES" value="5 RUNNING" color="#a78bfa" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', padding: '4px 10px', borderRadius: '20px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80', animation: 'pulse 1.5s infinite' }} />
          <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>LIVE</span>
        </div>
        <span style={{ color: '#374151', fontSize: '11px', fontFamily: 'monospace' }}>
          {time.toLocaleTimeString()}
        </span>
      </div>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: '4px', background: '#0f0f1a', padding: '4px', borderRadius: '10px', border: '1px solid #1e2035' }}>
        {[['leaderboard', '📊 Leaderboard'], ['upload', '🚀 Submit Code']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 16px', borderRadius: '7px', border: 'none',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            background: activeTab === tab ? '#4ade80' : 'transparent',
            color: activeTab === tab ? '#000' : '#4a5568',
            transition: 'all 0.2s',
            boxShadow: activeTab === tab ? '0 0 12px rgba(74,222,128,0.3)' : 'none',
          }}>{label}</button>
        ))}
      </nav>
    </header>
  )
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: '9px', color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
