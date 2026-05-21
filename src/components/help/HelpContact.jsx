import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { submitFeedback } from '../../utils/feedback'

export default function HelpContact({ open, onClose }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ firstName: '', message: '' })
  const [status, setStatus] = useState('idle') // 'idle' | 'sending' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  if (!open) return null

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')
    try {
      await submitFeedback({
        type:    'support',
        title:   `Support request from ${form.firstName || user?.email || 'user'}`,
        message: form.message,
        name:    form.firstName || null,
        email:   user?.email || null,
        userId:  user?.id || null,
      })
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const handleClose = () => {
    setForm({ firstName: '', message: '' })
    setStatus('idle')
    setErrorMsg('')
    onClose()
  }

  const fieldStyle = {
    width: '100%',
    background: 'var(--bg-main)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '9px 12px',
    fontSize: 13,
    color: 'var(--text-main)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 6,
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{
        background: 'var(--bg-nav)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        width: 'min(480px, 100%)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>
              Get in touch
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>Help &amp; Support</p>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {status === 'done' ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>✓</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
                Message received
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                We'll get back to you at <strong style={{ color: 'var(--text-main)' }}>{user?.email}</strong> as soon as we can.
              </p>
              <button
                onClick={handleClose}
                style={{
                  padding: '9px 20px', borderRadius: 6,
                  background: 'var(--accent)', color: 'var(--bg-main)',
                  border: 'none', fontWeight: 800, fontSize: 12,
                  letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>First name</label>
                  <input
                    type="text"
                    placeholder="Your first name"
                    value={form.firstName}
                    onChange={update('firstName')}
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    style={{ ...fieldStyle, opacity: 0.6, cursor: 'default' }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  required
                  placeholder="Describe your issue or question…"
                  value={form.message}
                  onChange={update('message')}
                  rows={5}
                  style={{ ...fieldStyle, resize: 'vertical', minHeight: 100 }}
                />
              </div>

              {status === 'error' && (
                <p style={{ fontSize: 12, color: 'var(--danger, #ef4444)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 12px' }}>
                  {errorMsg}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: '9px 16px', borderRadius: 6,
                    background: 'transparent', color: 'var(--text-muted)',
                    border: '1px solid var(--border)', fontWeight: 700, fontSize: 12,
                    letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{
                    padding: '9px 20px', borderRadius: 6,
                    background: 'var(--accent)', color: 'var(--bg-main)',
                    border: 'none', fontWeight: 800, fontSize: 12,
                    letterSpacing: '.06em', textTransform: 'uppercase', cursor: status === 'sending' ? 'default' : 'pointer',
                    opacity: status === 'sending' ? 0.7 : 1, fontFamily: 'inherit',
                  }}
                >
                  {status === 'sending' ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
