# It's a Present!

## Scene Effects

Each `ScrollEntry` accepts an optional `sceneEffect` that hooks into the scroll lifecycle to modify the rendering scene. A `SceneEffect` is a plain object with two optional functions:

```typescript
type SceneEffect = {
  addToScene?: (scene: Scene) => void
  cleanup?: (scene: Scene) => void
}
```

- **`addToScene`** runs when the scroll index enters the entry.
- **`cleanup`** runs when the scroll index leaves the entry.

Both are optional. Omitting `cleanup` lets changes persist across subsequent scroll entries, and omitting `addToScene` lets an entry only clean up a previous effect. This makes it easy to split activation and deactivation across different entries.

### How it works

`SceneEffectsManager` (in `CloudBackground.tsx`) runs inside the R3F render loop. Each frame it computes the active scroll step and, on transition, calls `cleanup` on the outgoing entry's effect and `addToScene` on the incoming entry's effect.

### Built-in effect factories

#### `backgroundLights(config)`

Spawns N lights into the cloud shader with randomised gentle-orbit motion. Lights fade in on entry and fade out on leave.

```typescript
backgroundLights({
  count: 50,           // number of shader lights
  radiusMin: 0.01,     // min gentleOrbit radius
  radiusMax: 0.02,     // max gentleOrbit radius
  speedMin: 1,         // min gentleOrbit speed
  speedMax: 2,         // max gentleOrbit speed
  intensity: 0.025,    // target intensity per light
  fadeDurationSec: 1,  // fade-in and fade-out duration
  color: '#e8a44a',    // optional, defaults to white
})
```

The lights are injected into the cloud fragment shader via a shared `extraLightsStore` array that `SmokeQuad` reads each frame and transfers to uniform arrays (`uExtraLightPos`, `uExtraLightColor`, `uExtraLightIntensity`).

#### `objectEffect(factory)`

Adds a Three.js `Object3D` to the scene on entry and removes it on leave.

#### `combineSceneEffects(...effects)`

Composes multiple `SceneEffect` objects into one. Runs `addToScene` in order and `cleanup` in reverse order.

### Usage in entries

Assign the full effect to a single entry:

```typescript
{
  background: { /* ... */ },
  sceneEffect: backgroundLights({ count: 50, /* ... */ }),
}
```

Or split activation and deactivation across entries:

```typescript
const lights = backgroundLights({ /* ... */ })

// Entry where lights appear
{ background: { /* ... */ }, sceneEffect: { addToScene: lights.addToScene } }

// Later entry where lights fade out
{ background: { /* ... */ }, sceneEffect: { cleanup: lights.cleanup } }
```