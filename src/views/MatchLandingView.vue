<!-- src/views/MatchLandingView.vue -->
<template>
  <div v-if="showUI" class="match-landing-container">
    <!--NOTICE BANNER-->
    <div v-if="store.landingNotice" class="notice-banner">
      <span>{{ store.landingNotice }}</span>
      <button class="notice-close" @click="store.clearLandingNotice()">×</button>
    </div>

    <!-- LANDING / FORM -->
    <div v-if="store.stage === 'landing'" class="match-form">
      <div class="match-header">
        <h1 class="match-title">Find Your Study Partner</h1>
        <p class="match-subtitle">
          Tell us when you're free, then we’ll match you 👇
        </p>
      </div>

      <!-- Time slot selector -->
      <div class="slots-grid">
        <button
          v-for="slot in timeSlots"
          :key="slot.id"
          type="button"
          @click="toggleSlot(slot.id)"
          class="slot-btn"
          :class="{ 'slot-btn--active': selectedSlots.includes(slot.id) }"
        >
          <span class="slot-title">{{ slot.label }}</span>
          <span class="slot-window">{{ slot.window }}</span>
        </button>
      </div>

      <!-- Start button -->
      <div class="match-start">
        <Button
          class="start-btn"
          size="large"
          :disabled="selectedSlots.length === 0"
          @click="onStart"
          label="Start Matchmaking"
        />
        <p v-if="selectedSlots.length === 0" class="error-hint">
          Pick at least one time slot to continue.
        </p>
      </div>
    </div>

    <!-- MATCH NOT FOUND STATE -->
    <div v-else-if="store.stage === 'notfound'" class="match-notfound">
      <h2 class="match-title-sm">No Match Found 😞</h2>
      <p class="match-subtitle">
        Nobody met the minimum compatibility score (≥ 200) right now.
        You can try again later — we kept your availability.
      </p>
      <Button class="mt-4" label="Try Again" @click="backToLanding" />
    </div>

    <!-- SEARCHING STATE -->
    <div v-else class="match-searching">
      <ProgressSpinner style="width:4rem;height:4rem" strokeWidth="4" />
      <h2 class="match-title-sm">Finding Your Perfect Study Match</h2>
      <p class="match-subtitle">Searching for classmates with similar study goals...</p>
      <div class="dots">
        <span class="dot"></span>
        <span class="dot delay-150"></span>
        <span class="dot delay-300"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchStore } from '@/stores/match'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const store = useMatchStore()

// 🔁 Change this if your route name/path differs
const CHAT_ROUTE = { name: 'matchchat' }

const timeSlots = [
  { id: 'slot_morning',   label: 'Morning',   window: '8:30am – 11:30am' },
  { id: 'slot_midday',    label: 'Midday',    window: '12:00pm – 3:00pm' },
  { id: 'slot_afternoon', label: 'Afternoon', window: '3:30pm – 6:30pm' },
  { id: 'slot_evening',   label: 'Evening',   window: '7:00pm – 10:00pm' },
]

const selectedSlots = ref<string[]>([])

function callGetIdleOthers(myId: string) {
  store.getIdleOthers(myId)
}

/**
 * If the user already has an active chat, send them there.
 * Cache-first (store), then DB lookup for match_room with non-null session_id.
 */
async function redirectIfActiveChat() {
  // hydrate cache if present
  await store.hydrateFromCache()

  // If store already knows we’re in chat, go there
  if (store.stage === 'chat' && (store.currentMatchId || store.sessionId)) {
    await store.loadPartnerForCurrent()
    await store.initVerificationForCurrentRoom()
    router.replace(CHAT_ROUTE)
    return true
  }

  // Otherwise, check DB for any established session
  const { data: auth } = await supabase.auth.getUser()
  const myId = auth?.user?.id
  if (!myId) return false

  const { data: rooms, error } = await supabase
    .from('match_room')
    .select('id, session_id, created_at')
    .or(`user1.eq.${myId},user2.eq.${myId}`)
    .not('session_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.warn('[landing] active chat lookup failed:', error)
    return false
  }

  if (rooms && rooms.length) {
    const rid = rooms[0].id as string
    store.currentMatchId = rid
    store.match.id = rid as any
    store.stage = 'chat'
    await store.ensureChat()
    await store.setPartnerFromRoom(rid)
    await store.initVerificationForCurrentRoom()
    router.replace(CHAT_ROUTE)
    return true
  }

  return false
}

/**
 * Prefill the user's last chosen timeslots
 */
