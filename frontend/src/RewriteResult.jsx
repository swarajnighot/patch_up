import { useState, useEffect } from 'react'
import { trackEvent } from './analytics.js'

function StarRating() {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  async function handleClick(n) {
    setRating(n)
    setSubmitted(true)
    try {
      await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: n }),
      })
    } catch {
      // silent — feedback is best-effort
    }
  }

  if (submitted) {
    return (
      <p className="result-check-feedback" role="status">
        Thank you for your feedback!
      </p>
    )
  }

  return (
    <div className="result-star-row" role="group" aria-label="Rate your experience">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`result-star ${(hovered || rating) >= n ? 'result-star--filled' : ''}`}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => handleClick(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function IconEnvelopeSmall() {
  return (
    <svg className="result-icon-sm" viewBox="0 0 20 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2 2h16v12H2V2zm2 2 6 4 6-4M4 12h12V4l-6 4-6-4v8z"
      />
    </svg>
  )
}

function IconSparkle() {
  return (
    <svg className="result-icon-sm" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 1l1.2 4.2L15 6l-3.8 1L10 11 8.8 7 5 6l3.8-1L10 1zm0 9l.8 2.8L13 13l-2.2.2L10 16l-.8-2.8L7 13l2.2-.2L10 10z"
      />
    </svg>
  )
}

function IconLeaf() {
  return (
    <svg className="result-icon-sm" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17 3C11 3 4 9 3 16c2-4 6-6 10-6 2 4 2 8 0 11 5-3 8-9 4-18z"
      />
    </svg>
  )
}

function HeartDivider() {
  return (
    <div className="result-divider" role="presentation">
      <span className="result-divider-line" />
      <span className="result-divider-heart" aria-hidden="true">
        ♥
      </span>
      <span className="result-divider-line" />
    </div>
  )
}

async function copyText(text, onDone) {
  try {
    await navigator.clipboard.writeText(text)
    onDone('ok')
  } catch {
    onDone('fail')
  }
}

function WhatsAppButton({ text, section }) {
  function handleClick() {
    navigator.clipboard.writeText(text).catch(() => {})
    trackEvent('whatsapp_share', { section })
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <button
      type="button"
      className="result-copy-btn"
      onClick={handleClick}
      style={{ backgroundColor: '#25D366', color: '#fff', borderColor: '#25D366', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      WhatsApp
    </button>
  )
}

function CopyButton({ label, text, section }) {
  const [status, setStatus] = useState('idle')
  return (
    <button
      type="button"
      className="result-copy-btn"
      onClick={() =>
        copyText(text, (s) => {
          if (s === 'ok') trackEvent('copy_section', { section })
          setStatus(s)
          setTimeout(() => setStatus('idle'), 2000)
        })
      }
    >
      {status === 'ok' ? 'Copied' : status === 'fail' ? 'Copy failed' : label}
    </button>
  )
}

export default function RewriteResult({ data, onEdit, onStartOver }) {
  const helpText = data.whatWouldHelp.join('\n')
  const [lastCheck, setLastCheck] = useState(null)

  useEffect(() => {
    function handleKeyboardCopy() {
      if (window.getSelection()?.toString().length > 0) {
        trackEvent('copy_section', { section: 'other' })
      }
    }
    document.addEventListener('copy', handleKeyboardCopy)
    return () => document.removeEventListener('copy', handleKeyboardCopy)
  }, [])

  return (
    <div className="result-page">
      <header className="result-header">
        <div className="result-header-icon" aria-hidden="true">
          💌
        </div>
        <h1 className="result-title">
          This is what your heart was trying to say
        </h1>
        <p className="result-subtitle">
          Thoughtfully rewritten to help you be heard.
        </p>
        <HeartDivider />
      </header>

      <main className="result-main">
        <article className="result-card">
          <div className="result-card-head">
            <div className="result-card-label">
              <span className="result-header-icon result-header-icon--sm" aria-hidden="true">💌</span>
              <span>How you feel</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <CopyButton label="Copy" text={data.howYouFeel} section="how_you_feel" />
              <WhatsAppButton text={data.howYouFeel} section="how_you_feel" />
            </div>
          </div>
          <div className="result-body-stack">
            {data.howYouFeel.split(/\n\n+/).map((para, i) => (
              <p key={i} className="result-body">
                {para.trim()}
              </p>
            ))}
          </div>
        </article>

        <article className="result-card">
          <div className="result-card-head">
            <div className="result-card-label">
              <span className="result-header-icon result-header-icon--sm" aria-hidden="true">💌</span>
              <span>What would help</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <CopyButton label="Copy" text={helpText} section="what_would_help" />
              <WhatsAppButton text={helpText} section="what_would_help" />
            </div>
          </div>
          <ul className="result-list">
            {data.whatWouldHelp.map((item, index) => (
              <li key={`${index}-${item.slice(0, 24)}`}>{item}</li>
            ))}
          </ul>
        </article>

        <p className="result-italic-center">
          Written carefully so you can be understood, not just heard.
        </p>
        <HeartDivider />

        <article className="result-card result-card-compact">
          <div className="result-card-label result-card-label-block">
            <IconSparkle />
            <span>If you&apos;re open to it</span>
          </div>
          <p className="result-body result-body-italic">
            {data.ifYoureOpenToIt}
          </p>
        </article>

        <article className="result-card result-card-compact">
          <div className="result-card-label result-card-label-block">
            <IconLeaf />
            <span>A note</span>
          </div>
          <p className="result-body">{data.aNote}</p>
        </article>

        <article className="result-card result-card-actions">
          <h2 className="result-actions-title">Does this feel right?</h2>
          <p className="result-actions-hint">
            If something feels off, start over and try again.
          </p>
          <div className="result-pill-row">
            <button type="button" className="result-pill" onClick={() => { trackEvent('start_over'); onStartOver() }}>
              Start over
            </button>
          </div>
        </article>

        <article className="result-card result-card-actions">
          <h2 className="result-actions-title">One last check.</h2>
          <p className="result-actions-hint">
            Does this message invite a conversation, or does it put them on the
            defensive?
          </p>
          <div className="result-pill-row">
            <button
              type="button"
              className="result-pill"
              onClick={() => { trackEvent('opens_a_door'); setLastCheck('open') }}
            >
              It opens a door
            </button>
            <button
              type="button"
              className="result-pill"
              onClick={() => { trackEvent('not_quite_yet'); setLastCheck('wait') }}
            >
              Not quite yet
            </button>
          </div>
          {lastCheck && (
            <p className="result-check-feedback" role="status">
              {lastCheck === 'open'
                ? 'Trust that instinct — you can still tweak words before you send.'
                : 'Take your time. Go back and edit until it feels kind and clear.'}
            </p>
          )}
        </article>

        <article className="result-card result-card-actions">
          <h2 className="result-actions-title">How did we do?</h2>
          <p className="result-actions-hint">Rate your experience. 5 stars is excellent.</p>
          <StarRating />
        </article>
      </main>

      <footer className="result-footer">
        <p className="result-copyright">
          © {new Date().getFullYear()} Patch-up.com · All rights reserved ·{' '}
          <a href="#" className="disclaimer-link" onClick={(e) => { e.preventDefault(); window.open('/Privacy Policy_Draft.pdf', 'PrivacyPolicy', 'width=800,height=600,scrollbars=yes,resizable=yes'); }}>Privacy Policy</a>
        </p>
      </footer>
    </div>
  )
}
