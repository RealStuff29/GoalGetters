<!-- src/views/MatchChatView.vue -->
<template>
  <div
    class="min-h-screen p-4 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-6"
    v-if="store.stage === 'chat'"
  >
    <!-- Left column: Header + Details + Chat -->
    <div class="space-y-4">
      <Card>
        <template #content>
          <div class="flex items-center gap-3">
            <Avatar :label="store.partnerInitials" shape="circle" />
            <div>
              <div class="font-medium">{{ store.match.partner.name || 'Study partner' }}</div>
              <small class="opacity-70">Online now</small>
            </div>
          </div>
        </template>
      </Card>

      <!-- Study Session Details -->
      <Card>
        <template #title>
          <span class="text-base font-medium">Study Session Details</span>
        </template>
        <template #content>
          <div class="space-y-4">
            <!-- Common time slots -->
            <div class="flex items-start gap-3">
              <i :class="pi('clock')" class="opacity-70 mt-1" />
              <div>
                <div class="font-medium mb-1">Common Time Slots</div>
                <div v-if="commonSlotsLabels.length">
                  <Tag v-for="s in commonSlotsLabels" :key="s" severity="secondary" :value="s" class="mr-2 mb-2" />
                </div>
                <small v-else class="opacity-70">No overlapping availability yet.</small>
              </div>
            </div>

            <!-- Common modules -->
            <div class="flex items-start gap-3">
              <i :class="pi('book')" class="opacity-70 mt-1" />
              <div>
                <div class="font-medium mb-1">Common Modules</div>
                <div v-if="commonModules.length">
                  <Tag v-for="m in commonModules" :key="m" severity="secondary" :value="m" class="mr-2 mb-2" />
                </div>
                <small v-else class="opacity-70">They have no common modules.</small>
              </div>
            </div>

            <!-- Degrees / Schools -->
            <div class="flex items-start gap-3">
              <i :class="pi('university')" class="opacity-70 mt-1" />
              <div>
                <div class="font-medium mb-1">School / Degree</div>
                <div class="text-sm">
                  <div><b>You:</b> {{ myDegreeLabel || '-' }}</div>
                  <div><b>Partner:</b> {{ partnerDegreeLabel || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Verification -->
      <Card>
        <template #title>
          <span class="text-base font-medium">Verify Your Partner</span>
        </template>
        <template #content>
          <div class="space-y-3">
            <div class="text-sm">
              <div class="opacity-70 mb-1">Share this word with your partner:</div>

              <div class="flex items-center gap-2">
                <div class="px-3 py-2 rounded bg-surface-200 font-mono text-sm select-all flex-1">
                  {{ store.roomVerifyCode || '—' }}
                </div>
                <Button
                  :disabled="!store.roomVerifyCode"
                  :icon="pi('copy')"
                  text
                  aria-label="Copy"
                  @click="copyCode"
                />
              </div>

              <small class="opacity-70">
                Both of you should enter the <i>same</i> word below to confirm you’re talking to the right person.
              </small>
            </div>

            <div class="flex items-center gap-2">
              <InputText
                v-model="store.verifyWordInput"
                placeholder="Enter the shared verification word"
                class="flex-1"
                :disabled="store.myVerified"
                @keyup.enter="onVerify"
              />
              <Button
                size="small"
                :icon="pi('check')"
                label="Verify"
                :disabled="store.myVerified || !store.verifyWordInput"
                @click="onVerify"
              />
            </div>

            <div class="flex items-center gap-2">
              <Tag :severity="store.myVerified ? 'success' : 'danger'"
                   :value="store.myVerified ? 'You: Verified' : 'You: Not verified'"/>
              <Tag :severity="store.partnerVerified ? 'success' : 'warn'"
                   :value="store.partnerVerified ? 'Partner: Verified' : 'Partner: Pending'"/>
              <Tag v-if="store.sessionId" severity="success" :value="`Session: ${store.sessionId.slice(0,8)}…`"/>
            </div>
          </div>
        </template>
      </Card>

      <!-- Time Remaining -->
      <Card v-if="store.myVerified && store.partnerVerified && store.sessionSecondsLeft > 0">
        <template #title>
          <span class="text-base font-medium">Time Remaining</span>
        </template>

        <template #content>
          <div class="flex items-center">
            <Tag severity="danger" :value="store.sessionCountdownText" />
          </div>

          <small class="block opacity-70 mt-2">
            Counts down to the end of the current time slot -
            <b>{{ store.sessionActiveSlotLabel || 'Current slot' }}</b>.
          </small>
        </template>
      </Card>

      <!-- Chat -->
      <Card class="h-96 flex flex-col">
        <template #title>
          <span class="text-base font-medium">Chat</span>
        </template>
        <template #content>
          <div class="flex flex-col h-72">
            <div class="flex-1 overflow-auto pr-2 space-y-4" ref="chatScroller">
              <div v-for="m in store.messages" :key="m.id" class="mb-2">
                <div :class="m.from === 'me' ? 'text-right' : 'text-left'">
                  <span
                    :class="[
                      'inline-block px-3 py-2 rounded-lg',
                      m.from === 'me' ? 'bg-primary-500 text-white' : 'bg-surface-200'
                    ]"
                  >
                    {{ m.text }}
                  </span>
                </div>
              </div>
            </div>
            <Divider />
            <div class="flex gap-2 items-center">
              <InputText
                v-model="store.draft"
                placeholder="Type a message..."
                class="flex-1"
                @keyup.enter="send"
              />
              <Button size="small" @click="send" icon="pi pi-send" label="Send" />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Right column: Map + Suggestions -->
    <div class="space-y-4">
      <Card>
        <template #title>
          <span class="text-base font-medium">
            <i :class="pi('direction')" class="mr-2" /> Nearby Study Locations
          </span>
        </template>
        <template #content>
          <StudySpotMap
            ref="mapRef"
            :api-key="YOUR_GOOGLE_MAPS_API_KEY"
            height="400px"
            @places-updated="handlePlacesUpdate"
          />
        </template>
      </Card>

      <Card :key="studySpots.length">
        <template #title>
          <div>
            <div class="text-base font-medium">Suggested Study Spots</div>
            <small class="opacity-70">{{ studySpots.length }} spots found</small>
          </div>
        </template>
        <template #content>
          <div v-if="studySpots.length === 0" class="text-center p-4 opacity-70">
            Search for a location to find study spots
          </div>
          <div v-else>
            <div class="space-y-4 mb-3">
              <div
                v-for="spot in paginatedSpots"
                :key="spot.place_id"
                class="flex items-start justify-between p-3 rounded border surface-border hover:bg-gray-50 transition-colors"
              >
                <div class="flex-1">
                  <div class="font-medium">{{ spot.name }}</div>
                  <small class="opacity-70 block">{{ spot.vicinity || spot.formatted_address }}</small>
                  <small v-if="spot.rating" class="text-yellow-600">
                    ★ {{ spot.rating }}
                    {{ spot.user_ratings_total ? `(${spot.user_ratings_total} reviews)` : '' }}
                  </small>
                </div>
                <div class="flex gap-3 space-y-4">
                  <Button
                    outlined
                    size="small"
                    icon="pi pi-map-marker"
                    label="View"
                    @click="focusOnSpot(spot)"
                  />
                  <Button
                    outlined
                    size="small"
                    icon="pi pi-plus"
                    label="Suggest"
                    @click="suggestSpot(spot)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination Controls -->
          <div class="flex justify-between items-center pt-2 border-t">
            <Button
              :disabled="currentPage === 1"
              @click="currentPage--"
              icon="pi pi-chevron-left"
              text
              size="small"
              label="Previous"
            />
            <small class="opacity-70">
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
            />
          </div>
        </template>
      </Card>

      <Button outlined class="w-full" :icon="pi('refresh')" label="Find Another Match" @click="restart" />
    </div>
  </div>

  <div v-else class="min-h-screen p-4 flex items-center justify-center opacity-70">
    You haven’t accepted a match yet. Go back to the landing page.
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMatchStore } from '@/stores/match'
import { degrees } from '@/constants/degrees'
import { supabase } from '@/lib/supabase'
import StudySpotMap from './StudySpotMap.vue'

