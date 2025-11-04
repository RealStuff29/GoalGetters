<!-- src/views/MatchDecisionView.vue -->
<template>
  <div class="min-h-screen p-4 w-full mx-auto max-w-md flex items-center justify-center">
    <!-- Decision UI -->
    <div class="w-full space-y-4" v-if="store.stage === 'match'">
      <div class="text-center">
        <h2 class="text-2xl font-semibold mb-1">Match Found! 🎉</h2>
        <p class="opacity-80">
          You have <b>{{ store.countdownText }}</b> to respond
        </p>
      </div>
      <Card>
        <template #title>
          <div class="flex flex-col items-center">
            <div class="mdv-avatar-wrap">
              <Avatar :label="store.partnerInitials" size="large" shape="circle" class="mb-3" />
              <span class="mdv-glow" aria-hidden="true"></span>
            </div>
            <span class="text-lg font-semibold flex items-center gap-2">
              {{ store.match.partner.name || 'Study partner' }}
            </span>
          </div>
        </template>

        <!-- Snapshot -->
        <template #content>
          <div class="mt-2 p-3 rounded-lg bg-slate-50 border text-sm space-y-4 mdv-snapshot">
            <p class="font-semibold flex items-center gap-2">
              <i :class="pi('info-circle')" class="opacity-70" /> Study Session Snapshot
            </p>

            <!-- Common time slots -->
            <div class="flex items-start gap-3">
              <div class="flex items-center gap-2 font-medium mb-1">
                <i :class="pi('clock')" class="opacity-70" />
                <span>  Common Time Slots</span>
              </div>
              <div class="flex-1">
                <div v-if="commonSlotLabels.length">
                  <Tag v-for="s in commonSlotLabels" :key="s" severity="secondary" :value="s" class="mr-2 mb-2" />
                </div>
                <small v-else class="opacity-70">No overlapping availability yet.</small>
              </div>
            </div>

            <!-- Common modules -->
            <div class="flex items-start gap-3">
              <div class="flex items-center gap-2 font-medium mb-1">
                <i :class="pi('book')" class="opacity-70" />
                <span>  Common Modules</span>
              </div>
              <div class="flex-1">
                <div v-if="commonMods.length">
                  <Tag v-for="m in commonMods" :key="m" severity="secondary" :value="m" class="mr-2 mb-2" />
                </div>
                <small v-else class="opacity-70">They have no common modules.</small>
              </div>
            </div>

            <!-- School / Degree -->
            <div class="flex items-start gap-3">
              <div class="flex items-center gap-2 font-medium mb-1">
                <i :class="pi('warehouse')" class="opacity-70" />
                <span>  School / Degree</span>
              </div>
              <div class="flex-1 text-sm">
                <div><b>Your Degree:</b> {{ myProfile?.degree || '-' }}</div>
                <div><b>Partner Degree:</b> {{ partnerProfile?.degree || '-' }}</div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <ProgressBar
        :value="(store.secondsLeft / store.totalSeconds) * 100"
        :showValue="false"
        style="height: 6px"
        :pt="{ value: { class: 'bg-red-500' } }"
      />

      <div class="grid grid-cols-2 gap-3">
        <Button outlined @click="onDecline" :icon="pi('times')" label="Decline" />
        <Button @click="onAccept" severity="primary" :icon="pi('check')" label="Accept & Chat" />
      </div>
    </div>
      <div v-else-if="store.stage === 'searching'" class="py-16 text-center space-y-4">
        <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/70 border">
          <i :class="pi('spinner')" class="pi-spin"></i>
            <span class="font-medium">Finding your next study partner…</span>
            </div>
            <p class="opacity-70 text-sm">We’ll avoid people you’ve just declined.</p>
              </div>
    <!-- Fallback -->
    <div v-else class="opacity-70 text-center">
      <p>Loading…</p>
      <Button class="mt-3" label="Back to Matchmaking" @click="startOver" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useMatchStore } from '@/stores/match'
import { supabase } from '@/lib/supabase'

function pi(name: string) { return `pi pi-${name}` }

const store = useMatchStore()
const router = useRouter()
const route = useRoute()

const myProfile = ref<any>(null)
const partnerProfile = ref<any>(null)
const partnerId = ref<string | null>(null)

const matchScore = ref<number | null>(null)
const commonSlots = ref<string[]>([])
const commonMods = ref<string[]>([])
const sameDegree = ref<boolean>(false)
const sameGender = ref<boolean>(false)
const studyHoursClose = ref<boolean>(false)

let pollTimer: number | null = null

