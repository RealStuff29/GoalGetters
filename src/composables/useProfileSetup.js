import { ref, computed } from 'vue'
import { avatarBase } from '@/lib/avatar';
import { generateName } from '@/services/nameService' 

const username = ref(generateName())
const gender = ref('') // 'boy' | 'girl' | ''
const seed = ref(makeSeed())
const errors = ref({})

// Generate a short randomr ID for generating a fresh avatar
function makeSeed () {
  return 'u-' + Math.random().toString(36).slice(2, 7)
}


const base = avatarBase
// Computed avatarURL to changes base on 'seed' and 'gender'
const avatarUrl = computed(() => {
  const q = `?username=${encodeURIComponent(seed.value)}` // Concat the base URL with seed (random ID)for the API username parameter
  if (gender.value === 'boy') return `${base}/boy${q}`
  if (gender.value === 'girl') return `${base}/girl${q}`
  return `${base}${q}`
})

// Check if the user selected a gender (required fill)
// 'isComplete' becomes true when 'gender' is not empty
const isComplete = computed(() => {
  return !!gender.value
})

// Call
function shuffleAvatar () { seed.value = makeSeed() }
// 
function randomiseUsername () { username.value = generateName() }

export function useProfileSetup () {
  return {
    // state
    username,
    gender,
    avatarUrl,
    errors,
    isComplete,
    // actions
    shuffleAvatar,
    randomiseUsername
  }
}
