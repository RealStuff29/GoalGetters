<!-- src/views/MatchChatView.vue -->
<template>
  <div class="bg-aura" aria-hidden="true"></div>
  <div class="float float-1" aria-hidden="true"></div>
  <div class="float float-2" aria-hidden="true"></div>
  <div class="float float-3" aria-hidden="true"></div>
  <div
  class="min-h-screen p-4 w-full max-w-6xl mx-auto"
  v-if="store.stage === 'chat'"
  >
    <Tabs value="0">
      <TabList>
        <Tab value="0">Session Details</Tab>
        <Tab value="1">Chat & Map</Tab>
      </TabList>

      <TabPanels>
        <!-- Tab 0: Session Details -->
        <TabPanel value="0">
          <div class="space-y-4 max-w-6xl mx-auto">
            <div class="frame-glow" aria-hidden="true">
              <Card class="partner-card">
                <template #content>
                  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <Avatar :label="store.partnerInitials" shape="circle" class="partner-avatar" />
                      <div>
                        <div class="font-medium">
                          {{ store.match.partner.name || 'Study partner' }}
                        </div>
                        <small class="opacity-70 online-indicator">
                          <span class="pulse-dot"></span>
                          Online now
                        </small>
                      </div>
                    </div>
                    <Button outlined class="find-match-btn" :icon="pi('refresh')" label="Find Another Match" @click="endForBoth" />
                  </div>
                </template>
              </Card>
            </div>

            <!-- Study Session Details and Verification side by side -->
            <div class="grid lg:grid-cols-2 gap-4">
              <!-- Study Session Details -->
              <Card class="detail-card">
                <template #title>
                  <span class="text-base font-medium card-title-glow">
                    <i :class="pi('users')" style="margin-right: 8px;" />
                    Study Session Details
                  </span>
                </template>
                <template #content>
                  <div class="space-y-4">
                    <!-- Common time slots -->
                    <div class="flex items-start gap-3 detail-item">
                      <div>
                        <div class="font-medium mb-1">
                          <i :class="pi('clock')" class="detail-icon" />
                          Common Time Slots
                        </div>
                        <div v-if="commonSlotsLabels.length" class="tags-container">
                          <Tag v-for="s in commonSlotsLabels" :key="s" severity="secondary" :value="s" class="mr-2 mb-2 tag-hover" style="margin-left: 5px;"/>
                        </div>
                        <small v-else class="opacity-70">No overlapping availability yet.</small>
                      </div>
                    </div>

                    <!-- Common modules -->
                    <div class="flex items-start gap-3 detail-item">
                      <div>
                        <div class="font-medium mb-1">
                          <i :class="pi('book')" class="detail-icon" />
                          Common Modules
                        </div>
                        <div v-if="commonModules.length" class="tags-container">
                          <Tag v-for="m in commonModules" :key="m" severity="secondary" :value="m" class="mr-2 mb-2 tag-hover" />
                        </div>
                        <small v-else class="opacity-70">You have no common modules.</small>
                      </div>
                    </div>

                    <!-- Degrees / Schools -->
                    <div class="flex items-start gap-3 detail-item">
                      <div>
                        <div class="font-medium mb-1">
                        <i :class="pi('warehouse')" class="detail-icon" />
                        School / Degree</div>
                        <div class="text-sm">
                          <div><b>You:</b> {{ myDegreeLabel || '-' }}</div>
                          <div><b>Partner:</b> {{ partnerDegreeLabel || '-' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="verify-card">
                <template #title>
                  <span class="text-base font-medium card-title-glow">
                    <i :class="pi('shield')" style="margin-right: 8px;" />
                    Verify Your Partner
                  </span>
                </template>
                <template #content>
                  <div class="space-y-3">
                    <div class="text-sm">
                      <div class="opacity-70 mb-1">Share this word with your partner:</div>

                      <div class="flex items-center gap-2">
                        <div class="verify-code-box">
                          {{ store.roomVerifyCode || '—' }}
                          <Button
                            :disabled="!store.roomVerifyCode"
                            :icon="pi('copy')"
                            text
                            aria-label="Copy"
                            @click="copyCode"
                            class="copy-btn"
                            style="border-radius: 5px;"
                          />
                        </div>
                      </div>

                      <small class="opacity-70">
                        Both of you should enter the <i>same</i> word below to confirm you're talking to the right person.
                      </small>
                    </div>

                    <div class="flex items-center gap-2">
                      <InputText
                        v-model="store.verifyWordInput"
                        placeholder="Enter the shared verification word"
                        class="flex-1 verify-input"
                        :disabled="store.myVerified"
                        @keyup.enter="onVerify"
                        style="width: 300px;"
                      />
                      <Button
                        size="medium"
                        :icon="pi('check')"
                        label="Verify"
                        :disabled="store.myVerified || !store.verifyWordInput"
                        @click="onVerify"
                        style="margin-left: 10px; border-radius: 5px;"
                        class="verify-btn"
                      />
                    </div>

                    <div class="flex items-center gap-2 status-tags">
                      <Tag :severity="store.myVerified ? 'success' : 'danger'"
                          :value="store.myVerified ? 'You: Verified' : 'You: Not verified'"
                          class="status-tag"/>
                      <Tag style="margin-left: 5px;" :severity="store.partnerVerified ? 'success' : 'warn'"
                          :value="store.partnerVerified ? 'Partner: Verified' : 'Partner: Pending'"
                          class="status-tag"/>
                      <Tag style="margin-left: 5px;" v-if="store.sessionId" severity="success" :value="`Session: ${store.sessionId.slice(0,8)}…`" class="status-tag"/>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Time Remaining -->
            <Card v-if="store.myVerified && store.partnerVerified && store.sessionSecondsLeft > 0" class="timer-card">
              <template #title>
                <div class="flex items-center justify-between w-full">
                  <span class="text-base font-medium card-title-glow">
                    <i :class="pi('hourglass')" style="margin-right: 8px;" />
                    Time Remaining
                  </span>
                  <Button outlined icon="pi pi-flag" label="End Session & Review" @click="endAndReview" class="end-btn" />
                </div>
              </template>

              <template #content>
                <div class="flex items-center">
                  <Tag severity="danger" :value="store.sessionCountdownText" class="countdown-tag" />
                </div>

                <small class="block opacity-70 mt-2">
                  Counts down to the end of the current time slot -
                  <b>{{ store.sessionActiveSlotLabel || 'Current slot' }}</b>.
                </small>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- Tab 1: Chat & Map -->
        <TabPanel value="1">
          <div class="space-y-4">
            <!-- Full Width: Partner Status Card at Top -->
            <div class="frame-glow" aria-hidden="true">
              <Card class="partner-card">
                <template #content>
                  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <Avatar :label="store.partnerInitials" shape="circle" class="partner-avatar" />
                      <div>
                        <div class="font-medium">
                          {{ store.match.partner.name || 'Study partner' }}
                        </div>
                        <small class="opacity-70 online-indicator">
                          <span class="pulse-dot"></span>
                          Online now
                        </small>
                      </div>
                    </div>
                    <Button outlined class="find-match-btn" :icon="pi('refresh')" label="Find Another Match" @click="endForBoth" />
                  </div>
                </template>
              </Card>
            </div>

            <!-- Two Column Layout: Chat (Left) and Map (Right) -->
            <div class="grid lg:grid-cols-2 gap-6">
              <!-- Left: Chat -->
              <Card class="chat-card">
                <template #title>
                  <span class="text-base font-medium card-title-glow">
                    <i :class="pi('comments')" style="margin-right: 8px;" />
                    Chat
                  </span>
                </template>
                <template #content>
                  <div class="chat-wrapper">
                    <!-- Messages Area - THIS IS THE SCROLLABLE SECTION -->
                    <div class="messages-container" ref="chatScroller">
                      <!-- Loading State -->
                      <div v-if="isLoadingMessages" class="flex items-center justify-center h-full opacity-70 loading-state">
                        <i class="pi pi-spin pi-spinner mr-2 spinner-icon"></i>
                        Loading messages...
                      </div>
                      
                      <!-- No Messages -->
                      <div v-else-if="store.messages.length === 0" class="flex items-center justify-center h-full opacity-70 no-messages">
                        <div class="text-center" style="padding-top: 1rem;">
                          <i :class="pi('comment')" class="text-4xl mb-2 empty-icon"></i>
                          <div>
                            No messages yet. Say hi! 👋</div>
                        </div>
                      </div>
                      
                      <!-- Messages -->
                      <div v-else class="space-y-3">
                        <div v-for="m in store.messages" :key="m.id" class="message-item">
                          <div :class="m.from === 'me' ? 'message-right' : 'message-left'">
                            <div :class="m.from === 'me' ? 'message-content-right' : 'message-content-left'">
                              <div
                                :class="[
                                  'message-bubble',
                                  m.from === 'me' ? 'message-bubble-me' : 'message-bubble-partner'
                                ]"
                              >
                                {{ m.text }}
                              </div>
                              <div class="text-xs opacity-50 mt-1 message-time">
                                {{ formatTime(m.created_at) }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Divider class="my-3 chat-divider" />
                    
                    <!-- Input Area - FIXED AT BOTTOM -->
                    <div class="input-area">
                      <InputText
                        v-model="store.draft"
                        placeholder="Type a message..."
                        class="flex-1 chat-input"
                        @keyup.enter="send"
                        :disabled="isSending"
                      />
                      <Button 
                        size="medium" 
                        @click="send" 
                        icon="pi pi-send" 
                        label="Send"
                        :disabled="!store.draft.trim() || isSending"
                        :loading="isSending"
                        class="send-btn"
                        style="border-radius: 5px;"
                      />
                    </div>
                  </div>
                </template>
              </Card>

              <!-- Right: Map and Suggestions -->
              <div class="space-y-4">
                <Card class="map-card">
                  <template #title>
                    <span class="text-base font-medium card-title-glow">
                      <i :class="pi('map-marker')" class="mr-2" /> Nearby Study Locations
                    </span>
                  </template>
                  <template #content>
                    <div class="map-wrapper" style="margin-top: 0;">
                      <StudySpotMap
                        ref="mapRef"
                        :api-key="YOUR_GOOGLE_MAPS_API_KEY"
                        height="400px"
                        @places-updated="handlePlacesUpdate"
                      />
                    </div>
                  </template>
                </Card>

                <Card :key="studySpots.length" class="spots-card">
                  <template #title>
                    <div>
                      <div class="text-base font-medium card-title-glow">
                        <i :class="pi('building')" />
                        Suggested Study Spots
                      </div>
                      <small class="opacity-70 spots-count">
                        <i :class="pi('check-circle')" class="mr-1" style="margin-right: 5px;"/>
                        {{ studySpots.length }} spots found
                      </small>
                    </div>
                  </template>
                  <template #content>
                    <div v-if="studySpots.length === 0" class="text-center p-4 opacity-70 empty-spots">
                      <i :class="pi('search')" class="text-3xl mb-2 empty-icon"></i>
                      <div>Search for a location to find study spots</div>
                    </div>
                    <div v-else>
                      <div class="space-y-4 mb-3">
                        <div
                          v-for="spot in paginatedSpots"
                          :key="spot.place_id"
                          class="spot-item"
                        >
                          <div class="flex-1">
                            <div class="font-medium spot-name">{{ spot.name }}</div>
                            <small class="opacity-70 block spot-address">
                              {{ spot.vicinity || spot.formatted_address }}
                            </small>
                            <small v-if="spot.rating" class="spot-rating">
                              ★ {{ spot.rating }}
                              {{ spot.user_ratings_total ? `(${spot.user_ratings_total} reviews)` : '' }}
                            </small>
                          </div>
                          <div class="flex gap-3 spot-actions">
                            <Button
                              outlined
                              size="small"
                              icon="pi pi-map-marker"
                              label="View"
                              @click="focusOnSpot(spot)"
                              class="spot-btn"
                              style="border-radius: 5px;"
                            />
                            <Button
                              outlined
                              size="small"
                              icon="pi pi-plus"
                              label="Suggest"
                              @click="suggestSpot(spot)"
                              class="spot-btn"
                              style="border-radius: 5px;"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Pagination Controls -->
                    <div class="pagination-controls" v-if="studySpots.length > 0">
                      <Button
                        :disabled="currentPage === 1"
                        @click="currentPage--"
                        icon="pi pi-chevron-left"
                        text
                        size="small"
                        label="Previous"
                        class="pagination-btn"
                      />
                      <small class="opacity-70 page-info">
                        Page {{ currentPage }} of {{ totalPages }}
                      </small>
                      <Button
                        :disabled="currentPage === totalPages"
                        @click="currentPage++"
                        icon="pi pi-chevron-right"
                        iconPos="right"
                        text
                        size="small"
                        label="Next"
                        class="pagination-btn"
                      />
                    </div>
                  </template>
                </Card>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>

  <div v-else class="min-h-screen p-4 flex items-center justify-center opacity-70">
    You haven't accepted a match yet. Go back to the landing page.
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMatchStore } from '@/stores/match'
import { degrees } from '@/constants/degrees'
import { supabase } from '@/lib/supabase'
import StudySpotMap from './StudySpotMap.vue'

import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

// ---- study details helpers ----
const myProfile = ref<any | null>(null)
const partnerProfile = ref<any | null>(null)

const SLOT_LABELS = {
  slot_morning:  'Morning (8:30am - 11:30am)',
  slot_midday:   'Midday (12:00pm - 3:00pm)',
  slot_afternoon:'Afternoon (3:30pm - 6:30pm)',
  slot_evening:  'Evening (7:00pm - 10:00pm)', // remember to update back to 10pm after testing
} as const
type SlotKey = keyof typeof SLOT_LABELS
const SLOT_ALIASES: Record<string, SlotKey> = {
  morning: 'slot_morning',
  midday: 'slot_midday',
  afternoon: 'slot_afternoon',
  evening: 'slot_evening',
}
const SLOT_ORDER: SlotKey[] = ['slot_morning','slot_midday','slot_afternoon','slot_evening']

function toArray(val: unknown): string[] {
  if (!val) return []
  return Array.isArray(val) ? val.map(v => String(v).trim()).filter(Boolean)
                            : String(val).split(',').map(s => s.trim()).filter(Boolean)
}
function normalize(raw: string): SlotKey | null {
  const k = raw.trim()
  if ((k as SlotKey) in SLOT_LABELS) return k as SlotKey
  const a = SLOT_ALIASES[k.toLowerCase()]
  return a ?? null
}
function isSlotKey(x: unknown): x is SlotKey {
  return typeof x === 'string' && x in SLOT_LABELS
}
const commonSlotsLabels = computed<string[]>(() => {
  const a = toArray(myProfile.value?.timeslot_avail).map(normalize).filter(isSlotKey)
  const b = toArray(partnerProfile.value?.timeslot_avail).map(normalize).filter(isSlotKey)
  if (!a.length || !b.length) return []
  const setB = new Set<SlotKey>(b)
  const common = Array.from(new Set(a.filter(x => setB.has(x))))
  return SLOT_ORDER.filter(x => common.includes(x)).map(x => SLOT_LABELS[x])
})

function toModules (val: unknown): string[] {
  if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean)
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean)
  // @ts-ignore
  if (val?.items && Array.isArray(val.items)) return val.items.map((x: any) => String(x).trim()).filter(Boolean)
  return []
}
function degreeLabel (value?: string|null) {
  if (!value) return null
  const found = degrees.find(d => d.value === value)
  return found ? found.label : null
}
const commonModules = computed<string[]>(() => {
  const a = toModules(myProfile.value?.modules).map(x => x.toUpperCase())
  const b = toModules(partnerProfile.value?.modules).map(x => x.toUpperCase())
  if (!a.length || !b.length) return []
  const setB = new Set(b)
  return a.filter(x => setB.has(x))
})
const myDegreeLabel = computed(() => degreeLabel(myProfile.value?.degree))
const partnerDegreeLabel = computed(() => degreeLabel(partnerProfile.value?.degree))

