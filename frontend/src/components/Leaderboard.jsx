import { useLeaderboard } from '../hooks/useLeaderboard'

const MEDALS = ['🥇', '🥈', '🥉']

const DEMO = [
  { submission_id: 'demo-1', team_name: 'IIT_KGP_Traders',  total_score: 831.7, tps: 1187, p99_latency: 4.9,  correctness: 97.3, status: 'running' },
  { submission_id: 'demo-2', team_name: 'BITS_OrderBook',   total_score: 708.4, tps: 943,  p99_latency: 7.3,  correctness: 94.8, status: 'running' },
  { submission_id: 'demo-3', team_name: 'NIT_Matchmakers',  total_score: 651.2, tps: 867,  p99_latency: 8.6,  correctness: 93.1, status: 'done'    },
  { submission_id: 'demo-4', team_name: 'IIIT_HydraFill',  total_score: 489.6, tps: 612,  p99_latency: 17.1, correctness: 85.9, status: 'done'    },
  { submission_id: 'demo-5', team_name: 'VIT_LimitBreak',   total_score: 412.3, tps: 401,  p99_latency: 31.4, correctness: 76.2, status: 'failed'  },
]

export default function Leaderboard() {
  const { scores, connected } = useLeaderboard()
  const display = scores.length > 0 ? scores : DEMO

  return (
    <div style={{
      background: '#0d0d18',
      border: '1px solid #1e2035',
      borderRadius: '14px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid #1e2035',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(90deg, #0d0d18, #0f0f20)',
      }}>
        <div>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '18px' }}>Live Leaderboard</h2>
          <p style={{ color: '#4a5568', fontSize: '12px', marginTop: '2px' }}>
            Ranked by composite score (TPS × 0.4 + Speed × 0.3 + Correctness × 0.3)
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: connected ? '#4ade80' : '#f87171',
            boxShadow: connected ? '0 0 8px #4ade80' : 'none',
            animation: connected ? 'pulse 2s infinite' : 'none'
          }} />
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: connected ? '#4ade80' : '#f87171' }}>
            {connected ? 'LIVE' : 'DEMO MODE'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '620px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1e2035' }}>
            {['#', 'Team', 'Score', 'TPS', 'p99ms', 'Correct%', 'Status'].map(h => (
              <th key={h} style={{
                padding: '10px 12px',
                textAlign: h === '#' || h === 'Team' ? 'left' : h === 'Status' ? 'center' : 'right',
                color: '#4a5568', fontSize: '10px',
                fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {display.map((s, i) => (
            <tr key={s.submission_id} style={{
              borderBottom: '1px solid #12121f',
              background: i === 0 ? 'rgba(74,222,128,0.03)' : 'transparent',
              transition: 'background 0.2s',
            }}>
              <td style={{ padding: '14px 12px', color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                {MEDALS[i] || `#${i + 1}`}
              </td>
              <td style={{ padding: '14px 12px' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>{s.team_name}</span>
              </td>
              <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                <span style={{
                  color: '#4ade80', fontWeight: 800,
                  fontFamily: 'monospace', fontSize: '15px'
                }}>
                  {parseFloat(s.total_score || s.score || 0).toFixed(1)}
                </span>
              </td>
              <td style={{ padding: '14px 12px', textAlign: 'right', color: '#94a3b8', fontFamily: 'monospace' }}>
                {parseFloat(s.tps || 0).toFixed(0)}
              </td>
              <td style={{ padding: '14px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                <span style={{ color: getLatencyColor(s.p99_latency || s.p99 || 0) }}>
                  {parseFloat(s.p99_latency || s.p99 || 0).toFixed(1)}
                </span>
              </td>
              <td style={{ padding: '14px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                <span style={{ color: parseFloat(s.correctness || 0) >= 90 ? '#4ade80' : '#fbbf24' }}>
                  {parseFloat(s.correctness || 0).toFixed(1)}%
                </span>
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <StatusBadge status={s.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = {
    running: { bg: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.4)', label: '● Running' },
    done:    { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.4)', label: '✓ Done' },
    failed:  { bg: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)', label: '✗ Failed' },
  }
  const c = cfg[status] || cfg.done
  return (
    <span style={{
      display: 'inline-block',
      padding: '5px 12px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 700,
      background: c.bg, color: c.color,
      border: c.border,
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>{c.label}</span>
  )
}

function getLatencyColor(v) {
  if (v < 10) return '#4ade80'
  if (v < 50) return '#fbbf24'
  return '#f87171'
}
