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

const EVENT_LABELS = {
  page_view:     'Page views',
  rewrite_click: 'Rewrite clicks',
  start_over:    'Start over',
  opens_a_door:  'It opens a door',
  not_quite_yet: 'Not quite yet',
  copy_section:  'Total copies',
}

const SECTION_LABELS = {
  how_you_feel:    'How you feel',
  what_would_help: 'What would help',
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(
    !ADMIN_PASSWORD || sessionStorage.getItem('admin_unlocked') === '1'
  )
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!unlocked) return
    fetch('/api/v1/feedback/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
    fetch('/api/v1/analytics/stats')
      .then(r => r.json())
      .then(setAnalytics)
      .catch(() => {})
  }, [unlocked])

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />

  if (error) return <div className="admin-page"><p className="admin-error">{error}</p></div>
  if (!stats) return <div className="admin-page"><p className="admin-loading">Loading...</p></div>

  const stars = [5, 4, 3, 2, 1]
  const max = stats.total > 0 ? Math.max(...stars.map(s => stats.breakdown[s] || 0)) : 1

  function handleLogout() {
    sessionStorage.removeItem('admin_unlocked')
    setUnlocked(false)
  }

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="admin-title" style={{ margin: 0 }}>Feedback Dashboard</h1>
        <button
          type="button"
          onClick={handleLogout}
          style={{ padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Log out
        </button>
      </div>

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

      {analytics && (
        <>
          <div className="admin-breakdown" style={{ marginTop: '2rem' }}>
            <h2 className="admin-section-title">User Actions</h2>
            {Object.entries(EVENT_LABELS).map(([key, label]) => {
              const count = analytics.events[key] || 0
              const maxCount = Math.max(...Object.keys(EVENT_LABELS).map(k => analytics.events[k] || 0), 1)
              const pct = Math.round((count / maxCount) * 100)
              return (
                <div key={key} className="admin-bar-row">
                  <span className="admin-bar-label" style={{ minWidth: '140px' }}>{label}</span>
                  <div className="admin-bar-track">
                    <div className="admin-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="admin-bar-count">{count}</span>
                </div>
              )
            })}
          </div>

          {Object.keys(analytics.copyBreakdown).length > 0 && (
            <div className="admin-breakdown" style={{ marginTop: '2rem' }}>
              <h2 className="admin-section-title">Copies by Section</h2>
              {Object.entries(analytics.copyBreakdown).map(([section, count]) => (
                <div key={section} className="admin-bar-row">
                  <span className="admin-bar-label" style={{ minWidth: '140px' }}>
                    {SECTION_LABELS[section] || section}
                  </span>
                  <div className="admin-bar-track">
                    <div className="admin-bar-fill" style={{ width: '100%' }} />
                  </div>
                  <span className="admin-bar-count">{count}</span>
                </div>
              ))}
            </div>
          )}

          {analytics.geo.length > 0 && (
            <div className="admin-breakdown" style={{ marginTop: '2rem' }}>
              <h2 className="admin-section-title">Top Countries</h2>
              {analytics.geo.map(({ country, count }) => {
                const maxGeo = analytics.geo[0].count
                const pct = Math.round((count / maxGeo) * 100)
                return (
                  <div key={country} className="admin-bar-row">
                    <span className="admin-bar-label" style={{ minWidth: '140px' }}>{country}</span>
                    <div className="admin-bar-track">
                      <div className="admin-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="admin-bar-count">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
