import { useEffect, useState } from 'react'

export const DIAMOND_BALANCE_KEY = 'pawplay-live-balance-v1'
export const STARTING_DIAMOND_BALANCE = 100_000_000_000
export const DIAMOND_REFILL = 25_000_000_000

export function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) as T : initialValue
    } catch { return initialValue }
  })

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Storage is optional. */ }
  }, [key, value])

  return [value, setValue] as const
}

export function useDiamondBalance() {
  return useStoredState(DIAMOND_BALANCE_KEY, STARTING_DIAMOND_BALANCE)
}