const SLOT_LABELS = {
  slot_morning: 'Morning (8:30am - 11:30am)',
  slot_midday: 'Midday (12:00pm - 3:00pm)',
  slot_afternoon: 'Afternoon (3:30pm - 6:30pm)',
  slot_evening: 'Evening (7:00pm - 1:30am)',
} as const
type SlotKey = keyof typeof SLOT_LABELS
const SLOT_ALIASES: Record<string, SlotKey> = {
  morning: 'slot_morning',
  midday: 'slot_midday',
  afternoon: 'slot_afternoon',
  evening: 'slot_evening',
}
const SLOT_ORDER: SlotKey[] = ['slot_morning', 'slot_midday', 'slot_afternoon', 'slot_evening']

function normalizeSlot(raw: string): SlotKey | null {
  const k = raw.trim()
  if ((k as SlotKey) in SLOT_LABELS) return k as SlotKey
  const a = SLOT_ALIASES[k.toLowerCase()]
  return a ?? null
}
const commonSlotLabels = computed<string[]>(() => {
  const a = strToArray(myProfile.value?.timeslot_avail).map(normalizeSlot).filter(Boolean) as SlotKey[]
  const b = strToArray(partnerProfile.value?.timeslot_avail).map(normalizeSlot).filter(Boolean) as SlotKey[]
  if (!a.length || !b.length) return []
  const setB = new Set<SlotKey>(b)
  const common = Array.from(new Set(a.filter(x => setB.has(x))))
  return SLOT_ORDER.filter(x => common.includes(x)).map(x => SLOT_LABELS[x])
})

function strToArray(val: string | string[] | null | undefined): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean).map(v => v.trim())
  return val.split(',').map(v => v.trim()).filter(Boolean)
}
function overlap<T extends string>(a: T[], b: T[]): T[] {
  const setB = new Set(b)
  return a.filter(x => setB.has(x))
}

function ensureBurstRoot(): HTMLElement {
  let el = document.getElementById('match-burst-root')
  if (!el) {
    el = document.createElement('div')
    el.id = 'match-burst-root'
    el.className = 'mdv-burst-root'
    document.body.appendChild(el)
  }
  return el
}
function spawnMatchBurst() {
  const root = ensureBurstRoot()
  const centerX = window.innerWidth / 2
  const topY = 100
  const pieces = 46
  for (let i = 0; i < pieces; i++) {
    const isBubble = Math.random() < 0.45
    const span = document.createElement('span')
    span.className = isBubble ? 'mdv-burst bubble' : 'mdv-burst ribbon'
    const spread = 70 + Math.random() * 55
    const angle = (Math.random() * 2 - 1) * spread
    const dist = 140 + Math.random() * 220
    const rot = Math.random() * 720 - 360
    const t = 900 + Math.random() * 1100
    const d = Math.random() * 180
    if (isBubble) {
      const size = 6 + Math.random() * 10
      span.style.width = `${size}px`
      span.style.height = `${size}px`
      span.style.background = `hsl(${210 + Math.random()*140} 85% 62%)`
    } else {
      const w = 4 + Math.random() * 6
      const h = 14 + Math.random() * 24
      span.style.width = `${w}px`
      span.style.height = `${h}px`
      span.style.background = `hsl(${180 + Math.random()*100} 90% 55%)`
    }
    const rad = (angle * Math.PI) / 180
    const tx = Math.cos(rad) * dist
    const ty = Math.sin(rad) * (dist * 0.5) - 120
    span.style.setProperty('--x', `${centerX}px`)
    span.style.setProperty('--y', `${topY}px`)
    span.style.setProperty('--tx', `${tx}px`)
    span.style.setProperty('--ty', `${ty}px`)
    span.style.setProperty('--rot', `${rot}deg`)
    span.style.setProperty('--time', `${t}ms`)
    span.style.setProperty('--delay', `${d}ms`)
    root.appendChild(span)
    window.setTimeout(() => span.remove(), t + d + 220)
  }
}

