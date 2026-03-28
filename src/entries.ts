import { gentleOrbit, circle, jitter, figure8, lightAnimationSequence, scaledSine } from './lightAnimations'
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
  | {
      type: 'sideBySideRecordings'
      left: { icon: string; recording: string }
      right: { icon: string; recording: string }
      topCaption?: string
      bottomCaption?: string
    }
  | { type: 'none' }

export type LightIdleAnimation = (t: number) => {
  light1: { dx: number; dy: number }
  light2: { dx: number; dy: number }
}

export type LightAnimationKeyframe = {
  start_time: number
  animation: LightIdleAnimation
}

export type Background = {
  color: string
  lights: LightConfig
  /** Seconds to animate into this step from the previous one */
  animationTime: number
  objects?: SceneObjectStates
  lightAnimation?: LightIdleAnimation | LightAnimationKeyframe[]
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
  spotify?: { trackId: string; song_start_time?: number; fade_time?: number } | 'none'
  sceneEffect?: SceneEffect
  /** Seconds to wait before automatically scrolling to the next entry. Defaults to 10. Set to 'none' to disable. */
  autoScrollDelay?: number | 'none'
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
  Happy Birthday Gaby.\n
  I love you a whole lot.
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
    spotify: { trackId: '6xiTXiZhECholKGfvDormV' },
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
    autoScrollDelay: 6,
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
    autoScrollDelay: 8,
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
    autoScrollDelay: 27,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.74, y: 0.75, color: '#e8a44a' }, light2: { x: 0.76, y: 0.75, color: '#a44ae8' } },
      lightAnimation: figure8(
        { width: 0.21, height: 0.15, speed: 0.3 }, 
        { width: 0.21, height: 0.15, speed: 0.3 },
        { bpm: 120, reverse_on_beats: [4] }
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
    spotify: { trackId: '3yPD6CHGE1xdJBWyu6ZBKk' },
    autoScrollDelay: 40,
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
        { src: withBase("images/whatsapp/wa6.jpg"), position: { x: '70%', y: '50%' }, startTime: 29.1, endTime: 33.5, width: '30%' },
        { src: withBase("images/whatsapp/wa5.jpg"), position: { x: '30%', y: '50%' }, startTime: 35.1, endTime: 39.5, width: '30%' },
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
      ],
    })
  },
  {
    autoScrollDelay: 13.5,
    foreground: FirstDate,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.75, y: 0.5, color: '#e8a44a' }, light2: { x: 0.75, y: 1.0, color: '#a44ae8' } },
      lightAnimation: jitter({ speed: 10, amplitude: 0.025 }, { speed: 0, amplitude: 0 }),
    },
  },
  {
    spotify: { trackId: '0IIxiwinMqP0dpxbVyOU1y', song_start_time: 106000 },
    autoScrollDelay: 5,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.5, y: 0.5, color: '#ff69b4' }, light2: { x: 1, y: 0.5, color: '#e8a44a' } },
      lightAnimation: gentleOrbit(0.01, 1),
    },
  },
  // Blackberry
  {
    autoScrollDelay: 15,
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
    autoScrollDelay: 8,
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.74, y: 0.8, color: '#ff69b4' }, light2: { x: 0.76, y: 0.8, color: '#e8a44a' } },
      lightAnimation: figure8(
        { width: 0.02, height: 0.02, speed: 1.2 },
        { width: 0.02, height: 0.02, speed: 1.2 },
      ),
      objects: {
        blackberry: { position: [-10, 0, 0], rotation: [0, 0, 0], scale: [0.05, 0.05, 0.05] },
        mud: { position: [0, -1, 0], rotation: [0, 0, 0], scale: [0.05, 0.05, 0.05] },
      },
    },
  },
  // Zebra
  {
    autoScrollDelay: 8,
    background: {
      color: '#e8a44a',
      animationTime: 4,
      lights: { light1: { x: 0.75, y: 0.5, color: '#ff69b4' }, light2: { x: 0.95, y: 0.57, color: '#e8a44a' } },
      lightAnimation: circle(
        { startAngle: 0, clockwise: true, radius: 0.0, speed: 1.5 },
        { startAngle: 0, clockwise: false, radius: 0.035, speed: 20 }
      ),
      objects: {
        zebra: { position: [-0.1, -0.1, 0], rotation: [0, -Math.PI/2, 0], scale: [0.05, 0.05, 0.05] },
        mud: { position: [0, -100, 0], rotation: [0, 0, 0], scale: [0.05, 0.05, 0.05] },
      },
    },
  },
  {
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
    autoScrollDelay: 37,
    spotify: { trackId: '0gGSxG7r332R7Vgvk24GHY' },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
      lightAnimation: lightAnimationSequence(
        { light1: { x: 0.745, y: 0.75 }, light2: { x: 0.755, y: 0.75 } },
        [
          { start_time: 0, animation: jitter(
            { speed: 10, amplitude: 0.025 },
            { speed: 10, amplitude: 0.025 }
          ) },
          { start_time: 9, animation: circle(
            { startAngle: Math.PI, clockwise: true, radius: 0.3, speed: 0.8 },
            { startAngle: 0, clockwise: true, radius: 0.3, speed: 0.8 }
          ) },
          { start_time: 18.2, moveTo: {
            light1: { x: 0.745, y: 0.75, duration: 7.5 },
            light2: { x: 0.755, y: 0.75, duration: 7.5 },
            // beat: { bpm: 120, reverse_on_beats: [3, 4] },
          } },
          { start_time: 25.7, animation: circle(
            { startAngle: 0, clockwise: true, radius: 0.02, speed: 17 },
            { startAngle: 0, clockwise: true, radius: 0.02, speed: 17 }
          ) },
          { start_time: 28.2, animation: scaledSine(
            { direction: 'vertical', distance: 0.25, duration: 5, amplitude: 0.1, frequency: 11, falloff: 'linear' },
            { direction: 'vertical', distance: 0.25, duration: 5, amplitude: 0.1, frequency: 11, falloff: 'linear' },
          ) },

          { start_time: 33.2, moveTo: {
            light1: { x: 0.6, y: 0.75, duration: 1 },
            light2: { x: 0.9, y: 0.75, duration: 1 },
          } },
          { start_time: 34.2, animation: jitter(
            { speed: 10, amplitude: 0.08 },
            { speed: 10, amplitude: 0.08 }
          ) },
        ]
      ),
    },
  },
  {
    autoScrollDelay: 5,
    foreground: HotInLove,
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
    },
  },
  {
    autoScrollDelay: 5,
    foreground: FireTender,
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
    },
  },
  {
    autoScrollDelay: 5,
    foreground: { type: 'picture', src: withBase("images/desk.jpeg") },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.745, y: 0.75, color: '#ff69b4' }, light2: { x: 0.755, y: 0.75, color: '#e8a44a' } },
    },
  },
  {
    autoScrollDelay: 10,
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
    autoScrollDelay: 28.5,
    foreground: { type: "picture", src: withBase("images/wood_with_ash.jpeg") },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.25, y: 0.75, color: '#ff69b4' }, light2: { x: 1.25, y: 0.75, color: '#e8a44a' } },
    },
    sceneEffect: sparkleLights({
      count: 120,
      radiusMin: 0.01,
      radiusMax: 0.02,
      speedMin: 1,
      speedMax: 2,
      intensity: 0.5,
      fadeDurationSec: 1,
      populateTime: 20,
    }),
    foregroundAnimation: {
      type: 'imageSequence',
      verticalOffset: '8px',
      clips: [
        {
          src: withBase('images/friends/ankle1.jpeg'),
          position: { x: '12%', y: '48%' },
          width: '20vw',
          startTime: 2,
          endTime: 60,
        },
        {
          src: withBase('images/friends/ankle2.jpeg'),
          position: { x: '30%', y: '55%' },
          width: '18vw',
          startTime: 4,
          endTime: 60,
        },
        {
          src: withBase('images/friends/bday.jpeg'),
          position: { x: '87%', y: '44%' },
          width: '20vw',
          startTime: 6,
          endTime: 60,
        },
        {
          src: withBase('images/friends/olivia.jpeg'),
          position: { x: '16%', y: '88%' },
          width: '19vw',
          startTime: 8,
          endTime: 60,
        },
        {
          src: withBase('images/friends/zendin.jpeg'),
          position: { x: '84%', y: '85%' },
          width: '19vw',
          startTime: 10,
          endTime: 60,
        },
        {
          src: withBase('images/friends/tina.jpeg'),
          position: { x: '36%', y: '96%' },
          width: '18vw',
          startTime: 12,
          endTime: 60,
        },
      ],
    },
  },
  {
    autoScrollDelay: 5,
    spotify: { trackId: '6dGnYIeXmHdcikdzNNDMm2' },
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
    autoScrollDelay: 5,
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
    autoScrollDelay: 10,
    spotify: { trackId: '6dGnYIeXmHdcikdzNNDMm2', song_start_time: 10000 },
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
    autoScrollDelay: "none",
    spotify: "none",
    foreground: { 
      type: 'sideBySideRecordings', 
      left: { icon: withBase("images/flags/american_flag.png"), recording: withBase("Gaby Bday - English.m4a") },
      right: { icon: withBase("images/flags/australian_flag.png"), recording: withBase("Gaby Bday - Aussie.m4a") },
      topCaption: "Click to listen",
      bottomCaption: "Scroll to continue",
    },
    background: {
      color: '#4ae8a4',
      animationTime: 1.5,
      lights: { light1: { x: 0.6, y: 0.6, color: '#e8a44a' }, light2: { x: 0.8, y: 0.8, color: '#a44ae8' } },
      lightAnimation: gentleOrbit(0.05, 2),
      objects: {
        manta: { position: [10, -100, 10], rotation: [0, 1, 0], scale: [0.05, 0.05, 0.05] },
      }
    },
  },
  {
    foreground: ClosingMessage,
    spotify: { trackId: '0gGSxG7r332R7Vgvk24GHY', song_start_time: 67000 },
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

export function getActiveSpotify(activeIndex: number): { trackId: string; song_start_time?: number } | null {
  for (let i = activeIndex; i >= 0; i--) {
    const s = entries[i].spotify
    if (s === 'none') return null
    if (s) return s
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
