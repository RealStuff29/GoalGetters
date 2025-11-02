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
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <Avatar :label="store.partnerInitials" shape="circle" />
              <div>
                <div class="font-medium">{{ store.match.partner.name }}</div>
                <small class="opacity-70">Online now</small>
              </div>
            </div>

            <!-- ⏱ timer -->
            <div
              v-if="timeLeftSec !== null"
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                timeLeftSec <= 60 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              ]"
            >
              ⏱ Time left: {{ timeLeftText }}
            </div>
          </div>

          <!-- optional progress bar -->
          <div v-if="timeLeftSec !== null" class="mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-emerald-500 transition-all"
              :style="{ width: progressPercent + '%' }"
            />
          </div>
        </template>
      </Card>

      <!-- ⬇️ UPDATED SECTION -->
      <Card>
        <template #title>
          <span class="text-base font-medium">Study Session Details</span>
        </template>
        <template #content>
          <div class="space-y-3">
            <!-- subject + desc -->
            <div class="flex items-start gap-3">
              <i :class="pi('book')" class="opacity-70 mt-1" />
              <div>
                <Tag severity="secondary" :value="store.match.subject" />
                <p class="text-sm opacity-80 mt-1">{{ store.match.description }}</p>
              </div>
            </div>

            <!-- match time (keep this, it's useful) -->
            <div v-if="store.match.time" class="flex items-start gap-3">
              <i :class="pi('clock')" class="opacity-70 mt-1" />
              <div>
                <p class="text-sm">{{ store.match.time }}</p>
              </div>
            </div>

            <!-- similar modules -->
            <div class="flex items-start gap-3" v-if="similarModules.length || partnerModules.length">
              <i :class="pi('sliders-h')" class="opacity-70 mt-1" />
              <div class="flex-1">
                <p class="text-sm font-medium mb-1">Similar modules</p>

                <div v-if="similarModules.length" class="flex flex-wrap gap-2">
                  <Tag
                    v-for="m in similarModules"
                    :key="m"
                    severity="success"
                    :value="m"
                  />
                </div>

                <p v-else class="text-xs opacity-60">
                  No exact module overlap found — but you can still coordinate study topics.
                </p>

                <!-- optional: show partner’s modules so user knows what they have -->
                <div v-if="!similarModules.length && partnerModules.length" class="mt-2">
                  <p class="text-xs opacity-60 mb-1">Your partner is taking:</p>
                  <div class="flex flex-wrap gap-1">
                    <Tag
                      v-for="m in partnerModules"
                      :key="m"
                      severity="secondary"
                      :value="m"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- common timeslot -->
            <div class="flex items-start gap-3" v-if="commonTimeslots.length || partnerTimeslots.length">
              <i :class="pi('calendar')" class="opacity-70 mt-1" />
              <div class="flex-1">
                <p class="text-sm font-medium mb-1">Common timeslot availability</p>

                <div v-if="commonTimeslots.length" class="flex flex-wrap gap-2">
                  <Tag
                    v-for="slot in commonTimeslots"
                    :key="slot"
                    severity="info"
                    :value="slot"
                  />
                </div>

                <p v-else class="text-xs opacity-60">
                  No exact overlapping slot detected. Try suggesting one from the list below 👇
                </p>

                <div v-if="!commonTimeslots.length && partnerTimeslots.length" class="mt-2">
                  <p class="text-xs opacity-60 mb-1">Your partner is free at:</p>
                  <div class="flex flex-wrap gap-1">
                    <Tag
                      v-for="slot in partnerTimeslots"
                      :key="slot"
                      severity="secondary"
                      :value="slot"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- you asked to remove duration + location, so we don't render them anymore -->
          </div>
        </template>
      </Card>

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
            <i :class="pi('direction')" class="mr-2" />
            Nearby Study Locations
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
            <small class="opacity-70"> Page {{ currentPage }} of {{ totalPages }} </small>
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
import { onMounted, onUnmounted, ref, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMatchStore } from '@/stores/match'
import { supabase } from '@/lib/supabase'
function pi(name: string) {
  return `pi pi-${name}`
}

import Card from 'primevue/card'
import Button from 'primevue/button'
import StudySpotMap from './StudySpotMap.vue'

const YOUR_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const store = useMatchStore()
const router = useRouter()
const route = useRoute()

const chatScroller = ref<HTMLElement | null>(null)
const studySpots = ref<any[]>([])
const currentPage = ref(1)
const itemsPerPage = 4
const mapRef = ref<InstanceType<typeof StudySpotMap> | null>(null)

// ---- helper to normalise arrays from db ----
function toArr(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean)
  return String(val)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

// 👇 derive profile info from store (defensive)
const myModules = computed(() =>
  toArr((store as any).myProfile?.modules || (store as any).profile?.modules)
)
const partnerModules = computed(() =>
  toArr((store as any).partnerProfile?.modules || (store.match as any)?.modules)
)
const similarModules = computed(() => {
  if (!myModules.value.length || !partnerModules.value.length) return []
  const mySet = new Set(myModules.value.map(m => m.toLowerCase()))
  return partnerModules.value.filter(m => mySet.has(m.toLowerCase()))
})

const myTimeslots = computed(() =>
  toArr((store as any).myProfile?.timeslot_avail || (store as any).profile?.timeslot_avail)
)
const partnerTimeslots = computed(() =>
  toArr((store as any).partnerProfile?.timeslot_avail)
)
const commonTimeslots = computed(() => {
  if (!myTimeslots.value.length || !partnerTimeslots.value.length) return []
  const mySet = new Set(myTimeslots.value.map(s => s.toLowerCase()))
  return partnerTimeslots.value.filter(s => mySet.has(s.toLowerCase()))
})

// 👇 timers
let chatPollTimer: number | null = null
let roomCountdownTimer: number | null = null
const isAlive = ref(true)

// 👇 expiry data
const roomExpiresAt = ref<Date | null>(null)
const timeLeftSec = ref<number | null>(null)
// we’ll assume 30 mins default if no expires_at
const FALLBACK_DURATION_SEC = 30 * 60

const totalPages = computed(() => Math.ceil(studySpots.value.length / itemsPerPage))
const paginatedSpots = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return studySpots.value.slice(start, end)
})

