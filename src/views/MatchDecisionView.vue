<!-- src/views/MatchDecisionView.vue -->
<template>
  <div class="min-h-screen p-4 w-full mx-auto max-w-md flex items-center justify-center">
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
            <Avatar :label="store.partnerInitials" size="large" shape="circle" class="mb-3" />
            <span class="text-lg font-semibold flex items-center gap-2">
              {{ store.match.partner.name || 'Study partner' }}
            </span>
          </div>
        </template>

        <!-- Snapshot: mirrors ChatView details -->
        <template #content>
          <div class="mt-2 p-3 rounded-lg bg-slate-50 border text-sm space-y-4">
            <p class="font-semibold flex items-center gap-2">
              <i :class="pi('info-circle')" class="opacity-70" /> Study Session Snapshot
            </p>

            <!-- Common time slots -->
            <div class="flex items-start gap-3">
              <i :class="pi('clock')" class="opacity-70 mt-1" />
              <div class="flex-1">
                <div class="font-medium mb-1">Common Time Slots</div>
                <div v-if="commonSlotLabels.length">
                  <Tag v-for="s in commonSlotLabels" :key="s" severity="secondary" :value="s" class="mr-2 mb-2" />
                </div>
                <small v-else class="opacity-70">No overlapping availability yet.</small>
              </div>
            </div>

            <!-- Common modules -->
            <div class="flex items-start gap-3">
              <i :class="pi('book')" class="opacity-70 mt-1" />
              <div class="flex-1">
                <div class="font-medium mb-1">Common Modules</div>
                <div v-if="commonMods.length">
                  <Tag v-for="m in commonMods" :key="m" severity="secondary" :value="m" class="mr-2 mb-2" />
                </div>
                <small v-else class="opacity-70">They have no common modules.</small>
              </div>
            </div>

            <!-- Degrees / School -->
            <div class="flex items-start gap-3">
              <i :class="pi('university')" class="opacity-70 mt-1" />
              <div class="flex-1">
                <div class="font-medium mb-1">School / Degree</div>
                <div class="text-sm">
                  <div><b>Your Degree:</b> {{ myProfile?.degree || '-' }}</div>
                  <div><b>Partner Degree:</b> {{ partnerProfile?.degree || '-' }}</div>
                </div>
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

    <div v-else class="opacity-70 text-center">
      <p>Loading your match…</p>
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

// ---- slot label helpers (mirror ChatView) ----
const SLOT_LABELS = {
  slot_morning:   'Morning (8:30am - 11:30am)',
  slot_midday:    'Midday (12:00pm - 3:00pm)',
  slot_afternoon: 'Afternoon (3:30pm - 6:30pm)',
  slot_evening:   'Evening (7:00pm - 1:30am)',
} as const
type SlotKey = keyof typeof SLOT_LABELS
const SLOT_ALIASES: Record<string, SlotKey> = {
  morning: 'slot_morning',
  midday: 'slot_midday',
  afternoon: 'slot_afternoon',
  evening: 'slot_evening',
}
const SLOT_ORDER: SlotKey[] = ['slot_morning','slot_midday','slot_afternoon','slot_evening']

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

// ---- small utils ----
function strToArray(val: string | string[] | null | undefined): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean).map(v => v.trim())
  return val.split(',').map(v => v.trim()).filter(Boolean)
}
function overlap<T extends string>(a: T[], b: T[]): T[] {
  const setB = new Set(b)
  return a.filter(x => setB.has(x))
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

  const { data: auth } = await supabase.auth.getUser()
  const myId = auth?.user?.id
  if (!myId) return

  // current user profile
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

    // detect partner decline
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

  // ---- compute display score + flags (kept inline so UI never drifts) ----
  if (myProfile.value && partnerProfile.value) {
    const me = myProfile.value
    const other = partnerProfile.value
    let score = 0

    // gender
    if (me.gender && other.gender && me.gender === other.gender) {
      score += 100
      sameGender.value = true
    } else {
      sameGender.value = false
    }

    // timeslot overlap: +100 each (✅ fixed)
    const mySlotsArr = strToArray(me.timeslot_avail)
    const partnerSlotsArr = strToArray(other.timeslot_avail)
    const slotOverlap = overlap(mySlotsArr, partnerSlotsArr)
    score += slotOverlap.length * 100
    commonSlots.value = slotOverlap

    // modules: +1 each
    const myModsArr = strToArray(me.modules)
    const partnerModsArr = strToArray(other.modules)
    const modsOverlap = overlap(myModsArr.map(m => m.toUpperCase()), partnerModsArr.map(m => m.toUpperCase()))
    score += modsOverlap.length
    commonMods.value = modsOverlap

    // degree/school: +1
    if (me.degree && other.degree && me.degree === other.degree) {
      score += 1
      sameDegree.value = true
    } else {
      sameDegree.value = false
    }

    // study hours proximity (<= 2h): +1
    const myStudy = Number(me.study_hours ?? 0)
    const otherStudy = Number(other.study_hours ?? 0)
    if (!Number.isNaN(myStudy) && !Number.isNaN(otherStudy) && Math.abs(myStudy - otherStudy) <= 2) {
      score += 1
      studyHoursClose.value = true
    } else {
      studyHoursClose.value = false
    }

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
  await store.declineMatch(partnerId.value ?? null, false)
  router.replace({ name: 'matchlanding' })
}
function startOver() {
  store.startOver()
  router.push({ name: 'matchlanding' })
}
</script>

<style scoped>
.min-h-screen { min-height: 100vh; }
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.gap-3 { gap: 0.75rem; }
.bg-red-500 { background: #ef4444; }
</style>
