import { useEffect, useRef, useState } from 'react'
import { entries } from '../entries'
import { useEntryStore } from '../store'

export default function ForegroundAnimationOverlay() {
  const activeEntryIndex = useEntryStore((s) => s.activeEntryIndex)
  const [elapsed, setElapsed] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const entry = entries[activeEntryIndex]
    const anim = entry?.foregroundAnimation
    if (!anim || anim.type !== 'imageSequence' || anim.clips.length === 0) {
      setElapsed(0)
      return
    }

    const maxEndTime = Math.max(...anim.clips.map((c) => c.endTime))
    const startedAt = performance.now()

    const tick = () => {
      const secs = (performance.now() - startedAt) / 1000
      setElapsed(secs)
      if (secs < maxEndTime + 0.6) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    setElapsed(0)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [activeEntryIndex])

  const entry = entries[activeEntryIndex]
  const anim = entry?.foregroundAnimation
  if (!anim || anim.type !== 'imageSequence') return null

  const verticalOffset = anim.verticalOffset ?? '0px'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      {anim.clips.map((clip, i) => {
        const visible = elapsed >= clip.startTime && elapsed <= clip.endTime
        return (
          <img
            key={i}
            src={clip.src}
            style={{
              position: 'absolute',
              left: clip.position.x,
              top: clip.position.y,
              transform: `translate(-50%, calc(-100% - ${verticalOffset})) scale(${clip.scale ?? 1})`,
              width: clip.width ?? 'auto',
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.5s ease',
              borderRadius: '12px',
              border: '2px solid #4a90d9',
            }}
          />
        )
      })}
    </div>
  )
}
