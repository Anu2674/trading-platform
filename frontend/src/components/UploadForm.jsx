import { useState, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export default function UploadForm() {
  const [teamName, setTeamName] = useState('')
  const [file, setFile]         = useState(null)
  const [status, setStatus]     = useState('idle')
  const [result, setResult]     = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!teamName || !file) return
    setStatus('uploading')
    const form = new FormData()
    form.append('team_name', teamName)
    form.append('file', file)
    try {
      const res  = await fetch(`${API_URL}/upload`, { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) {
        setResult(data); setStatus('success')
        await fetch(`${API_URL}/run/${data.submission_id}`, { method: 'POST' })
      } else { setResult(data); setStatus('error') }
    } catch {
      setStatus('error')
      setResult({ detail: 'Cannot connect to backend. Is it running on port 8001?' })
    }
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{
        background: '#0d0d18', border: '1px solid #1e2035',
        borderRadius: '16px', padding: '40px',
        boxShadow: '0 0 40px rgba(0,0,0,0.5)'
      }}>
        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '26px', marginBottom: '8px' }}>
            🚀 Submit Trading Engine
          </h2>
          <p style={{ color: '#4a5568', fontSize: '14px' }}>
            Upload your order book or matching engine. Supported: .zip .tar .cpp .rs .go
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Team Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#64748b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Team Name
            </label>
            <input
              type="text" value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="e.g. AlgoWarriors"
              required
              style={{
                width: '100%', background: '#111122',
                border: `1px solid ${teamName ? 'rgba(74,222,128,0.3)' : '#1e2035'}`,
                borderRadius: '10px', padding: '14px 16px',
                color: '#fff', fontSize: '15px', outline: 'none',
                transition: 'border 0.2s',
              }}
            />
          </div>

          {/* File Drop */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', color: '#64748b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Source Code
            </label>
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? '#4ade80' : file ? 'rgba(74,222,128,0.4)' : '#1e2035'}`,
                borderRadius: '12px', padding: '40px 20px',
                textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'rgba(74,222,128,0.05)' : file ? 'rgba(74,222,128,0.03)' : '#111122',
                transition: 'all 0.2s',
              }}
            >
              {file ? (
                <div>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
                  <p style={{ color: '#4ade80', fontWeight: 600, fontSize: '15px' }}>{file.name}</p>
                  <p style={{ color: '#374151', fontSize: '12px', marginTop: '4px' }}>{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
                  <p style={{ color: '#64748b', fontWeight: 600, fontSize: '15px' }}>Drop your file here</p>
                  <p style={{ color: '#374151', fontSize: '12px', marginTop: '4px' }}>or click to browse</p>
                </div>
              )}
              <input ref={fileRef} type="file" style={{ display: 'none' }}
                accept=".zip,.tar,.gz,.cpp,.rs,.go"
                onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>

          {/* Submit button */}
          <button type="submit" disabled={status === 'uploading' || !teamName || !file} style={{
            width: '100%', padding: '16px',
            background: status === 'uploading' ? '#1e2035' : 'linear-gradient(135deg, #4ade80, #16a34a)',
            border: 'none', borderRadius: '10px',
            color: status === 'uploading' ? '#64748b' : '#000',
            fontSize: '15px', fontWeight: 700, cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
            boxShadow: (!teamName || !file) ? 'none' : '0 0 20px rgba(74,222,128,0.3)',
            transition: 'all 0.2s',
          }}>
            {status === 'uploading' ? '⏳ Uploading & Starting Benchmark...' : '🚀 Submit & Start Benchmark'}
          </button>
        </form>

        {/* Result */}
        {status === 'success' && (
          <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px' }}>
            <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: '12px', fontSize: '16px' }}>✅ Benchmark Started!</p>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#64748b', lineHeight: 2 }}>
              <div>ID: <span style={{ color: '#94a3b8' }}>{result.submission_id}</span></div>
              <div>File: <span style={{ color: '#94a3b8' }}>{result.filename}</span></div>
              <div>Size: <span style={{ color: '#94a3b8' }}>{result.size_kb} KB</span></div>
            </div>
            <p style={{ color: '#4a5568', fontSize: '13px', marginTop: '12px' }}>
              Switch to <strong style={{ color: '#4ade80' }}>Leaderboard</strong> tab to watch live results.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px' }}>
            <p style={{ color: '#f87171', fontWeight: 700 }}>❌ {result?.detail}</p>
          </div>
        )}
      </div>
    </div>
  )
}
