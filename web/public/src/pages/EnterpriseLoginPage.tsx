import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoadingOverlay from '../components/LoadingOverlay'

type AuthMode = 'login' | 'register'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

/** Enterprise login/register page with instant mock auth and SSO */
export default function EnterpriseLoginPage() {
  const navigate = useNavigate()
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [agreed, setAgreed] = useState(false)

  const generateCode = () => {
    setCode(String(Math.floor(100000 + Math.random() * 900000)))
  }

  const validate = () => {
    if (!email.trim()) return 'please enter your work email.'
    if (authMode === 'register' && !companyName.trim()) return 'please enter your company name.'
    if (!password.trim()) return 'please enter your password.'
    if (!/^\d{6}$/.test(code)) return 'please enter the 6-digit verification code.'
    if (!agreed) return 'please agree to the enterprise terms.'
    return ''
  }

  const finishLogin = (name: string, emailAddr: string) => {
    localStorage.setItem('herbtable:access_token', `mock-enterprise-${Date.now()}`)
    localStorage.setItem(
      'herbtable:user',
      JSON.stringify({
        name,
        email: emailAddr,
        avatar: '/Image.png',
      })
    )
    navigate('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 150))
    finishLogin(companyName || email.split('@')[0], email)
  }

  const handleSso = (provider: 'google-workspace' | 'microsoft-entra') => {
    setError('')
    setLoading(true)
    setTimeout(() => {
      finishLogin(provider === 'google-workspace' ? 'Workspace User' : 'Microsoft User', `${provider}@enterprise.com`)
    }, 150)
  }

  return (
    <div className="min-h-screen w-full flex bg-background relative overflow-hidden">
      <LoadingOverlay visible={loading} message="loading" />

      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/skyscraper-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col justify-between p-margin-page w-full text-white">
          <div className="font-label-md text-label-md tracking-widest">HerbTable Enterprise</div>
          <div>
            <h2 className="font-display text-[48px] leading-tight mb-4">Organization-Grade Access.</h2>
            <p className="font-body-md text-body-md text-white/80 max-w-md">
              Secure, audited, and scalable workspace access for creative teams and institutions.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-secondary/5 to-transparent rounded-full blur-[120px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[50%] bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-[400px]">
          <div className="bg-white rounded-xl border-[0.5px] border-outline-variant/20 shadow-sm overflow-hidden p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">corporate_fare</span>
                </div>
                <span className="font-label-md text-label-md tracking-widest text-on-surface-variant">
                  enterprise access
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
                {authMode === 'login' ? 'enterprise login' : 'enterprise registration'}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant/80">
                {authMode === 'login'
                  ? 'access your organization workspace.'
                  : 'register your organization on HerbTable.'}
              </p>
            </div>

            {/* Auth Mode Tabs */}
            <div className="mb-6 bg-surface-container-low rounded-lg p-1 flex">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError('') }}
                className={`flex-1 py-2.5 font-label-md text-label-md tracking-widest transition-all rounded-md ${
                  authMode === 'login'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                sign in
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError('') }}
                className={`flex-1 py-2.5 font-label-md text-label-md tracking-widest transition-all rounded-md ${
                  authMode === 'register'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                sign up
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error font-body-md text-sm">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {authMode === 'register' && (
                <div className="group relative">
                  <label className="font-mono-sm text-[10px] text-on-surface-variant/60 mb-1 block tracking-wider">
                    company name
                  </label>
                  <input
                    className="w-full bg-transparent border-b border-outline-variant/50 py-2 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/30"
                    placeholder="Acme Studios"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              )}

              <div className="group relative">
                <label className="font-mono-sm text-[10px] text-on-surface-variant/60 mb-1 block tracking-wider">
                  work email
                </label>
                <input
                  className="w-full bg-transparent border-b border-outline-variant/50 py-2 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/30"
                  placeholder="director@acme.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="group relative">
                <label className="font-mono-sm text-[10px] text-on-surface-variant/60 mb-1 block tracking-wider">
                  password
                </label>
                <input
                  className="w-full bg-transparent border-b border-outline-variant/50 py-2 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/30"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="group relative">
                <label className="font-mono-sm text-[10px] text-on-surface-variant/60 mb-1 block tracking-wider">
                  verification code
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-transparent border-b border-outline-variant/50 py-2 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/30 tracking-[0.5em]"
                    placeholder="000000"
                    maxLength={6}
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="shrink-0 px-3 py-1.5 bg-surface-container text-primary font-label-md text-[11px] tracking-wider hover:bg-surface-container-high transition-colors"
                  >
                    get code
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-1">
                <div className="relative flex items-center h-5 mt-0.5">
                  <input
                    className="peer h-4 w-4 rounded-none border-outline-variant bg-transparent text-primary focus:ring-0 cursor-pointer appearance-none border-[0.5px] checked:bg-primary transition-all"
                    id="enterprise-terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span className="material-symbols-outlined absolute pointer-events-none text-[12px] text-on-primary opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontVariationSettings: "'wght' 700" }}>
                    check
                  </span>
                </div>
                <label className="font-mono-sm text-[11px] text-on-surface-variant cursor-pointer leading-tight" htmlFor="enterprise-terms">
                  i agree to the{' '}
                  <a className="text-primary underline underline-offset-4 decoration-outline-variant hover:decoration-primary transition-all" href="#">
                    enterprise terms
                  </a>.
                </label>
              </div>

              <div className="pt-2">
                <button
                  className="w-full bg-primary text-on-primary py-3.5 font-label-md tracking-widest hover:opacity-90 active:scale-[0.98] transition-all"
                  type="submit"
                >
                  {authMode === 'login' ? 'verify domain' : 'request enterprise access'}
                </button>
              </div>
            </form>

            {/* SSO Buttons */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-black/10" />
                <span className="font-mono-sm text-[10px] text-on-surface-variant/50 tracking-wider">or continue with</span>
                <div className="flex-1 h-px bg-black/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSso('google-workspace')}
                  className="flex items-center justify-center gap-2 bg-transparent border-[0.5px] border-outline-variant/50 py-3 font-label-md text-label-md tracking-wider text-on-surface hover:bg-surface-container transition-all"
                >
                  <GoogleIcon className="w-5 h-5" />
                  workspace
                </button>
                <button
                  type="button"
                  onClick={() => handleSso('microsoft-entra')}
                  className="flex items-center justify-center gap-2 bg-transparent border-[0.5px] border-outline-variant/50 py-3 font-label-md text-label-md tracking-wider text-on-surface hover:bg-surface-container transition-all"
                >
                  <MicrosoftIcon className="w-5 h-5" />
                  entra id
                </button>
              </div>
            </div>

            <div className="mt-5 text-center">
              <Link
                to="/login"
                className="font-mono-sm text-[10px] text-on-surface-variant/50 hover:text-primary transition-colors tracking-wider"
              >
                ← back to personal login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
