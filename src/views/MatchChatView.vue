<!-- src/views/MatchChatView.vue -->
<template>
  <div
    class="min-h-screen p-4 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-6"
    v-if="store.stage === 'chat'"
  >
    <!-- Left column -->
    <div class="space-y-4">
<<<<<<< HEAD
<<<<<<< HEAD
      <!-- Header -->
=======
>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
=======
>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
      <Card>
        <template #content>
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <Avatar :label="store.partnerInitials" shape="circle" />
              <div>
                <div class="font-medium">{{ store.match.partner.name }}</div>
                <small class="opacity-70">Online now</small>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <!-- ✅ VERIFY BUTTON -->
              <Button
                size="small"
                :icon="verifying ? 'pi pi-spin pi-spinner' : 'pi pi-shield'"
                :label="verifying ? 'Verifying...' : 'Verify'"
                outlined
                @click="verifySession"
              />
              <!-- timer -->
              <div
                v-if="chatTimeLeftSec !== null"
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium',
                  chatTimeLeftSec <= 60 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                ]"
              >
                ⏱ {{ chatTimeLabel }}
              </div>
            </div>
          </div>

          <!-- verify status text -->
          <p v-if="verifyStatus === 'ok'" class="mt-3 text-xs text-emerald-600 flex items-center gap-1">
            <i class="pi pi-check-circle"></i> Session verified (you).
          </p>
          <p v-else-if="verifyStatus === 'ok-both'" class="mt-3 text-xs text-emerald-600 flex items-center gap-1">
            <i class="pi pi-check-circle"></i> Both verified — session saved.
          </p>
          <p v-else-if="verifyStatus === 'fail'" class="mt-3 text-xs text-red-500 flex items-center gap-1">
            <i class="pi pi-times-circle"></i> Could not verify. Check room / partner code.
          </p>
        </template>
      </Card>

      <!-- 🔐 verification codes -->
      <Card>
        <template #title>
          <span class="text-sm font-medium flex items-center gap-2">
            <i class="pi pi-key"></i> Match verification
          </span>
        </template>
        <template #content>
          <div class="space-y-3">
            <div>
              <div class="text-xs opacity-70 mb-1">Your code (tell your partner):</div>
              <div class="px-3 py-2 rounded bg-surface-200 font-mono text-sm select-all inline-block">
                {{ myVerifyCode || '—' }}
              </div>
            </div>

            <div>
              <div class="text-xs opacity-70 mb-1">Enter partner’s code:</div>
              <div class="flex gap-2 items-center">
                <InputText
                  v-model="partnerCodeInput"
                  placeholder="e.g. MERLION-67"
                  class="flex-1"
                />
                <Button
                  icon="pi pi-check"
                  text
                  @click="quickCheckPartnerCode"
                  :disabled="!partnerExpectedCode"
                />
              </div>
              <small
                v-if="partnerCodeOK === true"
                class="text-emerald-600 text-xs flex items-center gap-1 mt-1"
              >
                <i class="pi pi-check-circle"></i> Partner code matches.
              </small>
              <small
                v-else-if="partnerCodeOK === false"
                class="text-red-500 text-xs flex items-center gap-1 mt-1"
              >
                <i class="pi pi-times-circle"></i> Partner code is wrong.
              </small>
              <small v-else class="text-xs opacity-60 mt-1 block">
                Ask your partner to read their code to you, then type it here.
              </small>
            </div>
          </div>
        </template>
      </Card>

<<<<<<< HEAD
<<<<<<< HEAD
      <!-- Study Session Details -->
=======
>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
=======
>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
      <Card>
        <template #title>
          <span class="text-base font-medium">Study Session Details</span>
        </template>
        <template #content>
          <div class="space-y-3">
            <div class="flex items-start gap-3">
<<<<<<< HEAD
<<<<<<< HEAD
              <i :class="pi('clock')" class="opacity-70 mt-1" />
              <div>
                <div class="font-medium mb-1">Common Time Slots</div>
                <div v-if="commonSlotsLabels.length">
                  <Tag
                    v-for="s in commonSlotsLabels"
                    :key="s"
                    severity="secondary"
                    :value="s"
                    class="mr-2 mb-2"
                  />
                </div>
                <small v-else class="opacity-70">No overlapping availability yet.</small>