async function loadStudyDetailsFromDB () {
  try {
    const roomId = String(store.currentMatchId || store.match?.id || '')
    if (!roomId) return

    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr || !auth?.user?.id) return
    const myId = auth.user.id

    const { data: room, error: roomErr } = await supabase
      .from('match_room')
      .select('id, user1, user2')
      .eq('id', roomId)
      .maybeSingle()
    if (roomErr || !room) return

    const partnerId = room.user1 === myId ? room.user2 : room.user1

    const { data: profs, error: profErr } = await supabase
      .from('profiles')
      .select('user_id, degree, modules, timeslot_avail')
      .in('user_id', [myId, partnerId])
    if (profErr) return

    myProfile.value = profs?.find(p => p.user_id === myId) || null
    partnerProfile.value = profs?.find(p => p.user_id === partnerId) || null
  } catch (e) {
    console.error('[details] loadStudyDetailsFromDB failed', e)
  }
}

// ---- utilities ----
function pi(name: string) { return `pi pi-${name}` }
// @ts-ignore
const YOUR_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const store = useMatchStore()
const router = useRouter()
const route = useRoute()
const chatScroller = ref<HTMLElement | null>(null)

// Start session-slot timer once BOTH sides are verified.
// When it expires: finalize session row + redirect to review.
watch(
  () => [store.myVerified, store.partnerVerified],
  async ([mine, theirs]) => {
    if (mine && theirs) {
      store.startSessionSlotTimer(async () => {
        const rid = await store.endCurrentSession('Time’s up for this slot. Session ended.')
        if (rid) router.replace({ name: 'matchreview', params: { id: rid } })
        else router.replace({ name: 'matchreview' })
      })
    }
  },
  { immediate: true, flush: 'post' } // ensure it runs after DOM/reactivity settles
)

