import { useState, useEffect } from 'react'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState('')
  const [failed, setFailed] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (ADMIN_PASSWORD && input === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_unlocked', '1')
      onUnlock()
    } else {
      setFailed(true)
      setInput('')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '12px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '260px' }}>
        <label htmlFor="admin-pw" style={{ fontWeight: 600 }}>Admin password</label>
        <input
          id="admin-pw"
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setFailed(false) }}
          autoFocus
          style={{ padding: '8px', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        {failed && <p style={{ color: '#c00', margin: 0, fontSize: '0.875rem' }}>Incorrect password.</p>}
        <button type="submit" style={{ padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>Unlock</button>
      </form>
    </div>
  )
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(
    !ADMIN_PASSWORD || sessionStorage.getItem('admin_unlocked') === '1'
  )
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!unlocked) return
    fetch('/api/v1/feedback/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
  }, [unlocked])

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />

  if (error) return <div className="admin-page"><p className="admin-error">{error}</p></div>
  if (!stats) return <div className="admin-page"><p className="admin-loading">Loading...</p></div>

  const stars = [5, 4, 3, 2, 1]
  const max = stats.total > 0 ? Math.max(...stars.map(s => stats.breakdown[s] || 0)) : 1

  return (
    <div className="admin-page">
      <h1 className="admin-title">Feedback Dashboard</h1>

      <div className="admin-summary">
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.average ?? '—'}</span>
          <span className="admin-stat-label">Average rating</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.total}</span>
          <span className="admin-stat-label">Total ratings</span>
        </div>
      </div>

      <div className="admin-breakdown">
        <h2 className="admin-section-title">Breakdown</h2>
        {stars.map(n => {
          const count = stats.breakdown[n] || 0
          const pct = max > 0 ? Math.round((count / max) * 100) : 0
          return (
            <div key={n} className="admin-bar-row">
              <span className="admin-bar-label">{n} ★</span>
              <div className="admin-bar-track">
                <div className="admin-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="admin-bar-count">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
