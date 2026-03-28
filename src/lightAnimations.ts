import type { LightIdleAnimation, LightAnimationKeyframe } from './entries'

type LightOffsets = ReturnType<LightIdleAnimation>

export function resolveLightAnimation(
  anim: LightIdleAnimation | LightAnimationKeyframe[],
  idleT: number,
): LightOffsets {
  if (typeof anim === 'function') return anim(idleT)

  let activeIdx = 0
  for (let i = anim.length - 1; i >= 0; i--) {
    if (idleT >= anim[i].start_time) { activeIdx = i; break }
  }

  let dx1 = 0, dy1 = 0, dx2 = 0, dy2 = 0

  for (let j = 0; j < activeIdx; j++) {
    const dur = anim[j + 1].start_time - anim[j].start_time
    const o = anim[j].animation(dur)
    dx1 += o.light1.dx; dy1 += o.light1.dy
    dx2 += o.light2.dx; dy2 += o.light2.dy
  }

  const cur = anim[activeIdx].animation(idleT - anim[activeIdx].start_time)
  dx1 += cur.light1.dx; dy1 += cur.light1.dy
  dx2 += cur.light2.dx; dy2 += cur.light2.dy

  return { light1: { dx: dx1, dy: dy1 }, light2: { dx: dx2, dy: dy2 } }
}

export interface BeatSignature {
  bpm: number
  reverse_on_beats: number[]
}

function beatTime(t: number, sig: BeatSignature): number {
  const beatDur = 60 / sig.bpm
  const cycleDur = 4 * beatDur
  const n = Math.floor(t / cycleDur)
  const tau = t - n * cycleDur

  const netPerCycle = (4 - 2 * sig.reverse_on_beats.length) * beatDur

  let effective = 0
  let remaining = tau
  for (let b = 1; b <= 4 && remaining > 0; b++) {
    const seg = Math.min(remaining, beatDur)
    effective += sig.reverse_on_beats.includes(b) ? -seg : seg
    remaining -= seg
  }

  return n * netPerCycle + effective
}

function beatAdjustedDuration(realDuration: number, beat: BeatSignature): number {
  const eff = beatTime(realDuration, beat)
  if (eff <= 0) return realDuration
  return eff
}

export interface CircleConfig {
  startAngle: number
  clockwise: boolean
  radius: number
  speed: number
}

export interface JitterConfig {
  speed: number
  amplitude: number
}

export function circle(light1: CircleConfig, light2: CircleConfig, beat?: BeatSignature): LightIdleAnimation {
  const dir1 = light1.clockwise ? -1 : 1
  const dir2 = light2.clockwise ? -1 : 1
  const cos1_0 = Math.cos(light1.startAngle)
  const sin1_0 = Math.sin(light1.startAngle)
  const cos2_0 = Math.cos(light2.startAngle)
  const sin2_0 = Math.sin(light2.startAngle)
  return (t) => {
    const et = beat ? beatTime(t, beat) : t
    const angle1 = light1.startAngle + et * light1.speed * dir1
    const angle2 = light2.startAngle + et * light2.speed * dir2
    return {
      light1: {
        dx: (Math.cos(angle1) - cos1_0) * light1.radius,
        dy: (Math.sin(angle1) - sin1_0) * light1.radius,
      },
      light2: {
        dx: (Math.cos(angle2) - cos2_0) * light2.radius,
        dy: (Math.sin(angle2) - sin2_0) * light2.radius,
      },
    }
  }
}

export function gentleOrbit(radius: number, speed: number, beat?: BeatSignature): LightIdleAnimation {
  return (t) => {
    const et = beat ? beatTime(t, beat) : t
    return {
      light1: {
        dx: (Math.cos(et * speed) - 1) * radius,
        dy: Math.sin(et * speed) * radius,
      },
      light2: {
        dx: (Math.cos(et * speed + Math.PI) + 1) * radius,
        dy: Math.sin(et * speed + Math.PI) * radius,
      },
    }
  }
}

export function jitter(light1: JitterConfig, light2: JitterConfig, beat?: BeatSignature): LightIdleAnimation {
  return (t) => {
    const et = beat ? beatTime(t, beat) : t
    return {
      light1: {
        dx: 0,
        dy: Math.abs(Math.sin(et * light1.speed)) * light1.amplitude,
      },
      light2: {
        dx: 0,
        dy: Math.abs(Math.sin(et * light2.speed)) * light2.amplitude,
      },
    }
  }
}

export interface Figure8Config {
  width: number
  height: number
  speed: number
  phase?: number
}