//extra guard: if sessionId pops in after both flags are already true
watch(
  () => store.sessionId,
  (sid) => {
    if (sid && store.myVerified && store.partnerVerified && store.sessionSecondsLeft === 0) {
      store.startSessionSlotTimer(/* same onExpired as above */)
    }
  },
  { flush: 'post' }
)

// Chat state
const isLoadingMessages = ref(false)
const isSending = ref(false)

// studyspots
const studySpots = ref<any[]>([])
const currentPage = ref(1)
const itemsPerPage = 4
const mapRef = ref<InstanceType<typeof StudySpotMap> | null>(null)

// pagination
const totalPages = computed(() => Math.ceil(studySpots.value.length / itemsPerPage))
const paginatedSpots = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return studySpots.value.slice(start, end)
})

const handlePlacesUpdate = (places: any) => {
  studySpots.value = [...places]
  currentPage.value = 1
}

const focusOnSpot = (spot: any) => {
  if (mapRef.value && spot.geometry?.location) {
    // @ts-ignore
    mapRef.value.focusOnLocation(spot.geometry.location, spot.name, spot.place_id)
  }
}

const suggestSpot = async (spot: any) => {
  const message = `Let's meet at ${spot.name}! Location @${spot.vicinity || spot.formatted_address || ''}`
  isSending.value = true
  await store.sendMessage(message)
  store.draft = ''
  isSending.value = false
  nextTick(scrollToBottom)
  setTimeout(() => nextTick(scrollToBottom), 750)
}

