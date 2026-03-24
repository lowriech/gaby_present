import { gentleOrbit, circle, jitter, figure8 } from './lightAnimations'
import type { Scene } from 'three'
import { backgroundLights, messageEffect, sparkleLights } from './sceneEffects'

export type Vec3 = [number, number, number]

export type LightConfig = {
  light1: { x: number; y: number; color: string }
  light2: { x: number; y: number; color: string }
}

export type ObjectKeyframe = {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3 | number
  visible?: boolean
}

export type SceneObjectStates = Record<string, ObjectKeyframe>

export type SceneObjectDef = {
  id: string
  meshPath: string
  defaults: Required<Omit<ObjectKeyframe, 'scale'>> & { scale: Vec3 }
}

export type ResolvedObjectState = {
  position: Vec3
  rotation: Vec3
  scale: Vec3
  visible: boolean
}

export type Foreground =
  | { type: 'message'; text: string; revealDuration: number }
  | { type: 'picture'; src: string; caption?: string }
  | { type: 'none' }

export type LightIdleAnimation = (t: number) => {
  light1: { dx: number; dy: number }
  light2: { dx: number; dy: number }
}

export type Background = {
  color: string
  lights: LightConfig
  /** Seconds to animate into this step from the previous one */
  animationTime: number
  objects?: SceneObjectStates
  lightAnimation?: LightIdleAnimation
}

export type SceneEffect = {
  addToScene?: (scene: Scene) => void
  cleanup?: (scene: Scene) => void
}

export type ImageClip = {
  src: string
  /** Screen position as CSS values, e.g. `{ x: '50%', y: '50%' }` */
  position: { x: string; y: string }
  /** Seconds after entry activation to begin fading in */
  startTime: number
  /** Seconds after entry activation to begin fading out */
  endTime: number
  width?: string
  /** Uniform scale applied to the image. Defaults to 1. */
  scale?: number
}

export type ForegroundAnimation =
  | {
      type: 'imageSequence'
      clips: ImageClip[]
      /**
       * How far above the anchor point to float the image, as a CSS length.
       * e.g. `'10vh'`, `'50px'`. Defaults to `'0px'` (bottom of image sits on
       * the anchor point).
       */
      verticalOffset?: string
    }

export type ScrollEntry = {
  foreground?: Foreground
  foregroundAnimation?: ForegroundAnimation
  background: Background
  audio?: { src: string }
  spotify?: { trackId: string } | 'none'
  sceneEffect?: SceneEffect
  /** Seconds to wait before automatically scrolling to the next entry */
  autoScrollDelay?: number
}

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

const entryText = `
Wonderful Gaby,\n
I made this as a little way of capturing the joy of being with you.\n
It turned out a little more like Spotify Wrapped than I wanted.\n
But I hope you enjoy it ❤️
`

const secondEntry = {
  type: 'message',
  text: `
You are an absolute light.\n
And every day, I'm excited to be in your life.
`,
  revealDuration: 3000,
} as Foreground

const MFC = {
  type: 'message',
  text: `
This first scene represents connecting with you at MFC.
`,
  revealDuration: 3000,
} as Foreground

const Bergen = {
  type: "picture",
  src: withBase("images/bergen.jpeg"),
  caption: `I went off to Bergen,\n
  and had so much fun and ease messaging with you.
  `,
} as Foreground

const FirstDate = {
  type: "picture",
  src: withBase("images/text.png"),
  caption: `
  Palpable Excitement
  `,
  revealDuration: 3000,
} as Foreground

const SafariText = {
  type: "message",
  text: `
  Ohhh noooo... Not my rump!
  `,  
  revealDuration: 500,
} as Foreground

const Dating = {
  type: "picture",
  src: withBase("images/canoe.jpeg"),
  revealDuration: 800,
} as Foreground

const Swing = {
  type: "picture",
  src: withBase("images/swing.jpeg"),
  revealDuration: 800,
} as Foreground

const HotInLove = {
  type: "picture",
  src: withBase("images/hot_in_love.jpeg"),
  caption: `
  So Hot. So In Love..
  `,
  revealDuration: 3000,
} as Foreground

