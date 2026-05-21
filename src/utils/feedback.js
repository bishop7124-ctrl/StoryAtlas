export async function submitFeedback({ type, title, message, category, email, name }) {
  const res = await fetch('/api/submit-feedback', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ type, title, message, category, email, name }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Submission failed — please try again.')
  }
}