// ---- study details helpers ----
const myProfile = ref<any | null>(null)
const partnerProfile = ref<any | null>(null)

const SLOT_LABELS = {
  slot_morning:  'Morning (8:30am - 11:30am)',
  slot_midday:   'Midday (12:00pm - 3:00pm)',
  slot_afternoon:'Afternoon (3:30pm - 6:30pm)',
  slot_evening:  'Evening (7:00pm - 1:30am)', // updated label
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

const suggestSpot = (spot: any) => {
  const message = `Let's meet at ${spot.name}! Location @${spot.vicinity || spot.formatted_address || ''}`
  store.sendMessage(message)
  store.draft = ''
  nextTick(scrollToBottom)
  setTimeout(() => nextTick(scrollToBottom), 750)
}

// reject detection
const partnerId = ref<string | null>(null)
const myId = ref<string | null>(null)
let rejectPoll: number | null = null

function scrollToBottom() {
  const el = chatScroller.value
  if (el) el.scrollTop = el.scrollHeight
}
function send() {
  store.sendMessage(store.draft)
  store.draft = ''
  nextTick(scrollToBottom)
  setTimeout(() => nextTick(scrollToBottom), 750)
}
function restart() {
  store.startOver()
  router.push({ name: 'matchlanding' })
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

  // let template render
  store.stage = 'chat'
  nextTick(scrollToBottom)
  setTimeout(() => nextTick(scrollToBottom), 500)

  // find my id
  const { data: auth } = await supabase.auth.getUser()
  myId.value = auth?.user?.id ?? null

  // find partner id from room
  const roomId = store.currentMatchId || store.match.id
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

  // poll for "other side declined"
  if (partnerId.value) {
    rejectPoll = window.setInterval(async () => {
      const rejected = await store.checkIfPartnerRejected(partnerId.value!)
      if (rejected) {
        if (rejectPoll) {
          clearInterval(rejectPoll)
          rejectPoll = null
        }
        await store.forceLeaveChat('Your partner left the match.')
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
.h-96 { height: 24rem; }
.h-72 { height: 18rem; }
.bg-primary-500 { background: var(--p-primary-color); }
.bg-surface-200 { background: var(--p-content-border-color); }
.text-white { color: #fff; }
</style>
