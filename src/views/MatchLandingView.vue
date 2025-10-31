<!-- src/views/MatchLandingView.vue -->
<template>
  <div class="match-landing-container">
    <!-- LANDING / FORM -->
    <div v-if="store.stage === 'landing'" class="match-form">
      <div class="match-header">
        <h1 class="match-title">Find Your Study Partner</h1>
        <p class="match-subtitle">
          Tell us when you're free, then we’ll match you 👇
        </p>
      </div>

      <!-- Time slot selector -->
      <div class="slots-grid">
        <button
          v-for="slot in timeSlots"
          :key="slot.id"
          type="button"
          @click="toggleSlot(slot.id)"
          class="slot-btn"
          :class="{ 'slot-btn--active': selectedSlots.includes(slot.id) }"
        >
          <span class="slot-title">{{ slot.label }}</span>
          <span class="slot-window">{{ slot.window }}</span>
        </button>
      </div>

      <!-- Start button -->
      <div class="match-start">
        <Button
          class="start-btn"
          size="large"
          :disabled="selectedSlots.length === 0"
          @click="onStart"
          label="Start Matchmaking"
        />
        <p v-if="selectedSlots.length === 0" class="error-hint">
          Pick at least one time slot to continue.
        </p>
      </div>
    </div>

    <!-- SEARCHING STATE -->
    <div v-else class="match-searching">
      <ProgressSpinner style="width:4rem;height:4rem" strokeWidth="4" />
      <h2 class="match-title-sm">Finding Your Perfect Study Match</h2>
      <p class="match-subtitle">Searching for classmates with similar study goals...</p>
      <div class="dots">
        <span class="dot"></span>
        <span class="dot delay-150"></span>
        <span class="dot delay-300"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchStore } from '@/stores/match'

const router = useRouter()
const store = useMatchStore()

const timeSlots = [
  { id: 'slot_morning',   label: 'Morning',   window: '8:30am – 11:30am' },
  { id: 'slot_midday',    label: 'Midday',    window: '12:00pm – 3:00pm' },
  { id: 'slot_afternoon', label: 'Afternoon', window: '3:30pm – 6:30pm' },
  { id: 'slot_evening',   label: 'Evening',   window: '7:00pm – 10:00pm' },
]

const selectedSlots = ref<string[]>([])

function toggleSlot(id: string) {
  if (selectedSlots.value.includes(id)) {
    selectedSlots.value = selectedSlots.value.filter(s => s !== id)
  } else {
    selectedSlots.value = [...selectedSlots.value, id]
  }
}

async function onStart() {
  if (selectedSlots.value.length === 0) return
  await store.setAvailability(selectedSlots.value)
  store.stage = 'searching'
  const roomId = await store.queueAndPoll()
  router.push({ name: 'matchdecision', params: { id: roomId } })
}
</script>

<style scoped>
/* ========= Layout ========= */
.match-landing-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.match-form {
  text-align: center;
  width: 100%;
  max-width: 650px;
}

.match-header {
  margin-bottom: 1.5rem;
}

.match-title {
  font-size: 2.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.match-subtitle {
  font-size: 1rem;
  color: var(--color-text);
  opacity: 0.8;
}

/* ========= Slots Grid ========= */
.slots-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 1.5rem;
}

.slot-btn {
  position: relative;
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease;
}

.slot-btn:hover {
  border-color: var(--color-border-hover);
  background: var(--color-background-mute);
}

/* When selected */
.slot-btn--active {
  background-color: #22c55e !important; /* green */
  border-color: #22c55e !important;
  color: #fff !important;
  box-shadow: 0 2px 10px rgba(34, 197, 94, 0.3);
  transform: translateY(-1px);
}

/* When pressed */
.slot-btn:active {
  transform: scale(0.97);
  background-color: var(--color-border-hover);
}
.slot-btn--active:active {
  background-color: #16a34a !important; /* darker green */
  border-color: #16a34a !important;
}

/* Text inside buttons */
.slot-title {
  font-weight: 600;
}
.slot-window {
  font-size: 0.8rem;
  opacity: 0.85;
}

/* ========= Start Button ========= */
.match-start {
  margin-top: 1rem;
}
.start-btn {
  background: #22c55e !important;
  border-color: #22c55e !important;
  color: #fff !important;
  font-weight: 600;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.start-btn:hover {
  background: #16a34a !important;
  border-color: #16a34a !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(34, 197, 94, 0.25);
}
.start-btn:active {
  transform: scale(0.97);
}
.start-btn:disabled {
  background: rgba(34, 197, 94, 0.4) !important;
  border-color: rgba(34, 197, 94, 0.4) !important;
  color: #fff !important;
  opacity: 1 !important;
  cursor: not-allowed;
}

.error-hint {
  font-size: 0.8rem;
  color: #f43f5e;
  margin-top: 0.5rem;
}

/* ========= Searching Animation ========= */
.match-searching {
  text-align: center;
  color: var(--color-text);
}
.match-title-sm {
  font-size: 1.6rem;
  font-weight: 600;
  margin-top: 1rem;
}
.dots {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.75rem;
}
.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: #22c55e;
  animation: pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite;
}
.delay-150 { animation-delay: 150ms; }
.delay-300 { animation-delay: 300ms; }
@keyframes pulse {
  50% { opacity: 0.4; }
}
</style>
