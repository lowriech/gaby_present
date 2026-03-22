import { useRef, useMemo, Suspense, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from '../shaders/cloud.vert'
import fragmentShader from '../shaders/cloud.frag'
import { useScrollPosition } from '../hooks/useScrollPosition'
import { entries, sceneObjects } from '../entries'
import AnimatedSceneObject from './AnimatedSceneObject'

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

interface LightSnapshot {
  l1x: number; l1y: number; l1color: THREE.Color
  l2x: number; l2y: number; l2color: THREE.Color
}

function snapshotFromStep(index: number): LightSnapshot {
  const s = entries[index].background.lights
  return {
    l1x: s.light1.x, l1y: s.light1.y, l1color: new THREE.Color(s.light1.color),
    l2x: s.light2.x, l2y: s.light2.y, l2color: new THREE.Color(s.light2.color),
  }
}

function SmokeQuad({ scrollY }: { scrollY: number }) {
  const meshRef = useMemo(() => ({ current: null as THREE.Mesh | null }), [])
  const { viewport } = useThree()

  const anim = useRef({
    currentStep: 0,
    from: snapshotFromStep(0),
    to: snapshotFromStep(0),
    startTime: -1,
    duration: 0,
  })

  const step0 = entries[0].background.lights
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScrollY: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uLight1Pos: { value: new THREE.Vector2(step0.light1.x, step0.light1.y) },
      uLight2Pos: { value: new THREE.Vector2(step0.light2.x, step0.light2.y) },
      uLight1Color: { value: new THREE.Color(step0.light1.color) },
      uLight2Color: { value: new THREE.Color(step0.light2.color) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useFrame(({ clock, size }) => {
    const mat = meshRef.current?.material as THREE.ShaderMaterial | undefined
    if (!mat) return

    const elapsed = clock.getElapsedTime()
    const segments = entries.length - 1
    const targetStep = Math.min(Math.round(scrollY * segments), segments)
    const a = anim.current

    if (targetStep !== a.currentStep) {
      const l1 = mat.uniforms.uLight1Pos.value as THREE.Vector2
      const l2 = mat.uniforms.uLight2Pos.value as THREE.Vector2
      const centerY = size.height / size.width * 0.5

      a.from = {
        l1x: l1.x, l1y: l1.y / (centerY * 2),
        l1color: (mat.uniforms.uLight1Color.value as THREE.Color).clone(),
        l2x: l2.x, l2y: l2.y / (centerY * 2),
        l2color: (mat.uniforms.uLight2Color.value as THREE.Color).clone(),
      }
      a.to = snapshotFromStep(targetStep)
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

    const centerY = size.height / size.width * 0.5

    let baseL1x = a.from.l1x + (a.to.l1x - a.from.l1x) * t
    let baseL1y = a.from.l1y + (a.to.l1y - a.from.l1y) * t
    let baseL2x = a.from.l2x + (a.to.l2x - a.from.l2x) * t
    let baseL2y = a.from.l2y + (a.to.l2y - a.from.l2y) * t

    const idleT = Math.max(0, elapsed - (a.startTime + a.duration))
    const idleFn = entries[a.currentStep].background.lightAnimation
    if (idleT > 0 && idleFn) {
      const offsets = idleFn(idleT)
      baseL1x += offsets.light1.dx
      baseL1y += offsets.light1.dy
      baseL2x += offsets.light2.dx
      baseL2y += offsets.light2.dy
    }

    const l1 = mat.uniforms.uLight1Pos.value as THREE.Vector2
    l1.set(baseL1x, baseL1y * centerY * 2)

    const l2 = mat.uniforms.uLight2Pos.value as THREE.Vector2
    l2.set(baseL2x, baseL2y * centerY * 2)

    const c1 = mat.uniforms.uLight1Color.value as THREE.Color
    c1.copy(a.from.l1color).lerp(a.to.l1color, t)

    const c2 = mat.uniforms.uLight2Color.value as THREE.Color
    c2.copy(a.from.l2color).lerp(a.to.l2color, t)

    mat.uniforms.uTime.value = elapsed
    mat.uniforms.uScrollY.value = scrollY
    mat.uniforms.uResolution.value.set(size.width, size.height)
  })

  return (
    <mesh ref={(el) => { meshRef.current = el }}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  )
}

function ScenePointLights({ scrollY }: { scrollY: number }) {
  const light1Ref = useRef<THREE.PointLight>(null)
  const light2Ref = useRef<THREE.PointLight>(null)
  const light3Ref = useRef<THREE.PointLight>(null)
  const light4Ref = useRef<THREE.PointLight>(null)
  const { viewport } = useThree()

  const anim = useRef({
    currentStep: 0,
    from: snapshotFromStep(0),
    to: snapshotFromStep(0),
    startTime: -1,
    duration: 0,
  })

  useFrame(({ clock }) => {
    const l1 = light1Ref.current
    const l2 = light2Ref.current
    const l3 = light3Ref.current
    const l4 = light4Ref.current
    if (!l1 || !l2 || !l3 || !l4) return

    const elapsed = clock.getElapsedTime()
    const segments = entries.length - 1
    const targetStep = Math.min(Math.round(scrollY * segments), segments)
    const a = anim.current

    if (targetStep !== a.currentStep) {
      a.from = {
        l1x: l1.position.x / viewport.width + 0.5,
        l1y: l1.position.y / viewport.height + 0.5,
        l1color: l1.color.clone(),
        l2x: l2.position.x / viewport.width + 0.5,
        l2y: l2.position.y / viewport.height + 0.5,
        l2color: l2.color.clone(),
      }
      a.to = snapshotFromStep(targetStep)
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

    let cfgX1 = a.from.l1x + (a.to.l1x - a.from.l1x) * t
    let cfgY1 = a.from.l1y + (a.to.l1y - a.from.l1y) * t
    let cfgX2 = a.from.l2x + (a.to.l2x - a.from.l2x) * t
    let cfgY2 = a.from.l2y + (a.to.l2y - a.from.l2y) * t

    const idleT = Math.max(0, elapsed - (a.startTime + a.duration))
    const idleFn = entries[a.currentStep].background.lightAnimation
    if (idleT > 0 && idleFn) {
      const offsets = idleFn(idleT)
      cfgX1 += offsets.light1.dx
      cfgY1 += offsets.light1.dy
      cfgX2 += offsets.light2.dx
      cfgY2 += offsets.light2.dy
    }

    l1.position.set((cfgX1 - 0.5) * viewport.width, (cfgY1 - 0.5) * viewport.height, 0.5)
    l1.color.copy(a.from.l1color).lerp(a.to.l1color, t)

    l2.position.set((cfgX2 - 0.5) * viewport.width, (cfgY2 - 0.5) * viewport.height, 0.5)
    l2.color.copy(a.from.l2color).lerp(a.to.l2color, t)

    l3.position.set((cfgX1 - 0.5) * viewport.width, (cfgY1 - 0.5) * viewport.height, -8)
    l3.color.copy(l1.color)

    l4.position.set((cfgX2 - 0.5) * viewport.width, (cfgY2 - 0.5) * viewport.height, -8)
    l4.color.copy(l2.color)
  })

  return (
    <>
      <pointLight ref={light1Ref} intensity={2} distance={8} />
      <pointLight ref={light2Ref} intensity={2} distance={8} />
      <pointLight ref={light3Ref} intensity={200} distance={20} />
      <pointLight ref={light4Ref} intensity={200} distance={20} />
    </>
  )
}

interface CloudBackgroundProps {
  containerRef: RefObject<HTMLDivElement | null>
}

export default function CloudBackground({ containerRef }: CloudBackgroundProps) {
  const scrollY = useScrollPosition(containerRef)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ pointerEvents: 'none' }}
      >
        <SmokeQuad scrollY={scrollY} />
        <ambientLight intensity={0.3} />
        <ScenePointLights scrollY={scrollY} />
        <Suspense fallback={null}>
          {sceneObjects.map((obj) => (
            <AnimatedSceneObject
              key={obj.id}
              objectId={obj.id}
              meshPath={obj.meshPath}
              scrollY={scrollY}
            />
          ))}
        </Suspense>
      </Canvas>
    </div>
  )
}
