import { useEffect, useRef, useCallback } from 'react'

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
  }
}

let apiLoadStarted = false

function ensureScript(): Promise<IFrameAPI> {
  if (window._spotifyIFrameAPI) return Promise.resolve(window._spotifyIFrameAPI)

  return new Promise((resolve) => {
    const prev = window.onSpotifyIframeApiReady
    window.onSpotifyIframeApiReady = (api) => {
      window._spotifyIFrameAPI = api
      prev?.(api)
      resolve(api)
    }

    if (!apiLoadStarted) {
      apiLoadStarted = true
      const s = document.createElement('script')
      s.src = 'https://open.spotify.com/embed/iframe-api/v1'
      s.async = true
      document.head.appendChild(s)
    }
  })
}

export default function SpotifyPlayer({ trackId }: { trackId: string | null }) {
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
    if (!trackId) {
      if (controllerRef.current && !pausedByNone.current) {
        controllerRef.current.pause()
        pausedByNone.current = true
      }
      return
    }

    const uri = `spotify:track:${trackId}`

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

    ensureScript().then((api) => initController(api, uri))
  }, [trackId, initController])

  useEffect(() => {
    return () => {
      controllerRef.current?.destroy()
      controllerRef.current = null
      currentUriRef.current = null
      pausedByNone.current = false
    }
  }, [])

  const visible = trackId !== null

  return (
    <div
      className="fixed bottom-4 left-4 z-50 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
    >
      <div ref={containerRef} className="rounded-xl shadow-lg overflow-hidden" />
    </div>
  )
}
