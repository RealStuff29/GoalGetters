import { ref, computed, nextTick } from 'vue'
import { makeSeed, buildAvatarUrl, extractSeedFromUrl } from '@/lib/avatar'

export function useAvatar() {
  const gender = ref('')               // 'boy' | 'girl' | ''
  const seed = ref('')                 // holds the current random id
  const avatarLoaded = ref(true)

  const avatarUrl = computed(() => {
    if (!seed.value) return ''
    return buildAvatarUrl(seed.value, gender.value)
  })

  function setGender(g) {
    gender.value = (g === 'boy' || g === 'girl') ? g : ''
  }

  // Use this when loading a stored profile URL to keep the same avatar
  function setSeedFromUrl(url) {
    const s = extractSeedFromUrl(String(url || ''))
    if (s) seed.value = s
  }

  // create a default avatar if none exists (allow gender hint)
  function ensureDefaultAvatar(genderHint) {
    if (genderHint) setGender(genderHint)
    if (!seed.value) seed.value = makeSeed()
  }

  // shuffle = new variation of avatar (allow gender hint)
  function shuffleAvatar(genderHint) {
    if (genderHint) setGender(genderHint)
    avatarLoaded.value = false
    seed.value = ''
    nextTick(() => { seed.value = makeSeed() })
  }

  function onImageLoad() { avatarLoaded.value = true }

  return {
    // state
    gender,
    seed,
    avatarUrl,
    avatarLoaded,
    // actions
    setGender,
    setSeedFromUrl,
    ensureDefaultAvatar,
    shuffleAvatar,
    onImageLoad
  }
}
