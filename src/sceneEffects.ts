import * as THREE from 'three'
import type { SceneEffect } from './entries'

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
