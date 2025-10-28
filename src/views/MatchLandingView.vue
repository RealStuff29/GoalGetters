<!-- src/views/MatchLandingView.vue -->
<template>
  <div class="min-h-screen p-4 w-full mx-auto max-w-2xl flex items-center justify-center">
    <div class="text-center space-y-4" v-if="store.stage === 'landing'">
      <div>
        <h1 class="text-4xl font-semibold mb-2">Find Your Study Partner</h1>
        <p class="text-lg opacity-80">Connect with classmates for collaborative learning sessions</p>
      </div>
      <Button size="large" severity="primary" @click="onStart" label="Start Matchmaking" />
    </div>

    <div v-else class="text-center space-y-4">
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
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMatchStore } from '@/stores/match'
function pi(name: string) { return `pi pi-${name}` } // if you need icons
const router = useRouter()
const store = useMatchStore()

async function onStart() {
  await store.startMatchmaking() //make the filter and matchmaking logic here
  router.push({ name: 'matchdecision' })
}
</script>

<style scoped>
.min-h-screen { min-height: 100vh; }
.bg-primary-500 { background: var(--p-primary-color); }
.animate-pulse { animation: pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite; }
.delay-150 { animation-delay:150ms; }
.delay-300 { animation-delay:300ms; }
@keyframes pulse { 50% { opacity:.5 } }
</style>
