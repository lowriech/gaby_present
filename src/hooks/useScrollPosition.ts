import { useState, useEffect, type RefObject } from 'react'

export function useScrollPosition(ref: RefObject<HTMLElement | null>): number {
  const [scroll, setScroll] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onScroll = () => {
      const maxScroll = el.scrollHeight - el.clientHeight
      setScroll(maxScroll > 0 ? el.scrollTop / maxScroll : 0)
    }

    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [ref])

  return scroll
}
