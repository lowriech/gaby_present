import { generatePKCE, buildAuthUrl, storeVerifier } from '../spotify/auth'

interface SpotifyLoginProps {
  onSkip: () => void
}

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string

export default function SpotifyLogin({ onSkip }: SpotifyLoginProps) {
  async function handleConnect() {
    const { verifier, challenge } = await generatePKCE()
    storeVerifier(verifier)
    window.location.href = buildAuthUrl(CLIENT_ID, REDIRECT_URI, challenge)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-white/10 border border-white/20 px-10 py-10 shadow-2xl backdrop-blur-md text-white text-center max-w-sm w-full mx-4">
        <div className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#1DB954]" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.493 17.307a.748.748 0 01-1.03.25c-2.819-1.723-6.365-2.112-10.542-1.157a.748.748 0 01-.333-1.458c4.573-1.045 8.492-.595 11.655 1.336a.748.748 0 01.25 1.029zm1.466-3.26a.936.936 0 01-1.287.308c-3.226-1.983-8.147-2.558-11.966-1.4a.937.937 0 01-.545-1.793c4.363-1.325 9.784-.682 13.49 1.598a.936.936 0 01.308 1.287zm.126-3.395c-3.868-2.297-10.248-2.509-13.942-1.388a1.122 1.122 0 01-.653-2.148c4.242-1.29 11.296-1.041 15.748 1.606a1.123 1.123 0 01-1.153 1.93z" />
          </svg>
          <h2 className="text-xl font-semibold tracking-wide">Connect Spotify</h2>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">
          Log in with Spotify Premium to hear full songs. Or skip to listen to previews.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleConnect}
            className="w-full rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold py-3 transition-colors cursor-pointer"
          >
            Connect Spotify
          </button>
          <button
            onClick={onSkip}
            className="w-full rounded-full bg-white/10 hover:bg-white/20 text-white/80 font-medium py-3 transition-colors cursor-pointer"
          >
            Skip — use previews
          </button>
        </div>
      </div>
    </div>
  )
}
