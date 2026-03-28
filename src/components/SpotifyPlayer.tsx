import { useEffect, useRef, useCallback, useState } from 'react'
import { clearToken } from '../spotify/auth'

// ---------- Embed (preview) mode types ----------

interface EmbedController {
  loadUri(uri: string): void
  play(): void
  pause(): void
  resume(): void
  togglePlay(): void
  destroy(): void
  addListener(event: string, cb: (e: unknown) => void): void
}

interface IFrameAPI {
  createController(
    el: HTMLElement,
    options: { uri: string; width: number; height: number },
    cb: (ctrl: EmbedController) => void,
  ): void
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void
    _spotifyIFrameAPI?: IFrameAPI
    onSpotifyWebPlaybackSDKReady?: () => void
    Spotify?: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifySDKPlayer
    }
  }
}

interface SpotifySDKPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, cb: (state: unknown) => void): void
  removeListener(event: string): void
  getCurrentState(): Promise<SDKPlaybackState | null>
  setVolume(v: number): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  togglePlay(): Promise<void>
}

interface SDKPlaybackState {
  paused: boolean
  track_window: {
    current_track: {
      name: string
      artists: { name: string }[]
      album: { images: { url: string }[] }
    }
  }
  position: number
  duration: number
}

// ---------- Embed mode ----------

let embedApiLoadStarted = false

function ensureEmbedScript(): Promise<IFrameAPI> {
  if (window._spotifyIFrameAPI) return Promise.resolve(window._spotifyIFrameAPI)

  return new Promise((resolve) => {
    const prev = window.onSpotifyIframeApiReady
    window.onSpotifyIframeApiReady = (api) => {
      window._spotifyIFrameAPI = api
      prev?.(api)
      resolve(api)
    }

    if (!embedApiLoadStarted) {
      embedApiLoadStarted = true
      const s = document.createElement('script')
      s.src = 'https://open.spotify.com/embed/iframe-api/v1'
      s.async = true
      document.head.appendChild(s)
    }
  })
}

function EmbedPlayer({ spotify }: { spotify: { trackId: string } | null }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<EmbedController | null>(null)
  const currentUriRef = useRef<string | null>(null)
  const pausedByNone = useRef(false)

  const initController = useCallback((api: IFrameAPI, uri: string) => {
    const el = containerRef.current
    if (!el || controllerRef.current) return

    api.createController(el, { uri, width: 300, height: 80 }, (ctrl) => {
      controllerRef.current = ctrl
      currentUriRef.current = uri

      ctrl.addListener('ready', () => {
        ctrl.play()
      })

      ctrl.addListener('playback_update', (e: unknown) => {
        const d = (e as { data: { isPaused: boolean; duration: number; position: number } }).data
        if (d.isPaused && d.duration > 0 && d.position >= d.duration - 500) {
          ctrl.loadUri(uri)
        }
      })
    })
  }, [])

  useEffect(() => {
    if (!spotify) {
      if (controllerRef.current && !pausedByNone.current) {
        controllerRef.current.pause()
        pausedByNone.current = true
      }
      return
    }

    const uri = `spotify:track:${spotify.trackId}`

    if (controllerRef.current) {
      if (currentUriRef.current !== uri) {
        currentUriRef.current = uri
        pausedByNone.current = false
        controllerRef.current.loadUri(uri)
      } else if (pausedByNone.current) {
        pausedByNone.current = false
        controllerRef.current.resume()
      }
      return
    }

    ensureEmbedScript().then((api) => initController(api, uri))
  }, [spotify, initController])

  useEffect(() => {
    return () => {
      controllerRef.current?.destroy()
      controllerRef.current = null
      currentUriRef.current = null
      pausedByNone.current = false
    }
  }, [])

  return <div ref={containerRef} className="rounded-xl shadow-lg overflow-hidden" />
}

// ---------- SDK mode ----------

const VOLUME = 0.8
const DEFAULT_FADE_MS = 400

async function fadeVolume(
  player: SpotifySDKPlayer,
  from: number,
  to: number,
  durationMs: number,
  fadeId: number,
  fadeIdRef: { current: number },
): Promise<boolean> {
  const steps = 10
  const stepMs = durationMs / steps
  const delta = (to - from) / steps
  for (let i = 1; i <= steps; i++) {
    await new Promise<void>((r) => setTimeout(r, stepMs))
    if (fadeIdRef.current !== fadeId) return false
    await player.setVolume(Math.max(0, Math.min(1, from + delta * i)))
  }
  return true
}

let sdkScriptLoadStarted = false

function ensureSDKScript(): Promise<void> {
  if (window.Spotify) return Promise.resolve()

  return new Promise((resolve) => {
    const prev = window.onSpotifyWebPlaybackSDKReady
    window.onSpotifyWebPlaybackSDKReady = () => {
      prev?.()
      resolve()
    }

    if (!sdkScriptLoadStarted) {
      sdkScriptLoadStarted = true
      const s = document.createElement('script')
      s.src = 'https://sdk.scdn.co/spotify-player.js'
      s.async = true
      document.head.appendChild(s)
    }
  })
}