const timeLeftText = computed(() => {
  if (timeLeftSec.value == null) return '—'
  const s = Math.max(0, timeLeftSec.value)
  const mm = Math.floor(s / 60)
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

const progressPercent = computed(() => {
  if (timeLeftSec.value == null) return 100
  const pct = (timeLeftSec.value / FALLBACK_DURATION_SEC) * 100
  return Math.max(0, Math.min(100, pct))
})

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

function restart() {
  store.startOver()
  router.push({ name: 'matchlanding' })
}

// ✅ safer: do NOT auto-kick just because room wasn't returned
async function checkStillValid() {
  const { data: auth } = await supabase.auth.getUser()
  const myId = auth?.user?.id
  if (!myId) {
    return true
  }

  const roomId = store.currentMatchId || store.match.id
  if (!roomId) {
    return false
  }

  const { data: room, error: roomErr } = await supabase
    .from('match_room')
    .select('id, user1, user2')
    .eq('id', roomId)
    .maybeSingle()

  if (roomErr) {
    console.warn('[chat poll] room query error, keeping user in chat:', roomErr)
    return true
  }

  if (!room) {
    console.log('[chat poll] room not returned, but staying in chat for safety')
    return true
  }

  const otherId = room.user1 === myId ? room.user2 : room.user1

  const { data: rej, error: rejErr } = await supabase
    .from('match_rejects')
    .select('user_id')
    .eq('user_id', otherId)
    .eq('rejected_user_id', myId)
    .maybeSingle()

  if (rejErr) {
    console.warn('[chat poll] reject check error, keeping user in chat:', rejErr)
    return true
  }

  if (rej) {
    console.log('[chat poll] partner actually rejected me → leave chat')
    return false
  }

  return true
}

// 👇 countdown tick
function startRoomCountdown() {
  if (roomCountdownTimer) {
    clearInterval(roomCountdownTimer)
    roomCountdownTimer = null
  }

  roomCountdownTimer = window.setInterval(() => {
    if (!roomExpiresAt.value) {
      timeLeftSec.value = FALLBACK_DURATION_SEC
      return
    }
    const now = Date.now()
    const diff = Math.floor((roomExpiresAt.value.getTime() - now) / 1000)
    timeLeftSec.value = diff

    if (diff <= 0) {
      console.log('[chat] room expired → kick user out')
      cleanupAndExit()
    }
  }, 1000) as unknown as number
}

function cleanupAndExit() {
  if (chatPollTimer) clearInterval(chatPollTimer)
  chatPollTimer = null
  if (roomCountdownTimer) clearInterval(roomCountdownTimer)
  roomCountdownTimer = null

  store.startOver()
  store.leaveQueue?.().catch(() => {})

  router.replace({ name: 'matchlanding' })
}

onMounted(async () => {
  await store.hydrateFromCache()

  const hasMatch = await store.ensureMatch(store.currentMatchId || undefined)
  if (!hasMatch) {
    router.replace({ name: 'matchlanding' })
    return
  }

  await store.ensureChat(route.params.chatId as string | undefined)
  store.stage = 'chat'

  nextTick(scrollToBottom)
  setTimeout(() => nextTick(scrollToBottom), 500)

  const roomId = store.currentMatchId || store.match.id
  if (roomId) {
    const { data: room } = await supabase
      .from('match_room')
      .select('id, expires_at')
      .eq('id', roomId)
      .maybeSingle()

    if (room?.expires_at) {
      roomExpiresAt.value = new Date(room.expires_at)
    } else {
      roomExpiresAt.value = new Date(Date.now() + FALLBACK_DURATION_SEC * 1000)
    }
  }

  startRoomCountdown()

  chatPollTimer = window.setInterval(async () => {
    if (!isAlive.value) return

    const ok = await checkStillValid()

    if (ok) return

    cleanupAndExit()
  }, 2000) as unknown as number
})

onUnmounted(() => {
  isAlive.value = false
  if (chatPollTimer) clearInterval(chatPollTimer)
  if (roomCountdownTimer) clearInterval(roomCountdownTimer)
  chatPollTimer = null
  roomCountdownTimer = null
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
