// Reads from your .env.local.
// Only vars starting with VITE_ are exposed in Vite
const raw = import.meta.env.VITE_AVATAR_BASE || 'https://avatar.iran.liara.run/public'

// Standardise the base avtar URL (raw) to prevent double slashes ('.../public//')
const normalized = raw.endsWith('/') ? raw.slice(0, -1) : raw

export const avatarBase = normalized
