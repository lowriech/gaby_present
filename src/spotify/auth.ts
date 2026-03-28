const STORAGE_KEY = 'spotify_token'
const VERIFIER_KEY = 'spotify_pkce_verifier'

export interface SpotifyTokenData {
  access_token: string
  refresh_token: string
  expires_at: number // ms since epoch
}

// PKCE helpers

function randomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return arr
}

function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64UrlEncode(randomBytes(32))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = base64UrlEncode(new Uint8Array(digest))
  return { verifier, challenge }
}

export function buildAuthUrl(clientId: string, redirectUri: string, challenge: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: 'streaming user-read-email user-read-private',
  })
  return `https://accounts.spotify.com/authorize?${params}`
}

export async function exchangeCode(
  code: string,
  verifier: string,
  clientId: string,
  redirectUri: string,
): Promise<SpotifyTokenData> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    }),
  })

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`)

  const json = await res.json()
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + json.expires_in * 1000,
  }
}

export function storeToken(data: SpotifyTokenData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getStoredToken(): SpotifyTokenData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data: SpotifyTokenData = JSON.parse(raw)
    if (data.expires_at <= Date.now()) return null
    return data
  } catch {
    return null
  }
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function storeVerifier(verifier: string): void {
  sessionStorage.setItem(VERIFIER_KEY, verifier)
}

export function popVerifier(): string | null {
  const v = sessionStorage.getItem(VERIFIER_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)
  return v
}
