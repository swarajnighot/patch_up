function getSessionId() {
  let id = sessionStorage.getItem('_sid')
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('_sid', id)
  }
  return id
}

export function trackEvent(event, meta) {
  fetch('/api/v1/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, sessionId: getSessionId(), meta: meta || null }),
  }).catch(() => {})
}
