import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import { entries, resolveObjectState } from '../entries'
import type { Vec3, ResolvedObjectState } from '../entries'

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function lerpVec3(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3 {
  out[0] = a[0] + (b[0] - a[0]) * t
  out[1] = a[1] + (b[1] - a[1]) * t
  out[2] = a[2] + (b[2] - a[2]) * t
  return out
}

interface AnimatedSceneObjectProps {
  objectId: string
  meshPath: string
  scrollY: number
}

export default function AnimatedSceneObject({ objectId, meshPath, scrollY }: AnimatedSceneObjectProps) {
  const gltf = useLoader(GLTFLoader, meshPath)
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf])
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene)
      for (const clip of gltf.animations) {
        mixer.clipAction(clip).play()
      }
      mixerRef.current = mixer
      return () => {
        mixer.stopAllAction()
        mixerRef.current = null
      }
    }
  }, [gltf, scene])

  const anim = useRef({
    currentStep: 0,
    from: resolveObjectState(objectId, 0),
    to: resolveObjectState(objectId, 0),
    startTime: -1,
    duration: 0,
  })

  const scratch: { pos: Vec3; rot: Vec3; scl: Vec3 } = useMemo(() => ({
    pos: [0, 0, 0],
    rot: [0, 0, 0],
    scl: [1, 1, 1],
  }), [])

  useFrame(({ clock }, delta) => {
    mixerRef.current?.update(delta)

    const group = groupRef.current
    if (!group) return

    const elapsed = clock.getElapsedTime()
    const segments = entries.length - 1
    const targetStep = Math.min(Math.round(scrollY * segments), segments)
    const a = anim.current

    if (targetStep !== a.currentStep) {
      a.from = snapshotCurrent(group)
      a.to = resolveObjectState(objectId, targetStep)
      a.startTime = elapsed
      a.duration = entries[targetStep].background.animationTime
      a.currentStep = targetStep
    }

    let t: number
    if (a.duration <= 0) {
      t = 1
    } else {
      t = smoothstep(Math.min((elapsed - a.startTime) / a.duration, 1))
    }

    lerpVec3(scratch.pos, a.from.position, a.to.position, t)
    lerpVec3(scratch.rot, a.from.rotation, a.to.rotation, t)
    lerpVec3(scratch.scl, a.from.scale, a.to.scale, t)

    group.position.set(scratch.pos[0], scratch.pos[1], scratch.pos[2])
    group.rotation.set(scratch.rot[0], scratch.rot[1], scratch.rot[2])
    group.scale.set(scratch.scl[0], scratch.scl[1], scratch.scl[2])

    const visTarget = a.to.visible
    group.visible = t < 1 ? a.from.visible || visTarget : visTarget
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

function snapshotCurrent(group: THREE.Group): ResolvedObjectState {
  return {
    position: [group.position.x, group.position.y, group.position.z],
    rotation: [group.rotation.x, group.rotation.y, group.rotation.z],
    scale: [group.scale.x, group.scale.y, group.scale.z],
    visible: group.visible,
  }
}
