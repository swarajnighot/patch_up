import { useState, useEffect } from 'react'

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/v1/feedback/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
  }, [])

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
