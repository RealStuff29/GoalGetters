// src/stores/match.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'

type Stage = 'landing' | 'searching' | 'match' | 'result' | 'chat' | 'notfound'
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

// ---------------------------------------------------
// shared helpers
// ---------------------------------------------------
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

// 👉 slot windows we use to compute expiry
const SLOT_WINDOWS: Record<string, { start: string; end: string }> = {
  slot_morning: { start: '08:30', end: '11:30' },
  slot_midday: { start: '12:00', end: '15:00' },
  slot_afternoon: { start: '15:30', end: '18:30' },
  slot_evening: { start: '19:00', end: '22:00' },
}

function buildTodayIsoAt(timeHHMM: string) {
  const d = new Date()
  const [hh, mm] = timeHHMM.split(':').map(Number)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}

// pick the LATEST common slot between 2 users and return its END time (ISO)
function computeLatestCommonExpiry(
  meSlotsRaw: string | null,
  otherSlotsRaw: string | null
): string | null {
  const meSlots = strToArray(meSlotsRaw)
  const otherSlots = strToArray(otherSlotsRaw)
  const common = meSlots.filter(s => otherSlots.includes(s))
  if (!common.length) return null

  let latestIso: string | null = null
  let latestMinutes = -1

  for (const slot of common) {
    const win = SLOT_WINDOWS[slot]
    if (!win) continue
    const [eh, em] = win.end.split(':').map(Number)
    const total = eh * 60 + em
    if (total > latestMinutes) {
      latestMinutes = total
      latestIso = buildTodayIsoAt(win.end)
    }
  }

  return latestIso
}

// ---------------------------------------------------
// scoring rules (IDs only)
// ---------------------------------------------------
async function computeMatchScore(meId: string, otherId: string): Promise<number> {
  try {
    if (!meId || !otherId) throw new Error('Both IDs are required')
    if (meId === otherId) return -1
    console.log(`🧮 Computing match score between ${meId} and ${otherId}...`)

    const { data: me, error: errMe } = await supabase
      .from('profiles')
      .select('user_id, gender, modules, study_hours, degree, timeslot_avail')
      .eq('user_id', meId)
      .maybeSingle()

    if (errMe) throw errMe
    if (!me) throw new Error('Profile not found for user: ' + meId)

    const { data: other, error: errOther } = await supabase
      .from('profiles')
      .select('user_id, gender, modules, study_hours, degree, timeslot_avail')
      .eq('user_id', otherId)
      .maybeSingle()

    if (errOther) throw errOther
    if (!other) throw new Error('Profile not found for user: ' + otherId)

    let score = 0

    // same gender
    if (me.gender && other.gender && me.gender === other.gender) {
      score += 100
    }

    // common timeslots
    const mySlots = strToArray(me.timeslot_avail)
    const otherSlots = strToArray(other.timeslot_avail)
    if (overlapCount(mySlots, otherSlots) > 0) {
      score += 100
    }

    // same modules
    const myMods = strToArray(me.modules)
    const otherMods = strToArray(other.modules)
    score += overlapCount(myMods, otherMods)

    // same degree
    if (me.degree && other.degree && me.degree === other.degree) {
      score += 1
    }

    // close study hours
    const myStudy = Number(me.study_hours ?? 0)
    const otherStudy = Number(other.study_hours ?? 0)
    if (Math.abs(myStudy - otherStudy) <= 2) {
      score += 1
    }

    console.log(`✅ [${meId}] vs [${otherId}] → Final score: ${score}`)
    return score
  } catch (err) {
    console.error('Error computing match score:', err)
    return -1
  }
}

