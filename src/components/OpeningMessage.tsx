import { useMemo } from 'react'

interface Props {
  text: string
  revealDuration: number
  isActive: boolean
}

export default function OpeningMessage({ text, revealDuration, isActive }: Props) {
  const lines = useMemo(() => {
    const split = text.split('\n')
    const totalChars = split.reduce((sum, line) => sum + line.length, 0)
    let globalIdx = 0

    return split.map((line) => {
      const chars = [...line].map((char) => {
        const delay = (globalIdx / totalChars) * revealDuration
        globalIdx++
        return { char, delay }
      })
      return chars
    })
  }, [text, revealDuration])

  return (
    <div className="text-white text-xl md:text-3xl font-light leading-relaxed text-center select-none">
      {lines.map((chars, lineIdx) => (
        <div key={lineIdx}>
          {chars.map(({ char, delay }, charIdx) => (
            <span
              key={charIdx}
              style={isActive
                ? { opacity: 0, animation: `fadeInChar 150ms ${delay}ms forwards` }
                : { opacity: 0 }
              }
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
