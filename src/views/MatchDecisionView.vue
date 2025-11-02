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
              <Tag v-if="matchScore !== null" severity="success" :value="`Score: ${matchScore}`" />
            </span>
          </div>
        </template>
        <template #content>
          <div class="mt-2 p-3 rounded-lg bg-slate-50 border text-sm space-y-2">
            <p class="font-semibold flex items-center gap-2">
              <i :class="pi('info-circle')" class="opacity-70" /> Match details
            </p>

            <p>
              <b>Common timeslots:</b>
              <span v-if="commonSlots.length">
                {{ commonSlots.join(', ') }}
              </span>
              <span v-else class="opacity-70">None</span>
            </p>

            <p>
              <b>Similar modules:</b>
              <span v-if="commonMods.length">
                {{ commonMods.join(', ') }}
              </span>
              <span v-else class="opacity-70">None</span>
            </p>

            <p>
              <b>Same degree / school:</b>
              <span v-if="sameDegree">
                ✅ {{ partnerProfile?.degree }}
              </span>
              <span v-else class="opacity-70">No</span>
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

    <div v-else class="opacity-70 text-center">
      <p>Loading your match…</p>
      <Button class="mt-3" label="Back to Matchmaking" @click="startOver" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted, onUnmounted, ref } from 'vue'
import { useMatchStore } from '@/stores/match'
import { supabase } from '@/lib/supabase'

function pi(name: string) {
  return `pi pi-${name}`
}

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

let currentMyId = '';

let pollTimer: number | null = null

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
  await store.hydrateFromCache()

  const ok = await store.ensureMatch(route.params.id as string | undefined)
  if (!ok) {
    console.log("[onMounted] Line 120")
    router.replace({ name: 'matchlanding' })
    return
  }

  await store.loadPartnerForCurrent()
  store.stage = 'match'

  const { data: auth } = await supabase.auth.getUser()
  const myId = auth?.user?.id
  if (!myId) return

  currentMyId = myId; 

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

    // poll to detect "other side declined"
    pollTimer = window.setInterval(async () => {
      // const { data: roomExists } = await supabase
      //   .from('match_room')
      //   .select('id')
      //   .eq('id', roomId)
      //   .maybeSingle()

      const nowRejected = await isRejected() // wait here
      console.log("[pollTimer while] rejected: " + nowRejected)

      if(nowRejected) {
         console.log("... sending the user back to match screen")
         store.startOver()
         console.log("[onMounted] Line 183")
         router.push({ name: 'matchlanding' })
        // Stop the timer and bring the user to match screen

      }
    }, 2000) as unknown as number
  }

  myProfile.value = myProf

  if (myProfile.value && partnerProfile.value) {
    const me = myProfile.value
    const other = partnerProfile.value
    let score = 0

    if (me.gender && other.gender && me.gender === other.gender) {
      score += 100
    }

    const mySlotsArr = strToArray(me.timeslot_avail)
    const partnerSlotsArr = strToArray(other.timeslot_avail)
    const slotOverlap = overlap(mySlotsArr, partnerSlotsArr)
    if (slotOverlap.length > 0) {
      score += 100
    }
    commonSlots.value = slotOverlap

    const myModsArr = strToArray(me.modules)
    const partnerModsArr = strToArray(other.modules)
    const modsOverlap = overlap(myModsArr, partnerModsArr)
    score += modsOverlap.length
    commonMods.value = modsOverlap

    if (me.degree && other.degree && me.degree === other.degree) {
      score += 1
      sameDegree.value = true
    } else {
      sameDegree.value = false
    }

    const myStudy = Number(me.study_hours ?? 0)
    const otherStudy = Number(other.study_hours ?? 0)
    if (Math.abs(myStudy - otherStudy) <= 2) {
      score += 1
    }

    matchScore.value = score
  }
})

onUnmounted(() => {
  // if (pollTimer) {
  //   clearInterval(pollTimer) 
  // }
  // pollTimer = null
})

// TODO
// Fix this by 5:30pm
async function isRejected() {
  const { data, error } = await supabase
        .from('match_rejects')
        .select('user_id')
        .eq('user_id', currentMyId)

  console.log("[isRejected] data: ", data)

  //return false

  return data.length === 0

  if(!data || data.length === 0)
    return true

  return false
}

function onAccept() {
  store.acceptMatch()
  const chatId = store.chatId
  if (chatId) {
    router.push({ name: 'matchchat', params: { chatId } })
  } else {
    router.push({ name: 'matchchat' })
  }
}

async function onDecline() {
  // 👇 THIS is the important change\

  await store.declineMatch(partnerId.value, true)
  console.log("[onMounted] Line 266")
  router.replace({ name: 'matchlanding' })
}

function startOver() {
  store.startOver()
  console.log("[onMounted] Line 272")
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
.bg-red-500 {
  background: #ef4444;
}
</style>
