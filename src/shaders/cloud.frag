precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uScrollY;
uniform vec2 uResolution;
uniform vec2 uLight1Pos;
uniform vec2 uLight2Pos;
uniform vec3 uLight1Color;
uniform vec3 uLight2Color;

#define MAX_EXTRA_LIGHTS 32
uniform int uExtraLightCount;
uniform vec2 uExtraLightPos[MAX_EXTRA_LIGHTS];
uniform vec3 uExtraLightColor[MAX_EXTRA_LIGHTS];
uniform float uExtraLightIntensity[MAX_EXTRA_LIGHTS];

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float normnoise(float noise) {
  return 0.5 * (noise + 1.0);
}

float clouds(vec2 uv) {
  uv += vec2(uTime * 0.05, uTime * 0.01);

  vec2 off1 = vec2(50.0, 33.0);
  vec2 off2 = vec2(0.0, 0.0);
  vec2 off3 = vec2(-300.0, 50.0);
  vec2 off4 = vec2(-100.0, 200.0);
  vec2 off5 = vec2(400.0, -200.0);
  vec2 off6 = vec2(100.0, -1000.0);
  float scale1 = 3.0;
  float scale2 = 6.0;
  float scale3 = 12.0;
  float scale4 = 24.0;
  float scale5 = 48.0;
  float scale6 = 96.0;

  return normnoise(
    snoise(vec3((uv + off1) * scale1, uTime * 0.5)) * 0.8 +
    snoise(vec3((uv + off2) * scale2, uTime * 0.4)) * 0.4 +
    snoise(vec3((uv + off3) * scale3, uTime * 0.1)) * 0.2 +
    snoise(vec3((uv + off4) * scale4, uTime * 0.7)) * 0.1 +
    snoise(vec3((uv + off5) * scale5, uTime * 0.2)) * 0.05 +
    snoise(vec3((uv + off6) * scale6, uTime * 0.3)) * 0.025
  );
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.x;

  float scrollOffset = uScrollY * 0.0003;
  uv.y += scrollOffset;

  vec2 light1 = uLight1Pos;
  vec2 light2 = uLight2Pos;

  vec3 lightColor1 = uLight1Color;
  vec3 lightColor2 = uLight2Color;

  float cl = clamp(clouds(uv), 0.0, 1.0);

  float cloudIntensity1 = max(0.7 * (1.0 - 2.5 * distance(uv, light1)), 0.0);
  float lightIntensity1 = 1.0 / (100.0 * distance(uv, light1));

  float cloudIntensity2 = max(0.7 * (1.0 - 2.5 * distance(uv, light2)), 0.0);
  float lightIntensity2 = 1.0 / (100.0 * distance(uv, light2));

  vec3 color =
    vec3(cloudIntensity1 * cl) * lightColor1 + lightIntensity1 * lightColor1 +
    vec3(cloudIntensity2 * cl) * lightColor2 + lightIntensity2 * lightColor2;

  for (int i = 0; i < MAX_EXTRA_LIGHTS; i++) {
    if (i >= uExtraLightCount) break;
    float d = distance(uv, uExtraLightPos[i]);
    float ci = max(0.7 * (1.0 - 2.5 * d), 0.0);
    float li = 1.0 / (100.0 * d);
    color += (vec3(ci * cl) + li) * uExtraLightColor[i] * uExtraLightIntensity[i];
  }

  color = max(color, vec3(0.0));
  color = color / (1.0 + color);
  color = pow(color, vec3(1.0 / 2.2));

  gl_FragColor = vec4(color, 1.0);
}