// reject detection
const partnerId = ref<string | null>(null)
const myId = ref<string | null>(null)
let rejectPoll: number | null = null

function scrollToBottom() {
  const el = chatScroller.value
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}
function send() {
  store.sendMessage(store.draft)
  store.draft = ''
  isSending.value = false
  nextTick(scrollToBottom)
  setTimeout(() => nextTick(scrollToBottom), 300)
}
function restart() {
  store.startOver()
  router.push({ name: 'matchlanding' })
}

// Format timestamp
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

//handels find another match button
// ADD near other refs
let roomCloseChannel: ReturnType<typeof supabase.channel> | null = null
  // ADD this helper
async function endForBoth() {
  try {
    const roomId = store.currentMatchId || store.match?.id
    if (!roomId) return

    // Best-effort: clear chat, end session, then delete the room.
    // If your RLS forbids deletes, see the "Fallback" at the end.
    await supabase.from('match_chat').delete().eq('room_id', roomId)

    if (store.sessionId) {
      await supabase.from('sessions').delete().eq('sessid', store.sessionId)
    }

    // Deleting the room will trigger the partner's realtime subscription (below)
    await supabase.from('match_room').delete().eq('id', roomId)

    // Local cleanup + redirect
    store.teardownVerification()
    store.stopSessionSlotTimer()
    await store.startOver()
    router.replace({ name: 'matchlanding' })
  } catch (e) {
    console.error('[endForBoth] failed', e)
    // Soft fallback: still navigate away so the user isn’t stuck
    await store.startOver()
    router.replace({ name: 'matchlanding' })
  }
}

// ADD this handler (called when partner deletes the room)
async function onRoomClosedByPartner() {
  // Prevent double handling
  try {
    store.teardownVerification()
    store.stopSessionSlotTimer()
  } finally {
    await store.forceLeaveChat?.('Session has ended. Returning to matchmaking.')
    await store.startOver()
    router.replace({ name: 'matchlanding' })
  }
}

