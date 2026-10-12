import { useState, useCallback, useRef } from 'react'

export type CaptchaState = 'idle' | 'tracking' | 'verifying' | 'verified' | 'error'

interface MouseData {
  x: number
  y: number
  t: number
}

interface CaptchaData {
  mouseMovements: MouseData[]
  timeOnPage: number
  scrollPositions: number[]
  userAgent: string
  screenResolution: string
  language: string
  timezone: string
}

interface CaptchaResponse {
  success: boolean
  token?: string
  error?: string
}

const CAPTCHA_API = '/api/captcha/verify'

/** Hook for captcha behavioral analysis and verification */
export function useCaptcha() {
  const [state, setState] = useState<CaptchaState>('idle')
  const [token, setToken] = useState<string | null>(null)
  const attemptsRef = useRef(0)
  const challengeRef = useRef<Promise<string> | null>(null)

  const startTracking = useCallback(() => {
    challengeRef.current = fetch('/api/captcha/challenge', { credentials: 'include' }).then(async (r) => { if (!r.ok) throw new Error('Challenge unavailable'); const body = await r.json(); return String(body.challenge || '') }).catch(() => '');
    setState('tracking')
  }, [])

  const submitCaptcha = useCallback(async (data: CaptchaData): Promise<CaptchaResponse> => {
    setState('verifying')
    attemptsRef.current += 1

    try {
      const challenge = await challengeRef.current
      if (!challenge) throw new Error("Start a challenge first")
      const response = await fetch(CAPTCHA_API, {
        credentials: "include",
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          challenge,
          attemptNumber: attemptsRef.current,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success && typeof result.token === "string") {
        setState('verified')
        setToken(result.token)
        return { success: true, token: result.token }
      } else {
        setState('error')
        return { success: false, error: result.error }
      }
    } catch (err) {
      setState('error')
      return { success: false, error: 'Network error' }
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setToken(null)
    challengeRef.current = null
    attemptsRef.current = 0
  }, [])

  return {
    state,
    token,
    startTracking,
    submitCaptcha,
    reset,
  }
}
