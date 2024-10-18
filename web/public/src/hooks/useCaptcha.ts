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

  const startTracking = useCallback(() => {
    setState('tracking')
  }, [])

  const submitCaptcha = useCallback(async (data: CaptchaData): Promise<CaptchaResponse> => {
    setState('verifying')
    attemptsRef.current += 1

    try {
      const response = await fetch(CAPTCHA_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          attemptNumber: attemptsRef.current,
        }),
      })

      const result = await response.json()

      if (result.success) {
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
