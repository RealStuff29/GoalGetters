// src/stores/match.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { generateName } from '@/services/nameService.js'

type Stage = 'landing' | 'searching' | 'match' | 'result' | 'chat'
type Message = { id: number; from: 'me' | 'them'; text: string }
type Spot = { name: string; desc: string }
type Match = {
  id?: string
  subject: string
  description: string
  time: string
  duration: string
  location: string
  partner: { name: string }
}

const STORAGE_KEY = 'match-store-v1'

export const useMatchStore = defineStore('match', () => {
  // ---------- State ----------
  const stage = ref<Stage>('landing')
  const resultAccepted = ref(false)

  const currentMatchId = ref<string | null>(null)
  const chatId = ref<string | null>(null)

  const match = ref<Match>({
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

  // ---------- Timer ----------
  const totalSeconds = 30
  const secondsLeft = ref(totalSeconds)
  let tick: number | null = null

  const countdownText = computed(() => {
    const s = secondsLeft.value
    const mm = Math.floor(s / 60)
    const ss = (s % 60).toString().padStart(2, '0')
    return `${mm}:${ss}`
  })

  // ---------- Chat ----------
  let idSeq = 0
  const draft = ref('')
  const messages = ref<Message[]>(seedMessages())

  function seedMessages(): Message[] {
    idSeq = 0
    return [
      { id: ++idSeq, from: 'them', text: 'Hey! Ready to go over the WAD2 homework?' },
      { id: ++idSeq, from: 'me', text: 'Yup! I got stuck at the Axios part though.' }
    ]
  }

  // ---------- Locations ----------
  const locationSuggestions = ref<Spot[]>([
    { name: 'Library L2 - Study Room 3', desc: 'Quiet room • Whiteboard • Fits 4' },
    { name: 'SMU Labs - Booth A12', desc: 'Open booth • Power sockets' },
    { name: 'Koufu - Back Corner', desc: 'Casual • Good for brainstorming' },
    { name: 'SOE L3 - Breakout Area', desc: 'Open space • Near elevators' }
  ])

  // ---------- Persistence (sessionStorage) ----------
  function persist() {
    const payload = {
      stage: stage.value,
      resultAccepted: resultAccepted.value,
      currentMatchId: currentMatchId.value,
      chatId: chatId.value,
      match: {
        ...match.value,
        // keep partner name and location; the rest are already simple strings
      },
      // do NOT persist messages body if you don’t want to — keep minimal:
      // messages: messages.value
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  function restore() {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    try {
      const data = JSON.parse(raw)
      if (data.stage) stage.value = data.stage as Stage
      if ('resultAccepted' in data) resultAccepted.value = !!data.resultAccepted
      currentMatchId.value = data.currentMatchId ?? null
      chatId.value = data.chatId ?? null
      if (data.match) {
        match.value = {
          subject: data.match.subject ?? match.value.subject,
          description: data.match.description ?? match.value.description,
          time: data.match.time ?? match.value.time,
          duration: data.match.duration ?? match.value.duration,
          location: data.match.location ?? match.value.location,
          partner: { name: data.match.partner?.name ?? match.value.partner.name },
          id: data.match.id ?? currentMatchId.value ?? undefined
        }
      }
      return true
    } catch {
      // bad JSON; clear it
      sessionStorage.removeItem(STORAGE_KEY)
      return false
    }
  }

  // auto-persist on important changes (keep it minimal & deep where needed)
  watch([stage, resultAccepted, currentMatchId, chatId, match], persist, { deep: true })

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
    }, 1000) as unknown as number
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
        // pretend we got a backend id
        const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
        currentMatchId.value = id
        match.value.id = id
        stage.value = 'match'
        startCountdown(() => declineMatch())
        persist()
        resolve()
      }, 1200)
    })
  }

  function acceptMatch() {
    stopCountdown()
    resultAccepted.value = true
    stage.value = 'result'
    // ready a chat id so /matchchatview/:chatId works on refresh
    if (!chatId.value) chatId.value = (crypto.randomUUID ? crypto.randomUUID() : `chat-${Date.now()}`)
    persist()
  }

  function declineMatch() {
    stopCountdown()
    resultAccepted.value = false
    stage.value = 'result'
    persist()
  }

  function startOver() {
    stopCountdown()
    stage.value = 'landing'
    messages.value = seedMessages()
    draft.value = ''
    currentMatchId.value = null
    chatId.value = null
    match.value.partner.name = generateName()
    persist()
  }

  function goToChat() {
    stage.value = 'chat'
    if (!chatId.value) chatId.value = (crypto.randomUUID ? crypto.randomUUID() : `chat-${Date.now()}`)
    persist()
  }

  function sendMessage(text: string) {
    const t = text.trim()
    if (!t) return
    messages.value.push({ id: ++idSeq, from: 'me', text: t })
    setTimeout(() => {
      messages.value.push({ id: ++idSeq, from: 'them', text: "Nice, let's compare approaches." })
    }, 700)
  }

  function chooseSpot(spot: Spot) {
    match.value.location = spot.name
    messages.value.push({ id: ++idSeq, from: 'me', text: `Let's meet at ${spot.name}.` })
    persist()
  }

  // ---------- Rehydration helpers ----------
  /** Call this in MatchDecisionView onMounted() */
  async function hydrateFromCache() {
    const ok = restore()
    // If we landed directly on /matchdecision and have no match id, bounce to landing
    if (!currentMatchId.value && stage.value !== 'landing') {
      stage.value = 'landing'
    }
    return ok
  }

  /** Optional: ensure we have a match id (e.g., from route param) */
  async function ensureMatch(id?: string) {
    if (id) {
      currentMatchId.value = id
      match.value.id = id
    }
    if (!currentMatchId.value) {
      return false
    }
    // If you had a backend, you’d fetch match details here.
    persist()
    return true
  }

  /** Optional: ensure we have a chat id (e.g., from route param) */
  async function ensureChat(id?: string) {
    if (id) chatId.value = id
    if (!chatId.value) chatId.value = (crypto.randomUUID ? crypto.randomUUID() : `chat-${Date.now()}`)
    persist()
    return true
  }

  return {
    // state
    stage, resultAccepted, match, messages, draft, locationSuggestions,
    secondsLeft, totalSeconds,
    currentMatchId, chatId,

    // computed
    partnerInitials, countdownText,

    // actions
    startMatchmaking, acceptMatch, declineMatch, startOver, goToChat,
    startCountdown, stopCountdown, sendMessage, chooseSpot,
    hydrateFromCache, ensureMatch, ensureChat
  }
})