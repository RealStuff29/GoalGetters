// src/composables/useProfileSetup.js
import { ref, computed } from 'vue'
import { makeSeed, buildAvatarUrl } from '@/lib/avatar'
import { generateName } from '@/services/nameService' 

const username = ref(generateName())
const gender = ref('') // 'boy' | 'girl' | ''
const seed = ref(makeSeed())
const errors = ref({})

// Computed avatarURL by calling buildAvatarUrl function
const avatarUrl = computed(() => buildAvatarUrl(seed.value, gender.value))

// Check if the user selected a gender (required fill)
// 'isComplete' becomes true when 'gender' is not empty
const isComplete = computed(() => {
  return !!gender.value
})

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
