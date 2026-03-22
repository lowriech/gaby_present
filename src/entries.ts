import { gentleOrbit, circle } from './lightAnimations'

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

export type ScrollEntry = {
  foreground?: Foreground
  background: Background
  audio?: { src: string }
  spotify?: { trackId: string } | 'none'
}

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
  src: "/images/bergen.jpeg",
  caption: `I went off to Bergen,\n
  and had so much fun and ease messaging with you.
  `,
} as Foreground

const FirstDate = {
  type: "picture",
  src: "/images/text.png",
  caption: `
  (I scrolled through so many 😘 to find this.)
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
  src: "/images/canoe.jpeg",
  revealDuration: 800,
} as Foreground

const Swing = {
  type: "picture",
  src: "/images/swing.jpeg",
  revealDuration: 800,
} as Foreground

const HotInLove = {
  type: "picture",
  src: "/images/hot_in_love.jpeg",
  caption: `
  So Hot. So In Love..
  `,
  revealDuration: 3000,
} as Foreground

const FireTender = {
  type: "picture",
  src: "/images/fire_tender.jpeg",
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
    meshPath: '/meshes/pine_tree.glb',
    defaults: {
      position: [-10, -10, -10],
      rotation: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      visible: true,
    },
  },
  {
    id: 'trees2',
    meshPath: '/meshes/pine_tree.glb',
    defaults: {
      position: [10, -10, -10],
      rotation: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      visible: true,
    },
  },
  {
    id: 'manta',
    meshPath: '/meshes/manta.glb',
    defaults: {
      position: [10, -100, 10],
      rotation: [0, 1, 0],
      scale: [0.05, 0.05, 0.05],
      visible: true,
    },
  },
  {
    id: 'blackberry',
    meshPath: '/meshes/blackberries.glb',
    defaults: {
      position: [2, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      visible: true,
    },
  },
  {
    id: "zebra",
    meshPath: '/meshes/zebra.glb',
    defaults: {
      position: [-10, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      visible: true,
    },
  },
  {
    id: "mud",
    meshPath: '/meshes/mud_material.glb',
    defaults: {
      position: [0, -100, 0],
      rotation: [0, 0, 0],
      scale: [0.1, 0.1, 0.1],
      visible: true,
    },
  },
]

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
    foreground: MFC,
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
  },

  {
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.74, y: 0.5, color: '#e8a44a' }, light2: { x: 0.76, y: 0.5, color: '#a44ae8' } },
      lightAnimation: gentleOrbit(0.07, 1.5),
      objects: {
        trees1: { position: [-10, -10, 10], rotation: [0, -0.3, 0] },
        trees2: { position: [10, -10, 10], rotation: [0, -0.3, 0] },
      },
    },
  },
  {
    spotify: "none",
    foreground: Bergen,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.3, y: 0.5, color: '#e8a44a' }, light2: { x: 2.0, y: 0.5, color: '#a44ae8' } },
    },
  },
  {
    spotify: "none",
    foreground: FirstDate,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.75, y: 0.5, color: '#e8a44a' }, light2: { x: 0.75, y: 1.0, color: '#a44ae8' } },
      lightAnimation: gentleOrbit(0.01, 1),
    },
  },
  {

    spotify: { trackId: '0IIxiwinMqP0dpxbVyOU1y' },
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.5, y: 0.5, color: '#ff69b4' }, light2: { x: 1, y: 0.5, color: '#e8a44a' } },
      lightAnimation: gentleOrbit(0.01, 1),
    },
  },
  // Blackberry
  {
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
      lights: { light1: { x: 0.5, y: 0.5, color: '#ff69b4' }, light2: { x: 1, y: 0.5, color: '#e8a44a' } },
      lightAnimation: gentleOrbit(0.01, 1.5),
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
      lights: { light1: { x: 0.5, y: 0.5, color: '#ff69b4' }, light2: { x: 1, y: 0.5, color: '#e8a44a' } },
      lightAnimation: gentleOrbit(0.01, 1.5),
    },
  },
  {
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
      lightAnimation: gentleOrbit(0.01, 1.5), 
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
    foreground: { type: 'picture', src: "images/desk.jpeg" },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
    },
  },
  {
    foreground: { type: 'picture', src: "images/wood_porch.jpeg", caption: "Hawt" },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
    },
  },

  {
    spotify: { trackId: '2Nm0IGkliIwWjSBINf3KjG' },
    foreground: { type: 'picture', src: "images/xc.jpeg", caption: "More please." },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
    },
  },
  {
    foreground: { type: "picture", src: "images/wood_with_ash.jpeg" },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.25, y: 0.45, color: '#4ae8a4' }, light2: { x: 0.75, y: 0.55, color: '#a44ae8' } },
    },
  },
  {
    spotify: "none",
    audio: { src: '/GettingBetter.m4a' },
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