const showUI = ref(false)
onMounted(async () => {
  // 0) auto-redirect if already in an active chat
  await new Promise(r => setTimeout(r, 0))
  const jumped = await redirectIfActiveChat()
  if (jumped) return
  showUI.value = true

  // 1) try to restore from store (now store keeps string, so use availabilityList)
  if (store.availabilityList.length > 0) {
    selectedSlots.value = [...store.availabilityList]
    return
  }

  // 2) else load from Supabase
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id
  if (!userId) return

  const { data: prof, error } = await supabase
    .from('profiles')
    .select('timeslot_avail')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.warn('[matchlanding] Could not load previous timeslot_avail:', error)
    return
  }

  const val = prof?.timeslot_avail
  if (typeof val === 'string' && val.trim() !== '') {
    selectedSlots.value = val.split(',').map(v => v.trim())
  } else if (Array.isArray(val)) {
    selectedSlots.value = val
  }
})

function toggleSlot(id: string) {
  if (selectedSlots.value.includes(id)) {
    selectedSlots.value = selectedSlots.value.filter(s => s !== id)
  } else {
    selectedSlots.value = [...selectedSlots.value, id]
  }
}

function backToLanding() {
  store.stage = 'landing'
}

async function onStart() {
  if (selectedSlots.value.length === 0) return

  // 1️ save selected slots
  await store.setAvailability(selectedSlots.value)
  // 2️ clear my old rejections so I can be matched with them again
  await store.clearMyRejections()

  // 3 show searching UI
  store.stage = 'searching'

  try {
    // 4 try to match
    const roomId = await store.queueAndPoll()

    // if store couldn't find ≥200, it will set stage='notfound' and return ''
    if (!roomId) {
      // we let the template show the notfound state
      return
    }

    // 5 go to decision page
    router.push({ name: 'matchdecision', params: { id: roomId } })
  } catch (err: any) {
    console.error('[matchlanding] matchmaking failed', err)

    // if no profile / not logged in
    if (err?.message === 'Not authenticated or profile missing') {
      router.push({ name: 'profilesetup' })
    } else {
      // generic failure → go back to landing
      store.stage = 'landing'
    }
  }
}
</script>

<style scoped>
.match-landing-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.match-form {
  text-align: center;
  width: 100%;
  max-width: 650px;
}

.match-header {
  margin-bottom: 1.5rem;
}

.match-title {
  font-size: 2.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.match-subtitle {
  font-size: 1rem;
  color: var(--color-text);
  opacity: 0.8;
}

/* slots */
.slots-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 1.5rem;
}

.slot-btn {
  position: relative;
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease;
}

.slot-btn:hover {
  border-color: var(--color-border-hover);
  background: var(--color-background-mute);
}

.slot-btn--active {
  background-color: #22c55e !important;
  border-color: #22c55e !important;
  color: #fff !important;
  box-shadow: 0 2px 10px rgba(34, 197, 94, 0.3);
  transform: translateY(-1px);
}

.slot-btn:active {
  transform: scale(0.97);
  background-color: var(--color-border-hover);
}
.slot-btn--active:active {
  background-color: #16a34a !important;
  border-color: #16a34a !important;
}

/* start button */
.match-start {
  margin-top: 1rem;
}
.start-btn {
  background: #22c55e !important;
  border-color: #22c55e !important;
  color: #fff !important;
  font-weight: 600;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.start-btn:hover {
  background: #16a34a !important;
  border-color: #16a34a !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(34, 197, 94, 0.25);
}
.start-btn:active {
  transform: scale(0.97);
}
.start-btn:disabled {
  background: rgba(34, 197, 94, 0.4) !important;
  border-color: rgba(34, 197, 94, 0.4) !important;
  color: #fff !important;
  opacity: 1 !important;
  cursor: not-allowed;
}

.error-hint {
  font-size: 0.8rem;
  color: #f43f5e;
  margin-top: 0.5rem;
}

/* searching */
.match-searching {
  text-align: center;
  color: var(--color-text);
}
.match-title-sm {
  font-size: 1.6rem;
  font-weight: 600;
  margin-top: 1rem;
}
.dots {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.75rem;
}
.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: #22c55e;
  animation: pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite;
}
.delay-150 { animation-delay: 150ms; }
.delay-300 { animation-delay: 300ms; }
@keyframes pulse {
  50% { opacity: 0.4; }
}

/* notfound */
.match-notfound {
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}
.match-notfound .match-title-sm {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.notice-banner {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem 0.75rem 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  z-index: 9999;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}

.notice-close {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: inherit;
}
</style>
