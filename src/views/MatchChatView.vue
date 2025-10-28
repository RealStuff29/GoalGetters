<!-- src/views/MatchChatView.vue -->

<template>
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
          <div class="relative h-64 rounded-lg overflow-hidden" style="background:linear-gradient(135deg,#dbeafe,#dcfce7)">
            <div class="absolute inset-4 border-2 border-dashed rounded flex items-center justify-center opacity-80">
              <div class="text-center">
                <i :class="pi('map-marker')" style="font-size:1.5rem" class="mb-2 block"/>
                <StudySpotMap :api-key="YOUR_GOOGLE_MAPS_API_KEY" height="400px" />
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
            <div v-for="(spot, idx) in store.locationSuggestions" :key="idx" class="flex items-start justify-between p-3 rounded border surface-border">
              <div>
                <div class="font-medium">{{ spot.name }}</div>
                <small class="opacity-70">{{ spot.desc }}</small>
              </div>
              <Button outlined size="small" :icon="pi('thumbtack')" label="Use" @click="store.chooseSpot(spot)"/>
            </div>
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
import { onMounted, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchStore } from '@/stores/match'
function pi(name: string) { return `pi pi-${name}` }

//import { usePrimeVue } from 'primevue/config';
import Card from 'primevue/card';
//@ts-ignore;

import StudySpotMap from './studyspotmap.vue'; // Import the map component


// Import the map component


// const { pi } = usePrimeVue().config;

//API key goes here

//@jordan - I just put a @ts-ignore and did it the JS way, if you want to do it the proper ts way, theres some setup you need to do
//@ts-ignore
const YOUR_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const store = useMatchStore()
const router = useRouter()
const route = useRoute()
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
  router.push({ name: 'matchchat', params: { chatId: store.chatId }}) //to fix hard refresh on chat
}

onMounted(async () => {
  // 1) restore
  await store.hydrateFromCache()
  // 2) ensure a match exists (needed for header/details)
  const hasMatch = await store.ensureMatch(store.currentMatchId || undefined)
  if (!hasMatch) {
    router.replace({ name: 'matchlanding' })
    return
  }
  // 3) ensure chat id (from route or cache)
  await store.ensureChat(route.params.chatId as string | undefined)
  // 4) set stage so template renders
  store.stage = 'chat'
  // 5) scroll once ready
  nextTick(scrollToBottom)
  setTimeout(() => nextTick(scrollToBottom), 500)})
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
