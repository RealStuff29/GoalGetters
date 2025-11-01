<!-- src/views/MatchDecisionView.vue -->
<template>
  <div class="min-h-screen p-4 w-full mx-auto max-w-md flex items-center justify-center">
    <!-- MATCH CARD -->
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
              {{ store.match.partner.name }}
              <!-- show match score if ready -->
              <Tag v-if="matchScore !== null" severity="success" :value="`Score: ${matchScore}`" />
            </span>
          </div>
        </template>
        <template #content>
          <!-- main meeting info -->
          <div class="space-y-3 mb-4">
            <div class="flex items-start gap-3">
              <i :class="pi('book')" class="opacity-70 mt-1" />
              <div>
                <Tag severity="secondary" :value="store.match.subject" />
                <p class="text-sm opacity-80 mt-1">{{ store.match.description }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i :class="pi('clock')" class="opacity-70 mt-1" />
              <div>
                <p>{{ store.match.time }}</p>
                <p class="text-sm opacity-80">
                  Duration: <b>{{ store.match.duration }}</b>
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i :class="pi('map-marker')" class="opacity-70 mt-1" />
              <p>{{ store.match.location }}</p>
            </div>
          </div>

          <!-- extra match info -->
          <div class="mt-2 p-3 rounded-lg bg-slate-50 border text-sm space-y-2">
            <p class="font-semibold flex items-center gap-2">
              <i :class="pi('info-circle')" class="opacity-70" /> Match details
            </p>

            <!-- common timeslots -->
            <p>
              <b>Common timeslots:</b>
              <span v-if="commonSlots.length">
                {{ commonSlots.join(', ') }}
              </span>
              <span v-else class="opacity-70">None</span>
            </p>

            <!-- common modules -->
            <p>
              <b>Similar modules:</b>
              <span v-if="commonMods.length">
                {{ commonMods.join(', ') }}
              </span>
              <span v-else class="opacity-70">None</span>
            </p>

            <!-- degree / school -->
            <p>
              <b>Same degree / school:</b>
              <span v-if="sameDegree">
                ✅ {{ partnerProfile?.degree }}
              </span>
              <span v-else class="opacity-70">
                No
              </span>
            </p>
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

    <!-- FALLBACK (if user refreshes weirdly) -->
    <div v-else class="opacity-70 text-center">
      <p>Loading your match…</p>
      <Button class="mt-3" label="Back to Matchmaking" @click="startOver" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { useMatchStore } from '@/stores/match'
import { supabase } from '@/lib/supabase'

function pi(name: string) {
  return `pi pi-${name}`
}

const store = useMatchStore()
const router = useRouter()
const route = useRoute()

// extra reactive data for this view
const myProfile = ref<any>(null)
const partnerProfile = ref<any>(null)
const matchScore = ref<number | null>(null)
const commonSlots = ref<string[]>([])
const commonMods = ref<string[]>([])
const sameDegree = ref<boolean>(false)

// small helpers (same as in store)
function strToArray(val: string | string[] | null | undefined): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean).map(v => v.trim())
  return val
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

function overlap<T extends string>(a: T[], b: T[]): T[] {
  const setB = new Set(b)
  return a.filter(x => setB.has(x))
}

onMounted(async () => {
  // 1) restore cached
  await store.hydrateFromCache()

  // 2) ensure we have the room id
  const ok = await store.ensureMatch(route.params.id as string | undefined)
  if (!ok) {
    router.replace({ name: 'matchlanding' })
    return
  }

  // 3) try to load partner (in case user hard-refreshed)
  await store.loadPartnerForCurrent()

  // 4) we stay in 'match' stage (we removed 'result' screen)
  store.stage = 'match'

  // 5) load both full profiles from Supabase to compute score
  const { data: auth } = await supabase.auth.getUser()
  const myId = auth?.user?.id
  if (!myId) return

  // load my profile
  const { data: myProf } = await supabase
    .from('profiles')
    .select('user_id, gender, modules, study_hours, degree, timeslot_avail')
    .eq('user_id', myId)
    .maybeSingle()

  // get partnerId from room
  const roomId = store.currentMatchId || store.match.id
  let partnerId: string | null = null
  if (roomId) {
    const { data: room } = await supabase
      .from('match_room')
      .select('user1, user2')
      .eq('id', roomId)
      .maybeSingle()
    if (room) {
      partnerId = room.user1 === myId ? room.user2 : room.user1
    }
  }

  let partnerProf: any = null
  if (partnerId) {
    const { data: p } = await supabase
      .from('profiles')
      .select('user_id, username, gender, modules, study_hours, degree, timeslot_avail')
      .eq('user_id', partnerId)
      .maybeSingle()
    partnerProf = p
  }

  myProfile.value = myProf
  partnerProfile.value = partnerProf

  if (myProf && partnerProf) {
    // compute score exactly like in store
    let score = 0

    // 1) same gender +100
    if (myProf.gender && partnerProf.gender && myProf.gender === partnerProf.gender) {
      score += 100
    }

    // 2) overlapping time slots +100
    const mySlotsArr = strToArray(myProf.timeslot_avail)
    const partnerSlotsArr = strToArray(partnerProf.timeslot_avail)
    const slotOverlap = overlap(mySlotsArr, partnerSlotsArr)
    if (slotOverlap.length > 0) {
      score += 100
    }
    commonSlots.value = slotOverlap

    // 3) same modules +1 each
    const myModsArr = strToArray(myProf.modules)
    const partnerModsArr = strToArray(partnerProf.modules)
    const modsOverlap = overlap(myModsArr, partnerModsArr)
    score += modsOverlap.length
    commonMods.value = modsOverlap

    // 4) same degree +1
    if (myProf.degree && partnerProf.degree && myProf.degree === partnerProf.degree) {
      score += 1
      sameDegree.value = true
    } else {
      sameDegree.value = false
    }

    // 5) similar study hours +1
    const myStudy = Number(myProf.study_hours ?? 0)
    const otherStudy = Number(partnerProf.study_hours ?? 0)
    if (Math.abs(myStudy - otherStudy) <= 2) {
      score += 1
    }

    matchScore.value = score
    console.log('[decision] match score (recomputed in view):', score)
  }
})

function onAccept() {
  // store should already set stage='chat' in acceptMatch() (update match.ts accordingly)
  store.acceptMatch()
  router.push({ name: 'matchchat', params: { chatId: store.chatId } })
}

function onDecline() {
  store.declineMatch()
  router.push({ name: 'matchlanding' })
}

function startOver() {
  store.startOver()
  router.push({ name: 'matchlanding' })
}
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
.grid {
  display: grid;
}
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.gap-3 {
  gap: 0.75rem;
}
.text-green-500 {
  color: #22c55e;
}
.text-red-500 {
  color: #ef4444;
}
.bg-red-500 {
  background: #ef4444;
}
</style>