const FireTender = {
  type: "picture",
  src: withBase("images/fire_tender.jpeg"),
  caption: `
  A fucking adorable.
  Collaborative.
  Lil Fire Tender.
  `,
  revealDuration: 3000,
} as Foreground

const ClosingMessage = {
  type: "message",
  text: `
  I absolutely adore you.\n
  Thanks for doing life with me.\n
  The highs and lows, I'm so down.
  `,
  revealDuration: 3000,
} as Foreground

export const sceneObjects: SceneObjectDef[] = [
  {
    id: 'trees1',
    meshPath: withBase('meshes/pine_tree.glb'),
    defaults: {
      position: [-10, -10, -10],
      rotation: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      visible: true,
    },
  },
  {
    id: 'trees2',
    meshPath: withBase('meshes/pine_tree.glb'),
    defaults: {
      position: [10, -10, -10],
      rotation: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      visible: true,
    },
  },
  {
    id: 'manta',
    meshPath: withBase('meshes/manta.glb'),
    defaults: {
      position: [10, -100, 10],
      rotation: [0, 1, 0],
      scale: [0.05, 0.05, 0.05],
      visible: true,
    },
  },
  {
    id: 'blackberry',
    meshPath: withBase('meshes/blackberries.glb'),
    defaults: {
      position: [2, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      visible: true,
    },
  },
  {
    id: "zebra",
    meshPath: withBase('meshes/zebra.glb'),
    defaults: {
      position: [-10, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      visible: true,
    },
  },
  {
    id: "mud",
    meshPath: withBase('meshes/mud_material.glb'),
    defaults: {
      position: [0, -100, 0],
      rotation: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      visible: true,
    },
  },
]

const backgroundLightsEffect = backgroundLights({ count: 50, radiusMin: 0.01, radiusMax: 0.02, speedMin: 1, speedMax: 2, intensity: 0.025, fadeDurationSec: 1 })

export const entries: ScrollEntry[] = [
  {
    foreground: { type: 'message', text: entryText, revealDuration: 3000 },
    spotify: { trackId: '6IzBZ2pexrY2BI9D1OeUvI' },
    background: {
      color: '#e8a44a',
      animationTime: 0,
      lights: { light1: { x: -0.1, y: 0.5, color: '#e8a44a' }, light2: { x: 0.85, y: 0.5, color: '#a44ae8' } },
      objects: {
        trees1: { position: [-10, -10, -10], rotation: [0, 0.2, 0], scale: 0.1 },
        trees2: { position: [10, -10, -10], rotation: [0, -0.2, 0], scale: 0.1 },
      },
    },
  },
  {
    foreground: secondEntry,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.6, y: 0.6, color: '#e8a44a' }, light2: { x: 0.8, y: 0.8, color: '#a44ae8' } },
      lightAnimation: gentleOrbit(0.05, 0.4),
      objects: {
        manta: { position: [10, -100, 10], rotation: [0, 1, 0], scale: [0.05, 0.05, 0.05] },
        trees1: { position: [-10, -10, -2], rotation: [0, -0.3, 0] },
        trees2: { position: [10, -10, -2], rotation: [0, -0.3, 0] },
      },
    },
  },
  {
    spotify: { trackId: '6xiTXiZhECholKGfvDormV' },
    autoScrollDelay: 5,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.6, y: 0.6, color: '#e8a44a' }, light2: { x: 0.8, y: 0.8, color: '#a44ae8' } },
      lightAnimation: gentleOrbit(0.05, 2),
      objects: {
        trees1: { position: [-10, -10, -2], rotation: [0, -0.3, 0] },
        trees2: { position: [10, -10, -2], rotation: [0, -0.3, 0] },
      },
    },
    sceneEffect: {
      addToScene: backgroundLightsEffect.addToScene,
    },
  },

  {
    autoScrollDelay: 10,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.74, y: 0.75, color: '#e8a44a' }, light2: { x: 0.76, y: 0.75, color: '#a44ae8' } },
      lightAnimation: figure8(
        { width: 0.21, height: 0.15, speed: 0.3, beat: 0.5 }, 
        { width: 0.21, height: 0.15, speed: 0.3, beat: 0.5 }
      ),
      objects: {
        trees1: { position: [-10, -10, 2], rotation: [0, -0.3, 0] },
        trees2: { position: [10, -10, 2], rotation: [0, -0.3, 0] },
      },
    },
    sceneEffect: {
      cleanup: backgroundLightsEffect.cleanup,
    },
  },
  {
    autoScrollDelay: 50,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.3, y: 0.5, color: '#e8a44a' }, light2: { x: 1.2, y: 0.5, color: '#a44ae8' } },
      objects: {
        trees1: { position: [-10, -10, 10], rotation: [0, -0.3, 0] },
        trees2: { position: [10, -10, 10], rotation: [0, -0.3, 0] },
      }
    },
    foregroundAnimation: {
      type: 'imageSequence',
      clips: [
        { src: withBase("images/whatsapp/wa1.jpg"), scale: 0.8, position: { x: '70%', y: '50%' }, startTime: 5.1, endTime: 9.5, width: '30%' },
        { src: withBase("images/whatsapp/wa2.jpg"), position: { x: '30%', y: '50%' }, startTime: 11.1, endTime: 15.5, width: '30%' },
        { src: withBase("images/whatsapp/wa3.jpg"), position: { x: '70%', y: '50%' }, startTime: 17.1, endTime: 21.5, width: '30%' },
        { src: withBase("images/whatsapp/wa4.jpg"), position: { x: '30%', y: '50%' }, startTime: 23.1, endTime: 27.5, width: '30%' },
        { src: withBase("images/whatsapp/wa5.jpg"), position: { x: '70%', y: '50%' }, startTime: 29.1, endTime: 33.5, width: '30%' },
        { src: withBase("images/whatsapp/wa6.jpg"), position: { x: '30%', y: '50%' }, startTime: 35.1, endTime: 39.5, width: '30%' },
        { src: withBase("images/whatsapp/wa7.jpg"), position: { x: '70%', y: '50%' }, startTime: 41.1, endTime: 45.5, width: '30%' },
      ],
    },
    sceneEffect: messageEffect({
      arcLength: 0.18,
      arcCurvature: 0.1,
      arcColor: 0xffffff,
      arcIntensity: 0.12,
      arcWidth: 0.004,
      pulseColor: 0xffffff,
      pulseIntensity: 1.8,
      pulses: [
        { startSec:  4, endSec:  5, direction: 'forward'  }, // wa1 — opens the chat
        { startSec:  10, endSec:  11, direction: 'reverse'  }, // wa2 — reply
        { startSec:  16, endSec:  17, direction: 'forward'  }, // wa3
        { startSec: 22, endSec: 23, direction: 'reverse'  }, // wa4 — reply
        { startSec: 28, endSec: 29, direction: 'forward'  }, // wa5
        { startSec: 34, endSec: 35, direction: 'reverse'  }, // wa6 — reply
        { startSec: 40, endSec: 41, direction: 'forward'  }, // wa7 — final message
      ],
    })
  },
  {
    spotify: "none",
    foreground: FirstDate,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.75, y: 0.5, color: '#e8a44a' }, light2: { x: 0.75, y: 1.0, color: '#a44ae8' } },
      lightAnimation: jitter({ speed: 10, amplitude: 0.025 }, { speed: 0, amplitude: 0 }),
    },
  },
  {
    spotify: { trackId: '0IIxiwinMqP0dpxbVyOU1y' },
    autoScrollDelay: 10,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.5, y: 0.5, color: '#ff69b4' }, light2: { x: 1, y: 0.5, color: '#e8a44a' } },
      lightAnimation: gentleOrbit(0.01, 1),
    },
  },
  // Blackberry
  {
    autoScrollDelay: 10,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.5, y: 0.5, color: '#ff69b4' }, light2: { x: 1, y: 0.5, color: '#e8a44a' } },
      lightAnimation: gentleOrbit(0.01, 1.5),
      objects: {
        blackberry: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [0.05, 0.05, 0.05] },
      },
    },
  },
  {
    spotify: { trackId: '1Rp2JzlulJtdD9ukeZIWon' },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.74, y: 0.8, color: '#ff69b4' }, light2: { x: 0.76, y: 0.8, color: '#e8a44a' } },
      lightAnimation: circle(
        { startAngle: 0, clockwise: true, radius: 0.02, speed: 1.2 },
        { startAngle: 0, clockwise: true, radius: 0.02, speed: 1.2 },
      ),
      objects: {
        blackberry: { position: [-10, 0, 0], rotation: [0, 0, 0], scale: [0.05, 0.05, 0.05] },
        mud: { position: [0, -1, 0], rotation: [0, 0, 0], scale: [0.05, 0.05, 0.05] },
      },
    },
  },
  // Zebra
  {
    foreground: SafariText,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.5, y: 0.5, color: '#ff69b4' }, light2: { x: 1, y: 0.5, color: '#e8a44a' } },
      lightAnimation: gentleOrbit(0.01, 1.5),
      objects: {
        zebra: { position: [0, -0.15, 0], rotation: [0, 0, 0], scale: [0.05, 0.05, 0.05] },
        mud: { position: [0, -100, 0], rotation: [0, 0, 0], scale: [0.05, 0.05, 0.05] },
      },
    },
  },
  {
    spotify: { trackId: '0gGSxG7r332R7Vgvk24GHY' },
    foreground: Dating,
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.45, y: 0.75, color: '#ff69b4' }, light2: { x: 1.05, y: 0.75, color: '#e8a44a' } },
      lightAnimation: circle(
        { startAngle: Math.PI, clockwise: true, radius: 0.3, speed: 0.8 }, 
        { startAngle: 0, clockwise: true, radius: 0.3, speed: 0.8 }
      ),
      objects: {
        zebra: { position: [-10, 0, 0], rotation: [0, 0, 0], scale: [0.0008, 0.0008, 0.0008] },
      },
    },
  },
  {
    foreground: Swing,
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.5, y: 0.75, color: '#ff69b4' }, light2: { x: 1, y: 0.75, color: '#e8a44a' } },
      lightAnimation: circle(
        { startAngle: Math.PI, clockwise: true, radius: 0.3, speed: 0.8 }, 
        { startAngle: 0, clockwise: true, radius: 0.3, speed: 0.8 }
      ),
    },
  },
  {
    autoScrollDelay: 10,
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
      lightAnimation: circle(
        { startAngle: Math.PI, clockwise: true, radius: 0.3, speed: 0.8 }, 
        { startAngle: 0, clockwise: true, radius: 0.3, speed: 0.8 }
      ),
    },
  },
  {
    spotify: { trackId: '3FjHWRfmNNYClBLZVtQAYT' },
    foreground: HotInLove,
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
    },
  },
  {
    foreground: FireTender,
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
    },
  },
  {
    foreground: { type: 'picture', src: withBase("images/desk.jpeg") },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
    },
  },
  {
    foreground: { type: 'picture', src: withBase("images/wood_porch.jpeg"), caption: "Hawt" },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
    },
  },

  {
    spotify: { trackId: '2Nm0IGkliIwWjSBINf3KjG' },
    foreground: { type: 'picture', src: withBase("images/xc.jpeg"), caption: "More please." },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
    },
  },
  {
    foreground: { type: "picture", src: withBase("images/wood_with_ash.jpeg") },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.25, y: 0.75, color: '#ff69b4' }, light2: { x: 1.25, y: 0.75, color: '#e8a44a' } },
    },
    sceneEffect: sparkleLights({
      count: 60,
      radiusMin: 0.01,
      radiusMax: 0.02,
      speedMin: 1,
      speedMax: 2,
      intensity: 0.5,
      fadeDurationSec: 1,
      populateTime: 10,
    }),
    foregroundAnimation: {
      type: 'imageSequence',
      verticalOffset: '8px',
      clips: [
        {
          src: withBase('images/friends/ankle1.jpeg'),
          position: { x: '12%', y: '48%' },
          width: '20vw',
          startTime: 0.4,
          endTime: 60,
        },
        {
          src: withBase('images/friends/ankle2.jpeg'),
          position: { x: '30%', y: '55%' },
          width: '18vw',
          startTime: 0.4,
          endTime: 60,
        },
        {
          src: withBase('images/friends/bday.jpeg'),
          position: { x: '87%', y: '44%' },
          width: '20vw',
          startTime: 0.9,
          endTime: 60,
        },
        {
          src: withBase('images/friends/olivia.jpeg'),
          position: { x: '16%', y: '88%' },
          width: '19vw',
          startTime: 1.4,
          endTime: 60,
        },
        {
          src: withBase('images/friends/zendin.jpeg'),
          position: { x: '84%', y: '85%' },
          width: '19vw',
          startTime: 1.9,
          endTime: 60,
        },
        {
          src: withBase('images/friends/tina.jpeg'),
          position: { x: '36%', y: '96%' },
          width: '18vw',
          startTime: 2.4,
          endTime: 60,
        },
      ],
    },
  },
  {
    spotify: "none",
    audio: { src: withBase('GettingBetter.m4a') },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.74, y: 1.1, color: '#4ae8a4' }, light2: { x: 0.76, y: 1.1, color: '#a44ae8' } },
      lightAnimation: circle(
        { startAngle: Math.PI, clockwise: false, radius: 0.01, speed: 2.5 },
        { startAngle: Math.PI, clockwise: false, radius: 0.01, speed: 2.5 },
      ),
      objects: {
        manta: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [0.15, 0.15, 0.15] },
      }
    },
  },
  {
    spotify: { trackId: '6dGnYIeXmHdcikdzNNDMm2' },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.74, y: 1.1, color: '#4ae8a4' }, light2: { x: 0.76, y: 1.1, color: '#a44ae8' } },
      lightAnimation: circle(
        { startAngle: Math.PI, clockwise: false, radius: 0.01, speed: 2.5 },
        { startAngle: Math.PI, clockwise: false, radius: 0.01, speed: 2.5 },
      ),
    },
  },

  {
    foreground: ClosingMessage,
    spotify: { trackId: '6dGnYIeXmHdcikdzNNDMm2' },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.6, y: 0.6, color: '#e8a44a' }, light2: { x: 0.8, y: 0.8, color: '#a44ae8' } },
      lightAnimation: gentleOrbit(0.05, 2),
      objects: {
        trees1: { position: [-10, -10, -2], rotation: [0, -0.3, 0] },
        trees2: { position: [10, -10, -2], rotation: [0, -0.3, 0] },
        manta: { position: [10, -100, 10], rotation: [0, 1, 0], scale: [0.05, 0.05, 0.05] },
      },
    },
  },
]

