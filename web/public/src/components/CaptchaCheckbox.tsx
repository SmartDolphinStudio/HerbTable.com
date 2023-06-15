import { useEffect, useRef, useCallback } from 'react'
import { useCaptcha } from '../hooks/useCaptcha'

interface CaptchaCheckboxProps {
  onVerify: (token: string) => void
  onError: () => void
}

/** Single-checkbox captcha with behavioral analysis */
export default function CaptchaCheckbox({ onVerify, onError }: CaptchaCheckboxProps) {
  const { state, token, startTracking, submitCaptcha } = useCaptcha()
  const mouseEvents = useRef<{ x: number; y: number; t: number }[]>([])
  const startTime = useRef(Date.now())
  const scrollEvents = useRef<number[]>([])
  const isTracking = useRef(false)

  // Track mouse movements
  useEffect(() => {
    if (!isTracking.current) return

    let rafId: number
    let lastRecorded = 0

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastRecorded > 50) {
        mouseEvents.current.push({ x: e.clientX, y: e.clientY, t: now - startTime.current })
        lastRecorded = now
      }
    }

    const handleScroll = () => {
      scrollEvents.current.push(window.scrollY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // Start tracking on mount
  useEffect(() => {
    isTracking.current = true
    startTime.current = Date.now()
    startTracking()
  }, [startTracking])

  const handleClick = useCallback(async () => {
    if (state === 'verified' || state === 'verifying') return

    const timeOnPage = Date.now() - startTime.current
    const data = {
      mouseMovements: mouseEvents.current.slice(-200), // Last 200 events
      timeOnPage,
      scrollPositions: scrollEvents.current.slice(-50),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }

    const result = await submitCaptcha(data)
    if (result.success && result.token) {
      onVerify(result.token)
    } else {
      onError()
    }
  }, [state, submitCaptcha, onVerify, onError])

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'verifying' || state === 'verified'}
        className={`
          relative w-full max-w-[300px] h-14 border-[0.5px] rounded-lg
          flex items-center px-4 gap-3 transition-all duration-300
          ${state === 'verified'
            ? 'border-green-500/30 bg-green-500/5 cursor-default'
            : state === 'verifying'
              ? 'border-outline-variant/30 bg-surface-container-low/50 cursor-wait'
              : 'border-outline-variant/50 bg-white hover:border-primary/50 hover:shadow-sm cursor-pointer'
          }
        `}
      >
        {/* Checkbox */}
        <div
          className={`
            w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-300
            ${state === 'verified'
              ? 'bg-green-500 border-green-500'
              : state === 'verifying'
                ? 'border-outline-variant/50 bg-surface-container'
                : 'border-outline-variant/70 bg-white'
            }
          `}
        >
          {state === 'verifying' && (
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant animate-spin">
              progress_activity
            </span>
          )}
          {state === 'verified' && (
            <span className="material-symbols-outlined text-[16px] text-white">check</span>
          )}
        </div>

        {/* Label */}
        <span
          className={`
            font-label-md text-label-md uppercase tracking-wider transition-colors
            ${state === 'verified'
              ? 'text-green-600'
              : state === 'verifying'
                ? 'text-on-surface-variant/50'
                : 'text-on-surface-variant'
            }
          `}
        >
          {state === 'verified'
            ? 'Verified'
            : state === 'verifying'
              ? 'Verifying...'
              : "I'm not a robot"}
        </span>

        {/* Success shimmer */}
        {state === 'verified' && (
          <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            <div className="absolute inset-0 w-1/4 h-full bg-green-400/10 skew-x-[-20deg] animate-[shimmer_1.5s_infinite]" />
          </div>
        )}
      </button>

      {/* Status message */}
      {state === 'error' && (
        <p className="font-mono-sm text-[10px] text-error">Verification failed. Please try again.</p>
      )}
    </div>
  )
}
