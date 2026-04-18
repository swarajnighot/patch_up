import { useState } from 'react'
import RewriteResult from './RewriteResult.jsx'
import './App.css'

const FEELING_OPTIONS_PRIMARY = [
  'Angry', 'Frustrated', 'Upset', 'Sad', 'Disappointed', 'Hurt',
  'Anxious', 'Overwhelmed', 'Ignored', 'Confused', 'Lonely', 'Unappreciated',
  'Hopeful', 'Scared', 'Tired',
]

const FEELING_OPTIONS_MORE = [
  'Triggered', 'Neglected', 'Resentful', 'Irritated', 'Insecure',
  'Drained', 'On edge', 'Missing you', 'Dismissed', 'Taken for granted',
]

function Heart({ className = '' }) {
  return (
    <span className={`patchup-heart ${className}`} aria-hidden="true">
      ♥
    </span>
  )
}

/** Aligns API JSON with what RewriteResult expects (strings + string[]). */
function normalizeRewritePayload(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.error === 'string') return null

  let bullets = raw.whatWouldHelp
  if (typeof bullets === 'string') {
    bullets = bullets
      .split(/\n+/)
      .map((line) =>
        line
          .replace(/^\s*[-*•]+\s*/, '')
          .replace(/^\s*\d+[).\s]+/, '')
          .trim(),
      )
      .filter(Boolean)
  }
  if (!Array.isArray(bullets)) bullets = []
  bullets = bullets.map((x) => String(x).trim()).filter(Boolean)

  const howYouFeel =
    typeof raw.howYouFeel === 'string' ? raw.howYouFeel.trim() : ''
  const ifYoureOpenToIt =
    typeof raw.ifYoureOpenToIt === 'string' ? raw.ifYoureOpenToIt.trim() : ''
  const aNote = typeof raw.aNote === 'string' ? raw.aNote.trim() : ''

  if (!howYouFeel && bullets.length === 0 && !ifYoureOpenToIt && !aNote) {
    return null
  }

  return {
    howYouFeel: howYouFeel || '—',
    whatWouldHelp: bullets.length ? bullets : ['—'],
    ifYoureOpenToIt: ifYoureOpenToIt || '—',
    aNote: aNote || '—',
  }
}

