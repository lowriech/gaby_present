import { useEffect, useRef, useState } from 'react'

interface RecordingSide {
  icon: string
  recording: string
}

interface Props {
  left: RecordingSide
  right: RecordingSide
  isActive: boolean
  topCaption?: string
  bottomCaption?: string
}

type PlayingSide = 'left' | 'right' | null

export default function SideBySideRecordings({ left, right, isActive, topCaption, bottomCaption }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState<PlayingSide>(null)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.addEventListener('ended', () => setPlaying(null))
    }
    return () => {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      }
    }
  }, [])

  useEffect(() => {
    if (!isActive && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(null)
    }
  }, [isActive])

  function handleClick(side: 'left' | 'right') {
    const audio = audioRef.current
    if (!audio) return

    if (playing === side) {
      audio.pause()
      audio.currentTime = 0
      setPlaying(null)
      return
    }

    const src = side === 'left' ? left.recording : right.recording
    audio.pause()
    audio.src = src
    audio.currentTime = 0
    audio.play().catch(() => {})
    setPlaying(side)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {topCaption && (
        <p className="text-white/80 text-lg font-light text-center select-none">{topCaption}</p>
      )}
      <div className="flex items-center justify-center gap-12">
        <RecordingButton
          icon={left.icon}
          isPlaying={playing === 'left'}
          onClick={() => handleClick('left')}
        />
        <RecordingButton
          icon={right.icon}
          isPlaying={playing === 'right'}
          onClick={() => handleClick('right')}
        />
      </div>
      {bottomCaption && (
        <p className="text-white/80 text-lg font-light text-center select-none">{bottomCaption}</p>
      )}
    </div>
  )
}

function RecordingButton({
  icon,
  isPlaying,
  onClick,
}: {
  icon: string
  isPlaying: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white/40 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 select-none"
    >
      {isPlaying && (
        <span className="absolute inset-0 rounded-full border-2 border-white/80 animate-ping" />
      )}
      <img
        src={icon}
        alt=""
        className="w-full h-full object-cover object-left-top pointer-events-none"
      />
    </button>
  )
}
