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

      <Card class="detail-card">
        <!-- ✅ TOP PROGRESS BAR INSIDE CARD -->
        <template #header>
          <ProgressBar
            class="mdv-topbar"
            :value="(store.secondsLeft / store.totalSeconds) * 100"
            :showValue="false"
            :pt="{
              root: { class: 'mdv-topbar-root' },
              value: { class: 'mdv-topbar-value' }
            }"
          />
        </template>

        <template #title>
          <div class="mdv-title-wrap">
            <div class="mdv-avatar-wrap">
              <Avatar
                v-if="store.match?.partner?.photo"
                :image="store.match.partner.photo"
                size="large"
                shape="circle"
                class="mb-3"
              />
              <Avatar
                v-else
                :label="store.partnerInitials"
                size="large"
                shape="circle"
                class="mb-3"
              />
              <span class="mdv-glow" aria-hidden="true"></span>
            </div>

            <!-- Name -->
            <span class="text-lg font-semibold mdv-partner-name">
              {{ store.match.partner.name || 'Study partner' }}
            </span>
          </div>
        </template>

        <!-- Snapshot -->
        <template #content>
          <div class="mdv-snapshot-pro">
            <!-- header -->
            <div class="mdv-snap-head">
              <div class="mdv-snap-head-left">
                <i :class="pi('info-circle')" />
                <div class="mdv-snap-title">Study Session Snapshot</div>
              </div>
            </div>

            <!-- body grid -->
            <div class="mdv-snap-grid">
              <!-- Common time slots -->
              <div class="mdv-snap-item">
                <div class="mdv-snap-item-head">
                  <span class="mdv-snap-icon">
                    <i :class="pi('clock')" />
                  </span>
                  <span class="mdv-snap-label">Common Time Slots</span>
                </div>
                <div class="mdv-snap-content">
                  <div v-if="commonSlotLabels.length" class="mdv-tags">
                    <Tag
                      v-for="s in commonSlotLabels"
                      :key="s"
                      severity="secondary"
                      :value="s"
                      class="mdv-tag"
                    />
                  </div>
                  <small v-else class="mdv-empty">No overlapping availability yet.</small>
                </div>
              </div>

              <!-- Common modules -->
              <div class="mdv-snap-item">
                <div class="mdv-snap-item-head">
                  <span class="mdv-snap-icon">
                    <i :class="pi('book')" />
                  </span>
                  <span class="mdv-snap-label">Common Modules</span>
                </div>
                <div class="mdv-snap-content">
                  <div v-if="commonMods.length" class="mdv-tags">
                    <Tag
                      v-for="m in commonMods"
                      :key="m"
                      severity="secondary"
                      :value="m"
                      class="mdv-tag"
                    />
                  </div>
                  <small v-else class="mdv-empty">You have no common modules.</small>
                </div>
              </div>

              <!-- School / Degree (two-up mini cards) -->
              <div class="mdv-snap-item mdv-snap-degree">
                <div class="mdv-snap-item-head">
                  <span class="mdv-snap-icon">
                    <i :class="pi('warehouse')" />
                  </span>
                  <span class="mdv-snap-label">School / Degree</span>
                </div>
                <div class="mdv-snap-content">
                  <div class="mdv-degree-grid">
                    <div class="mdv-degree-tile">
                      <div class="mdv-tile-k">You</div>
                      <div class="mdv-tile-v">{{ myProfile?.degree || '-' }}</div>
                    </div>
                    <div class="mdv-degree-tile">
                      <div class="mdv-tile-k">Partner</div>
                      <div class="mdv-tile-v">{{ partnerProfile?.degree || '-' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- subtle footer -->
            <div class="mdv-snap-foot">
              <div class="mdv-foot-accent"></div>
              <span class="mdv-foot-text">Tap <b>Accept & Chat</b> to lock this session in.</span>
            </div>
          </div>
        </template>
      </Card>

      <div class="grid grid-cols-2 gap-3">
        <Button outlined @click="onDecline" :icon="pi('times')" label="Decline" style="border-radius: 5px;"/>
        <Button @click="onAccept" severity="primary" :icon="pi('check')" label="Accept & Chat" style="border-radius: 5px;"/>
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
      <p>Oops seems like you did not respond and the timer has ran out! Lets Matchmake Again</p>
      <Button class="mt-3" label="Back to Matchmaking" @click="startOver" style="border-radius: 5px;"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted, onUnmounted, onBeforeUnmount, ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import booyahSound from '@/assets/LATESTBOOYAHmp3.mp3'
import { useMatchStore } from '@/stores/match'

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

// Reuse a single Audio element so it’s warmed & controllable
const booyah = new Audio(booyahSound)
booyah.preload = 'auto'
booyah.volume = 0.8
// 1) Unlock audio on first user interaction (satisfies autoplay policies)
function unlockAudioOnce() {
  booyah.play().then(() => {
    booyah.pause()
    booyah.currentTime = 0
  }).catch(() => {})
  window.removeEventListener('pointerdown', unlockAudioOnce, true)
  window.removeEventListener('keydown', unlockAudioOnce, true)
}

onMounted(() => {
  window.addEventListener('pointerdown', unlockAudioOnce, true)
  window.addEventListener('keydown', unlockAudioOnce, true)

  if (store.stage === 'match') {
    safePlay()
  }
})

const lastStage = ref(store.stage)
watch(
  () => store.stage,
  (newStage) => {
    if (newStage === 'match' && lastStage.value !== 'match') {
      safePlay()
    }
    lastStage.value = newStage
  }
)

function safePlay() {
  booyah.muted = false
  booyah.currentTime = 0
  booyah.play().catch((err) => {
    console.warn('Match sound blocked or failed:', err?.message || err)
  })
}

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', unlockAudioOnce, true)
  window.removeEventListener('keydown', unlockAudioOnce, true)
})

