<!-- src/views/MatchChatView.vue -->

<template>
  <!-- Debug line
  <div class="bg-blue-100 p-2">
    Stage: {{ store.stage }} | StudySpots: {{ studySpots.length }}
  </div> -->

  <div class="min-h-screen p-4 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-6" v-if="store.stage === 'chat'">
    <!-- Left column: Header + Details + Chat -->
    <div class="space-y-4">
      <Card>
        <template #content>
          <div class="flex items-center gap-3">
            <Avatar :label="store.partnerInitials" shape="circle" />
            <div>
              <div class="font-medium">{{ store.match.partner.name }}</div>
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
                <Tag severity="secondary" :value="store.match.subject" />
                <p class="text-sm opacity-80 mt-1">{{ store.match.description }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i :class="pi('clock')" class="opacity-70 mt-1"/>
              <div>
                <p class="text-sm">{{ store.match.time }}</p>
                <small class="opacity-70">Duration: <b>{{ store.match.duration }}</b></small>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i :class="pi('map-marker')" class="opacity-70 mt-1"/>
              <p class="text-sm">{{ store.match.location }}</p>
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
            <div class="flex-1 overflow-auto pr-2 space-y-4" ref="chatScroller">
              <div v-for="m in store.messages" :key="m.id" class="mb-2">
                <div :class="m.from==='me' ? 'text-right' : 'text-left'">
                  <span :class="['inline-block px-3 py-2 rounded-lg', m.from==='me' ? 'bg-primary-500 text-white' : 'bg-surface-200']">
                    {{ m.text }}
                  </span>
                </div>
              </div>
            </div>
            <Divider />
            <div class="flex gap-2 items-center">
              <InputText v-model="store.draft" placeholder="Type a message..." class="flex-1" @keyup.enter="send"/>
              <Button size="small" @click="send" icon="pi pi-send" label="Send"/>
            </div>
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
          <StudySpotMap ref="mapRef" :api-key="YOUR_GOOGLE_MAPS_API_KEY" height="400px" @places-updated="handlePlacesUpdate"/>
        </template>
      </Card>
      <!-- <Card>
        <template #content>
          <div class="bg-yellow-100 p-4">
            <strong>DEBUG:</strong> studySpots.length = {{ studySpots.length }}
            <br>
            <strong>First spot:</strong> {{ studySpots[0]?.name || 'none' }}
          </div>
        </template>
      </Card> -->
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

              <div v-for="spot in paginatedSpots" :key="spot.place_id" 
                  class="flex items-start justify-between p-3 rounded border surface-border hover:bg-gray-50 transition-colors">
                <div class="flex-1">
                  <div class="font-medium">{{ spot.name }}</div>
                  <small class="opacity-70 block">{{ spot.vicinity || spot.formatted_address }}</small>
                  <small v-if="spot.rating" class="text-yellow-600">
                    ★ {{ spot.rating }} {{ spot.user_ratings_total ? `(${spot.user_ratings_total} reviews)` : '' }}
                  </small>
                </div>
                <div class="flex gap-3 space-y-4">
                  <Button
                    outlined 
                    size="small" 
                    icon="pi pi-map-marker" 
                    label="View" 
                    @click="focusOnSpot(spot)">
                  </Button>
                  <Button 
                    outlined 
                    size="small" 
                    icon="pi pi-plus" 
                    label="Suggest" 
                    @click="suggestSpot(spot)">
                  </Button>
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

      <Button outlined class="w-full" :icon="pi('refresh')" label="Find Another Match" @click="restart"/>
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
function pi(name: string) { return `pi pi-${name}` }

import Card from 'primevue/card';
import Button from 'primevue/button';
import StudySpotMap from './StudySpotMap.vue';

const YOUR_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const studySpots = ref<any[]>([]);
const currentPage = ref(1);
const itemsPerPage = 4;
const mapRef = ref<InstanceType<typeof StudySpotMap> | null>(null);

const totalPages = computed(() => Math.ceil(studySpots.value.length / itemsPerPage));
const paginatedSpots = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return studySpots.value.slice(start, end);
});