onMounted(async () => {
  await store.hydrateFromCache()
  const ok = await store.ensureMatch(route.params.id as string | undefined)
  if (!ok) {
    router.replace({ name: 'matchlanding' })
    return
  }
  await store.loadPartnerForCurrent()
  store.stage = 'match'
  spawnMatchBurst()

  const { data: auth } = await supabase.auth.getUser()
  const myId = auth?.user?.id
  if (!myId) return
  const { data: myProf } = await supabase
    .from('profiles')
    .select('user_id, gender, modules, study_hours, degree, timeslot_avail')
    .eq('user_id', myId)
    .maybeSingle()

  const roomId = store.currentMatchId || store.match.id
  if (roomId) {
    const { data: room } = await supabase
      .from('match_room')
      .select('user1, user2')
      .eq('id', roomId)
      .maybeSingle()
    if (room) {
      const otherId = room.user1 === myId ? room.user2 : room.user1
      partnerId.value = otherId
      const { data: p } = await supabase
        .from('profiles')
        .select('user_id, username, gender, modules, study_hours, degree, timeslot_avail, profile_photo')
        .eq('user_id', otherId)
        .maybeSingle()
      partnerProfile.value = p
      if (p?.username && !store.match.partner.name) {
        store.match.partner = {
          ...store.match.partner,
          name: p.username,
          photo: p.profile_photo ?? store.match.partner.photo ?? null,
        }
      }
    }
    pollTimer = window.setInterval(async () => {
      if (!partnerId.value) return
      const nowRejected = await store.checkIfPartnerRejected(partnerId.value)
      if (nowRejected) {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
        store.setLandingNotice('Your partner declined the match.')
        store.startOver()
        router.push({ name: 'matchlanding' })
      }
    }, 2000) as unknown as number
  }
  myProfile.value = myProf

  if (myProfile.value && partnerProfile.value) {
    const me = myProfile.value
    const other = partnerProfile.value
    let score = 0
    if (me.gender && other.gender && me.gender === other.gender) score += 100
    const mySlotsArr = strToArray(me.timeslot_avail)
    const partnerSlotsArr = strToArray(other.timeslot_avail)
    const slotOverlap = overlap(mySlotsArr, partnerSlotsArr)
    score += slotOverlap.length * 100
    commonSlots.value = slotOverlap
    const myModsArr = strToArray(me.modules)
    const partnerModsArr = strToArray(other.modules)
    const modsOverlap = overlap(myModsArr.map(m => m.toUpperCase()), partnerModsArr.map(m => m.toUpperCase()))
    score += modsOverlap.length
    commonMods.value = modsOverlap
    if (me.degree && other.degree && me.degree === other.degree) score += 1
    const myStudy = Number(me.study_hours ?? 0)
    const otherStudy = Number(other.study_hours ?? 0)
    if (!Number.isNaN(myStudy) && !Number.isNaN(otherStudy) && Math.abs(myStudy - otherStudy) <= 2) score += 1
    matchScore.value = score
  }
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
})

function onAccept() {
  store.acceptMatch()
  const chatId = store.chatId
  if (chatId) router.push({ name: 'matchchat', params: { chatId } })
  else router.push({ name: 'matchchat' })
}

async function onDecline() {
  // Re-queue & start polling (store sets stage='searching' + queueAndPoll)
  await store.declineMatch(partnerId.value ?? null, true)

  // Stop the old partner-rejected poll
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }

  // Go back to MatchLandingView to show its existing "searching" UI
  router.replace({ name: 'matchlanding' })
}

function startOver() {
  store.startOver()
  router.push({ name: 'matchlanding' })
}
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
  background:
    radial-gradient(900px 180px at 50% -60px, rgba(59,130,246,.10), transparent 60%),
    linear-gradient(180deg, #ffffff, #f8fafc);
}
:deep(.p-card) {
  border: 1px solid rgba(15,23,42,.08);
  border-radius: 16px;
  box-shadow: 0 10px 22px rgba(2,6,23,.06), 0 2px 6px rgba(2,6,23,.04);
  backdrop-filter: blur(6px);
}
:deep(.p-card .p-card-title) {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(15,23,42,.08);
  background: linear-gradient(180deg, rgba(248,250,252,.92), rgba(255,255,255,.86));
}
:deep(.p-card .p-card-content) { padding: 16px 18px 18px; }

.mdv-avatar-wrap { position: relative; }
.mdv-glow {
  position: absolute; inset: -6px; border-radius: 999px;
  background: radial-gradient(60px 60px at 50% 50%, rgba(59,130,246,.25), transparent 60%);
  filter: blur(6px); animation: mdvGlow 2.6s ease-in-out infinite;
}
.mdv-avatar-wrap :deep(.p-avatar) { position: relative; z-index: 1; }
@keyframes mdvGlow { 0%,100%{opacity:.55} 50%{opacity:1} }

.mdv-snapshot { animation: mdvRise .28s ease-out both; }
@keyframes mdvRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.gap-3 { gap: 0.75rem; }
.bg-red-500 { background: #ef4444; }
</style>

<style>
.mdv-burst-root {
  position: fixed; inset: 0; overflow: clip; pointer-events: none; z-index: 9998;
}
.mdv-burst {
  position: absolute;
  left: var(--x); top: var(--y);
  transform: translate(-50%, -50%) translate3d(0,0,0);
  opacity: 0; border-radius: 6px;
  animation: mdv-flight var(--time) cubic-bezier(.25,.9,.2,1) var(--delay) forwards;
}
.mdv-burst.ribbon { border-radius: 3px; }
.mdv-burst.bubble { border-radius: 999px; filter: saturate(1.1); }
@keyframes mdv-flight {
  0%   { opacity: 0; transform: translate(-50%,-50%) translate3d(0,24px,0) rotate(0deg) scale(1); }
  10%  { opacity: 1; }
  65%  { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rot)) scale(1); }
}
</style>