export function getActiveTrackId(activeIndex: number): string | null {
  for (let i = activeIndex; i >= 0; i--) {
    const s = entries[i].spotify
    if (s === 'none') return null
    if (s) return s.trackId
  }
  return null
}

function normalizeScale(s: Vec3 | number): Vec3 {
  return typeof s === 'number' ? [s, s, s] : s
}

/**
 * Resolve the effective state for a scene object at a given entry index
 * by scanning forward from defaults, applying each entry's overrides.
 */
export function resolveObjectState(
  objectId: string,
  entryIndex: number,
): ResolvedObjectState {
  const def = sceneObjects.find(o => o.id === objectId)
  if (!def) throw new Error(`Unknown scene object: ${objectId}`)

  const resolved: ResolvedObjectState = {
    position: [...def.defaults.position],
    rotation: [...def.defaults.rotation],
    scale: [...def.defaults.scale],
    visible: def.defaults.visible,
  }

  for (let i = 0; i <= entryIndex; i++) {
    const kf = entries[i].background.objects?.[objectId]
    if (!kf) continue
    if (kf.position) resolved.position = [...kf.position]
    if (kf.rotation) resolved.rotation = [...kf.rotation]
    if (kf.scale != null) resolved.scale = normalizeScale(kf.scale)
    if (kf.visible != null) resolved.visible = kf.visible
  }

  return resolved
}
