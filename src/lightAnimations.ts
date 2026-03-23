import type { LightIdleAnimation } from './entries'

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

export function circle(light1: CircleConfig, light2: CircleConfig): LightIdleAnimation {
  const dir1 = light1.clockwise ? -1 : 1
  const dir2 = light2.clockwise ? -1 : 1
  const cos1_0 = Math.cos(light1.startAngle)
  const sin1_0 = Math.sin(light1.startAngle)
  const cos2_0 = Math.cos(light2.startAngle)
  const sin2_0 = Math.sin(light2.startAngle)
  return (t) => {
    const angle1 = light1.startAngle + t * light1.speed * dir1
    const angle2 = light2.startAngle + t * light2.speed * dir2
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

export function gentleOrbit(radius: number, speed: number): LightIdleAnimation {
  return (t) => ({
    light1: {
      dx: (Math.cos(t * speed) - 1) * radius,
      dy: Math.sin(t * speed) * radius,
    },
    light2: {
      dx: (Math.cos(t * speed + Math.PI) + 1) * radius,
      dy: Math.sin(t * speed + Math.PI) * radius,
    },
  })
}

export function jitter(light1: JitterConfig, light2: JitterConfig): LightIdleAnimation {
  return (t) => ({
    light1: {
      dx: 0,
      dy: Math.abs(Math.sin(t * light1.speed)) * light1.amplitude,
    },
    light2: {
      dx: 0,
      dy: Math.abs(Math.sin(t * light2.speed)) * light2.amplitude,
    },
  })
}

export interface Figure8Config {
  width: number
  height: number
  speed: number
  phase?: number
}

export function figure8(light1: Figure8Config, light2: Figure8Config): LightIdleAnimation {
  const p1 = light1.phase ?? 0
  const p2 = light2.phase ?? 0
  const dx1_0 = Math.sin(p1) * light1.width
  const dy1_0 = Math.sin(2 * p1) * 0.5 * light1.height
  const dx2_0 = Math.sin(p2) * light2.width
  const dy2_0 = Math.sin(2 * p2) * 0.5 * light2.height

  return (t) => {
    const a1 = t * light1.speed + p1
    const a2 = t * light2.speed + p2
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

export function slowDrift(amplitude: number, speed: number): LightIdleAnimation {
  return (t) => ({
    light1: { dx: Math.sin(t * speed) * amplitude, dy: Math.cos(t * speed * 0.7) * amplitude * 0.5 },
    light2: { dx: Math.cos(t * speed * 0.8) * amplitude * 0.5, dy: Math.sin(t * speed * 0.6) * amplitude },
  })
}