export function figure8(light1: Figure8Config, light2: Figure8Config, beat?: BeatSignature): LightIdleAnimation {
  const p1 = light1.phase ?? 0
  const p2 = light2.phase ?? 0
  const dx1_0 = Math.sin(p1) * light1.width
  const dy1_0 = Math.sin(2 * p1) * 0.5 * light1.height
  const dx2_0 = Math.sin(p2) * light2.width
  const dy2_0 = Math.sin(2 * p2) * 0.5 * light2.height

  return (t) => {
    const et = beat ? beatTime(t, beat) : t
    const a1 = et * light1.speed + p1
    const a2 = et * light2.speed + p2
    return {
      light1: {
        dx: Math.sin(a1) * light1.width - dx1_0,
        dy: Math.sin(2 * a1) * 0.5 * light1.height - dy1_0,
      },
      light2: {
        dx: Math.sin(a2) * light2.width - dx2_0,
        dy: Math.sin(2 * a2) * 0.5 * light2.height - dy2_0,
      },
    }
  }
}

export function slowDrift(amplitude: number, speed: number, beat?: BeatSignature): LightIdleAnimation {
  return (t) => {
    const et = beat ? beatTime(t, beat) : t
    return {
      light1: { dx: Math.sin(et * speed) * amplitude, dy: Math.cos(et * speed * 0.7) * amplitude * 0.5 },
      light2: { dx: Math.cos(et * speed * 0.8) * amplitude * 0.5, dy: Math.sin(et * speed * 0.6) * amplitude },
    }
  }
}

export interface ScaledSineConfig {
  direction: 'horizontal' | 'vertical'
  distance: number
  duration: number
  amplitude: number
  frequency: number
  falloff: 'exponential' | 'linear'
}

function scaledSineFalloff(progress: number, falloff: 'exponential' | 'linear'): number {
  return falloff === 'exponential' ? Math.exp(-progress) : 1 / (1 + progress)
}

function scaledSineOffsets(cfg: ScaledSineConfig, t: number): { dx: number; dy: number } {
  const progress = Math.min(t / cfg.duration, 1)
  const primary = cfg.distance * (1 - Math.abs(2 * progress - 1))
  const perp = Math.sin(t * cfg.frequency) * cfg.amplitude * scaledSineFalloff(progress, cfg.falloff)

  return cfg.direction === 'vertical'
    ? { dx: perp, dy: primary }
    : { dx: primary, dy: perp }
}

export interface MoveToConfig {
  x: number
  y: number
  duration: number
}

export function moveTo(
  light1: MoveToConfig,
  light2: MoveToConfig,
  base: { light1: { x: number; y: number }; light2: { x: number; y: number } },
  beat?: BeatSignature,
): LightIdleAnimation {
  const dx1 = light1.x - base.light1.x
  const dy1 = light1.y - base.light1.y
  const dx2 = light2.x - base.light2.x
  const dy2 = light2.y - base.light2.y
  const adjDur1 = beat ? beatAdjustedDuration(light1.duration, beat) : light1.duration
  const adjDur2 = beat ? beatAdjustedDuration(light2.duration, beat) : light2.duration
  return (t) => {
    const et = beat ? beatTime(t, beat) : t
    const p1 = Math.max(0, Math.min(et / adjDur1, 1))
    const p2 = Math.max(0, Math.min(et / adjDur2, 1))
    return {
      light1: { dx: dx1 * p1, dy: dy1 * p1 },
      light2: { dx: dx2 * p2, dy: dy2 * p2 },
    }
  }
}

export type LightAnimationStep =
  | { start_time: number; animation: LightIdleAnimation }
  | { start_time: number; moveTo: { light1: MoveToConfig; light2: MoveToConfig; beat?: BeatSignature } }

export function lightAnimationSequence(
  base: { light1: { x: number; y: number }; light2: { x: number; y: number } },
  steps: LightAnimationStep[],
): LightAnimationKeyframe[] {
  const keyframes: LightAnimationKeyframe[] = []
  let accDx1 = 0, accDy1 = 0, accDx2 = 0, accDy2 = 0

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    let anim: LightIdleAnimation

    if ('moveTo' in step) {
      const curX1 = base.light1.x + accDx1
      const curY1 = base.light1.y + accDy1
      const curX2 = base.light2.x + accDx2
      const curY2 = base.light2.y + accDy2
      anim = moveTo(step.moveTo.light1, step.moveTo.light2, {
        light1: { x: curX1, y: curY1 },
        light2: { x: curX2, y: curY2 },
      }, step.moveTo.beat)
    } else {
      anim = step.animation
    }

    keyframes.push({ start_time: step.start_time, animation: anim })

    if (i < steps.length - 1) {
      const dur = steps[i + 1].start_time - step.start_time
      const o = anim(dur)
      accDx1 += o.light1.dx; accDy1 += o.light1.dy
      accDx2 += o.light2.dx; accDy2 += o.light2.dy
    }
  }

  return keyframes
}

export function scaledSine(
  light1: ScaledSineConfig,
  light2: ScaledSineConfig,
  beat?: BeatSignature,
): LightIdleAnimation {
  return (t) => {
    const et = beat ? beatTime(t, beat) : t
    return {
      light1: scaledSineOffsets(light1, et),
      light2: scaledSineOffsets(light2, et),
    }
  }
}