// init
onMounted(async () => {
  await store.hydrateFromCache()

  const hasMatch = await store.ensureMatch(store.currentMatchId || undefined)
  if (!hasMatch) {
    router.replace({ name: 'matchlanding' })
    return
  }
  // making sure we have chat id
  await store.ensureChat(route.params.chatId as string | undefined)

  // init verification (reads flags & subscribes)
  await store.initVerificationForCurrentRoom()

  // optional extra refresh later
  setTimeout(() => { store.refreshVerificationNow() }, 3000)

  // load the dynamic study details here
  await loadStudyDetailsFromDB()

  // Initialize real-time chat
  const roomId = store.currentMatchId || store.match.id
  if (roomId) {
    isLoadingMessages.value = true
    await store.initializeChat(roomId)
    isLoadingMessages.value = false
    
    // Scroll to bottom after messages load
    nextTick(scrollToBottom)
    setTimeout(() => nextTick(scrollToBottom), 500)
    //bounce together
     roomCloseChannel = supabase
    .channel(`room-close-${roomId}`)
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'match_room', filter: `id=eq.${roomId}` },
      () => onRoomClosedByPartner()
    )
    .subscribe()
  }
  

  // Set stage
  store.stage = 'chat'
  // Find my ID and partner ID
  const { data: auth } = await supabase.auth.getUser()
  myId.value = auth?.user?.id ?? null

  if (roomId && myId.value) {
    const { data: room } = await supabase
      .from('match_room')
      .select('user1, user2')
      .eq('id', roomId)
      .maybeSingle()
    if (room) {
      partnerId.value = room.user1 === myId.value ? room.user2 : room.user1
    }
  }

  // poll for partner rejection
  if (partnerId.value) {
    rejectPoll = window.setInterval(async () => {
      const rejected = await store.checkIfPartnerRejected(partnerId.value!)
      if (rejected) {
        if (rejectPoll) {
          clearInterval(rejectPoll)
          rejectPoll = null
        }
        await store.forceLeaveChat('Match Declined, Sorry about that!')
        router.replace({ name: 'matchlanding' })
      }
    }, 2000) as unknown as number
  }
})

// verify submit
async function onVerify() {
  const res = await store.submitVerification()
  if (!res.ok) {
    console.warn(res.msg)
  }
}

// copy helper
async function copyCode() {
  try {
    if (!store.roomVerifyCode) return
    await navigator.clipboard.writeText(store.roomVerifyCode)
  } catch {}
}

// ======= ADDED CODE =========
async function endAndReview() {
  const rid = await store.endCurrentSession('Previous Match Session has ended.')
  if (rid) router.replace({ name: 'matchreview', params: { id: rid } })
  else router.replace({ name: 'matchreview' })
}
// ======= END OF CODE =========

// if room changes (rare), re-init verification quickly
watch(() => store.currentMatchId, async (rid) => {
  if (rid) {
    await store.initVerificationForCurrentRoom()
  }
})

onUnmounted(() => {
  if (rejectPoll) clearInterval(rejectPoll)
  rejectPoll = null
  // stop realtime + short-lived verification polling if still running
  if (roomCloseChannel) {
    supabase.removeChannel(roomCloseChannel)
    roomCloseChannel = null
  }
  store.teardownVerification()
  store.stopSessionSlotTimer()
})
</script>

<style scoped>
.min-h-screen { min-height: 100vh; }
.grid { display: grid; }
.lg\:grid-cols-2 { grid-template-columns: 1fr; }
@media (min-width: 1024px) {
  .lg\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.gap-6 { gap: 1.5rem; }
.space-y-4 > * + * { margin-top: 1rem; }
/* .h-96 { height: 24rem; }
.h-72 { height: 18rem; } */
.bg-primary-500 { background: var(--p-primary-color); }
.bg-surface-200 { background: var(--p-content-border-color); }
.text-white { color: #fff; }
.flex-1 { flex: 1 1 0%; }

/* CHAT CONTAINER - KEY STYLES FOR SCROLLING */
.chat-card {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 500px;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.5rem;
  max-height: 520px; /* Important for flex scrolling */
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.message-item {
  margin-bottom: 0.75rem;
}

.message-right {
  display: flex;
  justify-content: flex-end;
}

.message-left {
  display: flex;
  justify-content: flex-start;
}

.message-content-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 100%;
}

.message-content-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 100%;
}

.message-bubble-wrapper {
  max-width: 100%;
}

.message-bubble {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  word-wrap: break-word; 
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
  padding-top: 0.5rem;
}

.bg-aura {
  position: absolute;
  inset: -40% -20% -20% -20%;
  background:
    radial-gradient(60% 60% at 20% 10%, rgba(255, 214, 10, 0.45), transparent 60%),
    radial-gradient(50% 50% at 80% 0%, rgba(251, 133, 0, 0.3), transparent 60%),
    radial-gradient(40% 40% at 50% 100%, rgba(239, 68, 68, 0.18), transparent 60%);
  filter: blur(50px);
  z-index: -2;
  pointer-events: none;
}

.float {
  --size: 260px;
  position: absolute;
  width: var(--size); height: var(--size);
  border-radius: 50%;
  background: conic-gradient(from 180deg,
    rgba(255, 183, 3, 0.20),
    rgba(251, 133, 0, 0.20),
    rgba(239, 68, 68, 0.18),
    rgba(255, 183, 3, 0.20)
  );
  filter: blur(22px);
  opacity: 0.6;
  animation: float 18s ease-in-out infinite;
  z-index: -1;
}
.float-1 { top: 12%; left: -6%; animation-delay: -2s; }
.float-2 { bottom: -8%; right: -4%; --size: 340px; animation-delay: -6s; }
.float-3 { top: 40%; right: 18%; --size: 220px; animation-delay: -9s; }

.card-gradient {
  border: 1px solid #ff9800;
  background: linear-gradient(135deg, #fff8f0 0%, #ffffff 100%);
}

/* Card backgrounds with subtle gradients and depth */
.partner-card {
  background: linear-gradient(135deg, #fff5e6 0%, #ffffff 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.1);
}

.partner-card::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  border-radius: inherit;
  z-index: -1;
}

.detail-card, .verify-card {
  background: linear-gradient(135deg, #fff8f0 0%, #ffffff 50%, #fff5e6 100%);
  border: 1px solid #ffe0b2;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(255, 152, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.detail-card::after, .verify-card::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 152, 0, 0.05) 0%, transparent 70%);
  animation: rotateGlow 20s linear infinite;
  pointer-events: none;
}

@keyframes rotateGlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.detail-card:hover, .verify-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 152, 0, 0.15);
  border-color: #ffb74d;
}

.timer-card {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 50%, #fff8f0 100%);
  border: 2px solid #ff9800;
  box-shadow: 0 4px 16px rgba(255, 152, 0, 0.15);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(255, 152, 0, 0.15);
  }
  50% {
    box-shadow: 0 4px 24px rgba(255, 152, 0, 0.25);
  }
}