=======
              <i :class="pi('book')" class="opacity-70 mt-1" />
              <div>
                <Tag severity="secondary" :value="store.match.subject" />
                <p class="text-sm opacity-80 mt-1">{{ store.match.description }}</p>
>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
              </div>
            </div>
            <div class="flex items-start gap-3">
<<<<<<< HEAD
              <i :class="pi('book')" class="opacity-70 mt-1" />
              <div>
                <div class="font-medium mb-1">Common Modules</div>
                <div v-if="commonModules.length">
                  <Tag
                    v-for="m in commonModules"
                    :key="m"
                    severity="secondary"
                    :value="m"
                    class="mr-2 mb-2"
                  />
                </div>
                <small v-else class="opacity-70">They have no common modules.</small>
=======
              <i :class="pi('clock')" class="opacity-70 mt-1" />
              <div>
                <p class="text-sm">{{ store.match.time }}</p>
                <small class="opacity-70">Duration: <b>{{ store.match.duration }}</b></small>
>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
              </div>
            </div>
            <div class="flex items-start gap-3">
<<<<<<< HEAD
              <i :class="pi('university')" class="opacity-70 mt-1" />
              <div>
                <div class="font-medium mb-1">School / Degree</div>
                <div class="text-sm">
                  <div><b>You:</b> {{ myDegreeLabel || '-' }}</div>
                  <div><b>Partner:</b> {{ partnerDegreeLabel || '-' }}</div>
                </div>
              </div>
=======
              <i :class="pi('map-marker')" class="opacity-70 mt-1" />
              <p class="text-sm">{{ store.match.location }}</p>
