<template>
  <div class="min-h-screen p-4">
    <!-- Non-chat stages -->
    <div v-if="stage !== 'chat'" class="w-full mx-auto max-w-2xl flex items-center justify-center min-h-screen">
      <!-- Landing Page -->
      <div v-if="stage === 'landing'" class="text-center space-y-4">
        <div>
          <h1 class="text-4xl font-semibold mb-2">Find Your Study Partner</h1>
          <p class="text-lg opacity-80">Connect with classmates for collaborative learning sessions</p>
        </div>
        <Button size="large" severity="primary" @click="startMatchmaking" label="Start Matchmaking" />
      </div>

      <!-- Searching State -->
      <div v-else-if="stage === 'searching'" class="text-center space-y-4">
        <div class="flex items-center justify-center">
          <ProgressSpinner style="width:4rem;height:4rem" strokeWidth="4"/>
        </div>
        <div>
          <h2 class="text-2xl font-semibold">Finding Your Perfect Study Match</h2>
          <p class="opacity-80">Searching for classmates with similar study goals...</p>
        </div>
        <div class="flex justify-center gap-2">
          <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
          <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse delay-150"></span>
          <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse delay-300"></span>
        </div>
      </div>

      <!-- Match Found -->
      <div v-else-if="stage === 'match'" class="w-full max-w-md mx-auto space-y-4">
        <div class="text-center">
          <h2 class="text-2xl font-semibold mb-1">Match Found! 🎉</h2>
          <p class="opacity-80">You have <b>{{ countdownText }}</b> to respond</p>
        </div>

        <Card>
          <template #title>
            <div class="flex flex-col items-center">
              <Avatar :label="partnerInitials" size="large" shape="circle" class="mb-3" />
              <span class="text-lg font-semibold">{{ match.partner.name }}</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <i :class="pi('book')" class="opacity-70 mt-1"/>
                <div>
                  <Tag severity="secondary" :value="match.subject" />
                  <p class="text-sm opacity-80 mt-1">{{ match.description }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <i :class="pi('clock')" class="opacity-70 mt-1"/>
                <div>
                  <p>{{ match.time }}</p>
                  <p class="text-sm opacity-80">Duration: <b>{{ match.duration }}</b></p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <i :class="pi('map-marker')" class="opacity-70 mt-1"/>
                <p>{{ match.location }}</p>
              </div>
            </div>
          </template>
        </Card>

        <ProgressBar :value="(secondsLeft/totalSeconds)*100" :showValue="false" style="height:6px" :pt="{value:{class:'bg-red-500'}}"/>

        <div class="grid grid-cols-2 gap-3">
          <Button outlined @click="declineMatch" :icon="pi('times')" label="Decline"/>
          <Button @click="acceptMatch" severity="primary" :icon="pi('check')" label="Accept"/>
        </div>
      </div>

      <!-- Match Result -->
      <div v-else-if="stage === 'result'" class="text-center space-y-4 w-full max-w-md mx-auto">
        <Card>
          <template #title>
            <div class="flex justify-center mb-2">
              <i :class="['pi', resultAccepted ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500']" :style="{ fontSize: '3rem' }"/>
            </div>
            <span class="text-xl font-semibold">{{ resultAccepted ? 'Match Accepted!' : 'Match Declined' }}</span>
          </template>
          <template #content>
            <p class="opacity-80 mb-4">
              {{ resultAccepted ? 'Great! Both parties have accepted the match. You can now chat and coordinate your study session!' : 'No worries. You can try finding another match.' }}
            </p>
            <div class="space-y-2">
              <Button v-if="resultAccepted" @click="goToChat" severity="primary" :icon="pi('comments')" label="Start Chatting & Find Location" class="w-full"/>
              <Button outlined @click="startOver" :icon="pi('refresh')" label="Find Another Match" class="w-full"/>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Chat + Map stage -->
    <div v-else class="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
      <!-- Left column: Chat -->
      <div class="space-y-4">
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <Avatar :label="partnerInitials" shape="circle" />
              <div>
                <div class="font-medium">{{ match.partner.name }}</div>
                <small class="opacity-70">Online now</small>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #title>
            <span class="text-base font-medium">Study Session Details</span>
          </template>
          <template #content>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <i :class="pi('book')" class="opacity-70 mt-1"/>
                <div>
                  <Tag severity="secondary" :value="match.subject" />
                  <p class="text-sm opacity-80 mt-1">{{ match.description }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <i :class="pi('clock')" class="opacity-70 mt-1"/>
                <div>
                  <p class="text-sm">{{ match.time }}</p>
                  <small class="opacity-70">Duration: <b>{{ match.duration }}</b></small>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <i :class="pi('map-marker')" class="opacity-70 mt-1"/>
                <p class="text-sm">{{ match.location }}</p>
              </div>
            </div>
          </template>
        </Card>

        <Card class="h-96 flex flex-col">
          <template #title>
            <span class="text-base font-medium">Chat</span>
          </template>
          <template #content>
            <div class="flex flex-col h-72">
              <div class="flex-1 overflow-auto pr-2" ref="chatScroller">
                <div v-for="m in messages" :key="m.id" class="mb-2">
                  <div :class="m.from==='me' ? 'text-right' : 'text-left'">
                    <span :class="['inline-block px-3 py-2 rounded-lg', m.from==='me' ? 'bg-primary-500 text-white' : 'bg-surface-200']">{{ m.text }}</span>
                  </div>
                </div>
              </div>
              <Divider />
              <!-- Chat send bar -->
              <IconField class="w-full">
                <InputText
                  v-model="draft"
                  placeholder="Type a message..."
                  @keyup.enter="send"
                  class="w-full"
                />
                <InputIcon
                  class="pi pi-arrow-right cursor-pointer"
                  @click="send"
                  aria-label="Send message"
                />
              </IconField>



            </div>
          </template>
        </Card>
      </div>

      <!-- Right column: Map + Suggestions -->
      <div class="space-y-4">
        <Card>
          <template #title>
            <span class="text-base font-medium"><i :class="pi('direction')" class="mr-2"/> Nearby Study Locations</span>
          </template>
          <template #content>
            <div class="relative h-64 rounded-lg overflow-hidden" style="background:linear-gradient(135deg,#dbeafe,#dcfce7)">
              <div class="absolute inset-4 border-2 border-dashed rounded flex items-center justify-center opacity-80">
                <div class="text-center">
                  <i :class="pi('map-marker')" style="font-size:1.5rem" class="mb-2 block"/>
                  <p class="text-sm">Google Maps Integration</p>
                  <small>API Key: YOUR_GOOGLE_MAPS_API_KEY</small>
                </div>
              </div>
              <span class="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow" style="left:20%;top:30%"></span>
              <span class="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow" style="left:45%;top:50%"></span>
              <span class="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow" style="left:70%;top:70%"></span>
            </div>
          </template>
        </Card>

        <Card>
          <template #title>
            <div>
              <div class="text-base font-medium">Suggested Study Spots</div>
              <small class="opacity-70">Based on your location and study needs</small>
            </div>
          </template>
          <template #content>
            <div class="max-h-64 overflow-auto space-y-2">
              <div v-for="(spot, idx) in locationSuggestions" :key="idx" class="flex items-start justify-between p-3 rounded border surface-border">
                <div>
                  <div class="font-medium">{{ spot.name }}</div>
                  <small class="opacity-70">{{ spot.desc }}</small>
                </div>
                <Button outlined size="small" :icon="pi('thumbtack')" label="Use" @click="chooseSpot(spot)"/>
              </div>
            </div>
          </template>
        </Card>

        <Button outlined class="w-full" :icon="pi('refresh')" label="Find Another Match" @click="startOver"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, nextTick } from 'vue'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'



// Tiny helper to use PrimeIcons more ergonomically
function pi(name: string) { return `pi pi-${name}` }

// ---------- State ----------
const stage = ref<'landing' | 'searching' | 'match' | 'result' | 'chat'>('landing')
const resultAccepted = ref(false)
import { generateName } from '@/services/nameService.js'
const match = ref({
  subject: 'WAD2',
  description: 'Homework discussion and review',
  time: '3:30 PM - 4:30 PM',
  duration: '1 hour',
  location: 'Library Level 2, Study Room 3',
  partner: { name: generateName() } //Replace with random name
})

const partnerInitials = computed(() => match.value.partner.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase())

// Timer (30s)
const totalSeconds = 30
const secondsLeft = ref(totalSeconds)
let tick: number | null = null

const countdownText = computed(() => {
  const s = secondsLeft.value
  const mm = Math.floor(s / 60)
  const ss = (s % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
})

function startCountdown() {
  stopCountdown()
  secondsLeft.value = totalSeconds
  tick = window.setInterval(() => {
    if (secondsLeft.value > 0) secondsLeft.value--
    else { stopCountdown(); declineMatch() }
  }, 1000)
}

function stopCountdown() { if (tick) { clearInterval(tick); tick = null } }

// ---------- Actions ----------
function startMatchmaking() {
  stage.value = 'searching'
  setTimeout(() => { stage.value = 'match'; startCountdown() }, 1200)
}

function acceptMatch() { stopCountdown(); resultAccepted.value = true; stage.value = 'result' }
function declineMatch() { stopCountdown(); resultAccepted.value = false; stage.value = 'result' }

function startOver() {
  stopCountdown(); stage.value = 'landing'; messages.value = seedMessages(); draft.value = ''
}

function goToChat() { stage.value = 'chat'; nextTick(() => scrollToBottom()) }

// ---------- Chat ----------
let idSeq = 0
const chatScroller = ref<HTMLElement | null>(null)
const draft = ref('')
const messages = ref(seedMessages())

function seedMessages() {
  idSeq = 0
  return [
    { id: ++idSeq, from: 'them' as const, text: 'Hey! Ready to go over the WAD2 homework?' },
    { id: ++idSeq, from: 'me' as const, text: 'Yup! I got stuck at the Axios part though.' }
  ]
}

function send() {
  const text = draft.value.trim(); if (!text) return
  messages.value.push({ id: ++idSeq, from: 'me' as const, text }); draft.value = ''
  scrollToBottom()
  setTimeout(() => { messages.value.push({ id: ++idSeq, from: 'them' as const, text: "Nice, let's compare approaches." }); scrollToBottom() }, 700)
}

function scrollToBottom() { const el = chatScroller.value; if (el) el.scrollTop = el.scrollHeight }

// ---------- Locations ----------
const locationSuggestions = ref([
  { name: 'Library L2 – Study Room 3', desc: 'Quiet room • Whiteboard • Fits 4' },
  { name: 'SMU Labs – Booth A12', desc: 'Open booth • Power sockets' },
  { name: 'Koufu – Back Corner', desc: 'Casual • Good for brainstorming' },
  { name: 'SOE L3 – Breakout Area', desc: 'Open space • Near elevators' }
])

function chooseSpot(spot: { name: string; desc: string }) {
  match.value.location = spot.name
  messages.value.push({ id: ++idSeq, from: 'me' as const, text: `Let's meet at ${spot.name}.` })
  scrollToBottom()
}

onBeforeUnmount(() => stopCountdown())
</script>

<style scoped>
.chat-sendbar :deep(.p-button .pi) { font-size: 1rem; }
.min-h-screen { min-height: 100vh; }
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.gap-6 { gap: 1.5rem; }
.space-y-4 > * + * { margin-top: 1rem; }
.space-y-2 > * + * { margin-top: .5rem; }
.w-full { width: 100%; }
.max-w-2xl { max-width: 42rem; }
.max-w-6xl { max-width: 72rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.text-center { text-align: center; }
.font-semibold { font-weight: 600; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.opacity-70 { opacity: .7; }
.opacity-80 { opacity: .8; }
.p-4 { padding: 1rem; }
.h-96 { height: 24rem; }
.h-72 { height: 18rem; }
.rounded { border-radius: .5rem; }
.rounded-full { border-radius: 9999px; }
.border { border: 1px solid var(--p-content-border-color); }
.bg-primary-500 { background: var(--p-primary-color); }
.bg-surface-200 { background: var(--p-content-border-color); }
.text-white { color: #fff; }
.delay-150 { animation-delay:150ms; }
.delay-300 { animation-delay:300ms; }
.animate-pulse { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
@keyframes pulse { 50% { opacity:.5 } }
</style>
