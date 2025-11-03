import { ref } from 'vue'
import { avatarBase } from '@/lib/avatar'

function makeSeed() {
  // Create a random short unique ID
  return 'u-' + Math.random().toString(36).slice(2, 7)
}

function buildAvatarUrl(seed, gender) {
  // Construct avatar URL based on gender and random seed
  const base = avatarBase.endsWith('/') ? avatarBase.slice(0, -1) : avatarBase
  const q = `?username=${encodeURIComponent(seed)}`
  if (gender === 'boy') return `${base}/boy${q}`
  if (gender === 'girl') return `${base}/girl${q}`
  return `${base}${q}`
}

export function useAvatar() {
  const avatarUrl = ref('')
  const avatarLoaded = ref(true)
  const gender = ref('')

  // Set gender from profile
  function setGender(g) {
    gender.value = g || ''
  }

  // Set avatar URL from profile
  function setAvatar(url) {
    avatarUrl.value = url || ''
  }

  // Generate a default avatar if none exists
  function ensureDefaultAvatar() {
    if (!avatarUrl.value) {
      avatarUrl.value = buildAvatarUrl(makeSeed(), gender.value)
    }
  }

  // Shuffle to generate new avatar variation
  function shuffleAvatar() {
    const seed = makeSeed()
    avatarUrl.value = buildAvatarUrl(seed, gender.value)
    avatarLoaded.value = false
    requestAnimationFrame(() => (avatarLoaded.value = true))
  }

  return {
    avatarUrl,
    avatarLoaded,
    gender,
    setGender,
    setAvatar,
    ensureDefaultAvatar,
    shuffleAvatar
  }
}
