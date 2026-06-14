import { useState } from 'react'
import Header from './components/Header'
import Leaderboard from './components/Leaderboard'
import UploadForm from './components/UploadForm'
import BotActivity from './components/BotActivity'
import LatencyChart from './components/LatencyChart'
import ScoreBreakdown from './components/ScoreBreakdown'

export default function App() {
  const [activeTab, setActiveTab] = useState('leaderboard')

  return (
    <div style={{ background: '#050508', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#e2e8f0' }}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'leaderboard' ? (
        <div style={{
          flex: 1, display: 'grid',
          gridTemplateColumns: '1fr 320px 260px',
          gridTemplateRows: '1fr 200px',
          gap: '12px',
          padding: '12px',
          overflow: 'hidden',
        }}>
          {/* Leaderboard — spans 2 rows */}
          <div style={{ gridRow: '1 / 3', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Leaderboard />
          </div>

          {/* Bot Activity */}
          <div style={{ gridRow: '1 / 2', overflow: 'hidden' }}>
            <BotActivity />
          </div>

          {/* Score Breakdown */}
          <div style={{ gridRow: '1 / 2', overflow: 'hidden' }}>
            <ScoreBreakdown />
          </div>

          {/* Latency Chart — bottom, spans 2 cols */}
          <div style={{ gridColumn: '2 / 4', gridRow: '2 / 3', overflow: 'hidden' }}>
            <LatencyChart />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <UploadForm />
        </div>
      )}
    </div>
  )
}
