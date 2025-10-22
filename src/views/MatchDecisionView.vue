<!-- src/views/MatchDecisionView.vue -->
<template>
  <div class="min-h-screen p-4 w-full mx-auto max-w-md flex items-center justify-center">
    <div class="w-full space-y-4" v-if="store.stage === 'match'">
      <div class="text-center">
        <h2 class="text-2xl font-semibold mb-1">Match Found! 🎉</h2>
        <p class="opacity-80">You have <b>{{ store.countdownText }}</b> to respond</p>
      </div>

      <Card>
        <template #title>
          <div class="flex flex-col items-center">
            <Avatar :label="store.partnerInitials" size="large" shape="circle" class="mb-3" />
            <span class="text-lg font-semibold">{{ store.match.partner.name }}</span>
          </div>
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
                <p>{{ store.match.time }}</p>
                <p class="text-sm opacity-80">Duration: <b>{{ store.match.duration }}</b></p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i :class="pi('map-marker')" class="opacity-70 mt-1"/>
              <p>{{ store.match.location }}</p>
            </div>
          </div>
        </template>
      </Card>

      <ProgressBar :value="(store.secondsLeft/store.totalSeconds)*100" :showValue="false" style="height:6px" :pt="{value:{class:'bg-red-500'}}"/>

      <div class="grid grid-cols-2 gap-3">
        <Button outlined @click="onDecline" :icon="pi('times')" label="Decline"/>
        <Button @click="onAccept" severity="primary" :icon="pi('check')" label="Accept"/>
      </div>
    </div>

    <div class="w-full space-y-4 text-center" v-else-if="store.stage === 'result'">
      <Card>
        <template #title>
          <div class="flex justify-center mb-2">
            <i :class="['pi', store.resultAccepted ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500']" :style="{ fontSize: '3rem' }"/>
          </div>
          <span class="text-xl font-semibold">{{ store.resultAccepted ? 'Match Accepted!' : 'Match Declined' }}</span>
        </template>
        <template #content>
          <p class="opacity-80 mb-4">
            {{ store.resultAccepted ? 'Great! Both parties have accepted the match. You can now chat and coordinate your study session!' : 'No worries. You can try finding another match.' }}
          </p>
          <div class="space-y-2">
            <Button v-if="store.resultAccepted" @click="goChat" severity="primary" :icon="pi('comments')" label="Start Chatting & Find Location" class="w-full"/>
            <Button outlined @click="startOver" :icon="pi('refresh')" label="Find Another Match" class="w-full"/>
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="opacity-70">
      <!-- in case someone lands here out of order -->
      Loading...
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMatchStore } from '@/stores/match'
function pi(name: string) { return `pi pi-${name}` }

const store = useMatchStore()
const router = useRouter()

function onAccept() {
  store.acceptMatch()
  // show result on same page (stage changes to 'result')
}

function onDecline() {
  store.declineMatch()
}

function goChat() {
  store.goToChat()
  router.push({ name: 'match-chat' })
}

function startOver() {
  store.startOver()
  router.push({ name: 'match-landing' })
}
</script>

<style scoped>
.min-h-screen { min-height: 100vh; }
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.gap-3 { gap: .75rem; }
.text-green-500 { color: #22c55e; }
.text-red-500 { color: #ef4444; }
.bg-red-500 { background: #ef4444; }
</style>