async function apiPlay(
  accessToken: string,
  deviceId: string,
  trackUri: string,
  positionMs: number,
): Promise<void> {
  const res = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [trackUri], position_ms: positionMs }),
    },
  )
  if (res.status === 401) {
    clearToken()
    window.location.reload()
  }
}

function SDKPlayer({
  spotify,
  accessToken,
}: {
  spotify: { trackId: string; song_start_time?: number; fade_time?: number } | null
  accessToken: string
}) {
  const playerRef = useRef<SpotifySDKPlayer | null>(null)
  const deviceIdRef = useRef<string | null>(null)
  const [trackInfo, setTrackInfo] = useState<{ name: string; artist: string; albumArt: string } | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const currentUriRef = useRef<string | null>(null)
  const currentStartMsRef = useRef(0)
  const currentFadeMsRef = useRef(DEFAULT_FADE_MS)
  const fadeIdRef = useRef(0)

  // Initialize the SDK player once
  useEffect(() => {
    let cancelled = false

    ensureSDKScript().then(() => {
      if (cancelled || playerRef.current) return

      const player = new window.Spotify!.Player({
        name: 'Gaby Present',
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0, // start silent; always fade in
      })

      playerRef.current = player

      player.addListener('ready', (state: unknown) => {
        const { device_id } = state as { device_id: string }
        deviceIdRef.current = device_id
        if (currentUriRef.current) {
          const id = ++fadeIdRef.current
          apiPlay(accessToken, device_id, currentUriRef.current, currentStartMsRef.current)
            .then(() => fadeVolume(player, 0, VOLUME, currentFadeMsRef.current, id, fadeIdRef))
        }
      })

      player.addListener('player_state_changed', (state: unknown) => {
        if (!state) return
        const s = state as SDKPlaybackState
        setIsPaused(s.paused)
        const track = s.track_window.current_track
        setTrackInfo({
          name: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
          albumArt: track.album.images[0]?.url ?? '',
        })
      })

      player.addListener('authentication_error', () => {
        clearToken()
        window.location.reload()
      })

      player.connect()
    })

    return () => {
      cancelled = true
      playerRef.current?.disconnect()
      playerRef.current = null
      deviceIdRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only on mount; accessToken won't change within a session

  // React to spotify prop changes
  useEffect(() => {
    const uri = spotify ? `spotify:track:${spotify.trackId}` : null
    const player = playerRef.current

    if (!uri) {
      if (!player) return
      const id = ++fadeIdRef.current
      fadeVolume(player, VOLUME, 0, currentFadeMsRef.current, id, fadeIdRef).then((ok) => {
        if (ok) player.pause()
      })
      return
    }

    if (uri === currentUriRef.current) return
    currentUriRef.current = uri
    currentStartMsRef.current = spotify?.song_start_time ?? 0
    currentFadeMsRef.current = spotify?.fade_time ?? DEFAULT_FADE_MS

    const deviceId = deviceIdRef.current
    if (!deviceId) return // player not ready yet; ready listener will handle first play

    if (!player) return

    const id = ++fadeIdRef.current
    const startMs = spotify?.song_start_time ?? 0
    const fadeMs = spotify?.fade_time ?? DEFAULT_FADE_MS
    ;(async () => {
      const ok = await fadeVolume(player, VOLUME, 0, fadeMs, id, fadeIdRef)
      if (!ok) return
      await apiPlay(accessToken, deviceId, uri, startMs)
      await fadeVolume(player, 0, VOLUME, fadeMs, id, fadeIdRef)
    })()
  }, [spotify, accessToken])

  const handleToggle = () => {
    playerRef.current?.togglePlay()
  }

  if (!trackInfo) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-md text-white text-sm shadow-lg border border-white/10 w-[300px]">
        <div className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
        <span className="text-white/60">Connecting to Spotify…</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-black/50 backdrop-blur-md text-white shadow-lg border border-white/10 w-[300px]">
      {trackInfo.albumArt && (
        <img src={trackInfo.albumArt} alt="album art" className="w-10 h-10 rounded object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{trackInfo.name}</p>
        <p className="text-xs text-white/60 truncate">{trackInfo.artist}</p>
      </div>
      <button
        onClick={handleToggle}
        aria-label={isPaused ? 'Play' : 'Pause'}
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
      >
        {isPaused ? (
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white ml-0.5"><path d="M8 5v14l11-7z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
        )}
      </button>
    </div>
  )
}

// ---------- Main export ----------

interface SpotifyPlayerProps {
  spotify: { trackId: string; song_start_time?: number; fade_time?: number } | null
  accessToken: string | null
}

export default function SpotifyPlayer({ spotify, accessToken }: SpotifyPlayerProps) {
  const visible = spotify !== null

  return (
    <div
      className="fixed bottom-4 left-4 z-50 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
    >
      {accessToken ? (
        <SDKPlayer spotify={spotify} accessToken={accessToken} />
      ) : (
        <EmbedPlayer spotify={spotify} />
      )}
    </div>
  )
}