const SLOT_LABELS = {
  slot_morning: 'Morning (8:30am - 11:30am)',
  slot_midday: 'Midday (12:00pm - 3:00pm)',
  slot_afternoon: 'Afternoon (3:30pm - 6:30pm)',
  slot_evening: 'Evening (7:00pm - 10:00pm)',  // remember to update back to 10pm after testing
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
        store.setLandingNotice("Match has been decline. Let's Matchmake again!")
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
  await store.declineMatch(partnerId.value ?? null, true)
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  router.replace({ name: 'matchlanding' })
}

function startOver() {
  store.startOver()
  router.push({ name: 'matchlanding' })
}
</script>

<style scoped>
/* ===== Page background (light/dark aware) ===== */
.min-h-screen {
  min-height: 100vh;
  background:
    radial-gradient(900px 180px at 50% -60px, rgba(59,130,246,.10), transparent 60%),
    linear-gradient(180deg, #ffffff, #f8fafc);
}
.dark .min-h-screen {
  background:
    radial-gradient(900px 180px at 50% -60px, rgba(59,130,246,.10), transparent 60%),
    linear-gradient(180deg, #0b1020, #0f172a);
}

/* ===== Prime card shell ===== */
:deep(.p-card) {
  border: 1px solid rgba(15,23,42,.08);
  border-radius: 16px;
  box-shadow: 0 10px 22px rgba(2,6,23,.06), 0 2px 6px rgba(2,6,23,.04);
  backdrop-filter: blur(6px);
  background: linear-gradient(180deg, rgba(248,250,252,.92), rgba(255,255,255,.86));
}
.dark :deep(.p-card) {
  border-color: rgba(255,255,255,.06);
  box-shadow: 0 10px 22px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.25);
  background: linear-gradient(180deg, rgba(15,23,42,.75), rgba(2,6,23,.65));
}

/* Header slot should be flush for top bar */
:deep(.p-card .p-card-header){
  padding: 0;            /* remove default padding so bar is edge-to-edge */
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}

/* ===== Card title ===== */
:deep(.p-card .p-card-title) {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(15,23,42,.08);
  background: linear-gradient(180deg, rgba(248,250,252,.92), rgba(255,255,255,.86));
  /* center title content (avatar + name) */
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.dark :deep(.p-card .p-card-title) {
  border-bottom-color: rgba(255,255,255,.08);
  background: linear-gradient(180deg, rgba(15,23,42,.6), rgba(15,23,42,.4));
}

:deep(.p-card .p-card-content) { padding: 16px 18px 18px; }

/* ===== Top progress bar styling ===== */
.mdv-topbar { width: 100%; }
:deep(.mdv-topbar-root){
  height: 6px;
  background: transparent;           /* no gray track */
  border-radius: 0;                  /* squared to match edges */
}
:deep(.mdv-topbar-value){
  height: 6px;
  border-radius: 0;
  background: linear-gradient(90deg, #ef4444, #f59e0b);  /* red -> amber */
}
.dark :deep(.mdv-topbar-value){
  background: linear-gradient(90deg, #f87171, #fbbf24);  /* brighter for dark */
}

/* ===== Avatar glow ===== */
.mdv-avatar-wrap { position: relative; }
.mdv-glow {
  position: absolute; inset: -6px; border-radius: 999px;
  background: radial-gradient(60px 60px at 50% 50%, rgba(59,130,246,.25), transparent 60%);
  filter: blur(6px); animation: mdvGlow 2.6s ease-in-out infinite;
}
.mdv-avatar-wrap :deep(.p-avatar) { position: relative; z-index: 1; }
@keyframes mdvGlow { 0%,100%{opacity:.55} 50%{opacity:1} }

/* ===== Enter animation for the snapshot container (kept) ===== */
.mdv-snapshot { animation: mdvRise .28s ease-out both; }
@keyframes mdvRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ===== Detail items animation (kept) ===== */
.detail-item { animation: fadeInUp 0.5s ease backwards; }
.detail-item:nth-child(1) { animation-delay: 0.1s; }
.detail-item:nth-child(2) { animation-delay: 0.2s; }
.detail-item:nth-child(3) { animation-delay: 0.3s; }
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ===== Icons (kept) ===== */
.detail-icon {
  color: #ff9800;
  margin-right: 8px;
  transition: transform 0.3s ease;
}
.detail-item:hover .detail-icon { transform: scale(1.2) rotate(5deg); }

/* ===== Tags (kept) ===== */
.tag-hover { transition: all 0.2s ease; }
.tag-hover:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

/* ===== Outer detail card (light/dark polish) ===== */
.detail-card {
  background: linear-gradient(135deg, #fff8f0 0%, #ffffff 50%, #fff5e6 100%);
  border: 1px solid #ffe0b2;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(255, 152, 0, 0.08);
  position: relative;
  overflow: hidden;
}
.dark .detail-card {
  background: linear-gradient(135deg, #1a1720 0%, #0f1320 50%, #1a1420 100%);
  border-color: rgba(255, 183, 77, .28);
  box-shadow: 0 2px 12px rgba(0,0,0,.35);
}
.detail-card::after {
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
@keyframes rotateGlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.detail-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 152, 0, 0.15);
  border-color: #ffb74d;
}
.dark .detail-card:hover {
  box-shadow: 0 6px 22px rgba(0,0,0,.45);
  border-color: rgba(255, 183, 77, .45);
}

/* =========================================================
   SNAPSHOT PRO (light/dark aware)
   ========================================================= */
.mdv-snapshot-pro{
  --ink:            #1f2937;
  --ink-dim:        #94a3b8;
  --glass-bg-a:     rgba(255,255,255,0.88);
  --glass-bg-b:     rgba(255,255,255,0.70);
  --border:         rgba(255, 183, 77, .40);
  --border-strong:  rgba(255, 183, 77, .55);
  --chip-bg:        #fffdf8;
  --chip-border:    rgba(255, 183, 77, .45);
  --chip-text:      #7c2d12;
  --icon-pill-bg:   linear-gradient(135deg, #fff, #ffe9d0);
  --accent-a:       #ff9800;
  --accent-b:       #ffb74d;
  --tile-bg:        linear-gradient(135deg,#fff,#fff7ec);
  --item-bg:        radial-gradient(140% 100% at 0% 0%, rgba(255, 245, 230, .75), rgba(255,255,255, .6) 40%, rgba(255,255,255,.5) 70%);
  --badge-bg:       #fff3e0;
  --badge-border:   #ffd699;
  --badge-text:     #b45309;
  --foot-accent-a:  #ff9800;
  --foot-accent-b:  #ffcc80;

  position: relative;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, var(--glass-bg-a), var(--glass-bg-b)) padding-box;
  border: 1px solid var(--border);
  box-shadow:
    0 10px 24px color-mix(in oklab, var(--accent-a) 15%, transparent),
    inset 0 0 0 1px rgba(255,255,255,0.35);
  backdrop-filter: blur(10px);
  overflow: hidden;
  color: var(--ink);
}

.dark .mdv-snapshot-pro{
  --ink:            #e5e7eb;
  --ink-dim:        #9ca3af;
  --glass-bg-a:     rgba(17, 24, 39, 0.85);
  --glass-bg-b:     rgba(17, 24, 39, 0.70);
  --border:         rgba(255, 183, 77, .28);
  --border-strong:  rgba(255, 183, 77, .40);
  --chip-bg:        rgba(17, 24, 39, 0.7);
  --chip-border:    rgba(255, 183, 77, .35);
  --chip-text:      #fde68a;
  --icon-pill-bg:   linear-gradient(135deg, #1f2937, #2a2f3a);
  --accent-a:       #ffb156;
  --accent-b:       #ffd08a;
  --tile-bg:        linear-gradient(135deg,#121826,#0f172a);
  --item-bg:        radial-gradient(140% 100% at 0% 0%, rgba(255, 170, 60, .07), rgba(255,255,255, .03) 40%, rgba(255,255,255,.02) 70%);
  --badge-bg:       rgba(255, 193, 120, .10);
  --badge-border:   rgba(255, 193, 120, .35);
  --badge-text:     #ffd28c;
  --foot-accent-a:  #ffb156;
  --foot-accent-b:  #ffd08a;
}

/* gradient border shimmer (mask + compat) */
.mdv-snapshot-pro::before{
  content:'';
  position:absolute; inset:0;
  padding:1px; border-radius:16px;
  background: linear-gradient(135deg, var(--accent-b), #ffffff80, var(--accent-a));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: exclude;
  opacity:.6; pointer-events:none;
}

/* sheen */
.mdv-snapshot-pro::after{
  content:'';
  position:absolute; inset:-40% -20% auto -20%; height: 180px;
  background: linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.35) 40%, rgba(255,255,255,0) 80%);
  transform: translateY(-30%) rotate(2deg);
  filter: blur(8px);
  animation: mdvSheen 6s ease-in-out infinite;
  pointer-events:none;
}
@keyframes mdvSheen{
  0%, 15% { transform: translateY(-30%) rotate(2deg); opacity: .0; }
  22%      { opacity: .8; }
  40%,100% { transform: translateY(30%)  rotate(2deg); opacity: 0; }
}

/* header */
.mdv-snap-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px; }
.mdv-snap-head-left{ display:flex; align-items:center; gap:10px; color: var(--ink); }
.mdv-snap-head-left i{ opacity:.85; font-size: 1.1rem; }
.mdv-snap-title{
  font-weight: 700; letter-spacing:.2px;
  background: linear-gradient(90deg, var(--accent-a), var(--accent-b));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

/* grid */
.mdv-snap-grid{ display:grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 520px){
  .mdv-snap-grid{ grid-template-columns: 1fr 1fr; }
  .mdv-snap-degree{ grid-column: 1 / -1; }
}

/* item (cardlet) */
.mdv-snap-item{
  position:relative;
  border-radius: 14px;
  padding:12px 12px 10px;
  background: var(--item-bg) padding-box;
  border:1px solid var(--border);
  box-shadow:
    0 6px 16px color-mix(in oklab, var(--accent-a) 12%, transparent),
    inset 0 1px 0 rgba(255,255,255,.35);
  overflow:hidden;
}
/* animated accent bar */
.mdv-snap-item::before{
  content:'';
  position:absolute; left:0; top:10px; bottom:10px; width:3px;
  background: linear-gradient(180deg, var(--accent-b), var(--accent-a));
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(255,255,255,.6) inset;
  opacity:.9;
  animation: mdvPulse 2.6s ease-in-out infinite;
}
@keyframes mdvPulse{ 0%,100%{ transform: scaleY(.95); opacity:.7; } 50%{ transform: scaleY(1); opacity:1; } }

.mdv-snap-item-head{
  display:flex; align-items:center; gap:8px; margin-left:6px; margin-bottom:6px;
  color: var(--ink); font-weight: 600;
}
.mdv-snap-icon{
  display:inline-flex; align-items:center; justify-content:center;
  width:26px; height:26px; border-radius:999px;
  background: var(--icon-pill-bg);
  border:1px solid var(--border-strong);
  box-shadow: 0 2px 6px color-mix(in oklab, var(--accent-a) 15%, transparent);
}
.mdv-snap-icon i{ font-size:.9rem; color:var(--accent-a); opacity:.95; }

.mdv-snap-label{ letter-spacing:.2px; color: var(--ink); }

/* tags (PrimeVue <Tag> override only inside snapshot) */
.mdv-tags{ display:flex; flex-wrap:wrap; gap:8px; }
:deep(.mdv-tag.p-tag){
  border-radius: 999px;
  padding: .3rem .6rem;
  font-size: .78rem;
  background: var(--chip-bg);
  border:1px solid var(--chip-border);
  color: var(--chip-text);
  transition: transform .18s ease, box-shadow .18s ease;
}
:deep(.mdv-tag.p-tag:hover){
  transform: translateY(-1px);
  box-shadow: 0 4px 10px color-mix(in oklab, var(--accent-a) 22%, transparent);
}

.mdv-empty{ color: var(--ink-dim); }

/* degree tiles */
.mdv-degree-grid{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
.mdv-degree-tile{
  border-radius:12px; padding:10px;
  background: var(--tile-bg);
  border:1px solid var(--border);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.18);
}
.mdv-tile-k{
  font-size:.72rem; text-transform:uppercase; letter-spacing:.06em;
  color: color-mix(in oklab, var(--accent-a) 55%, #8b5cf6 0%);
  margin-bottom:4px; font-weight:700;
}
.mdv-tile-v{
  font-size:.9rem; color: var(--ink); font-weight:600; word-break: break-word;
}

/* footer cue */
.mdv-snap-foot{
  display:flex; align-items:center; gap:10px;
  margin-top: 12px; padding-top: 10px; position:relative;
}
.mdv-foot-accent{
  width: 50px; height: 4px; border-radius:999px;
  background: linear-gradient(90deg,var(--foot-accent-a),var(--foot-accent-b));
  box-shadow: 0 2px 8px color-mix(in oklab, var(--accent-a) 35%, transparent);
}
.mdv-foot-text{ color: var(--ink-dim); font-size:.82rem; }

/* ===== Floating bursts (kept) ===== */
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

/* ===== Utility (kept) ===== */
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.gap-3 { gap: 0.75rem; }
.bg-red-500 { background: #ef4444; }

/* ===== Partner name: light/dark + centering spin ===== */
.mdv-title-wrap{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
  gap:.25rem;
}

/* Partner name color (light/dark friendly) */
.mdv-partner-name {
  color: #1f2937 !important;            /* slate-800 for light */
  display: inline-block;                 /* for transforms */
  animation: mdvSpinIn 1.5s ease both;    /* entrance spin */
  will-change: transform;
  cursor: default;
}
.dark .mdv-partner-name {
  color: #1f2937 !important;            /* slate-200 for dark */
}

/* spin again on hover */
.mdv-partner-name:hover{
  animation: mdvSpinHover .7s ease-in-out both;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce){
  .mdv-partner-name{ animation:none !important; }
  .mdv-partner-name:hover{ animation:none !important; }
}

/* Keyframes for partner name */
@keyframes mdvSpinIn{
  0%   { transform: rotate(-8deg) scale(.96); opacity:0; }
  60%  { transform: rotate(6deg)  scale(1.02); opacity:1; }
  100% { transform: rotate(0deg)  scale(1); }
}
@keyframes mdvSpinHover{
  0%   { transform: rotate(0deg)   scale(1); }
  50%  { transform: rotate(360deg) scale(1.04); }
  100% { transform: rotate(360deg) scale(1); }
}

/* Optional: if your app doesn't toggle .dark, honor OS dark mode */
@media (prefers-color-scheme: dark) {
  html:not(.dark) .mdv-partner-name { color: #1f2937 !important; }
}
</style>
<style>
/* Confetti needs to be global because we append to document.body */
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
