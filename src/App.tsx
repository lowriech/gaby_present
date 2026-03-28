import { useRef, useEffect, useState, useCallback } from 'react'
import { entries, getActiveSpotify } from './entries'
import CloudBackground from './components/CloudBackground'
import OpeningMessage from './components/OpeningMessage'
import PictureEntry from './components/PictureEntry'
import SideBySideRecordings from './components/SideBySideRecordings'
import ForegroundAnimationOverlay from './components/ForegroundAnimationOverlay'
import { useEntryStore } from './store'
import { useEntryAudio } from './hooks/useEntryAudio'
import SpotifyPlayer from './components/SpotifyPlayer'
import SpotifyLogin from './components/SpotifyLogin'
import {
  exchangeCode,
  getStoredToken,
  storeToken,
  popVerifier,
} from './spotify/auth'

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string

type AuthState = 'loading' | 'login' | 'authenticated' | 'skipped'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<(HTMLDivElement | null)[]>([])
  const setActiveEntryIndex = useEntryStore((s) => s.setActiveEntryIndex)
  const activeEntryIndex = useEntryStore((s) => s.activeEntryIndex)
  const { needsGesture, unlock } = useEntryAudio(activeEntryIndex)
  const [activatedEntries, setActivatedEntries] = useState<Set<number>>(() => new Set([0]))
  const activeSpotify = getActiveSpotify(activeEntryIndex)

  const [authState, setAuthState] = useState<AuthState>('loading')
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Handle OAuth callback and initial auth check on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      const verifier = popVerifier()
      if (verifier) {
        exchangeCode(code, verifier, CLIENT_ID, REDIRECT_URI)
          .then((tokenData) => {
            storeToken(tokenData)
            setAccessToken(tokenData.access_token)
            setAuthState('authenticated')
          })
          .catch(() => {
            setAuthState('login')
          })
          .finally(() => {
            history.replaceState(null, '', window.location.pathname)
          })
      } else {
        history.replaceState(null, '', window.location.pathname)
        setAuthState('login')
      }
      return
    }

    const stored = getStoredToken()
    if (stored) {
      setAccessToken(stored.access_token)
      setAuthState('authenticated')
    } else {
      setAuthState('login')
    }
  }, [])

  const activateEntry = useCallback((idx: number) => {
    setActiveEntryIndex(idx)
    setActivatedEntries((prev) => {
      if (prev.has(idx)) return prev
      const next = new Set(prev)
      next.add(idx)
      return next
    })
  }, [setActiveEntryIndex])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (observerEntries) => {
        for (const oe of observerEntries) {
          if (oe.isIntersecting && oe.intersectionRatio >= 0.5) {
            const idx = panelRefs.current.indexOf(oe.target as HTMLDivElement)
            if (idx !== -1) activateEntry(idx)
          }
        }
      },
      { root: container, threshold: 0.5 },
    )

    for (const panel of panelRefs.current) {
      if (panel) observer.observe(panel)
    }

    return () => observer.disconnect()
  }, [activateEntry])

  useEffect(() => {
    const entry = entries[activeEntryIndex]
    const delay = entry?.autoScrollDelay ?? 10
    if (delay === 'none') return
    const nextPanel = panelRefs.current[activeEntryIndex + 1]
    if (!nextPanel) return
    const id = setTimeout(() => {
      nextPanel.scrollIntoView({ behavior: 'smooth' })
    }, delay * 1000)
    return () => clearTimeout(id)
  }, [activeEntryIndex])

  return (
    <>
      <CloudBackground containerRef={containerRef} />
      <ForegroundAnimationOverlay />
      <div
        ref={containerRef}
        className="relative z-10 h-screen overflow-y-scroll snap-y snap-mandatory"
      >
        <div className="mx-auto w-full max-w-screen-sm px-4 md:max-w-[30vw] md:px-0">
          {entries.map((entry, i) => (
            <div
              key={i}
              ref={(el) => { panelRefs.current[i] = el }}
              className="h-screen snap-center flex flex-col items-center justify-center gap-6"
            >
              {entry.foreground?.type === 'message' && (
                <OpeningMessage text={entry.foreground.text} revealDuration={entry.foreground.revealDuration} isActive={activatedEntries.has(i)} />
              )}
              {entry.foreground?.type === 'picture' && (
                <PictureEntry src={entry.foreground.src} caption={entry.foreground.caption} />
              )}
              {entry.foreground?.type === 'sideBySideRecordings' && (
                <SideBySideRecordings left={entry.foreground.left} right={entry.foreground.right} isActive={activatedEntries.has(i)} topCaption={entry.foreground.topCaption} bottomCaption={entry.foreground.bottomCaption} />
              )}
            </div>
          ))}
        </div>
      </div>
      {authState !== 'loading' && (
        <SpotifyPlayer
          spotify={activeSpotify}
          accessToken={authState === 'authenticated' ? accessToken : null}
        />
      )}
      {authState === 'login' && (
        <SpotifyLogin onSkip={() => setAuthState('skipped')} />
      )}
      {needsGesture && (
        <button
          onClick={unlock}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-white text-sm shadow-lg hover:bg-white/30 transition-colors cursor-pointer"
        >
          Tap for sound ♪
        </button>
      )}
    </>
  )
}