export default function App() {
  const [screen, setScreen] = useState('form')
  const [feelings, setFeelings] = useState([])
  const [vent, setVent] = useState('')
  const [help, setHelp] = useState('')
  const [rewrite, setRewrite] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [harmBlocked, setHarmBlocked] = useState(false)
  const [unclearInput, setUnclearInput] = useState(false)

  const maxFeelings = 4
  const [showMoreFeelings, setShowMoreFeelings] = useState(false)

  const addFeeling = (value) => {
    if (!value || feelings.length >= maxFeelings) return
    if (feelings.includes(value)) return
    setFeelings((prev) => [...prev, value])
  }

  const removeFeeling = (f) => {
    setFeelings((prev) => prev.filter((x) => x !== f))
  }

  const handleFeelingSelect = (e) => {
    const v = e.target.value
    if (v === '__more__') {
      setShowMoreFeelings(true)
      e.target.value = ''
      return
    }
    addFeeling(v)
    e.target.value = ''
  }

  const handleStartOver = () => {
    setFeelings([])
    setVent('')
    setHelp('')
    setRewrite(null)
    setScreen('form')
    setFormError(null)
    setHarmBlocked(false)
    setUnclearInput(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    setHarmBlocked(false)
    setUnclearInput(false)
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/chats/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feelings, vent, help }),
      })
      const text = await res.text()
      let json = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {
        throw new Error('Server returned invalid JSON')
      }
      if (!res.ok) {
        if (json.error === 'HARM_DETECTED') {
          setHarmBlocked(true)
          return
        }
        if (json.error === 'UNCLEAR_INPUT' || res.status === 422) {
          setUnclearInput(true)
          return
        }
        throw new Error(json.error || `Request failed (${res.status})`)
      }
      const normalized = normalizeRewritePayload(json)
      if (!normalized) {
        throw new Error(
          json.error ||
            'Empty or unrecognized response from server. Expected howYouFeel, whatWouldHelp, ifYoureOpenToIt, aNote.',
        )
      }
      setRewrite(normalized)
      setScreen('result')
    } catch (err) {
      setFormError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const helpPlaceholder = `1. I just need you to really listen, without jumping in.
2. Acknowledge how I felt — even if you see it differently.
3. Can we find some time this week, just the two of us?`

  const canSubmit =
    feelings.length > 0 || vent.trim().length > 0 || help.trim().length > 0

  if (screen === 'result' && rewrite) {
    return (
      <RewriteResult
        data={rewrite}
        onEdit={() => setScreen('form')}
        onStartOver={handleStartOver}
      />
    )
  }

  return (
    <div className="patchup-page">
      <header className="patchup-header">
        <div className="patchup-header-hearts" aria-hidden="true">
          <Heart />
          <Heart />
          <Heart />
        </div>
        <h1 className="patchup-logo">Patch-up.com</h1>
        <p className="patchup-tagline">
          Say what you feel, without hurting the person you love.
        </p>
        <div className="patchup-divider" role="presentation">
          <span className="patchup-divider-line" />
          <Heart className="patchup-divider-heart" />
          <span className="patchup-divider-line" />
        </div>
        <p className="patchup-disclaimer">Private by design. Nothing you share is stored.</p>
      </header>

      {harmBlocked && (
        <div className="popup-overlay" role="dialog" aria-modal="true">
          <div className="popup-box">
            <p className="popup-body">
              It looks like this message involves physical harm. This space is meant to feel safe for both people.
            </p>
            <button
              type="button"
              className="popup-btn"
              onClick={() => setHarmBlocked(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
      {unclearInput && (
        <div className="popup-overlay" role="dialog" aria-modal="true">
          <div className="popup-box">
            <p className="popup-body">
              We couldn&apos;t quite follow that. Could you try describing what happened in a bit more detail? Even a sentence or two gives us enough to work with.
            </p>
            <button
              type="button"
              className="popup-btn"
              onClick={() => setUnclearInput(false)}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <main className="patchup-main">
        {formError && (
          <div className="patchup-error" role="alert">
            {formError}
          </div>
        )}
        <form className="patchup-form" onSubmit={handleSubmit}>
          <section className="patchup-card">
            <h2 className="patchup-card-title">How are you feeling?</h2>
            <p className="patchup-card-hint">
              Pick up to 4. We&apos;ll use these to shape the tone.
            </p>
            <label htmlFor="feeling-select" className="visually-hidden">
              Add a feeling
            </label>
            <select
              id="feeling-select"
              className="patchup-select"
              defaultValue=""
              onChange={handleFeelingSelect}
              disabled={feelings.length >= maxFeelings}
            >
              <option value="" disabled>
                What are you feeling right now?
              </option>
              {FEELING_OPTIONS_PRIMARY.map((opt) => (
                <option
                  key={opt}
                  value={opt}
                  disabled={feelings.includes(opt) || feelings.length >= maxFeelings}
                >
                  {opt}
                </option>
              ))}
              {!showMoreFeelings && (
                <option value="__more__">More emotions...</option>
              )}
              {showMoreFeelings && FEELING_OPTIONS_MORE.map((opt) => (
                <option
                  key={opt}
                  value={opt}
                  disabled={feelings.includes(opt) || feelings.length >= maxFeelings}
                >
                  {opt}
                </option>
              ))}
            </select>
            {feelings.length > 0 && (
              <ul className="patchup-chips" aria-label="Selected feelings">
                {feelings.map((f) => (
                  <li key={f}>
                    <button
                      type="button"
                      className="patchup-chip"
                      onClick={() => removeFeeling(f)}
                      aria-label={`Remove ${f}`}
                    >
                      {f}
                      <span className="patchup-chip-remove" aria-hidden="true">
                        ×
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="patchup-card">
            <h2 className="patchup-card-title">Vent it out</h2>
            <p className="patchup-card-hint">
              Write it raw. All of it. We&apos;ll soften it before it goes
              anywhere.
            </p>
            <label htmlFor="vent" className="visually-hidden">
              Vent
            </label>
            <textarea
              id="vent"
              className="patchup-textarea"
              rows={6}
              value={vent}
              onChange={(e) => {
                if (e.target.value.length <= 500) setVent(e.target.value)
              }}
              placeholder="Say everything you feel. Don't worry about how it sounds."
            />
            <p className={`patchup-wordcount ${vent.length >= 470 ? 'patchup-wordcount--warn' : ''}`}>
              {vent.length} / 500 characters
            </p>
          </section>

          <section className="patchup-card">
            <h2 className="patchup-card-title">What would actually help?</h2>
            <p className="patchup-card-hint">
              What do you need from them? Keep it real and fair.
            </p>
            <label htmlFor="help" className="visually-hidden">
              What would help
            </label>
            <textarea
              id="help"
              className="patchup-textarea"
              rows={7}
              value={help}
              onChange={(e) => setHelp(e.target.value)}
              placeholder={helpPlaceholder}
            />
          </section>

          <button
            type="submit"
            className="patchup-submit"
            disabled={submitting || !canSubmit}
            title={
              canSubmit ? undefined : 'Add a feeling, your vent, or what would help.'
            }
          >
            {submitting ? 'Rewriting…' : 'Rewrite my message'}
          </button>
        </form>
      </main>

      <footer className="patchup-footer">
        <div className="patchup-footer-hearts" aria-hidden="true">
          <Heart />
          <Heart />
          <Heart />
          <Heart />
          <Heart />
        </div>
        <p className="patchup-copyright">
          © {new Date().getFullYear()} Patch-up.com · All rights reserved
        </p>
      </footer>
    </div>
  )
}
