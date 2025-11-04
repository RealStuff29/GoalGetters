// Reads from your .env.local.
// Only vars starting with VITE_ are exposed in Vite
const raw = import.meta.env.VITE_AVATAR_BASE || 'https://avatar.iran.liara.run/public'

// Standardise the base avatar URL (raw) to prevent double slashes ('.../public//')
const normalized = raw.endsWith('/') ? raw.slice(0, -1) : raw

export const avatarBase = normalized

// Generate a short random ID (used for avatar seeds)
export function makeSeed() {
  return 'u-' + Math.random().toString(36).slice(2, 7)
}

// Build avatar URL from seed + gender
export function buildAvatarUrl(seed, gender) {
  // Construct avatar URL based on gender and random seed
  const base = avatarBase.endsWith('/') ? avatarBase.slice(0, -1) : avatarBase
  const q = `?username=${encodeURIComponent(seed)}`
  if (gender === 'boy') return `${base}/boy${q}`
  if (gender === 'girl') return `${base}/girl${q}`
  return `${base}${q}`
}

// Extract seed from a previously saved avatar URL (?username=...)
export function extractSeedFromUrl(url) {
  try {
    const u = new URL(url)
    return u.searchParams.get('username') || ''
  } catch {
    return ''
  }
}