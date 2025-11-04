// src/composables/useAvatar.js
import { ref, computed, nextTick } from 'vue'
import { makeSeed, buildAvatarUrl, extractSeedFromUrl } from '@/lib/avatar'

export function useAvatar() {
  const gender = ref('')               // 'boy' | 'girl' | ''
  const seed = ref('')                 // holds the current random id
  const avatarLoaded = ref(true)

  // derive the URL from seed + gender
  const avatarUrl = computed(() => {
    if (!seed.value) return ''         // if there is nothing, it will show spinner
    return buildAvatarUrl(seed.value, gender.value)
  })

  // set from profile
  function setGender(g) {
    gender.value = g || ''
  }

// Use this when loading a stored profile URL to keep the same avatar
  function setSeedFromUrl(url) {
    const s = extractSeedFromUrl(String(url || ''))
    if (s) seed.value = s
  }

  // create a default avatar if none exists
  function ensureDefaultAvatar() {
    if (!seed.value) seed.value = makeSeed()
  }

  // shuffle = new variation of avatar
  function shuffleAvatar() {
    avatarLoaded.value = false
    // Clear the src first so the <img> unmounts/updates and spinner shows
    seed.value = ''
    // Next DOM update, assign a fresh seed (new URL), image will start loading
    nextTick(() => {
      seed.value = makeSeed()
    })
  }

  // hook for <img @load>
  function onImageLoad() {
    avatarLoaded.value = true
  }

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