/* Title glow effect */
.card-title-glow {
  background: linear-gradient(90deg, #ff9800, #f57c00, #ff9800);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: titleShine 3s linear infinite;
}

@keyframes titleShine {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* Detail items animation */
.detail-item {
  animation: fadeInUp 0.5s ease backwards;
}

.detail-item:nth-child(1) { animation-delay: 0.1s; }
.detail-item:nth-child(2) { animation-delay: 0.2s; }
.detail-item:nth-child(3) { animation-delay: 0.3s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Icons */
.detail-icon {
  color: #ff9800;
  margin-right: 8px;
  transition: transform 0.3s ease;
}

.detail-item:hover .detail-icon {
  transform: scale(1.2) rotate(5deg);
}

/* Tags */
.tag-hover {
  transition: all 0.2s ease;
}

.tag-hover:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

/* Online indicator */
.online-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  animation: pulseDot 2s ease-in-out infinite;
}

@keyframes pulseDot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

/* Partner avatar */
.partner-avatar {
  background: linear-gradient(135deg, #ff9800, #f57c00) !important;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

/* Verify code box */
.verify-code-box {
  padding: 12px 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border: 2px solid #ffb74d;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  color: #e65100;
  max-width: 250px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: all;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.15);
  transition: all 0.3s ease;
}

.verify-code-box:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.25);
}

.copy-btn {
  transition: transform 0.2s ease;
}

.copy-btn:hover {
  transform: scale(1.1);
}

/* Verify input */
.verify-input {
  transition: all 0.3s ease;
}

.verify-input:focus {
  border-color: #ff9800 !important;
  box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1) !important;
}

/* Buttons */
.verify-btn, .end-btn, .find-match-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.verify-btn::before, .end-btn::before, .find-match-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.verify-btn:hover::before, .end-btn:hover::before, .find-match-btn:hover::before {
  transform: translateX(100%);
}

.verify-btn:hover, .end-btn:hover, .find-match-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

/* Status tags */
.status-tag {
  transition: all 0.3s ease;
  animation: slideIn 0.5s ease backwards;
}

.status-tag:nth-child(1) { animation-delay: 0.1s; }
.status-tag:nth-child(2) { animation-delay: 0.2s; }
.status-tag:nth-child(3) { animation-delay: 0.3s; }

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.status-tag:hover {
  transform: scale(1.05);
}

/* Countdown tag */
.countdown-tag {
  font-size: 1.1rem;
  font-weight: bold;
  padding: 8px 16px;
  animation: countdownPulse 2s ease-in-out infinite;
}

@keyframes countdownPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Find match button */
.find-match-btn {
  background: linear-gradient(135deg, #fff5e6, #ffffff);
  border: 2px solid #ff9800;
  font-weight: 600;
}

.find-match-btn:hover {
  background: linear-gradient(135deg, #ffe0b2, #fff5e6);
  border-color: #f57c00;
}

/* Chat Card */
.chat-card {
  background: linear-gradient(135deg, #fff8f0 0%, #ffffff 50%, #fff5e6 100%);
  border: 2px solid #ffe0b2 !important;
  height: 700px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(255, 152, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.chat-card::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 152, 0, 0.05) 0%, transparent 70%);
  animation: rotateGlow 20s linear infinite;
  pointer-events: none;
}

.chat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 152, 0, 0.15);
  border-color: #ffb74d !important;
}

/* Map and Spots Cards */
.map-card, .spots-card {
  background: linear-gradient(135deg, #fff8f0 0%, #ffffff 50%, #fff5e6 100%);
  border: 1px solid #ffe0b2 !important;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(255, 152, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.map-card::after, .spots-card::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 152, 0, 0.05) 0%, transparent 70%);
  animation: rotateGlow 20s linear infinite;
  pointer-events: none;
}

.map-card:hover, .spots-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 152, 0, 0.15);
  border-color: #ffb74d !important;
}