const handlePlacesUpdate = (places:any) => {
  studySpots.value = [...places];
  currentPage.value = 1;
};

const focusOnSpot = (spot:any) => {
  if (mapRef.value && spot.geometry?.location) {
    // @ts-ignore
    mapRef.value.focusOnLocation(spot.geometry.location, spot.name, spot.place_id);
  }
};

const store = useMatchStore()
const router = useRouter()
const route = useRoute()
const chatScroller = ref<HTMLElement | null>(null)

// 👇 add this
let chatPollTimer: number | null = null
const isAlive = ref(true)

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

const suggestSpot = (spot: any) => {
  const message = `Let's meet at ${spot.name}! Location @${spot.vicinity || spot.formatted_address || ''}`;
  store.sendMessage(message);
  store.draft = '';
  nextTick(scrollToBottom);
  setTimeout(() => nextTick(scrollToBottom), 750);
};

function restart() {
  store.startOver()
  router.push({ name: 'matchlanding' })
}

// 👇 helper: check if partner rejected me OR room is gone
async function checkStillValid() {
  // 1) who am I?
  const { data: auth } = await supabase.auth.getUser()
  const myId = auth?.user?.id
  if (!myId) return false

  // 2) what room am I in?
  const roomId = store.currentMatchId || store.match.id
  if (!roomId) return false

  // 3) does the room still exist?
  const { data: room, error: roomErr } = await supabase
    .from('match_room')
    .select('id, user1, user2')
    .eq('id', roomId)
    .maybeSingle()

  // if room is gone → other person declined (or we deleted it)
  if (roomErr || !room) {
    console.log('[chat poll] room missing → treat as rejected')
    return false
  }

  // 4) who is the other person?
  const otherId = room.user1 === myId ? room.user2 : room.user1

  // 5) did the OTHER person reject ME?
  const { data: rej, error: rejErr } = await supabase
    .from('match_rejects')
    .select('user_id')
    .eq('user_id', otherId)
    .eq('rejected_user_id', myId)
    .maybeSingle()

  if (rejErr) {
    console.warn('[chat poll] reject check error', rejErr)
    // if error, don't kick user out
    return true
  }

  // if rej exists → otherId rejected me
  if (rej) {
    console.log('[chat poll] partner rejected me → leaving chat')
    return false
  }

  // otherwise still valid
  return true
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

  // 👇 start polling
  chatPollTimer = window.setInterval(async () => {
    // if component is already unmounting, don't do anything
    if (!isAlive.value) return

    const ok = await checkStillValid()

    // user still ok in room
    if (ok) return

    // 👇 from here: user is NOT ok → stop timer FIRST
    if (chatPollTimer) {
      clearInterval(chatPollTimer)
      chatPollTimer = null
    }

    // also stop further work if unmounted in between
    if (!isAlive.value) return

    // clean local state
    store.startOver()
    // optional: clean queue
    store.leaveQueue?.().catch(() => {})

    // finally navigate
    router.replace({ name: 'matchlanding' })
  }, 2000) as unknown as number
})

onUnmounted(() => {
  isAlive.value = false
  if (chatPollTimer) {
    clearInterval(chatPollTimer)
  }
  chatPollTimer = null
})
</script>

<style scoped>
.min-h-screen { min-height: 100vh; }
.grid { display: grid; }
.lg\:grid-cols-2 { grid-template-columns: 1fr; }
@media (min-width: 1024px) { .lg\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.gap-6 { gap: 1.5rem; }
.space-y-4 > * + * { margin-top: 1rem; }
.h-96 { height: 24rem; }
.h-72 { height: 18rem; }
.bg-primary-500 { background: var(--p-primary-color); }
.bg-surface-200 { background: var(--p-content-border-color); }
.text-white { color: #fff; }
</style>
