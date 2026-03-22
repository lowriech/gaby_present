import { useEffect, useRef, useState, useCallback } from 'react'
import { entries } from '../entries'

let sharedAudio: HTMLAudioElement | null = null

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio()
    sharedAudio.preload = 'auto'
  }
  return sharedAudio
}

export function useEntryAudio(activeEntryIndex: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSrcRef = useRef<string | null>(null)
  const [needsGesture, setNeedsGesture] = useState(false)

  const unlock = useCallback(() => {
    const src = pendingSrcRef.current
    if (!src) return
    const audio = getSharedAudio()
    audio.src = src
    audio.currentTime = 0
    audio.play().then(() => {
      setNeedsGesture(false)
      pendingSrcRef.current = null
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const audio = getSharedAudio()
    if (!audio.paused) {
      audio.pause()
    }
    pendingSrcRef.current = null
    setNeedsGesture(false)

    const entry = entries[activeEntryIndex]
    if (!entry?.audio) return

    const delayMs = entry.background.animationTime * 1000
    const src = entry.audio.src

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      audio.src = src
      audio.currentTime = 0
      audio.play().then(() => {
        pendingSrcRef.current = null
        setNeedsGesture(false)
      }).catch(() => {
        pendingSrcRef.current = src
        setNeedsGesture(true)
      })
    }, delayMs)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [activeEntryIndex])

  return { needsGesture, unlock }
}