@keyframes rotateGlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Title glow effect */
.card-title-glow {
  background: linear-gradient(90deg, #ff9800, #f57c00, #ff9800);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: titleShine 3s linear infinite;
}

@keyframes titleShine {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* Chat wrapper */
.chat-wrapper {
  height: 750px;
  position: relative;
  z-index: 1;
}

/* Messages container */
.messages-container {
  height: calc(100% - 80px);
  overflow-y: auto;
  padding-right: 8px;
  scroll-behavior: smooth;
}

.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: #fff3e0;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #ff9800, #f57c00);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #f57c00, #e65100);
}

/* Loading and empty states */
.loading-state, .no-messages, .empty-spots {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.spinner-icon {
  color: #ff9800;
  font-size: 1.5rem;
}

.empty-icon {
  color: #ffb74d;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Message bubbles */
.message-item {
  animation: messageSlide 0.3s ease;
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-right {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  flex-direction: row;
}

.message-left {
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  flex-direction: row;
}

.message-bubble-me {
  background: linear-gradient(135deg, #ff9800, #f57c00) !important;
  color: white !important;
  padding: 10px 14px;
  border-radius: 16px 16px 4px 16px;
  max-width: 70%;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  transition: all 0.2s ease;
  min-width: fit-content; 
}

.message-bubble-me:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

.message-bubble-partner {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2) !important;
  color: #5d4037 !important;
  padding: 10px 14px;
  border-radius: 16px 16px 16px 4px;
  max-width: 70%;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.15);
  transition: all 0.2s ease;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: anywhere;
  min-width: fit-content; 
}

.message-bubble-partner:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.25);
}

.message-time {
  font-size: 0.75rem;
  transition: opacity 0.2s ease;
}

.message-item:hover .message-time {
  opacity: 1 !important;
}

/* Chat divider */
.chat-divider {
  border-color: #ffe0b2;
  margin: 12px 0;
}

/* Input area */
.input-area {
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.chat-input {
  transition: all 0.3s ease;
}

.chat-input:focus {
  border-color: #ff9800 !important;
  box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1) !important;
}

.send-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.send-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.send-btn:hover::before {
  transform: translateX(100%);
}

.send-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

/* Map wrapper */
.map-wrapper {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.map-wrapper:hover {
  box-shadow: 0 4px 16px rgba(255, 152, 0, 0.2);
}

/* Spots count */
.spots-count {
  display: flex;
  align-items: center;
  color: #ff9800;
  font-weight: 500;
}

/* Spot items */
.spot-item {
  display: flex;
  align-items: start;
  justify-content: space-between;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid #ffe0b2;
  background: linear-gradient(135deg, #ffffff, #fff8f0);
  transition: all 0.3s ease;
  animation: spotFadeIn 0.4s ease backwards;
  position: relative;
  overflow: hidden;
}

.spot-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(180deg, #ff9800, #f57c00);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.spot-item:hover::before {
  transform: scaleY(1);
}

.spot-item:hover {
  background: linear-gradient(135deg, #fff8f0, #ffe0b2);
  border-color: #ff9800;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.15);
}

@keyframes spotFadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.spot-item:nth-child(1) { animation-delay: 0.05s; }
.spot-item:nth-child(2) { animation-delay: 0.1s; }
.spot-item:nth-child(3) { animation-delay: 0.15s; }

.spot-name {
  color: #e65100;
  font-size: 1rem;
  margin-bottom: 4px;
}

.spot-address {
  color: #666;
  display: flex;
  align-items: center;
}

.spot-rating {
  color: #f57c00;
  font-weight: 600;
  display: inline-block;
  margin-top: 4px;
}

.spot-actions {
  display: flex;
  gap: 8px;
}

.spot-btn {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.spot-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 233, 199, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.spot-btn:hover::before {
  transform: translateX(100%);
}

.spot-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 152, 0, 0.2);
  border-color: #ff9800;
}

/* Pagination */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ffe0b2;
  margin-top: 12px;
}

.pagination-btn {
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  color: #ff9800 !important;
  transform: scale(1.05);
}

.page-info {
  font-weight: 500;
  color: #f57c00;
}

/* Find match button */
.find-match-btn {
  background: linear-gradient(135deg, #fff5e6, #ffffff);
  border: 2px solid #ff9800 !important;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.find-match-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.find-match-btn:hover::before {
  transform: translateX(100%);
}

.find-match-btn:hover {
  background: linear-gradient(135deg, #ffe0b2, #fff5e6);
  border-color: #f57c00 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}
/* 1) Design tokens */
:root {
  --ink:              #0b1220;
  --ink-dim:          #6b7280;
  --bg-page-a:        #ffffff;
  --bg-page-b:        #f8fafc;

  --card-bg-a:        rgba(255,255,255,0.92);
  --card-bg-b:        rgba(255,255,255,0.86);
  --card-border:      rgba(15,23,42,.10);

  --accent-a:         #ff9800;
  --accent-b:         #f59e0b;

  --chip-bg:          #fff7ed;
  --chip-border:      #ffd699;
  --chip-ink:         #7c2d12;

  --me-bubble-bg:     linear-gradient(135deg, #ff9800, #f57c00);
  --me-bubble-ink:    #ffffff;
  --them-bubble-bg:   linear-gradient(135deg, #fff3e0, #ffe0b2);
  --them-bubble-ink:  #5d4037;

  --divider:          #ffe0b2;
  --scroll-track:     #fff3e0;
  --scroll-thumb-a:   #ff9800;
  --scroll-thumb-b:   #f57c00;

  --map-spot-bg-a:    #ffffff;
  --map-spot-bg-b:    #fff8f0;

  --tile-spot-name:   #e65100;
  --tile-spot-accent: #f57c00;

  --verify-code-bg-a: #fff3e0;
  --verify-code-bg-b: #ffe0b2;
  --verify-code-ink:  #e65100;

  --timer-bg-a:       #fff3e0;
  --timer-bg-b:       #ffe0b2;

  --aura-yellow:      rgba(255, 214, 10, 0.45);
  --aura-orange:      rgba(251, 133, 0, 0.30);
  --aura-red:         rgba(239, 68, 68, 0.18);
}

.dark {
  --ink:              #e5e7eb;
  --ink-dim:          #9ca3af;
  --bg-page-a:        #0b1020;
  --bg-page-b:        #0f172a;

  --card-bg-a:        rgba(15,23,42,.80);
  --card-bg-b:        rgba(15,23,42,.66);
  --card-border:      rgba(255,255,255,.10);

  --chip-bg:          rgba(17,24,39,.6);
  --chip-border:      rgba(255,214,153,.35);
  --chip-ink:         #fde68a;

  --me-bubble-bg:     linear-gradient(135deg, #ffb156, #ff8a3d);
  --me-bubble-ink:    #111827;
  --them-bubble-bg:   linear-gradient(135deg, #1e2636, #111827);
  --them-bubble-ink:  #e5e7eb;

  --divider:          rgba(255,214,153,.28);
  --scroll-track:     rgba(255,255,255,.06);
  --scroll-thumb-a:   #ffb156;
  --scroll-thumb-b:   #ffd08a;

  --map-spot-bg-a:    #121826;
  --map-spot-bg-b:    #0f172a;

  --tile-spot-name:   #ffd08a;
  --tile-spot-accent: #ffb156;

  --verify-code-bg-a: rgba(255,193,120,.14);
  --verify-code-bg-b: rgba(255,193,120,.06);
  --verify-code-ink:  #ffd08a;

  --timer-bg-a:       rgba(255,193,120,.14);
  --timer-bg-b:       rgba(255,193,120,.06);

  --aura-yellow:      rgba(255, 214, 10, 0.22);
  --aura-orange:      rgba(251, 133, 0, 0.18);
  --aura-red:         rgba(239, 68, 68, 0.10);
}

/* 2) Page background + ink (keeps your gradients) */
.min-h-screen {
  color: var(--ink);
}
.dark .min-h-screen {
  color: var(--ink);
  background:
    radial-gradient(900px 180px at 50% -60px, rgba(59,130,246,.10), transparent 60%),
    linear-gradient(180deg, var(--bg-page-a), var(--bg-page-b));
}

/* 3) Aura brightness tuning for dark */
.dark .bg-aura {
  background:
    radial-gradient(60% 60% at 20% 10%, var(--aura-yellow), transparent 60%),
    radial-gradient(50% 50% at 80% 0%, var(--aura-orange), transparent 60%),
    radial-gradient(40% 40% at 50% 100%, var(--aura-red), transparent 60%);
}

/* 4) Prime card shells (reuse your classes, just recolor) */
:deep(.p-card) {
  background: linear-gradient(180deg, var(--card-bg-a), var(--card-bg-b)) !important;
  border-color: var(--card-border) !important;
  color: var(--ink);
}

/* 5) Chat bubbles (your class names kept) */
.message-bubble-me {
  background: var(--me-bubble-bg) !important;
  color: var(--me-bubble-ink) !important;
}
.message-bubble-partner {
  background: var(--them-bubble-bg) !important;
  color: var(--them-bubble-ink) !important;
}

/* 6) Scrollbar colors */
.messages-container::-webkit-scrollbar-track {
  background: var(--scroll-track);
}
.messages-container::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--scroll-thumb-a), var(--scroll-thumb-b));
}

/* 7) Divider and inputs */
.chat-divider { border-color: var(--divider) !important; }
.chat-input:focus,
.verify-input:focus {
  border-color: var(--accent-a) !important;
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent-a) 20%, transparent) !important;
}

/* 8) Tags (Prime Tag inside your containers) */
.tags-container :deep(.p-tag),
.status-tags :deep(.p-tag) {
  background: var(--chip-bg) !important;
  border: 1px solid var(--chip-border) !important;
  color: var(--chip-ink) !important;
}

/* 9) Verify code box */
.verify-code-box {
  background: linear-gradient(135deg, var(--verify-code-bg-a), var(--verify-code-bg-b)) !important;
  border-color: var(--chip-border) !important;
  color: var(--verify-code-ink) !important;
}

/* 10) Timer card */
.timer-card {
  background: linear-gradient(135deg, var(--timer-bg-a), var(--timer-bg-b)) !important;
  border-color: var(--chip-border) !important;
  color: var(--ink) !important;
}

/* 11) Map / spots cards + spot rows */
.map-card, .spots-card, .detail-card, .verify-card, .chat-card, .partner-card {
  background: linear-gradient(180deg, var(--card-bg-a), var(--card-bg-b)) !important;
  border-color: var(--card-border) !important;
  color: var(--ink) !important;
}
.spot-item {
  background: linear-gradient(135deg, var(--map-spot-bg-a), var(--map-spot-bg-b)) !important;
  border-color: var(--card-border) !important;
}
.spot-name { color: var(--tile-spot-name) !important; }
.spot-rating { color: var(--tile-spot-accent) !important; }
.spots-count { color: var(--accent-a) !important; }

/* 12) Optional: Tabs header colors */
:deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
  color: var(--ink-dim);
}
:deep(.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  color: var(--ink);
  border-color: var(--accent-a);
}

/* 13) Respect OS dark if you don't toggle .dark yourself */
@media (prefers-color-scheme: dark) {
  html:not(.dark) .min-h-screen {
    color: var(--ink);
    background:
      radial-gradient(900px 180px at 50% -60px, rgba(59,130,246,.10), transparent 60%),
      linear-gradient(180deg, var(--bg-page-a), var(--bg-page-b));
  }
}
</style>
