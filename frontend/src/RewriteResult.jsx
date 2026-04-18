import { useState } from 'react'

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

function CopyButton({ label, text }) {
  const [status, setStatus] = useState('idle')
  return (
    <button
      type="button"
      className="result-copy-btn"
      onClick={() =>
        copyText(text, (s) => {
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
            <CopyButton label="Copy" text={data.howYouFeel} />
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
            <CopyButton label="Copy" text={helpText} />
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
            If something feels off, edit it. It&apos;s your message.
          </p>
          <div className="result-pill-row">
            <button type="button" className="result-pill" onClick={onEdit}>
              Edit
            </button>
            <button type="button" className="result-pill" onClick={onStartOver}>
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
              onClick={() => setLastCheck('open')}
            >
              It opens a door
            </button>
            <button
              type="button"
              className="result-pill"
              onClick={() => setLastCheck('wait')}
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
      </main>

      <footer className="result-footer">
        <p className="result-copyright">
          © {new Date().getFullYear()} Patch-up.com · All rights reserved
        </p>
      </footer>
    </div>
  )
}
