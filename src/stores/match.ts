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
  const totalSeconds = 60
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
  async function persist() {
    // we try to tag the cached state with the current auth user
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth?.user?.id ?? null

    const payload = {
      owner_user_id: userId,
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

  async function restore() {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    try {
      const data = JSON.parse(raw)

      // check that the cached state belongs to the same logged-in user
      const { data: auth } = await supabase.auth.getUser()
      const currentUserId = auth?.user?.id ?? null
      if (data.owner_user_id && currentUserId && data.owner_user_id !== currentUserId) {
        // cached state belongs to someone else → drop it
        sessionStorage.removeItem(STORAGE_KEY)
        return false
      }

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

  // persist whenever these change
  watch([stage, resultAccepted, currentMatchId, chatId, match, availability], () => {
    // fire and forget
    void persist()
  }, { deep: true })

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
    void persist()
  }

  function declineMatch() {
    stopCountdown()
    resultAccepted.value = false
    stage.value = 'result'
    void persist()
  }

  async function startOver() {
    stopCountdown()
    stage.value = 'landing'
    messages.value = seedMessages()
    draft.value = ''
    currentMatchId.value = null
    chatId.value = null
    match.value.partner.name = generateName()
    await persist()

    // also clear from queue in DB
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth?.user?.id
    if (userId) {
      await supabase
        .from('match_queue')
        .update({
          status: 'idle',
          room_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    }
  }

  function goToChat() {
    stage.value = 'chat'
    if (!chatId.value) chatId.value = (crypto.randomUUID ? crypto.randomUUID() : `chat-${Date.now()}`)
    void persist()
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
    void persist()
  }

  // ---------- Rehydration ----------
  async function hydrateFromCache() {
    const ok = await restore()
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
    await persist()
    return true
  }

  async function ensureChat(id?: string) {
    if (id) chatId.value = id
    if (!chatId.value) chatId.value = (crypto.randomUUID ? crypto.randomUUID() : `chat-${Date.now()}`)
    await persist()
    return true
  }

  // =========== save availability to Supabase AS STRING ===========
  async function setAvailability(slots: string[]) {
    const slotsString = Array.isArray(slots) ? slots.join(',') : String(slots ?? '')
    availability.value = slotsString

    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr || !auth?.user?.id) {
      console.warn('[match] cannot save timeslot_avail, not authenticated')
      await persist()
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

    await persist()
  }

  // expose as array for views
  const availabilityList = computed(() => strToArray(availability.value))

  // ============= helper: my profile =============
async function getMyProfile() {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id
  if (!userId) return null

  const { data: prof, error } = await supabase
    .from('profiles')
    .select('user_id, username, email, profile_photo, personality, gender, avg_rating, rating_count, created_at, modules, study_hours, degree, timeslot_avail')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.warn('[match] getMyProfile error', error)
    return null
  }
  if (!prof) return null

  return { userId, profile: prof }
}

  // ============= matching logic =============
  async function findBestCandidateForMe(
    myId: string,
    myProfile: any,
    opts?: { relax?: boolean }
  ): Promise<{ user_id: string } | null> {
    const relax = opts?.relax === true

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
      .select('user_id, username, profile_photo, description, gender, timeslot_avail, modules, study_hours, degree, school')
      .in('user_id', candidateIds)

    if (profErr) {
      console.warn('[match] findBestCandidateForMe → profiles error', profErr)
      return null
    }

    const myGender = myProfile.gender
    const mySlots = strToArray(myProfile.timeslot_avail ?? availability.value)
    const myMods = strToArray(myProfile.modules) // your table uses "modules"
    const mySchool = myProfile.school
    const myStudyHours = typeof myProfile.study_hours === 'number'
      ? myProfile.study_hours
      : Number(myProfile.study_hours ?? 0)

    // if I myself have no slots, don't even try
    if (mySlots.length === 0 && !relax) {
      return null
    }

    const scored = candProfiles
      .map((cp: any) => {
        const cSlots = strToArray(cp.timeslot_avail)
        const cMods = strToArray(cp.modules)
        const cStudyHours = typeof cp.study_hours === 'number'
          ? cp.study_hours
          : Number(cp.study_hours ?? 0)

        // candidate missing slots → cannot match (unless relax)
        if (cSlots.length === 0 && !relax) {
          return null
        }

        // HARD 1: same gender
        if (myGender && cp.gender && myGender !== cp.gender && !relax) {
          return null
        }

        // HARD 2: at least 1 slot overlap
        const slotOverlap = overlapCount(mySlots, cSlots)
        if (slotOverlap === 0 && !relax) {
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

    // derive my slots (from profile first, else from local store)
    const mySlots = strToArray(myProfile.timeslot_avail ?? availability.value)
    if (mySlots.length === 0) {
      stage.value = 'landing'
      throw new Error('You have no timeslots saved. Pick at least 1.')
    }

    // 0) CLEANUP: if I was stuck as waiting/matched from previous try, reset
    await supabase
      .from('match_queue')
      .update({
        status: 'idle',
        room_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', myId)
      .in('status', ['waiting', 'matched'])

    // 1) enqueue fresh
    {
      const now = new Date().toISOString()
      const { error } = await supabase.from('match_queue').upsert({
        user_id: myId,
        status: 'waiting',
        room_id: null,
        updated_at: now,
      }, { onConflict: 'user_id' })
      if (error) throw error
    }

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

      // auto-start countdown once match is made
      stage.value = 'match'
      startCountdown(() => declineMatch())
      void persist()

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
      const elapsed = 60_000 - (deadline - Date.now())
      const shouldRelax = elapsed > 40_000 // after 40s, we can relax rules a bit

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
        // start countdown here too (we were matched by someone else)
        startCountdown(() => declineMatch())
        void persist()
        return rid
      }

      // else: try to match again using rules (maybe relaxed)
      const best = await findBestCandidateForMe(myId, myProfile, { relax: shouldRelax })
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

    // 4) timeout → set me back to idle
    // await supabase.from('match_queue')
    //   .update({ status: 'idle', room_id: null, updated_at: new Date().toISOString() })
    //   .eq('user_id', myId)

    // stage.value = 'landing'
    // throw new Error('No match found (timeout)')

    // 4) Disable: create a dummy match for testing
    console.warn('[match] No real match found (timeout) — using dummy match for testing')

    const dummyRoomId = 'demo-' + Date.now()

    // simulate a fake match partner
    match.value.partner = {
      name: generateName(), // 👈 uses your existing random name generator
      photo: null,
      description: 'This is a demo match generated for testing.'
    }

    currentMatchId.value = dummyRoomId
    match.value.id = dummyRoomId
    stage.value = 'match'

    // start countdown timer to behave like a real match
    startCountdown(() => declineMatch())
    void persist()

    return dummyRoomId
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
    if (!roomId) return false

    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id
    if (!myId) return false

    const { data: room } = await supabase
      .from('match_room')
      .select('user1, user2')
      .eq('id', roomId)
      .single()

    if (!room) return false
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
      return true
    }
    return false
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
    availabilityList,

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
