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

// ------------ helpers ------------
function strToArray(val: string | string[] | null | undefined): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean).map(v => v.trim())
  return val
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

function overlapCount(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const setB = new Set(b)
  return a.reduce((cnt, it) => (setB.has(it) ? cnt + 1 : cnt), 0)
}

export const useMatchStore = defineStore('match', () => {
  // ---------- State ----------
  const stage = ref<Stage>('landing')
  const resultAccepted = ref(false)

  const currentMatchId = ref<string | null>(null)
  const chatId = ref<string | null>(null)

  // keep as string: "slot_morning,slot_evening"
  const availability = ref<string>('')

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
      { id: ++idSeq, from: 'me', text: 'Yup! I got stuck at the Axios part though.' },
    ]
  }

  // ---------- Locations ----------
  const locationSuggestions = ref<Spot[]>([
    { name: 'Library L2 - Study Room 3', desc: 'Quiet room • Whiteboard • Fits 4' },
    { name: 'SMU Labs - Booth A12', desc: 'Open booth • Power sockets' },
    { name: 'Koufu - Back Corner', desc: 'Casual • Good for brainstorming' },
    { name: 'SOE L3 - Breakout Area', desc: 'Open space • Near elevators' },
  ])

  // ---------- Persistence ----------
  function persist() {
    const payload = {
      stage: stage.value,
      resultAccepted: resultAccepted.value,
      currentMatchId: currentMatchId.value,
      chatId: chatId.value,
      availability: availability.value,
      match: {
        ...match.value,
      },
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

      if (typeof data.availability === 'string') {
        availability.value = data.availability
      }

      if (data.match) {
        match.value = {
          subject: data.match.subject ?? match.value.subject,
          description: data.match.description ?? match.value.description,
          time: data.match.time ?? match.value.time,
          duration: data.match.duration ?? match.value.duration,
          location: data.match.location ?? match.value.location,
          partner: { name: data.match.partner?.name ?? match.value.partner.name },
          id: data.match.id ?? currentMatchId.value ?? undefined,
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

  // ---------- Rehydration ----------
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

  // =========== save availability to Supabase AS STRING ===========
  async function setAvailability(slots: string[]) {
    const slotsString = Array.isArray(slots) ? slots.join(',') : String(slots ?? '')
    availability.value = slotsString

    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr || !auth?.user?.id) {
      console.warn('[match] cannot save timeslot_avail, not authenticated')
      persist()
      return
    }
    const myId = auth.user.id

    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        timeslot_avail: slotsString,
      })
      .eq('user_id', myId)

    if (updErr) {
      console.error('[match] failed to update timeslot_avail', updErr)
    }

    persist()
  }

  // 👇 expose as computed for the views that want array form
  const availabilityList = computed(() => strToArray(availability.value))

  // ============= helper: my profile =============
  async function getMyProfile() {
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth?.user?.id
    if (!userId) return null
    console.log(auth.user.id)
  
    const { data: prof } = await supabase
      .from('profiles')
      .select('user_id, username, email, profile_photo, personality, gender, avg_rating, rating_count, created_at,modules, study_hours, degree,timeslot_avail')
      .eq('user_id', userId)
    console.log(prof)
    if (!prof) return null
    return { userId, profile: prof }
  }

  // ============= matching logic =============
  async function findBestCandidateForMe(myId: string, myProfile: any): Promise<{ user_id: string } | null> {
    // 1) get waiting others
    const { data: waiting, error: waitErr } = await supabase
      .from('match_queue')
      .select('user_id, updated_at')
      .eq('status', 'waiting')
      .neq('user_id', myId)

    if (waitErr) {
      console.warn('[match] findBestCandidateForMe → queue error', waitErr)
      return null
    }
    if (!waiting || waiting.length === 0) return null

    const candidateIds = waiting.map(w => w.user_id)

    // 2) load their profiles
    const { data: candProfiles, error: profErr } = await supabase
      .from('profiles')
      .select('user_id, username, email, profile_photo, personality, gender, avg_rating, rating_count, created_at,modules, study_hours, degree,timeslot_avail')
      .in('user_id', candidateIds)
      console.log(candProfiles)

    if (profErr) {
      console.warn('[match] findBestCandidateForMe → profiles error', profErr)
      return null
    }

    const myGender = myProfile.gender
    const mySlots = strToArray(myProfile.timeslot_avail ?? availability.value)
    const myMods = strToArray(myProfile.mods)
    const mySchool = myProfile.school
    const myStudyHours = typeof myProfile.study_hours === 'number'
      ? myProfile.study_hours
      : Number(myProfile.study_hours ?? 0)

    const scored = candProfiles
      .map((cp: any) => {
        const cSlots = strToArray(cp.timeslot_avail)
        const cMods = strToArray(cp.mods)
        const cStudyHours = typeof cp.study_hours === 'number'
          ? cp.study_hours
          : Number(cp.study_hours ?? 0)

        // HARD 1: same gender
        if (myGender && cp.gender && myGender !== cp.gender) {
          return null
        }

        // HARD 2: at least 1 slot overlap
        const slotOverlap = overlapCount(mySlots, cSlots)
        if (slotOverlap === 0) {
          return null
        }

        // SOFTS
        const modsOverlap = overlapCount(myMods, cMods)
        const sameSchool = mySchool && cp.school && mySchool === cp.school ? 1 : 0
        const diffStudy = Math.abs(myStudyHours - cStudyHours)

        const score =
          modsOverlap * 100 +
          sameSchool * 20 +
          (10 - Math.min(diffStudy, 10))

        return {
          user_id: cp.user_id,
          score,
        }
      })
      .filter(Boolean) as Array<{ user_id: string; score: number }>

    if (!scored.length) return null

    scored.sort((a, b) => b.score - a.score)
    return { user_id: scored[0].user_id }
  }

  // ==================== queue matchmaking ====================
  async function queueAndPoll(): Promise<string> {
    stage.value = 'searching'
    // get my profile
    const mine = await getMyProfile()
    if (!mine) throw new Error('Not authenticated or profile missing')
    const myId = mine.userId
    const myProfile = mine.profile

    // 1) enqueue
    {
      const { error } = await supabase.from('match_queue').upsert({
        user_id: myId,
        status: 'waiting',
        room_id: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (error) throw error
    }

    console.log("i enqueued")

    const markMatched = async (partnerId: string): Promise<string | null> => {
      const roomId = (globalThis.crypto?.randomUUID?.() ?? String(Date.now()))
      const now = new Date().toISOString()

      const { error: updErr } = await supabase
        .from('match_queue')
        .update({ status: 'matched', room_id: roomId, updated_at: now })
        .in('user_id', [myId, partnerId])

      if (updErr) {
        console.warn('[match] failed to update both users as matched', updErr)
        return null
      }

      await supabase.from('match_room').insert({
        id: roomId,
        user1: myId,
        user2: partnerId,
        created_at: now,
      })

      const { data: prof } = await supabase
        .from('profiles')
        .select('username, profile_photo, description')
        .eq('user_id', partnerId)
        .maybeSingle()

      if (prof?.username) {
        match.value.partner = {
          name: prof.username,
          photo: prof.profile_photo,
          description: prof.description,
        }
      }

      // 👇 auto-start countdown once match is made
      stage.value = 'match'
      startCountdown(() => declineMatch())
      persist()

      return roomId
    }

    // 2) immediate try with rules
    {
      const best = await findBestCandidateForMe(myId, myProfile)
      if (best?.user_id) {
        const rid = await markMatched(best.user_id)
        if (rid) {
          currentMatchId.value = rid
          match.value.id = rid
          return rid
        }
      }
    }

    // 3) poll
    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
      // maybe someone matched us
      const { data: meQueue } = await supabase
        .from('match_queue')
        .select('status, room_id')
        .eq('user_id', myId)
        .single()

      if (meQueue?.status === 'matched' && meQueue?.room_id) {
        const rid = meQueue.room_id as string
        currentMatchId.value = rid
        match.value.id = rid
        stage.value = 'match'
        await setPartnerFromRoom(rid)
        // 👇 start countdown here too (we were matched by someone else)
        startCountdown(() => declineMatch())
        persist()
        return rid
      }

      // else: try to match again using rules
      const best = await findBestCandidateForMe(myId, myProfile)
      if (best?.user_id) {
        const rid = await markMatched(best.user_id)
        if (rid) {
          currentMatchId.value = rid
          match.value.id = rid
          return rid
        }
      }

      await new Promise(r => setTimeout(r, 2000))
    }

  // 4) timeout
    await supabase.from('match_queue')
      .update({ status: 'idle', room_id: null, updated_at: new Date().toISOString() })
      .eq('user_id', myId)

    stage.value = 'landing'
    throw new Error('No match found (timeout)')
  }

  // ---------- partner loading ----------
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
      .eq('user_id', partnerId)
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
        description: partner.description,
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
      .eq('user_id', partnerId)
      .single()

    if (prof?.username) {
      match.value.partner = {
        name: prof.username,
        photo: prof.profile_photo,
        description: prof.description,
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
    availability,
    availabilityList, // 👈 for views

    // computed
    partnerInitials,
    countdownText,

    // actions
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
    setAvailability,
    queueAndPoll,
    loadPartnerForCurrent,
    setPartnerFromRoom,
  }
})
