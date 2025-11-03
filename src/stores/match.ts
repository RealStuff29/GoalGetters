// src/stores/match.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Stage = 'landing' | 'searching' | 'match' | 'result' | 'chat' | 'notfound'
type Message = { 
  id: string
  from: 'me' | 'them'
  text: string
  created_at: string
  sender_id: string
}
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

// ---------------- helpers ----------------
function strToArray(val: string | string[] | null | undefined): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean).map(v => v.trim())
  return val.split(',').map(v => v.trim()).filter(Boolean)
}

function overlapCount(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const setB = new Set(b)
  return a.reduce((cnt, it) => (setB.has(it) ? cnt + 1 : cnt), 0)
}

// Human-friendly verify word (two short words + 3 digits)
function generateVerifyCode(): string {
  const words = [
    'lime','mango','panda','pixel','sun','mint','nova','aqua','dawn','orb',
    'kite','nori','pebble','quartz','sonic','terra','ultra','vapor','willow','zen'
  ]
  const w1 = words[Math.floor(Math.random() * words.length)]
  const w2 = words[Math.floor(Math.random() * words.length)]
  const n = Math.floor(100 + Math.random() * 900) // 100-999
  return `${w1}-${w2}-${n}`
}

// ============ scoring rules (IDs only) ============
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

    // +100 same gender
    if (me.gender && other.gender && me.gender === other.gender) {
      score += 100
    }

    // +100 timeslot overlap
    const mySlots = strToArray(me.timeslot_avail)
    const otherSlots = strToArray(other.timeslot_avail)
    if (overlapCount(mySlots, otherSlots) > 0) {
      score += 100
    }

    // +1 per common mod
    const myMods = strToArray(me.modules)
    const otherMods = strToArray(other.modules)
    score += overlapCount(myMods, otherMods)

    // +1 same degree
    if (me.degree && other.degree && me.degree === other.degree) {
      score += 1
    }

    // +1 similar study hours
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
  const landingNotice = ref<string | null>(null)
  const booting = ref<boolean>(false)                 // NEW: suppress UI while resuming

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

  // --- Verification state ---
  const verifyWordInput = ref<string>('')
  const verifyDriftTimer = ref<number | null>(null)
  const verifyMessage = ref<string>('')
  const myVerified = ref<boolean>(false)
  const partnerVerified = ref<boolean>(false)
  const myVerifyField = ref<'verified_a' | 'verified_b'>('verified_a')
  const partnerVerifyField = ref<'verified_a' | 'verified_b'>('verified_b')
  const roomVerifyCode = ref<string>('')
  const sessionId = ref<string | null>(null)

  // live subscription handle
  let roomSub: ReturnType<typeof supabase.channel> | null = null

  // figure out which side I am (A or B) for this room
  async function resolveSides(roomId: string) {
    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id
    if (!myId) throw new Error('Not authenticated')

    // Debug: Check all rooms
    const { data: allRooms, error: listError } = await supabase
      .from('match_room')
      .select('*')
    
    console.log('All rooms:', allRooms)
    console.log('List error:', listError)
    console.log('Looking for:', roomId)
    console.log('My user ID:', myId)
    console.log('Actual room IDs:', allRooms?.map(r => r.id))

    const { data: room, error } = await supabase
      .from('match_room')
      .select('user1, user2')
      .eq('id', roomId)
      .maybeSingle()

    if (error) throw new Error(`Database error: ${error.message}`)
    if (!room) throw new Error(`No match_room found with id: ${roomId}`)

    const amA = room.user1 === myId
    myVerifyField.value = amA ? 'verified_a' : 'verified_b'
    partnerVerifyField.value = amA ? 'verified_b' : 'verified_a'
  }

  // pull the latest verification fields for the room
  async function loadVerification(roomId: string) {
    await resolveSides(roomId)

    const { data: row, error } = await supabase
      .from('match_room')
      .select('verify_code, verified_a, verified_b, session_id')
      .eq('id', roomId)
      .maybeSingle()

    if (error || !row) {
      console.warn('[verify] loadVerification error', error)
      return
    }
    roomVerifyCode.value = row.verify_code || ''
    myVerified.value = Boolean(row[myVerifyField.value])
    partnerVerified.value = Boolean(row[partnerVerifyField.value])
    sessionId.value = row.session_id ?? null
  }

  // attempt verification with the word I typed
  async function submitVerification(): Promise<{ ok: boolean; msg: string }> {
    verifyMessage.value = ''
    const rid = currentMatchId.value || match.value.id
    if (!rid) return { ok: false, msg: 'No room id' }

    // ensure sides & latest row
    await loadVerification(rid)

    // check word
    const word = (verifyWordInput.value || '').trim()
    if (!word) {
      verifyMessage.value = 'Enter the verification word.'
      return { ok: false, msg: verifyMessage.value }
    }

    if (word.toLowerCase() !== (roomVerifyCode.value || '').toLowerCase()) {
      verifyMessage.value = 'Incorrect word. Try again.'
      return { ok: false, msg: verifyMessage.value }
    }

    // set my side = true
    const myField = myVerifyField.value

    const { error: updErr } = await supabase
      .from('match_room')
      .update({ [myField]: true })
      .eq('id', rid)

    if (updErr) {
      console.warn('[verify] update my verified flag failed', updErr)
      verifyMessage.value = 'Could not save verification.'
      return { ok: false, msg: verifyMessage.value }
    }

    // re-read to see if partner is verified too
    const { data: after, error: afterErr } = await supabase
      .from('match_room')
      .select('verified_a, verified_b, session_id')
      .eq('id', rid)
      .maybeSingle()

    if (afterErr || !after) {
      verifyMessage.value = 'Verified on your side. Waiting for partner.'
      // follow-up nudge in case realtime drops
      setTimeout(() => { const rid2 = currentMatchId.value || match.value.id; if (rid2) loadVerification(rid2) }, 1200)
      return { ok: true, msg: verifyMessage.value }
    }

    const both = Boolean(after.verified_a) && Boolean(after.verified_b)

    // if both verified and no session_id, create one
    if (both && !after.session_id) {
      const newSess = crypto.randomUUID?.() ?? `sess-${Date.now()}`
      const { error: sessErr } = await supabase
        .from('match_room')
        .update({ session_id: newSess })
        .eq('id', rid)
      if (!sessErr) sessionId.value = newSess
    }

    // update local flags
    myVerified.value = Boolean(after[myVerifyField.value])
    partnerVerified.value = Boolean(after[partnerVerifyField.value])

    verifyMessage.value = both
      ? 'Both verified. Session ready!'
      : 'Verified on your side. Waiting for partner.'

    // light nudges to pick up partner's update shortly after mine
    setTimeout(() => { const rid2 = currentMatchId.value || match.value.id; if (rid2) loadVerification(rid2) }, 1200)
    setTimeout(() => { const rid3 = currentMatchId.value || match.value.id; if (rid3) loadVerification(rid3) }, 3000)

    return { ok: true, msg: verifyMessage.value }
  }

  // realtime subscription so the tags flip without refresh
  async function subscribeVerification(roomId: string) {
    if (roomSub) {
      try { await roomSub.unsubscribe() } catch {}
      roomSub = null
    }

    roomSub = supabase
      .channel(`match_room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'match_room', filter: `id=eq.${roomId}` },
        async payload => {
          const row: any = payload.new
          if (!row) return

          // Fast path
          roomVerifyCode.value  = row.verify_code ?? roomVerifyCode.value
          myVerified.value      = Boolean(row[myVerifyField.value])
          partnerVerified.value = Boolean(row[partnerVerifyField.value])
          sessionId.value       = row.session_id ?? sessionId.value

          // Safety re-read
          const { data: latest, error } = await supabase
            .from('match_room')
            .select('verify_code, verified_a, verified_b, session_id')
            .eq('id', roomId)
            .maybeSingle()
          if (!error && latest) {
            roomVerifyCode.value  = latest.verify_code ?? roomVerifyCode.value
            myVerified.value      = Boolean(latest[myVerifyField.value])
            partnerVerified.value = Boolean(latest[partnerVerifyField.value])
            sessionId.value       = latest.session_id ?? sessionId.value
          }

          if (myVerified.value && partnerVerified.value) {
            verifyMessage.value = 'Both verified. Session ready!'
          } else if (myVerified.value) {
            verifyMessage.value = 'Verified on your side. Waiting for partner.'
          }
        }
      )
      .subscribe()
  }

  // unsubscribe + stop polling
  async function teardownVerification() {
    if (roomSub) {
      try { await roomSub.unsubscribe() } catch {}
      roomSub = null
    }
    if (verifyDriftTimer.value) {
      clearInterval(verifyDriftTimer.value)
      verifyDriftTimer.value = null
    }
  }

  // helper to init the whole verification panel when you enter chat
  async function initVerificationForCurrentRoom() {
    const rid = currentMatchId.value || match.value.id
    if (!rid) return
    await loadVerification(rid)
    await subscribeVerification(rid)

    // one-shot refresh shortly after init
    setTimeout(() => { loadVerification(rid) }, 1500)

    // short-lived fallback polling to catch races
    startVerifyDriftFix()
  }

  async function refreshVerificationNow() {
    const rid = currentMatchId.value || match.value.id
    if (!rid) return
    await loadVerification(rid)
  }

  async function startVerifyDriftFix() {
    // clear any previous timer
    if (verifyDriftTimer.value) {
      clearInterval(verifyDriftTimer.value)
      verifyDriftTimer.value = null
    }
    const rid = currentMatchId.value || match.value.id
    if (!rid) return

    const start = Date.now()
    verifyDriftTimer.value = window.setInterval(async () => {
      // stop if both are verified
      if (myVerified.value && partnerVerified.value) {
        clearInterval(verifyDriftTimer.value!)
        verifyDriftTimer.value = null
        return
      }
      // hard stop after ~15s
      if (Date.now() - start > 15000) {
        clearInterval(verifyDriftTimer.value!)
        verifyDriftTimer.value = null
        return
      }
      await loadVerification(rid)
    }, 1200) as unknown as number
  }

  function stopVerifyDriftFix() {
    if (verifyDriftTimer.value) {
      clearInterval(verifyDriftTimer.value)
      verifyDriftTimer.value = null
    }
  }

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

  // ---------- Chat (UPDATED FOR REAL-TIME) ----------
  const draft = ref('')
  const messages = ref<Message[]>([])
  let realtimeChannel: RealtimeChannel | null = null

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
      landingNotice: landingNotice.value,
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
      landingNotice.value = data.landingNotice ?? null
      return true
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
      return false
    }
  }

  watch([stage, resultAccepted, currentMatchId, chatId, match, availability], persist, { deep: true })

  // ---------- REAL-TIME CHAT FUNCTIONS ----------
  
  /**
   * Load existing messages from the database
   */
  async function loadMessages(roomId: string) {
    try {
      const { data: auth } = await supabase.auth.getUser()
      const myId = auth?.user?.id
      if (!myId) {
        console.warn('[chat] Cannot load messages - not authenticated')
        return
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, room_id, sender_id, message_text, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[chat] Error loading messages:', error)
        return
      }

      messages.value = (data || []).map(msg => ({
        id: msg.id,
        from: msg.sender_id === myId ? 'me' : 'them',
        text: msg.message_text,
        created_at: msg.created_at,
        sender_id: msg.sender_id
      }))

      console.log(`📨 Loaded ${messages.value.length} messages for room ${roomId}`)
    } catch (err) {
      console.error('[chat] loadMessages failed:', err)
    }
  }

  /**
   * Subscribe to real-time message updates
   */
  async function subscribeToMessages(roomId: string) {
    try {
      const { data: auth } = await supabase.auth.getUser()
      const myId = auth?.user?.id
      if (!myId) {
        console.warn('[chat] Cannot subscribe - not authenticated')
        return
      }

      // Unsubscribe from previous channel if exists
      if (realtimeChannel) {
        await supabase.removeChannel(realtimeChannel)
        realtimeChannel = null
      }

      // Create new channel for this room
      realtimeChannel = supabase
        .channel(`room:${roomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${roomId}`
          },
          (payload) => {
            console.log('💬 New message received:', payload)
            
            const newMsg = payload.new as any
            
            // Add to messages array
            messages.value.push({
              id: newMsg.id,
              from: newMsg.sender_id === myId ? 'me' : 'them',
              text: newMsg.message_text,
              created_at: newMsg.created_at,
              sender_id: newMsg.sender_id
            })
          }
        )
        .subscribe((status) => {
          console.log(`🔌 Realtime subscription status: ${status}`)
        })

      console.log(`📡 Subscribed to room: ${roomId}`)
    } catch (err) {
      console.error('[chat] subscribeToMessages failed:', err)
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  async function unsubscribeFromMessages() {
    if (realtimeChannel) {
      await supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
      console.log('🔌 Unsubscribed from realtime messages')
    }
  }

  /**
   * Send a message (persists to database, triggers realtime update)
   */
  async function sendMessage(text: string) {
    const t = text.trim()
    if (!t) return

    try {
      const { data: auth } = await supabase.auth.getUser()
      const myId = auth?.user?.id
      if (!myId) {
        console.warn('[chat] Cannot send message - not authenticated')
        return
      }

      const roomId = currentMatchId.value || match.value.id
      if (!roomId) {
        console.warn('[chat] Cannot send message - no room ID')
        return
      }

      // Insert message into database (this will trigger realtime update)
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: myId,
          message_text: t,
        })

      if (error) {
        console.error('[chat] Error sending message:', error)
        return
      }

      console.log('✉️ Message sent successfully')
    } catch (err) {
      console.error('[chat] sendMessage failed:', err)
    }
  }

  /**
   * Initialize chat when entering chat view
   */
  async function initializeChat(roomId: string) {
    try {
      messages.value = [] // Clear existing messages
      await loadMessages(roomId) // Load history
      await subscribeToMessages(roomId) // Subscribe to new messages
      console.log('💬 Chat initialized for room:', roomId)
    } catch (err) {
      console.error('[chat] initializeChat failed:', err)
    }
  }

  /**
   * Cleanup chat when leaving
   */
  async function cleanupChat() {
    await unsubscribeFromMessages()
    messages.value = []
    console.log('🧹 Chat cleaned up')
  }

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

  function setLandingNotice(msg: string) {
    landingNotice.value = msg
    persist()
  }

  function clearLandingNotice() {
    landingNotice.value = null
    persist()
  }

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

  async function recordRejection(myId: string, otherId?: string | null) {
    if (!otherId) return
    const now = new Date().toISOString()

    await supabase
      .from('match_rejects')
      .upsert(
        [
          { user_id: myId, rejected_user_id: otherId, created_at: now },
          { user_id: otherId, rejected_user_id: myId, created_at: now },
        ],
        { onConflict: 'user_id,rejected_user_id' }
      )
  }

  async function clearMyRejections() {
    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id
    if (!myId) return

    const { error } = await supabase.from('match_rejects').delete().eq('user_id', myId)
    if (error) console.warn('[match] clearMyRejections failed:', error)
  }

  // view calls this to check if the other side rejected me
  async function checkIfPartnerRejected(partnerId?: string | null): Promise<boolean> {
    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id
    if (!myId || !partnerId) return false

    const { data, error } = await supabase
      .from('match_rejects')
      .select('user_id')
      .eq('user_id', partnerId)
      .eq('rejected_user_id', myId)
      .maybeSingle()

    if (error) {
      console.warn('[match] checkIfPartnerRejected error:', error)
      return false
    }
    return !!data
  }

  // cleanly kick user out of chat if partner leaves
  async function forceLeaveChat(msg?: string) {
    stopCountdown()
    if (msg) landingNotice.value = msg

    stage.value = 'landing'
    resultAccepted.value = false
    currentMatchId.value = null
    chatId.value = null
    match.value.partner = { name: '', photo: null, description: null }
    messages.value = []
    persist()
    // also teardown verification channel/poll
    await teardownVerification()
  }

  async function acceptMatch() {
    stopCountdown()
    resultAccepted.value = true
    if (!chatId.value) chatId.value = crypto.randomUUID?.() ?? `chat-${Date.now()}`
    stage.value = 'chat'
    persist()
  }

  async function declineMatch(partnerId?: string | null, autoRematch = false) {
    stopCountdown()
    resultAccepted.value = false

    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id ?? null

    if (currentMatchId.value) {
      await supabase.from('match_room').delete().eq('id', currentMatchId.value)
    }

    if (myId && partnerId) {
      await recordRejection(myId, partnerId)
    }

    if (myId) {
      await putUserBackToQueue(myId)
    }

    match.value.partner = { name: '', photo: null, description: null }
    currentMatchId.value = null

    await teardownVerification()

    if (autoRematch) {
      stage.value = 'searching'
      queueAndPoll().catch(err => console.error('[match] auto-rematch failed', err))
    } else {
      stage.value = 'landing'
      persist()
    }
  }

  function startOver() {
    stopCountdown()
    cleanupChat() // Clean up chat subscriptions
    stage.value = 'landing'
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

  function chooseSpot(spot: Spot) {
    match.value.location = spot.name
    sendMessage(`Let's meet at ${spot.name}.`)
    persist()
  }
  async function validateAndCleanStaleRoom() {
  const roomId = currentMatchId.value || match.value.id
  if (!roomId) return

  // Check if room still exists
  const { data: room } = await supabase
    .from('match_room')
    .select('id')
    .eq('id', roomId)
    .maybeSingle()

  if (!room) {
    console.log('🧹 Clearing stale room from storage')
    currentMatchId.value = null
    match.value.id = undefined
    stage.value = 'landing'
    persist()
  }
  }
  
  async function hydrateFromCache() {
    const ok = restore()
    await validateAndCleanStaleRoom()
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

    const { error: updErr } = await supabase.from('profiles').update({ timeslot_avail: slotsString }).eq('user_id', myId)
    if (updErr) console.error('[match] failed to update timeslot_avail', updErr)
    persist()
  }

  const availabilityList = computed(() => strToArray(availability.value))

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

  async function getBlockedFor(meId: string): Promise<Set<string>> {
    const { data: iRejected } = await supabase.from('match_rejects').select('rejected_user_id').eq('user_id', meId)
    const { data: rejectedMe } = await supabase.from('match_rejects').select('user_id').eq('rejected_user_id', meId)

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

  // Prefer only un-finalized rooms; if you want that filter, add .is('session_id', null)
  async function findRoomForMe(myId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('match_room')
      .select('id, user1, user2, created_at, session_id')
      .or(`user1.eq.${myId},user2.eq.${myId}`)
      .is('session_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) {
      console.warn('[match] findRoomForMe → error', error)
      return null
    }
    if (!data || !data.length) return null
    const room = data[0]
    console.log(`📦 Found existing open room for ${myId}:`, room.id)
    return room.id as string
  }

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

    const candidateIds = others.map(o => o.user_id).filter(cid => !blocked.has(cid))
    if (!candidateIds.length) {
      console.log('🚫 Everyone in queue is blocked (mutual rejections).')
      return null
    }

    const scored = await Promise.all(
      candidateIds.map(async (cid: string) => {
        console.log(` [START] score for ${myId} vs ${cid}`)
        const score = await computeMatchScore(myId, cid)
        console.log(` [END] score for ${myId} vs ${cid}`)
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
    // NOTE: leave showing/hiding UI to the view; this function just does work.
    stage.value = 'searching'
    const mine = await getMyProfile()
    if (!mine) {
      stage.value = 'landing'
      throw new Error('Not authenticated or profile missing')
    }
    const myId = mine.userId
    const myProfile = mine.profile

    await supabase.from('match_queue').upsert(
      { user_id: myId, status: 'idle', room_id: null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

    // Backfill helper for legacy rows
    async function ensureVerifyCodeExists(roomId: string) {
      const { data: row, error } = await supabase
        .from('match_room')
        .select('verify_code')
        .eq('id', roomId)
        .maybeSingle()
      if (error || !row) return
      if (!row.verify_code) {
        const { error: fixErr } = await supabase
          .from('match_room')
          .update({ verify_code: generateVerifyCode() })
          .eq('id', roomId)
        if (fixErr) console.warn('[verify] backfill verify_code failed', fixErr)
      }
    }

    // Create a room (robust to race) and RETURN THE FINAL ROOM ID
    const markMatched = async (partnerId: string): Promise<string | null> => {
      const proposedId = globalThis.crypto?.randomUUID?.() ?? String(Date.now())
      const now = new Date().toISOString()
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()
      const verifyWord = generateVerifyCode()

      try {
        const { error: insErr } = await supabase.from('match_room').insert({
          id: proposedId,
          user1: myId,
          user2: partnerId,
          created_at: now,
          expires_at: expires, // adjust if your column is 'expire_at'
          verify_code: verifyWord,
          verified_a: false,
          verified_b: false,
          session_id: null,
        })
        if (insErr && (insErr as any).code !== '23505') {
          console.error('[match] insert match_room failed', insErr)
          return null
        }
      } catch {}

      // Whether our insert won or not, fetch the SINGLE open room for this pair
      const { data: existing, error: selErr } = await supabase
        .from('match_room')
        .select('id, verify_code')
        .or(`and(user1.eq.${myId},user2.eq.${partnerId}),and(user1.eq.${partnerId},user2.eq.${myId})`)
        .is('session_id', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (selErr || !existing?.length) return null
      const finalId = existing[0].id as string

      // clear both from queue
      await supabase.from('match_queue').delete().in('user_id', [myId, partnerId])

      // set partner card, start timer, etc.
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

      return finalId
    }

    // Try instantaneous match first
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

    // Poll for 15s
    const deadline = Date.now() + 15_000
    while (Date.now() < deadline) {
      const existingRoomId = await findRoomForMe(myId)
      if (existingRoomId) {
        console.log(`📦 Someone matched me → room ${existingRoomId}`)
        currentMatchId.value = existingRoomId
        match.value.id = existingRoomId
        await ensureVerifyCodeExists(existingRoomId)
        await setPartnerFromRoom(existingRoomId)
        stage.value = 'match'
        startCountdown(() => declineMatch())
        persist()
        return existingRoomId
      }

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

    // time out → back to queue idle and show notfound
    await supabase.from('match_queue').upsert(
      { user_id: myId, status: 'idle', room_id: null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

    stage.value = 'notfound'
    persist()
    console.log('🚫 No suitable match (score < 200) → showing notfound screen.')
    return ''
  }

  async function loadPartnerProfile(roomId: string, myId: string) {
    const { data: room } = await supabase.from('match_room').select('user1, user2').eq('id', roomId).single()
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
    console.log('currentMatchId.value:', currentMatchId.value)
    console.log('match.value.id:', match.value.id)
    console.log('match.value:', match.value) // See the whole object
    
    const roomId = currentMatchId.value || match.value.id
    console.log('Using roomId:', roomId)
    
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

    const { data: room } = await supabase.from('match_room').select('user1, user2').eq('id', roomId).single()
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

  // --- resume helpers ---
  async function findActiveSessionForMe(): Promise<{ roomId: string; sessionId: string } | null> {
    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id
    if (!myId) return null

    const { data, error } = await supabase
      .from('match_room')
      .select('id, session_id, created_at')
      .or(`user1.eq.${myId},user2.eq.${myId}`)
      .not('session_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !data?.length) return null
    return { roomId: data[0].id as string, sessionId: data[0].session_id as string }
  }

  async function findOpenRoomForMe(): Promise<string | null> {
    const { data: auth } = await supabase.auth.getUser()
    const myId = auth?.user?.id
    if (!myId) return null
    return await findRoomForMe(myId)
  }

  async function prepareChatFromRoom(roomId: string) {
    currentMatchId.value = roomId
    match.value.id = roomId

    const { data: row } = await supabase
      .from('match_room')
      .select('session_id, verified_a, verified_b')
      .eq('id', roomId)
      .maybeSingle()

    if (row?.session_id) sessionId.value = row.session_id

    await setPartnerFromRoom(roomId)

    stage.value = 'chat'
    resultAccepted.value = true
    if (!chatId.value) chatId.value = crypto.randomUUID?.() ?? `chat-${Date.now()}`
    persist()

    await initVerificationForCurrentRoom()
  }

  // NEW: no-flicker auto-resume
  async function resumeSilently(): Promise<'chat' | 'decision' | 'landing'> {
    booting.value = true
    try {
      const active = await findActiveSessionForMe()
      if (active) {
        await prepareChatFromRoom(active.roomId) // sets stage='chat'
        return 'chat'
      }

      const openRoomId = await findOpenRoomForMe()
      if (openRoomId) {
        // go straight to decision state without showing landing/searching
        await ensureMatch(openRoomId)
        await setPartnerFromRoom(openRoomId)
        stage.value = 'match'
        startCountdown(() => declineMatch())
        persist()
        return 'decision'
      }

      // nothing to resume — stay at landing
      stage.value = 'landing'
      return 'landing'
    } finally {
      booting.value = false
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
    landingNotice,
    booting, // NEW

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

    // verification API
    verifyWordInput,
    verifyMessage,
    myVerified,
    partnerVerified,
    roomVerifyCode,
    sessionId,
    submitVerification,
    initVerificationForCurrentRoom,
    refreshVerificationNow,
    teardownVerification,
    startVerifyDriftFix,
    stopVerifyDriftFix,

    // misc
    checkIfPartnerRejected,
    forceLeaveChat,
    setLandingNotice,
    clearLandingNotice,
    
    // NEW: Chat functions
    initializeChat,
    cleanupChat,
    loadMessages,
    subscribeToMessages,
    unsubscribeFromMessages,

    // resume helpers
    findActiveSessionForMe,
    findOpenRoomForMe,
    prepareChatFromRoom,
    resumeSilently, // NEW
  }
})