export const useMatchStore = defineStore('match', () => {
  // ---------- State ----------
  const stage = ref<Stage>('landing')
  const resultAccepted = ref(false)

  const currentMatchId = ref<string | null>(null)
  const chatId = ref<string | null>(null)
  const availability = ref<string>('')

  const match = ref<Match>({
    subject: 'WAD2',
    description: 'Homework discussion and review',
    time: '3:30 PM - 4:30 PM',
    duration: '1 hour',
    location: 'Library Level 2, Study Room 3',
    partner: { name: '', photo: null, description: null },
  })

  const partnerInitials = computed(() =>
    match.value.partner.name
      .split(' ')
      .map(p => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
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
      match: { ...match.value },
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
      if (typeof data.availability === 'string') availability.value = data.availability
      if (data.match) {
        match.value = {
          subject: data.match.subject ?? match.value.subject,
          description: data.match.description ?? match.value.description,
          time: data.match.time ?? match.value.time,
          duration: data.match.duration ?? match.value.duration,
          location: data.match.location ?? match.value.location,
          partner: {
            name: data.match.partner?.name ?? match.value.partner.name,
            photo: data.match.partner?.photo ?? null,
            description: data.match.partner?.description ?? null,
          },
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

  // ---------- Countdown helpers ----------
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

  // ---------- Queue helpers ----------
  async function putUserBackToQueue(userId: string) {
    await supabase.from('match_queue').upsert(
      {
        user_id: userId,
        status: 'idle',
        room_id: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  }

  async function leaveQueue() {
    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id
    if (!myId) return

    const { error } = await supabase.from('match_queue').delete().eq('user_id', myId)
    if (error) {
      console.warn('[match] leaveQueue failed', error)
    }
  }

 // 1) keep this: symmetric write
async function recordRejection(myId: string, otherId?: string | null) {
  if (!otherId) return
  const now = new Date().toISOString()

  await supabase
    .from('match_rejects')
    .upsert(
      [
        // I rejected them
        {
          user_id: myId,
          rejected_user_id: otherId,
          created_at: now,
        },
        // they were rejected by me (so their UI can also block me)
        {
          user_id: otherId,
          rejected_user_id: myId,
          created_at: now,
        },
      ],
      { onConflict: 'user_id,rejected_user_id' }
    )
}

  // 2) 🔧 FIXED: clear BOTH directions involving me
  async function clearMyRejections() {
  const { data: auth } = await supabase.auth.getUser()
  const myId = auth?.user?.id
  if (!myId) return

  const { error } = await supabase
    .from('match_rejects')
    .delete()
    // delete rows where:
    // - I am the one rejecting  (user_id = me)
    // - OR I was the one rejected (rejected_user_id = me)
    .or(`user_id.eq.${myId},rejected_user_id.eq.${myId}`)

  if (error) {
    console.warn('[match] clearMyRejections failed:', error)
  }
}

  // ---------- Accept / decline ----------
  async function acceptMatch() {
    stopCountdown()
    resultAccepted.value = true
    if (!chatId.value) {
      chatId.value = crypto.randomUUID?.() ?? `chat-${Date.now()}`
    }
    stage.value = 'chat'
    persist()
  }

  async function declineMatch(partnerId?: string | null, autoRematch = false) {
    stopCountdown()
    resultAccepted.value = false

    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id ?? null

    // delete the room
    if (currentMatchId.value) {
      await supabase.from('match_room').delete().eq('id', currentMatchId.value)
    }

    // put myself back to queue + record the rejection
    if (myId) {
      await putUserBackToQueue(myId)
      if (partnerId) {
        await recordRejection(myId, partnerId)
      }
    }

    // also put partner back to queue so they can match others
    if (partnerId) {
      await putUserBackToQueue(partnerId)
    }

    match.value.partner = { name: '', photo: null, description: null }
    currentMatchId.value = null

    if (autoRematch) {
      console.log('autoRematch [TRUE]')
      stage.value = 'searching'
      queueAndPoll().catch(err => console.error('[match] auto-rematch failed', err))
    } else {
      console.log('autoRematch [FALSE]')
      stage.value = 'result'
      persist()
    }
  }

  function startOver() {
    stopCountdown()
    // make sure I am not a ghost in queue
    leaveQueue().catch(err => console.warn('[match] leaveQueue in startOver failed', err))

    stage.value = 'landing'
    messages.value = seedMessages()
    draft.value = ''
    currentMatchId.value = null
    chatId.value = null
    match.value.partner = { name: '', photo: null, description: null }
    persist()
  }

  function goToChat() {
    stage.value = 'chat'
    if (!chatId.value) chatId.value = crypto.randomUUID?.() ?? `chat-${Date.now()}`
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

  // ---------- Cache / ensure ----------
  async function hydrateFromCache() {
    const ok = restore()
    if (!currentMatchId.value && stage.value !== 'landing') stage.value = 'landing'
    return ok
  }

  async function ensureMatch(id?: string) {
    if (id) {
      currentMatchId.value = id
      match.value.id = id
    }
    if (!currentMatchId.value) return false
    persist()
    return true
  }

  async function ensureChat(id?: string) {
    if (id) chatId.value = id
    if (!chatId.value) chatId.value = crypto.randomUUID?.() ?? `chat-${Date.now()}`
    persist()
    return true
  }

  // ---------- availability ----------
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
      .update({ timeslot_avail: slotsString })
      .eq('user_id', myId)
    if (updErr) console.error('[match] failed to update timeslot_avail', updErr)
    persist()
  }

  const availabilityList = computed(() => strToArray(availability.value))

  // ---------- profile / blocked ----------
  async function getMyProfile() {
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr) {
      console.warn('[match] getMyProfile auth error', authErr)
      return null
    }
    const userId = auth?.user?.id
    if (!userId) return null

    const { data: prof, error } = await supabase
      .from('profiles')
      .select(
        'user_id, username, email, profile_photo, personality, gender, avg_rating, rating_count, created_at, modules, study_hours, degree, timeslot_avail'
      )
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      console.warn('[match] getMyProfile error', error)
      return null
    }
    if (!prof) return null
    return { userId, profile: prof }
  }

  // 3) keep this, it now works with the fixed clear
  async function getBlockedFor(meId: string): Promise<Set<string>> {
  const { data: iRejected } = await supabase
    .from('match_rejects')
    .select('rejected_user_id')
    .eq('user_id', meId)

  const { data: rejectedMe } = await supabase
    .from('match_rejects')
    .select('user_id')
    .eq('rejected_user_id', meId)

  const blocked = new Set<string>()
  ;(iRejected ?? []).forEach(r => blocked.add(r.rejected_user_id))
  ;(rejectedMe ?? []).forEach(r => blocked.add(r.user_id))
  return blocked
}

  async function getIdleOthers(myId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('match_queue')
      .select('user_id')
      .eq('status', 'idle')
      .neq('user_id', myId)
    if (error) {
      console.error('[match] getIdleOthers → query failed', error)
      return []
    }
    return (data ?? []).map(row => row.user_id)
  }

  // ---------- room helpers ----------
  async function findRoomForMe(myId: string): Promise<string | null> {
    const nowIso = new Date().toISOString()
    const { data, error } = await supabase
      .from('match_room')
      .select('id, user1, user2, created_at, expires_at')
      .or(`user1.eq.${myId},user2.eq.${myId}`)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) {
      console.warn('[match] findRoomForMe → error', error)
      return null
    }
    if (!data || !data.length) return null
    const room = data[0]

    // ignore expired rooms
    if (room.expires_at && room.expires_at < nowIso) {
      return null
    }

    console.log(`📦 Found existing active room for ${myId}:`, room.id)
    return room.id as string
  }

  // find if user has an active (non-expired) room → used by MatchLandingView to auto-redirect
  async function getActiveRoom(): Promise<{ id: string; user1: string; user2: string } | null> {
    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id
    if (!myId) return null

    const nowIso = new Date().toISOString()

    const { data, error } = await supabase
      .from('match_room')
      .select('id, user1, user2, expires_at')
      .or(`user1.eq.${myId},user2.eq.${myId}`)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !data || !data.length) return null

    const room = data[0]
    if (room.expires_at && room.expires_at < nowIso) {
      // expired → ignore
      return null
    }

    return room
  }

  // purge my expired rooms → run before matchmaking
  async function purgeMyExpiredRooms(myId: string) {
    const nowIso = new Date().toISOString()
    await supabase
      .from('match_room')
      .delete()
      .or(`user1.eq.${myId},user2.eq.${myId}`)
      .lt('expires_at', nowIso)
  }

  // ---------- matchmaker ----------
  async function findBestCandidateForMe(
    myId: string,
    myProfile: any
  ): Promise<{ user_id: string } | null> {
    console.log(`🔍 Finding best candidate for ${myId}...`)

    const blocked = await getBlockedFor(myId)

    const { data: others, error: othersErr } = await supabase
      .from('match_queue')
      .select('user_id')
      .eq('status', 'idle')
      .neq('user_id', myId)
    if (othersErr) {
      console.warn('[match] findBestCandidateForMe → queue error', othersErr)
      return null
    }
    if (!others || others.length === 0) {
      console.log('⚠️ No other idle users in queue.')
      return null
    }

    const candidateIds = others
      .map(o => o.user_id)
      .filter(cid => !blocked.has(cid))

    if (!candidateIds.length) {
      console.log('🚫 Everyone in queue is blocked (mutual rejections).')
      return null
    }

    const scored = await Promise.all(
      candidateIds.map(async (cid: string) => {
        console.log(` [START] Going to find score for ${myId} and ${cid}`)
        const score = await computeMatchScore(myId, cid)
        console.log(` [END] Found score for ${myId} and ${cid}`)
        return { user_id: cid, score }
      })
    )

    const eligible = scored.filter(s => s.score >= 200)
    if (!eligible.length) {
      console.log('🚫 No candidate reached score ≥ 200. Will not match.')
      return null
    }
    eligible.sort((a, b) => b.score - a.score)
    const best = eligible[0]
    console.log(`🏆 Chosen candidate for ${myId}: ${best.user_id}`)
    return { user_id: best.user_id }
  }

  async function queueAndPoll(): Promise<string> {
    stage.value = 'searching'
    const mine = await getMyProfile()
    if (!mine) {
      stage.value = 'landing'
      throw new Error('Not authenticated or profile missing')
    }
    const myId = mine.userId
    const myProfile = mine.profile

    // 1) delete / purge my expired rooms so they don't pull me back
    await purgeMyExpiredRooms(myId)

    // 2) put me in queue
    await supabase.from('match_queue').upsert(
      {
        user_id: myId,
        status: 'idle',
        room_id: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    // helper to create room with LATEST common expiry
    const markMatched = async (partnerId: string): Promise<string | null> => {
      const roomId = globalThis.crypto?.randomUUID?.() ?? String(Date.now())
      const nowIso = new Date().toISOString()

      // load both profiles → get timeslot_avail
      const { data: meProf } = await supabase
        .from('profiles')
        .select('timeslot_avail')
        .eq('user_id', myId)
        .maybeSingle()

      const { data: otherProf } = await supabase
        .from('profiles')
        .select('timeslot_avail')
        .eq('user_id', partnerId)
        .maybeSingle()

      // compute latest common expiry
      let expiresAt = computeLatestCommonExpiry(
        meProf?.timeslot_avail ?? null,
        otherProf?.timeslot_avail ?? null
      )

      // fallback → 2h from now
      if (!expiresAt) {
        const d = new Date()
        d.setHours(d.getHours() + 2)
        expiresAt = d.toISOString()
      }

      await supabase.from('match_room').insert({
        id: roomId,
        user1: myId,
        user2: partnerId,
        created_at: nowIso,
        expires_at: expiresAt,
      })

      // remove both from queue
      await supabase.from('match_queue').delete().in('user_id', [myId, partnerId])

      // load partner display
      const { data: prof } = await supabase
        .from('profiles')
        .select('username, profile_photo, personality')
        .eq('user_id', partnerId)
        .maybeSingle()
      if (prof?.username) {
        match.value.partner = {
          name: prof.username,
          photo: prof.profile_photo,
          description: prof.personality ?? null,
        }
      }

      stage.value = 'match'
      startCountdown(() => declineMatch(partnerId))
      persist()
      return roomId
    }

    // 3) try immediate match
    const best = await findBestCandidateForMe(myId, myProfile)
    if (best?.user_id) {
      console.log(`💞 Immediate match found: ${myId} ↔ ${best.user_id}`)
      const rid = await markMatched(best.user_id)
      if (rid) {
        currentMatchId.value = rid
        match.value.id = rid
        return rid
      }
    } else {
      console.log('⏳ No immediate candidate, will poll...')
    }

    // 4) poll for 15s
    const deadline = Date.now() + 15_000
    while (Date.now() < deadline) {
      // did someone else match me?
      const existingRoomId = await findRoomForMe(myId)
      if (existingRoomId) {
        console.log(`📦 Someone matched me → room ${existingRoomId}`)

        // even if matched by someone else, make sure I'm not lingering in queue
        await supabase.from('match_queue').delete().eq('user_id', myId)

        currentMatchId.value = existingRoomId
        match.value.id = existingRoomId

        await setPartnerFromRoom(existingRoomId)
        stage.value = 'match'
        startCountdown(() => declineMatch())
        persist()
        return existingRoomId
      }

      // else, re-evaluate possible candidates
      const polled = await findBestCandidateForMe(myId, myProfile)
      if (polled?.user_id) {
        console.log(`💞 Polled match found: ${myId} ↔ ${polled.user_id}`)
        const rid = await markMatched(polled.user_id)
        if (rid) {
          currentMatchId.value = rid
          match.value.id = rid
          return rid
        }
      }

      await new Promise(r => setTimeout(r, 2000))
    }

    // 5) no match found → show notfound
    await supabase.from('match_queue').upsert(
      {
        user_id: myId,
        status: 'idle',
        room_id: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    stage.value = 'notfound'
    persist()
    console.log('🚫 No suitable match (score < 200) → showing notfound screen.')
    return ''
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
      .select('username, profile_photo, personality')
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
        description: partner.personality ?? null,
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
      .select('username, profile_photo, personality')
      .eq('user_id', partnerId)
      .single()

    if (prof?.username) {
      match.value.partner = {
        name: prof.username,
        photo: prof.profile_photo,
        description: prof.personality ?? null,
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
    getIdleOthers,
    clearMyRejections,
    leaveQueue,
    getActiveRoom,        // 👈 for landing auto-redirect
  }
})