>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
=======
              <i :class="pi('book')" class="opacity-70 mt-1" />
              <div>
                <Tag severity="secondary" :value="store.match.subject" />
                <p class="text-sm opacity-80 mt-1">{{ store.match.description }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i :class="pi('clock')" class="opacity-70 mt-1" />
              <div>
                <p class="text-sm">{{ store.match.time }}</p>
                <small class="opacity-70">Duration: <b>{{ store.match.duration }}</b></small>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i :class="pi('map-marker')" class="opacity-70 mt-1" />
              <p class="text-sm">{{ store.match.location }}</p>
>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
            </div>
          </div>
        </template>
      </Card>

      <!-- Chat Card -->
      <Card class="h-96 flex flex-col">
        <template #title>
          <div class="flex items-center justify-between gap-3">
            <span class="text-base font-medium">Chat</span>
            <Button
              text
              size="small"
              icon="pi pi-stop"
              label="End Session"
              @click="endSessionAndReview"
            />
          </div>
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

      <Button
        outlined
        class="w-full"
        :icon="pi('refresh')"
        label="Find Another Match"
        @click="restart"
      />
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
<<<<<<< HEAD
<<<<<<< HEAD
import { degrees } from '@/constants/degrees'
import { supabase } from '@/lib/supabase'
import StudySpotMap from './StudySpotMap.vue'

const store = useMatchStore()
const router = useRouter()
const route = useRoute()
const chatScroller = ref<HTMLElement | null>(null)

// ✅ verification state
const verifying = ref(false)
// 'ok' = I verified; 'ok-both' = both verified; 'fail' = failed
const verifyStatus = ref<'ok' | 'ok-both' | 'fail' | null>(null)

// codes
const myVerifyCode = ref<string>('')
const partnerExpectedCode = ref<string>('')
const partnerCodeInput = ref<string>('')
const partnerCodeOK = ref<boolean | null>(null)

// ✅ timer from store
const chatTimeLeftSec = computed(() => store.chatRemainingSec ?? null)
const chatTimeLabel = computed(() => {
  const s = chatTimeLeftSec.value
  if (s == null) return '—'
  const m = Math.floor(s / 60)
  const ss = (s % 60).toString().padStart(2, '0')
  return `${m}:${ss}`
})

// ---- study details ----
const myProfile = ref<any | null>(null)
const partnerProfile = ref<any | null>(null)

const SLOT_LABELS = {
  slot_morning: 'Morning (8:30am - 11:30am)',
  slot_midday: 'Midday (12:00pm - 3:00pm)',
  slot_afternoon: 'Afternoon (3:30pm - 6:30pm)',
  slot_evening: 'Evening (7:00pm - 10:00pm)'
} as const
type SlotKey = keyof typeof SLOT_LABELS

const SLOT_ALIASES: Record<string, SlotKey> = {
  morning: 'slot_morning',
  midday: 'slot_midday',
  afternoon: 'slot_afternoon',
  evening: 'slot_evening'
}

const SLOT_ORDER: SlotKey[] = ['slot_morning', 'slot_midday', 'slot_afternoon', 'slot_evening']

function toArray(val: unknown): string[] {
  if (!val) return []
  return Array.isArray(val)
    ? val.map(v => String(v).trim()).filter(Boolean)
    : String(val)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
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

// ✅ FIX for .items
function toModules(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map(v => String(v).trim()).filter(Boolean)
  }
  if (typeof val === 'string') {
    return val.split(',').map(s => s.trim()).filter(Boolean)
  }
  if (val && typeof val === 'object' && 'items' in (val as any)) {
    const maybeItems = (val as any).items
    if (Array.isArray(maybeItems)) {
      return maybeItems.map((x: any) => String(x).trim()).filter(Boolean)
    }
  }
  return []
}

function degreeLabel(value?: string | null) {
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

async function loadStudyDetailsFromDB() {
  try {
    const roomId = String(store.currentMatchId || store.match?.id || '')
    if (!roomId) {
      console.warn('[details] no roomId on store')
      return
    }

    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr || !auth?.user?.id) {
      console.warn('[details] auth error', authErr)
      return
    }
    const myId = auth.user.id

    const { data: room, error: roomErr } = await supabase
      .from('match_room')
      .select('id, user1, user2')
      .eq('id', roomId)
      .maybeSingle()

    if (roomErr) {
      console.warn('[details] match_room error', roomErr)
      return
    }
    if (!room) {
      console.warn('[details] no match_room for id', roomId)
      return
    }

    const theirId = room.user1 === myId ? room.user2 : room.user1

    const { data: profs, error: profErr } = await supabase
      .from('profiles')
      .select('user_id, degree, modules, timeslot_avail')
      .in('user_id', [myId, theirId])

    if (profErr) {
      console.warn('[details] profiles error', profErr)
      return
    }

    myProfile.value = profs?.find(p => p.user_id === myId) || null
    partnerProfile.value = profs?.find(p => p.user_id === theirId) || null
  } catch (e) {
    console.error('[details] loadStudyDetailsFromDB failed', e)
  }
}

// 🔐 deterministic code generator
function deriveVerifyCode(roomId: string, userId: string): string {
  const words = ['MANGO', 'OTTER', 'ORCHARD', 'MERLION', 'KOPI', 'LAKSA', 'HDB', 'LION', 'NDP', 'CHILLI']
  const seed = `${roomId}:${userId}`
  let sum = 0
  for (let i = 0; i < seed.length; i++) {
    sum += seed.charCodeAt(i)
  }
  const word = words[sum % words.length]
  const num = (sum % 90) + 10
  return `${word}-${num}`
}

=======
import { supabase } from '@/lib/supabase'   // 👈 you were missing this
import Card from 'primevue/card'
import Button from 'primevue/button'
import StudySpotMap from './StudySpotMap.vue'

>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
=======
import { supabase } from '@/lib/supabase'   // 👈 you were missing this
import Card from 'primevue/card'
import Button from 'primevue/button'
import StudySpotMap from './StudySpotMap.vue'

>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
function pi(name: string) {
  return `pi pi-${name}`
}
// @ts-ignore
const YOUR_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// studyspots
const studySpots = ref<any[]>([])
const currentPage = ref(1)
const itemsPerPage = 4
const mapRef = ref<InstanceType<typeof StudySpotMap> | null>(null)

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

// ids to poll for end
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

/**
 * 👇 This is the NEW part:
 * we only "complete" the session once BOTH verified.
 *
 * We try to use columns `verified_by_a` / `verified_by_b` if they exist.
 * If they don't, we just create the row.
 */
async function upsertSessionVerification(roomId: string, me: string, other: string) {
  // 1) get current row (if any)
  const { data: existing, error: sessErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('sessid', roomId)
    .maybeSingle()

  // if table doesn't exist or error → just insert simple row
  if (sessErr?.code === '42P01') {
    // table missing → fall back
    const now = new Date().toISOString()
    await supabase.from('sessions').insert({
      sessid: roomId,
      created_at: now,
      started_at: now,
      created_by_a: me,
      created_by_b: other
    })
    return true
  }

  const now = new Date().toISOString()

  // if no row → create with my verify
  if (!existing) {
    // we don't know which is A/B → use ordering to decide
    const iAmA = me < other
    const insertPayload: any = {
      sessid: roomId,
      created_at: now,
      started_at: now,
      created_by_a: iAmA ? me : other,
      created_by_b: iAmA ? other : me
    }

    // try to set verified flag
    insertPayload.verified_by_a = iAmA ? true : false
    insertPayload.verified_by_b = iAmA ? false : true

    const { error: insErr } = await supabase.from('sessions').insert(insertPayload)
    if (insErr) {
      // maybe columns don't exist → insert minimal
      await supabase.from('sessions').insert({
        sessid: roomId,
        created_at: now,
        started_at: now,
        created_by_a: iAmA ? me : other,
        created_by_b: iAmA ? other : me
      })
      return false
    }
    // only 1 person verified so far
    return false
  }

  // row exists → update verify flag
  let updated: any = {}
  // try to detect who is A/B
  const iAmA = existing.created_by_a === me
  if (iAmA) {
    updated.verified_by_a = true
  } else {
    updated.verified_by_b = true
  }

  const { data: afterUpdate, error: updErr } = await supabase
    .from('sessions')
    .update(updated)
    .eq('sessid', roomId)
    .select()
    .maybeSingle()

  if (updErr) {
    // can't update → fine, we at least have a row
    return false
  }

  // if after update both sides verified → return true
  const both =
    (afterUpdate?.verified_by_a === true && afterUpdate?.verified_by_b === true) ||
    // fallback if columns absent
    false

  return both
}

// quick check just for the input box
function quickCheckPartnerCode() {
  if (!partnerExpectedCode.value) {
    partnerCodeOK.value = null
    return
  }
  partnerCodeOK.value =
    partnerCodeInput.value.trim().toUpperCase() === partnerExpectedCode.value.toUpperCase()
}

// ✅ VERIFY ACTION
async function verifySession() {
  verifying.value = true
  verifyStatus.value = null
  partnerCodeOK.value = null
  try {
    const roomId = store.currentMatchId || store.match.id
    if (!roomId) {
      verifyStatus.value = 'fail'
      return
    }

    const { data: auth } = await supabase.auth.getUser()
    const me = auth?.user?.id
    if (!me) {
      verifyStatus.value = 'fail'
      return
    }

    const { data: room, error } = await supabase
      .from('match_room')
      .select('id, user1, user2')
      .eq('id', roomId)
      .maybeSingle()

    if (error || !room) {
      verifyStatus.value = 'fail'
      return
    }

    if (room.user1 !== me && room.user2 !== me) {
      verifyStatus.value = 'fail'
      return
    }

    const other = room.user1 === me ? room.user2 : room.user1

    // derive codes
    const myCode = deriveVerifyCode(roomId, me)
    const theirCode = deriveVerifyCode(roomId, other)
    myVerifyCode.value = myCode
    partnerExpectedCode.value = theirCode

    // if user already typed code, check it
    if (partnerCodeInput.value.trim().length > 0) {
      quickCheckPartnerCode()
      if (partnerCodeOK.value === false) {
        verifyStatus.value = 'fail'
        return
      }
    }

    // ✅ at this point THIS user is verified
    // now mark in sessions, and if both → we return ok-both
    const bothVerified = await upsertSessionVerification(roomId, me, other)

    verifyStatus.value = bothVerified ? 'ok-both' : 'ok'
  } catch (e) {
    console.warn('[verify] failed', e)
    verifyStatus.value = 'fail'
  } finally {
    verifying.value = false
  }
}

// manual end → go review
async function endSessionAndReview() {
  const roomId = store.currentMatchId || store.match.id

  // safety: make sure a session row exists even if they never verified
  if (roomId) {
    const { data: auth } = await supabase.auth.getUser()
    const me = auth?.user?.id
    if (me) {
      // try to fetch room to get partner
      const { data: room } = await supabase
        .from('match_room')
        .select('user1, user2')
        .eq('id', roomId)
        .maybeSingle()
      const other = room ? (room.user1 === me ? room.user2 : room.user1) : me
      await upsertSessionVerification(roomId, me, other)
    }
  }

  const endedRoomId = await store.endSession?.('manual')
  const finalId = endedRoomId || store.lastSessionId || roomId
  if (finalId) {
    router.push({ name: 'matchreview', params: { roomid: finalId } })
  } else {
    router.push({ name: 'matchlanding' })
  }
}

onMounted(async () => {
  await store.hydrateFromCache()

  const hasMatch = await store.ensureMatch(store.currentMatchId || undefined)
  if (!hasMatch) {
    router.replace({ name: 'matchlanding' })
    return
  }

  await store.ensureChat(route.params.chatId as string | undefined)

<<<<<<< HEAD
<<<<<<< HEAD
  await loadStudyDetailsFromDB()

  const roomId = store.currentMatchId || store.match.id
  if (roomId) {
    const { data: room, error } = await supabase
      .from('match_room')
      .select('id, user1, user2, expires_at')
      .eq('id', roomId)
      .maybeSingle()

    if (!error && room?.expires_at && store.startChatTimerFrom) {
      store.startChatTimerFrom(room.expires_at)
    } else if (!store.chatEndsAt && store.startChatTimer) {
      store.startChatTimer()
    }

    // preload codes
    const { data: auth } = await supabase.auth.getUser()
    const me = auth?.user?.id ?? null
    if (me && room) {
      myVerifyCode.value = deriveVerifyCode(roomId, me)
      const other = room.user1 === me ? room.user2 : room.user1
      partnerExpectedCode.value = deriveVerifyCode(roomId, other)
    }
  }

=======
=======
>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
  // let template render
>>>>>>> parent of a2482d4 ([corrected] Update Study Session Details from hardcode to actual data pulled from profiles table in database)
  store.stage = 'chat'
  nextTick(scrollToBottom)
  setTimeout(() => nextTick(scrollToBottom), 500)

  // ids for polling
  const { data: auth2 } = await supabase.auth.getUser()
  myId.value = auth2?.user?.id ?? null

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

  // poll for partner ending / rejecting
  const roomdoublecheckId = store.currentMatchId || store.match.id
  if (roomdoublecheckId) {
    rejectPoll = window.setInterval(async () => {
      let ended = false

      if (partnerId.value) {
        const rejected = await store.checkIfPartnerRejected(partnerId.value!)
        if (rejected) ended = true
      }

      if (!ended) {
        const alive = await store.checkRoomAlive(roomdoublecheckId)
        if (!alive) ended = true
      }

      if (ended) {
        if (rejectPoll) {
          clearInterval(rejectPoll)
          rejectPoll = null
        }

        // make sure session exists
        const { data: auth3 } = await supabase.auth.getUser()
        const me = auth3?.user?.id ?? null
        if (me) {
          // get partner
          const { data: room } = await supabase
            .from('match_room')
            .select('user1, user2')
            .eq('id', roomdoublecheckId)
            .maybeSingle()
          const other = room ? (room.user1 === me ? room.user2 : room.user1) : me
          await upsertSessionVerification(roomdoublecheckId, me, other)
        }

        await store.forceLeaveChat('Your partner ended the session.')
        router.replace({ name: 'matchreview', params: { roomid: roomdoublecheckId } })
      }
    }, 2000) as unknown as number
  }
})

watch(
  () => store.stage,
  val => {
    if (val === 'landing' && store.lastSessionId) {
      router.push({ name: 'matchreview', params: { roomid: store.lastSessionId } })
    }
  }
)

onUnmounted(() => {
  if (rejectPoll) {
    clearInterval(rejectPoll)
  }
  rejectPoll = null
})
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
.grid {
  display: grid;
}
.lg\:grid-cols-2 {
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .lg\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.gap-6 {
  gap: 1.5rem;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}
.h-96 {
  height: 24rem;
}
.h-72 {
  height: 18rem;
}
.bg-primary-500 {
  background: var(--p-primary-color);
}
.bg-surface-200 {
  background: var(--p-content-border-color);
}
.text-white {
  color: #fff;
}
</style>
