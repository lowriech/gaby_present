import * as THREE from 'three'
import type { SceneEffect } from './entries'
import { gentleOrbit } from './lightAnimations'
import type { LightIdleAnimation } from './entries'

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
