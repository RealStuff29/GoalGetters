// src/stores/match.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateName } from '@/services/nameService.js'


export const useMatchStore = defineStore('match', () => {
  // ---------- State ----------
  const stage = ref<'landing' | 'searching' | 'match' | 'result' | 'chat'>('landing')
  const resultAccepted = ref(false)

  const match = ref({
    subject: 'WAD2',
    description: 'Homework discussion and review',
    time: '3:30 PM - 4:30 PM',
    duration: '1 hour',
    location: 'Library Level 2, Study Room 3',
    partner: { name: generateName() }
  })

  const partnerInitials = computed(() =>
    match.value.partner.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  )

  // Timer
  const totalSeconds = 30
  const secondsLeft = ref(totalSeconds)
  let tick: number | null = null

  const countdownText = computed(() => {
    const s = secondsLeft.value
    const mm = Math.floor(s / 60)
    const ss = (s % 60).toString().padStart(2, '0')
    return `${mm}:${ss}`
  })

  // Chat
  let idSeq = 0
  const draft = ref('')
  const messages = ref(seedMessages())

  function seedMessages() {
    idSeq = 0
    return [
      { id: ++idSeq, from: 'them' as const, text: 'Hey! Ready to go over the WAD2 homework?' },
      { id: ++idSeq, from: 'me' as const, text: 'Yup! I got stuck at the Axios part though.' }
    ]
  }

  // Locations
  const locationSuggestions = ref([
    { name: 'Library L2 - Study Room 3', desc: 'Quiet room • Whiteboard • Fits 4' },
    { name: 'SMU Labs - Booth A12', desc: 'Open booth • Power sockets' },
    { name: 'Koufu - Back Corner', desc: 'Casual • Good for brainstorming' },
    { name: 'SOE L3 - Breakout Area', desc: 'Open space • Near elevators' }
  ])

  // ---------- Actions ----------
  function startCountdown(onExpired?: () => void) {
    stopCountdown()
    secondsLeft.value = totalSeconds
    tick = window.setInterval(() => {
      if (secondsLeft.value > 0) secondsLeft.value--
      else {
        stopCountdown()
        onExpired?.()
      }
    }, 1000)
  }

  function stopCountdown() {
    if (tick) {
      clearInterval(tick)
      tick = null
    }
  }

  function startMatchmaking() {
  stage.value = 'searching'
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      stage.value = 'match'
      startCountdown(() => declineMatch())
      resolve()
    }, 1200)
  })
}

  function acceptMatch() {
    stopCountdown()
    resultAccepted.value = true
    stage.value = 'result'
  }

  function declineMatch() {
    stopCountdown()
    resultAccepted.value = false
    stage.value = 'result'
  }

  function startOver() {
    stopCountdown()
    stage.value = 'landing'
    messages.value = seedMessages()
    draft.value = ''
    // Optionally generate a fresh name
    match.value.partner.name = generateName()
  }

  function goToChat() {
    stage.value = 'chat'
  }

  function sendMessage(text: string) {//testing message to update previous commit
    const t = text.trim()
    if (!t) return
    messages.value.push({ id: ++idSeq, from: 'me' as const, text: t })
    // Simulated reply
    setTimeout(() => {
      messages.value.push({ id: ++idSeq, from: 'them' as const, text: "Nice, let's compare approaches." })
    }, 700)
  }

  function chooseSpot(spot: { name: string; desc: string }) {
    match.value.location = spot.name
    messages.value.push({ id: ++idSeq, from: 'me' as const, text: `Let's meet at ${spot.name}.` })
  }

  return {
    // state
    stage, resultAccepted, match, messages, draft, locationSuggestions,
    secondsLeft, totalSeconds,
    // computed
    partnerInitials, countdownText,
    // actions
    startMatchmaking, acceptMatch, declineMatch, startOver, goToChat,
    startCountdown, stopCountdown, sendMessage, chooseSpot
  }
})
