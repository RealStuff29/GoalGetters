// src/stores/match.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { generateName } from '@/services/nameService.js'
import { supabase } from '@/lib/supabase'

type Stage = 'landing' | 'searching' | 'match' | 'result' | 'chat'
type Message = { id: number; from: 'me' | 'them'; text: string }
type Spot = { name: string; desc: string }

type Partner = {
  name: string
  photo?: string | null
  description?: string | null
}

type Match = {
  id?: string
  subject: string
  description: string
  time: string
  duration: string
  location: string
  partner: Partner
}

const STORAGE_KEY = 'match-store-v1'

export const useMatchStore = defineStore('match', () => {
  // ---------- State ----------
  const stage = ref<Stage>('landing')
  const resultAccepted = ref(false)

  const currentMatchId = ref<string | null>(null)
  const chatId = ref<string | null>(null)

  // NEW: what the user just picked on the landing view (time slots)
  const availability = ref<string[]>([]) // e.g. ["slot_morning", "slot_evening"]

  const match = ref<Match>({
    subject: 'WAD2',
    description: 'Homework discussion and review',
    time: '3:30 PM - 4:30 PM',
    duration: '1 hour',
    location: 'Library Level 2, Study Room 3',
    // fallback name – will be overwritten once we load from Supabase
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
      availability: availability.value, // NEW
      match: {
        ...match.value,
      }
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
      if (Array.isArray(data.availability)) {
        availability.value = data.availability // NEW
      }
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
      sessionStorage.removeItem(STORAGE_KEY)
      return false
    }
  }

  watch([stage, resultAccepted, currentMatchId, chatId, match, availability], persist, { deep: true })

  // ---------- Actions: countdown ----------
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

  // ---------- Actions: fake/basic matchmaking ----------
  function startMatchmaking() {
    stage.value = 'searching'
    return new Promise<void>((resolve) => {
      setTimeout(() => {
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
  async function hydrateFromCache() {
    const ok = restore()
    if (!currentMatchId.value && stage.value !== 'landing') {
      stage.value = 'landing'
    }
    return ok
  }

  async function ensureMatch(id?: string) {
    if (id) {
      currentMatchId.value = id
      match.value.id = id
    }
    if (!currentMatchId.value) {
      return false
    }
    persist()
    return true
  }

  async function ensureChat(id?: string) {
    if (id) chatId.value = id
    if (!chatId.value) chatId.value = (crypto.randomUUID ? crypto.randomUUID() : `chat-${Date.now()}`)
    persist()
    return true
  }

  // =========== NEW: save availability to Supabase ===========
  async function setAvailability(slots: string[]) {
    availability.value = slots

    // push to Supabase
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr || !auth?.user?.id) {
      console.warn('[match] cannot save timeslot_avail, not authenticated')
      return
    }
    const myId = auth.user.id

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ timeslot_avail: slots })   // PROFILES COLUMN
      .eq('id', myId)                      // FIXED: use id, not user_id
    if (updErr) {
      console.error('[match] failed to update timeslot_avail', updErr)
    }

    persist()
  }

  // =============================== True matchmaking code below (your version, but fixed for profiles.id) ===============================
  async function queueAndPoll(): Promise<string> {
    stage.value = 'searching'

    // 0) who am I?
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth?.user?.id
    if (!userId) throw new Error('Not authenticated')

    // 1) enqueue myself (idempotent)
    {
      const { error } = await supabase.from('match_queue').upsert({
        user_id: userId,
        status: 'waiting',
        room_id: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      if (error) throw error
    }

    // helper to try matching immediately
    const tryImmediateMatch = async (): Promise<string | null> => {
      const { data: candidate, error: findErr } = await supabase
        .from('match_queue')
        .select('user_id')
        .eq('status', 'waiting')
        .neq('user_id', userId)
        .order('updated_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (findErr) return null
      if (!candidate?.user_id) return null

      const roomId = (globalThis.crypto?.randomUUID?.() ?? String(Date.now()))
      const { error: updErr } = await supabase
        .from('match_queue')
        .update({ status: 'matched', room_id: roomId, updated_at: new Date().toISOString() })
        .in('user_id', [userId, candidate.user_id])
      if (updErr) return null

      // record the room
      await supabase.from('match_room').insert({
        id: roomId, user1: userId, user2: candidate.user_id, created_at: new Date().toISOString()
      })

      return roomId
    }

    // 2) greedy attempt
    {
      const rid = await tryImmediateMatch()
      if (rid) {
        currentMatchId.value = rid
        match.value.id = rid

        stage.value = 'match'
        await setPartnerFromRoom(rid)

        // load partner again for full profile
        const { data: auth } = await supabase.auth.getUser()
        const myId = auth?.user?.id
        if (myId) {
          const partner = await loadPartnerProfile(rid, myId)
          if (partner) {
            match.value.partner = {
              name: partner.username,
              photo: partner.profile_photo,
              description: partner.description
            }
          }
        }

        return rid
      }
    }

    // 3) poll for up to 60s
    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
      // a) did someone else match me?
      const { data: mine } = await supabase
        .from('match_queue')
        .select('status, room_id')
        .eq('user_id', userId)
        .single()

      if (mine?.status === 'matched' && mine?.room_id) {
        const rid = mine.room_id as string

        currentMatchId.value = rid
        match.value.id = rid

        stage.value = 'match'
        await setPartnerFromRoom(rid)

        const { data: auth } = await supabase.auth.getUser()
        const myId = auth?.user?.id
        if (myId) {
          const partner = await loadPartnerProfile(rid, myId)
          if (partner) {
            match.value.partner = {
              name: partner.username,
              photo: partner.profile_photo,
              description: partner.description
            }
          }
        }

        return rid
      }

      // b) still waiting? try to match again
      const rid2 = await tryImmediateMatch()
      if (rid2) {
        currentMatchId.value = rid2
        match.value.id = rid2
        stage.value = 'match'
        return rid2
      }

      // c) wait 2s
      await new Promise(r => setTimeout(r, 2000))
    }

    // 4) timeout → mark idle
    await supabase.from('match_queue')
      .update({ status: 'idle', room_id: null, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    stage.value = 'landing'
    throw new Error('No match found (timeout)')
  }

  // FIXED: load partner by profiles.id
  async function loadPartnerProfile(roomId: string, myId: string) {
    const { data: room } = await supabase
      .from('match_room')
      .select('user1, user2')
      .eq('id', roomId)
      .single()

    if (!room) return null

    const partnerId = room.user1 === myId ? room.user2 : room.user1

    const { data: partner } = await supabase
      .from('profiles')
      .select('username, profile_photo, description')
      .eq('id', partnerId)  // FIXED
      .single()

    return partner
  }

  async function loadPartnerForCurrent() {
    const roomId = currentMatchId.value || match.value.id
    if (!roomId) return

    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id
    if (!myId) return

    const partner = await loadPartnerProfile(roomId, myId)
    if (partner) {
      match.value.partner = {
        name: partner.username,
        photo: partner.profile_photo,
        description: partner.description
      }
    }
  }

  async function setPartnerFromRoom(roomId: string) {
    if (!roomId) return

    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id
    if (!myId) return

    const { data: room } = await supabase
      .from('match_room')
      .select('user1, user2')
      .eq('id', roomId)
      .single()

    if (!room) return
    const partnerId = room.user1 === myId ? room.user2 : room.user1

    const { data: prof } = await supabase
      .from('profiles')
      .select('username, profile_photo, description')
      .eq('id', partnerId)  // FIXED
      .single()

    if (prof?.username) {
      match.value.partner = {
        name: prof.username,
        photo: prof.profile_photo,
        description: prof.description
      }
    }
  }

  return {
    // state
    stage,
    resultAccepted,
    match,
    messages,
    draft,
    locationSuggestions,
    secondsLeft,
    totalSeconds,
    currentMatchId,
    chatId,
    availability,        // NEW

    // computed
    partnerInitials,
    countdownText,

    // actions
    startMatchmaking,
    acceptMatch,
    declineMatch,
    startOver,
    goToChat,
    startCountdown,
    stopCountdown,
    sendMessage,
    chooseSpot,
    hydrateFromCache,
    ensureMatch,
    ensureChat,
    setAvailability,      // NEW
    queueAndPoll,
    loadPartnerForCurrent,
    setPartnerFromRoom
  }
})
