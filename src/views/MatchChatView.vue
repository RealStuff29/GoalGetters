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
            <div class="flex-1 overflow-auto pr-2" ref="chatScroller">
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
          <StudySpotMap :api-key="YOUR_GOOGLE_MAPS_API_KEY" height="400px" @places-updated="handlePlacesUpdate"/>
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
            <div class="space-y-2 mb-3">

              <div v-for="spot in paginatedSpots" :key="spot.place_id" 
                  class="flex items-start justify-between p-3 rounded border surface-border hover:bg-gray-50 transition-colors">
                <div class="flex-1">
                  <div class="font-medium">{{ spot.name }}</div>
                  <small class="opacity-70 block">{{ spot.vicinity || spot.formatted_address }}</small>
                  <small v-if="spot.rating" class="text-yellow-600">
                    ★ {{ spot.rating }} {{ spot.user_ratings_total ? `(${spot.user_ratings_total} reviews)` : '' }}
                  </small>
                </div>
                <Button 
                  outlined 
                  size="small" 
                  icon="pi pi-map-marker" 
                  label="View" 
                  @click="focusOnSpot(spot)"
                />
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
import { onMounted, ref, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchStore } from '@/stores/match'
function pi(name: string) { return `pi pi-${name}` }

import { usePrimeVue } from 'primevue/config';
import Card from 'primevue/card';
import Button from 'primevue/button';
import StudySpotMap from './StudySpotMap.vue'; // Import the map component

// const { pi } = usePrimeVue().config;

//API key goes here

//@jordan - I just put a @ts-ignore and did it the JS way, if you want to do it the proper ts way, theres some setup you need to do
//@ts-ignore
const YOUR_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

//studyspots
const studySpots = ref<any[]>([]);
const currentPage = ref(1);
const itemsPerPage = 4;

// Computed property for pagination
const totalPages = computed(() => Math.ceil(studySpots.value.length / itemsPerPage));

const paginatedSpots = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return studySpots.value.slice(start, end);
});


const handlePlacesUpdate = (places:any) => {
  console.log('🎯 Parent received places:', places.length);
  console.log('🎯 Places:', places);
  studySpots.value = [...places];
  currentPage.value = 1; // Reset to first page on new search
  console.log('🎯 studySpots.value updated to:', studySpots.value.length);
};

const focusOnSpot = (spot:any) => {
  console.log('Focus on:', spot.name);
  // Can add map focusing logic here later
};

const store = useMatchStore()
const router = useRouter()
const chatScroller = ref<HTMLElement | null>(null)

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
  router.push({ name: 'match-landing' })
}

onMounted(() => nextTick(scrollToBottom))
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
