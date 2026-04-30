'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/feed')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div className="logo-mark">HP</div>
          <span style={{ fontSize: 20, fontWeight: 500 }}>HomePlate</span>
        </div>
        <h1>Start cooking together</h1>
        <p>Create an account to share your homemade dishes.</p>

        <form onSubmit={handleSignup} className="form-gap">
          {error && <div className="error-msg">{error}</div>}
          <div>
            <label className="form-label">Email</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="input" type="password" placeholder="At least 6 characters"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', marginTop: 4 }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--green)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}