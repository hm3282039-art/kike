import { useEffect, useRef } from 'react'

// Opt-in, short synthesized tones. No network audio and no sound on page load.
export function useGameSound() {
  const context = useRef<AudioContext | null>(null)
  useEffect(() => () => { void context.current?.close().catch(() => {}) }, [])
  return (event: 'refuge' | 'collision' | 'cashout') => {
    try {
      const audio = context.current ||= new AudioContext()
      void audio.resume().catch(() => {})
      const notes = event === 'collision' ? [180, 90] : event === 'cashout' ? [523, 659, 784] : [440, 660]
      notes.forEach((frequency, i) => {
        const oscillator = audio.createOscillator()
        const gain = audio.createGain()
        oscillator.type = event === 'collision' ? 'triangle' : 'sine'
        oscillator.frequency.value = frequency
        const start = audio.currentTime + i * .11
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(.055, start + .01)
        gain.gain.exponentialRampToValueAtTime(.001, start + .18)
        oscillator.connect(gain); gain.connect(audio.destination)
        oscillator.start(start); oscillator.stop(start + .2)
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
      })
    } catch { /* Audio unavailable: visuals still communicate every result. */ }
  }
}
