import { ref, computed } from 'vue'
import { generateName } from '@/services/nameService'

const username = ref(generateName())
const gender = ref('') // 'boy' | 'girl' | ''
const seed = ref(makeSeed())
const errors = ref({})

function makeSeed () {
  return 'u-' + Math.random().toString(36).slice(2, 7)
}

const base = 'https://avatar.iran.liara.run/public'
const avatarUrl = computed(() => {
  const q = `?username=${encodeURIComponent(seed.value)}`
  if (gender.value === 'boy') return `${base}/boy${q}`
  if (gender.value === 'girl') return `${base}/girl${q}`
  return `${base}${q}`
})

const isComplete = computed(() => !!gender.value)

function shuffleAvatar () { seed.value = makeSeed() }
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
