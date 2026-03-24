import * as THREE from 'three'
import type { SceneEffect } from './entries'
import { gentleOrbit } from './lightAnimations'
import type { LightIdleAnimation } from './entries'

// ---------------------------------------------------------------------------
// messageEffect types and store
// ---------------------------------------------------------------------------

export interface MessagePulse {
  /** Seconds after effect activation when the pulse begins travelling */
  startSec: number
  /** Seconds after effect activation when the pulse finishes travelling */
  endSec: number
  /** forward = light1 → light2, reverse = light2 → light1 */
  direction: 'forward' | 'reverse'
}

export interface MessageEffectConfig {
  /** Fraction of arc (0–1) the pulse segment occupies, e.g. 0.15 */
  arcLength: number
  /** Perpendicular offset of bezier control point in shader-UV units (default 0.1) */
  arcCurvature?: number
  /** Base arc line colour (default white) */
  arcColor?: THREE.ColorRepresentation
  /** Base arc line intensity (default 0.15) */
  arcIntensity?: number
  /** Glow sigma in UV units (default 0.004) */
  arcWidth?: number
  /** Pulse colour (default white) */
  pulseColor?: THREE.ColorRepresentation
  /** Peak pulse glow intensity (default 1.0) */
  pulseIntensity?: number
  pulses: MessagePulse[]
}

export const MAX_SHADER_PULSES = 8

export interface ActivePulse {
  /** Current t-value [0,1] along the arc */
  center: number
  /** Half of arcLength */
  halfLength: number
  color: THREE.Color
  intensity: number
}

export interface MessageEffectState {
  active: boolean
  arcCurvature: number
  arcColor: THREE.Color
  arcWidth: number
  arcIntensity: number
  pulses: ActivePulse[]
}

export const messageEffectStore: MessageEffectState = {
  active: false,
  arcCurvature: 0.1,
  arcColor: new THREE.Color(0xffffff),
  arcWidth: 0.004,
  arcIntensity: 0.15,
  pulses: [],
}

/**
 * Build a scene effect that adds one Object3D on entry and removes it on leave.
 * The object instance is retained between enters unless cleanup runs.
 */
export function objectEffect(factory: () => THREE.Object3D): SceneEffect {
  let object: THREE.Object3D | null = null

  return {
    addToScene(scene) {
      if (!object) object = factory()
      if (object.parent !== scene) {
        scene.add(object)
      }
    },
    cleanup(scene) {
      if (!object) return
      if (object.parent === scene) {
        scene.remove(object)
      }
    },
  }
}

/**
 * Compose multiple effects into one.
 */
export function combineSceneEffects(...effects: SceneEffect[]): SceneEffect {
  return {
    addToScene(scene) {
      for (const effect of effects) {
        effect.addToScene?.(scene)
      }
    },
    cleanup(scene) {
      for (let i = effects.length - 1; i >= 0; i--) {
        effects[i].cleanup?.(scene)
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Shared extra-lights store — written by backgroundLights, read by SmokeQuad
// ---------------------------------------------------------------------------

export interface ExtraLight {
  x: number
  y: number
  r: number
  g: number
  b: number
  intensity: number
}

export const extraLightsStore: ExtraLight[] = []

// ---------------------------------------------------------------------------

export interface BackgroundLightsConfig {
  count: number
  radiusMin: number
  radiusMax: number
  speedMin: number
  speedMax: number
  intensity: number
  fadeDurationSec: number
  color?: THREE.ColorRepresentation
}

function rand(min: number, max: number): number {
  return min + (max - min) * Math.random()
}

interface InternalLightState {
  storeEntry: ExtraLight
  orbit: LightIdleAnimation
  phase: number
  baseX: number
  baseY: number
}

export function backgroundLights(config: BackgroundLightsConfig): SceneEffect {
  const {
    count, radiusMin, radiusMax, speedMin, speedMax,
    intensity, fadeDurationSec,
    color: colorInput = 0xffffff,
  } = config
  const color = new THREE.Color(colorInput)

  let internal: InternalLightState[] = []
  let animFrameId: number | null = null
  let fadeFrameId: number | null = null
  let animStart: number | null = null

  function stopAnim() {
    if (animFrameId != null) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
  }

  function stopFade() {
    if (fadeFrameId != null) {
      cancelAnimationFrame(fadeFrameId)
      fadeFrameId = null
    }
  }

  function animate() {
    if (animStart == null) animStart = performance.now()
    const t = (performance.now() - animStart) / 1000

    for (const ls of internal) {
      const offsets = ls.orbit(t + ls.phase)
      ls.storeEntry.x = ls.baseX + offsets.light1.dx
      ls.storeEntry.y = ls.baseY + offsets.light1.dy
    }

    animFrameId = requestAnimationFrame(animate)
  }

  function removeFromStore() {
    for (const ls of internal) {
      const idx = extraLightsStore.indexOf(ls.storeEntry)
      if (idx !== -1) extraLightsStore.splice(idx, 1)
    }
    internal = []
  }

  function fadeIn() {
    if (fadeDurationSec <= 0) {
      for (const ls of internal) ls.storeEntry.intensity = intensity
      return
    }

    const fadeStart = performance.now()
    const fadeDurationMs = fadeDurationSec * 1000

    function step() {
      const elapsed = performance.now() - fadeStart
      const t = Math.min(elapsed / fadeDurationMs, 1)

      for (const ls of internal) {
        ls.storeEntry.intensity = intensity * t
      }

      if (t < 1) {
        fadeFrameId = requestAnimationFrame(step)
      } else {
        fadeFrameId = null
      }
    }

    step()
  }

  return {
    addToScene() {
      stopFade()

      if (internal.length === 0) {
        for (let i = 0; i < count; i++) {
          const r = rand(radiusMin, radiusMax)
          const s = rand(speedMin, speedMax)

          const storeEntry: ExtraLight = {
            x: 0, y: 0,
            r: color.r, g: color.g, b: color.b,
            intensity: 0,
          }
          extraLightsStore.push(storeEntry)

          internal.push({
            storeEntry,
            orbit: gentleOrbit(r, s),
            phase: Math.random() * Math.PI * 2,
            baseX: rand(0, 1.5),
            baseY: rand(0, 1.5),
          })
        }
      } else {
        for (const ls of internal) {
          ls.storeEntry.intensity = 0
          if (!extraLightsStore.includes(ls.storeEntry)) {
            extraLightsStore.push(ls.storeEntry)
          }
        }
      }

      stopAnim()
      animStart = null
      animate()
      fadeIn()
    },

    cleanup() {
      stopAnim()
      stopFade()

      if (internal.length === 0) return

      if (fadeDurationSec <= 0) {
        removeFromStore()
        animStart = null
        return
      }

      const fadeStart = performance.now()
      const fadeDurationMs = fadeDurationSec * 1000
      const startIntensities = internal.map(ls => ls.storeEntry.intensity)

      function step() {
        const elapsed = performance.now() - fadeStart
        const t = Math.min(elapsed / fadeDurationMs, 1)

        for (let i = 0; i < internal.length; i++) {
          internal[i].storeEntry.intensity = startIntensities[i] * (1 - t)
        }

        if (t < 1) {
          fadeFrameId = requestAnimationFrame(step)
        } else {
          removeFromStore()
          animStart = null
          fadeFrameId = null
        }
      }

      step()
    },
  }
}

// ---------------------------------------------------------------------------
// sparkleLights — random-colored orbiting lights with staggered fade-in
// ---------------------------------------------------------------------------

export interface SparkleLightsConfig {
  count: number
  radiusMin: number
  radiusMax: number
  speedMin: number
  speedMax: number
  intensity: number
  fadeDurationSec: number
  /** Seconds over which all lights stagger their individual fade-ins */
  populateTime: number
}

interface SparkleInternalState {
  storeEntry: ExtraLight
  orbit: LightIdleAnimation
  phase: number
  baseX: number
  baseY: number
  /** Milliseconds after animStart when this light begins fading in */
  delayMs: number
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

export function sparkleLights(config: SparkleLightsConfig): SceneEffect {
  const {
    count, radiusMin, radiusMax, speedMin, speedMax,
    intensity, fadeDurationSec, populateTime,
  } = config

  const fadeDurationMs = fadeDurationSec * 1000

  let internal: SparkleInternalState[] = []
  let animFrameId: number | null = null
  let fadeFrameId: number | null = null
  let animStart: number | null = null

  function stopAnim() {
    if (animFrameId != null) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
  }

  function stopFade() {
    if (fadeFrameId != null) {
      cancelAnimationFrame(fadeFrameId)
      fadeFrameId = null
    }
  }

  function animate() {
    if (animStart == null) animStart = performance.now()
    const elapsed = performance.now() - animStart

    for (const ls of internal) {
      const t = elapsed / 1000
      const offsets = ls.orbit(t + ls.phase)
      ls.storeEntry.x = ls.baseX + offsets.light1.dx
      ls.storeEntry.y = ls.baseY + offsets.light1.dy

      if (fadeDurationMs > 0) {
        const fadeProgress = clamp((elapsed - ls.delayMs) / fadeDurationMs, 0, 1)
        ls.storeEntry.intensity = intensity * fadeProgress
      } else {
        ls.storeEntry.intensity = elapsed >= ls.delayMs ? intensity : 0
      }
    }

    animFrameId = requestAnimationFrame(animate)
  }

  function removeFromStore() {
    for (const ls of internal) {
      const idx = extraLightsStore.indexOf(ls.storeEntry)
      if (idx !== -1) extraLightsStore.splice(idx, 1)
    }
    internal = []
  }

  return {
    addToScene() {
      stopFade()

      if (internal.length === 0) {
        for (let i = 0; i < count; i++) {
          const color = new THREE.Color().setHSL(Math.random(), 1, 0.7)
          const r = rand(radiusMin, radiusMax)
          const s = rand(speedMin, speedMax)

          const storeEntry: ExtraLight = {
            x: 0, y: 0,
            r: color.r, g: color.g, b: color.b,
            intensity: 0,
          }
          extraLightsStore.push(storeEntry)

          internal.push({
            storeEntry,
            orbit: gentleOrbit(r, s),
            phase: Math.random() * Math.PI * 2,
            baseX: rand(0, 1.5),
            baseY: rand(0, 1.5),
            delayMs: Math.random() * populateTime * 1000,
          })
        }
      } else {
        for (const ls of internal) {
          ls.storeEntry.intensity = 0
          ls.delayMs = Math.random() * populateTime * 1000
          if (!extraLightsStore.includes(ls.storeEntry)) {
            extraLightsStore.push(ls.storeEntry)
          }
        }
      }

      stopAnim()
      animStart = null
      animate()
    },

    cleanup() {
      stopAnim()
      stopFade()

      if (internal.length === 0) return

      if (fadeDurationMs <= 0) {
        removeFromStore()
        animStart = null
        return
      }

      const fadeStart = performance.now()
      const startIntensities = internal.map(ls => ls.storeEntry.intensity)

      function step() {
        const elapsed = performance.now() - fadeStart
        const t = Math.min(elapsed / fadeDurationMs, 1)

        for (let i = 0; i < internal.length; i++) {
          internal[i].storeEntry.intensity = startIntensities[i] * (1 - t)
        }

        if (t < 1) {
          fadeFrameId = requestAnimationFrame(step)
        } else {
          removeFromStore()
          animStart = null
          fadeFrameId = null
        }
      }

      step()
    },
  }
}

// ---------------------------------------------------------------------------
// messageEffect — arc + pulse animation between the two scene lights
// ---------------------------------------------------------------------------

export function messageEffect(config: MessageEffectConfig): SceneEffect {
  const {
    arcLength,
    arcCurvature = 0.1,
    arcColor: arcColorInput = 0xffffff,
    arcIntensity = 0.15,
    arcWidth = 0.004,
    pulseColor: pulseColorInput = 0xffffff,
    pulseIntensity = 1.0,
    pulses: pulseConfigs,
  } = config

  const arcColor = new THREE.Color(arcColorInput)
  const pulseColor = new THREE.Color(pulseColorInput)
  const halfLength = arcLength / 2

  let rafId: number | null = null
  let effectStart: number | null = null

  function stopRaf() {
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function tick() {
    if (effectStart == null) effectStart = performance.now()
    const elapsed = (performance.now() - effectStart) / 1000

    const activePulses: ActivePulse[] = []

    for (const p of pulseConfigs) {
      if (activePulses.length >= MAX_SHADER_PULSES) break

      const dur = p.endSec - p.startSec
      if (dur <= 0) continue

      // Only draw while the pulse is actively travelling
      if (elapsed < p.startSec || elapsed > p.endSec) continue

      const progress = (elapsed - p.startSec) / dur
      const center = p.direction === 'forward' ? progress : 1 - progress

      activePulses.push({ center, halfLength, color: pulseColor, intensity: pulseIntensity })
    }

    messageEffectStore.pulses = activePulses
    rafId = requestAnimationFrame(tick)
  }

  return {
    addToScene() {
      messageEffectStore.active = true
      messageEffectStore.arcCurvature = arcCurvature
      messageEffectStore.arcColor.copy(arcColor)
      messageEffectStore.arcWidth = arcWidth
      messageEffectStore.arcIntensity = arcIntensity
      messageEffectStore.pulses = []

      stopRaf()
      effectStart = null
      tick()
    },

    cleanup() {
      stopRaf()
      messageEffectStore.active = false
      messageEffectStore.pulses = []
      effectStart = null
    },
  }
}
