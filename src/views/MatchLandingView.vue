<!-- src/views/MatchLandingView.vue -->
<template>
  <!-- Hide everything while resuming to avoid any UI flash -->
  <div v-if="!isResuming" class="match-landing-container">
    <!-- Background aura + floating shapes (pure CSS) -->
    <div class="bg-aura" aria-hidden="true"></div>
    <div class="float float-1" aria-hidden="true"></div>
    <div class="float float-2" aria-hidden="true"></div>
    <div class="float float-3" aria-hidden="true"></div>

    <!-- NOTICE BANNER -->
    <div v-if="store.landingNotice" class="notice-banner fx-pop">
      <span>{{ store.landingNotice }}</span>
      <button class="notice-close" @click="store.clearLandingNotice()" aria-label="Close notice">×</button>
    </div>

    <!-- LANDING / FORM -->
    <div v-if="store.stage === 'landing'" class="match-form fx-rise">
      <!-- Glow frame -->
      <div class="frame-glow" aria-hidden="true"></div>

      <!-- GOALGETTERS LOGO (animated) -->
      <div
        class="logo-hero"
        ref="logoRef"
        @mousemove="onLogoMouseMove"
        @mouseleave="resetLogoTilt"
        aria-label="GoalGetters logo"
      >
        <img class="logo-img" src="../assets/images/Logo.png" alt="GoalGetters" />
        <span class="logo-glow" aria-hidden="true"></span>
        <span class="logo-shine" aria-hidden="true"></span>
      </div>

      <div class="match-header">
        <h1 class="match-title">
          <span class="sparkle" aria-hidden="true">✨</span>
          Find Your Study Partner
        </h1>
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
          <!-- ripple -->
          <span class="ripple" aria-hidden="true"></span>
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
        <p v-if="selectedSlots.length === 0" class="error-hint fx-fade-in">
          Pick at least one time slot to continue.
        </p>
      </div>
    </div>

    <!-- MATCH NOT FOUND STATE -->
    <div v-else-if="store.stage === 'notfound'" class="match-notfound fx-rise">
      <h2 class="match-title-sm">No Match Found 😞</h2>
      <p class="match-subtitle">You can try again later</p>
      <Button class="mt-4 ghost-btn" label="Try Again" @click="backToLanding" />
    </div>

    <!-- SEARCHING STATE -->
    <div
      v-else-if="store.stage === 'searching'"
      class="match-searching fx-rise"
      role="status"
      aria-live="polite"
    >
      <!-- Orbit loader -->
      <div class="orbit">
        <span class="planet"></span>
        <span class="satellite s1"></span>
        <span class="satellite s2"></span>
        <span class="satellite s3"></span>
      </div>

      <h2 class="match-title-sm gradient-text">Finding Your Perfect Study Match</h2>
      <p class="match-subtitle">Searching for classmates with similar study goals...</p>

      <div class="dots" aria-hidden="true">
        <span class="dot"></span>
        <span class="dot delay-150"></span>
        <span class="dot delay-300"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchStore } from '@/stores/match'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const store = useMatchStore()

// while this is true, nothing renders (prevents the brief "searching" flash)
const isResuming = ref(true)

const timeSlots = [
  { id: 'slot_morning',   label: 'Morning',   window: '8:30am – 11:30am' },
  { id: 'slot_midday',    label: 'Midday',    window: '12:00pm – 3:00pm' },
  { id: 'slot_afternoon', label: 'Afternoon', window: '3:30pm – 6:30pm' },
  { id: 'slot_evening',   label: 'Evening',   window: '7:00pm – 10:00pm' },
]

const selectedSlots = ref<string[]>([])

/* ===== Logo tilt (tiny parallax) ===== */
const logoRef = ref<HTMLElement | null>(null)
function onLogoMouseMove(e: MouseEvent) {
  const el = logoRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = (e.clientX - cx) / rect.width  // -0.5..0.5
  const dy = (e.clientY - cy) / rect.height // -0.5..0.5
  // small tilt
  el.style.setProperty('--rx', `${(-dy * 6).toFixed(2)}deg`)
  el.style.setProperty('--ry', `${(dx * 8).toFixed(2)}deg`)
  // move highlight
  el.style.setProperty('--mx', `${((dx + 0.5) * 100).toFixed(1)}%`)
  el.style.setProperty('--my', `${((dy + 0.5) * 100).toFixed(1)}%`)
}
function resetLogoTilt() {
  const el = logoRef.value
  if (!el) return
  el.style.removeProperty('--rx')
  el.style.removeProperty('--ry')
  el.style.removeProperty('--mx')
  el.style.removeProperty('--my')
}

onMounted(async () => {
  try {
    if (store.stage === 'searching') {
      isResuming.value = false
      return
    }

    if (store.availabilityList.length > 0) {
      selectedSlots.value = [...store.availabilityList]
    } else {
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth?.user?.id
      if (userId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('timeslot_avail')
          .eq('user_id', userId)
          .maybeSingle()
        const val = prof?.timeslot_avail
        if (typeof val === 'string' && val.trim() !== '') {
          selectedSlots.value = val.split(',').map(v => v.trim())
        } else if (Array.isArray(val)) {
          selectedSlots.value = val
        }
      }
    }

    // silent resume
    const where = await store.resumeSilently()
    if (where === 'chat') {
      router.replace({ name: 'matchchat', params: { id: store.currentMatchId! } })
      return
    }
    if (where === 'decision') {
      router.replace({ name: 'matchdecision', params: { id: store.currentMatchId! } })
      return
    }
  } catch (e) {
    console.warn('[landing] resume check failed', e)
  } finally {
    isResuming.value = false
  }
})

onBeforeUnmount(() => resetLogoTilt())

function toggleSlot(id: string) {
  if (selectedSlots.value.includes(id)) {
    selectedSlots.value = selectedSlots.value.filter(s => s !== id)
  } else {
    selectedSlots.value = [...selectedSlots.value, id]
  }
}

function backToLanding() {
  store.stage = 'landing'
}

async function onStart() {
  if (selectedSlots.value.length === 0) return
  await store.setAvailability(selectedSlots.value)
  await store.clearMyRejections()
  store.stage = 'searching'
  try {
    const roomId = await store.queueAndPoll()
    if (!roomId) return
    router.push({ name: 'matchdecision', params: { id: roomId } })
  } catch (err: any) {
    console.error('[matchlanding] matchmaking failed', err)
    if (err?.message === 'Not authenticated or profile missing') {
      router.push({ name: 'profilesetup' })
    } else {
      store.stage = 'landing'
    }
  }
}
</script>

<style scoped>
/* ---------- Warm Sunrise Theme ---------- */
:host {
  /* warm palette */
  --sun-bg-1: #fff7e6;   /* light peach */
  --sun-bg-2: #fff0cc;   /* pale amber */
  --sun-bg-3: #ffe8e1;   /* blush */
  --sun-amber: #ffb703;  /* amber */
  --sun-orange: #fb8500; /* orange */
  --sun-red: #ef4444;    /* soft red */
  --sun-rose: #ff6b6b;   /* rose/orange */
  --sun-brown: #3b1f00;  /* deep text */
  --sun-brown-2: #5a2d00;

  --color-text: var(--sun-brown);
  --color-background-soft: rgba(255, 255, 255, 0.7);
  --color-background-mute: rgba(255, 255, 255, 0.85);
  --color-border: rgba(255, 136, 0, 0.25);
  --color-border-hover: rgba(255, 136, 0, 0.45);
}

/* ---------- Base Layout ---------- */
.match-landing-container {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  overflow: clip;
  isolation: isolate;
  background:
    radial-gradient(1200px 800px at -10% -10%, rgba(255, 183, 3, 0.25), transparent 60%),
    radial-gradient(900px 600px at 110% 0%, rgba(251, 133, 0, 0.18), transparent 55%),
    linear-gradient(180deg, var(--sun-bg-1), var(--sun-bg-2));
}

/* ---------- Decorative BG ---------- */
.bg-aura {
  position: absolute;
  inset: -40% -20% -20% -20%;
  background:
    radial-gradient(60% 60% at 20% 10%, rgba(255, 214, 10, 0.45), transparent 60%),
    radial-gradient(50% 50% at 80% 0%, rgba(251, 133, 0, 0.3), transparent 60%),
    radial-gradient(40% 40% at 50% 100%, rgba(239, 68, 68, 0.18), transparent 60%);
  filter: blur(50px);
  z-index: -2;
  pointer-events: none;
}

/* Floating shapes (warm conic gradients) */
.float {
  --size: 260px;
  position: absolute;
  width: var(--size); height: var(--size);
  border-radius: 50%;
  background: conic-gradient(from 180deg,
    rgba(255, 183, 3, 0.20),
    rgba(251, 133, 0, 0.20),
    rgba(239, 68, 68, 0.18),
    rgba(255, 183, 3, 0.20)
  );
  filter: blur(22px);
  opacity: 0.6;
  animation: float 18s ease-in-out infinite;
  z-index: -1;
}
.float-1 { top: 12%; left: -6%; animation-delay: -2s; }
.float-2 { bottom: -8%; right: -4%; --size: 340px; animation-delay: -6s; }
.float-3 { top: 40%; right: 18%; --size: 220px; animation-delay: -9s; }

@keyframes float {
  0%,100% { transform: translateY(0) translateX(0) scale(1); }
  50%     { transform: translateY(-14px) translateX(8px) scale(1.02); }
}

/* ---------- Card / Frame ---------- */
.match-form,
.match-searching,
.match-notfound {
  position: relative;
  width: 100%;
  max-width: 780px;
  padding: 1.25rem;
}

.frame-glow {
  position: absolute;
  inset: -2px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 183, 3, 0.9), rgba(251, 133, 0, 0.9)) border-box;

  /* Standard mask (Chrome/Firefox/Edge) */
  mask:
    linear-gradient(#000 0 0) padding-box,
    linear-gradient(#000 0 0);
  /* For multiple layers, this defines how they combine: exclude = punch out */
  mask-composite: exclude;

  /* WebKit/Safari */
  -webkit-mask:
    linear-gradient(#000 0 0) padding-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;

  border: 2px solid transparent;
  filter: blur(12px) saturate(120%);
  opacity: 0.55;
  pointer-events: none;
}

.match-form {
  text-align: center;
  border-radius: 20px;
  backdrop-filter: blur(10px) saturate(120%);
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  box-shadow: 0 16px 40px rgba(251, 133, 0, 0.15);
}

/* ---------- Logo Hero (animated) ---------- */
.logo-hero {
  --rx: 0deg;
  --ry: 0deg;
  --mx: 50%;
  --my: 50%;
  width: clamp(110px, 16vw, 160px);
  height: clamp(110px, 16vw, 160px);
  margin: 0.25rem auto 0.9rem;
  position: relative;
  perspective: 800px;
  transform-style: preserve-3d;
  animation: logo-bob 4.8s ease-in-out infinite;
  will-change: transform;
  filter: drop-shadow(0 10px 22px rgba(251,133,0,.25));
}
@keyframes logo-bob {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-6px); }
}
.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 22px;
  transform:
    rotateX(var(--rx)) rotateY(var(--ry))
    translateZ(0);
  transition: transform .08s ease;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,0.35);
  background: radial-gradient(120% 120% at var(--mx) var(--my), rgba(255,255,255,.35), transparent 55%);
}
.logo-glow {
  position: absolute; inset: -10%;
  border-radius: 28px;
  background: radial-gradient(60% 60% at 50% 60%, rgba(255, 183, 3, 0.35), transparent 60%),
              radial-gradient(45% 45% at 60% 35%, rgba(251, 133, 0, 0.25), transparent 60%);
  filter: blur(16px);
  pointer-events: none;
  animation: glow-pulse 2.6s ease-in-out infinite;
}
@keyframes glow-pulse {
  0%,100% { opacity: .55; }
  50%     { opacity: .9; }
}
/* Shine sweep on first paint + on hover */
.logo-shine {
  position: absolute; inset: 0;
  border-radius: 22px;
  pointer-events: none;
  overflow: hidden;
}
.logo-shine::after {
  content: "";
  position: absolute; inset: -20%;
  background: linear-gradient(120deg, rgba(255,255,255,.65), rgba(255,255,255,0) 40%);
  transform: translateX(-130%) rotate(12deg);
  animation: shine 1.1s ease .25s 1;
}
.logo-hero:hover .logo-shine::after {
  animation: shine 1s ease 0s 1;
}
@keyframes shine {
  to { transform: translateX(130%) rotate(12deg); }
}

/* ---------- Header ---------- */
.match-header { margin-bottom: 1.25rem; }
.match-title {
  font-size: clamp(1.75rem, 2.3vw + 1rem, 2.6rem);
  font-weight: 800;
  color: var(--sun-brown);
  letter-spacing: 0.2px;
  margin: 0 0 0.35rem 0;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  text-shadow: 0 1px 0 rgba(255,255,255,0.4);
}
.sparkle { filter: drop-shadow(0 2px 6px rgba(255, 214, 10, .7)); }
.match-subtitle {
  font-size: 1rem;
  color: var(--sun-brown-2);
  opacity: 0.95;
}

/* ---------- Slots Grid ---------- */
.slots-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 2.2rem;
}

.slot-btn {
  position: relative;
  background: linear-gradient(180deg, rgba(255, 250, 230, 0.98), rgba(255, 238, 204, 0.96));
  color: var(--sun-brown);
  border: 1.5px solid var(--color-border);
  box-shadow:
    0 14px 26px rgba(0, 0, 0, 0.18),
    0 2px 0 rgba(255, 255, 255, 0.65) inset;
  border-radius: 0.9rem;
  padding: 0.9rem 1rem;
  transform: translateY(0);
  transition: transform .08s ease, box-shadow .15s ease, background .15s ease, border-color .15s ease;
  text-align: center;
  cursor: pointer;
  overflow: hidden;
  will-change: transform;
}
.slot-btn:hover {
  border-color: var(--color-border-hover);
  background: linear-gradient(180deg, #fff6d1, #ffe5aa);
  transform: translateY(-2px);
  box-shadow:
    0 18px 32px rgba(0, 0, 0, 0.22),
    0 2px 0 rgba(255, 255, 255, 0.7) inset;
}
.slot-btn:active {
  transform: translateY(1px) scale(0.99);
  box-shadow:
    0 10px 20px rgba(0, 0, 0, 0.18),
    0 1px 0 rgba(255, 255, 255, 0.6) inset;
}

.slot-title { font-weight: 900; display: block; }
.slot-window { opacity: 0.95; font-weight: 600; }

/* Active (selected) slot */
.slot-btn--active {
  background: linear-gradient(180deg, #ff9e2c, #fb8500);
  border-color: rgba(255, 255, 255, 0.5);
  color: #fff;
  box-shadow:
    0 22px 40px rgba(251, 133, 0, 0.45),
    0 2px 0 rgba(255, 255, 255, 0.25) inset;
}
.slot-btn--active:hover { transform: translateY(-2px); }

/* Ripple (pure CSS, warm) */
.slot-btn .ripple {
  position: absolute;
  inset: 0;
  background: radial-gradient(120px 120px at var(--mx, 50%) var(--my, 50%), rgba(255, 183, 3, 0.3), transparent 60%);
  opacity: 0;
  transition: opacity .25s;
  pointer-events: none;
}
.slot-btn:hover .ripple { opacity: 1; }

/* ---------- Primary Start Button (PrimeVue) ---------- */
.start-btn :deep(button) {
  position: relative;
  background: linear-gradient(90deg, #22c55e, #16a34a 55%, #0ea5a0);
  border-color: transparent;
  color: #082b12;
  font-weight: 900;
  letter-spacing: .2px;
  border-radius: 0.9rem;
  padding: 0.95rem 1.2rem;
  box-shadow: 0 16px 34px rgba(34, 197, 94, 0.35), inset 0 -2px 0 rgba(0,0,0,0.06);
  transform: translateY(0);
  transition: transform .08s ease, box-shadow .12s ease, filter .2s ease, background .25s ease;
}

/* Shine sweep */
.start-btn :deep(button)::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(120deg, rgba(255,255,255,.55), rgba(255,255,255,0) 35%);
  mix-blend-mode: soft-light;
  transform: translateX(-120%);
  transition: transform .6s ease;
}

.start-btn:hover :deep(button) {
  background: linear-gradient(90deg, #34d399, #22c55e 55%, #10b981);
  box-shadow: 0 20px 38px rgba(34, 197, 94, 0.4), inset 0 -2px 0 rgba(0,0,0,0.08);
  transform: translateY(-2px);
  filter: saturate(1.05);
}

.start-btn:active :deep(button) {
  transform: translateY(0);
  box-shadow: 0 10px 22px rgba(34, 197, 94, 0.3), inset 0 -2px 0 rgba(0,0,0,0.12);
}

.start-btn :deep(button:disabled) {
  background: linear-gradient(90deg, rgba(52, 211, 153, 0.55), rgba(34, 197, 94, 0.55));
  border-color: rgba(16, 185, 129, 0.35);
  color: rgba(8, 43, 18, 0.7);
  cursor: not-allowed;
  box-shadow: none;
}

/* ---------- Helper / Errors ---------- */
.error-hint { font-size: 0.9rem; color: #b91c1c; margin-top: 0.65rem; }

/* ---------- Searching State ---------- */
.match-searching {
  text-align: center;
  color: var(--sun-brown);
  padding: 2rem 1rem;
  border-radius: 18px;
  background: rgba(255,255,255,0.85);
  border: 1px solid var(--color-border);
  box-shadow: 0 16px 40px rgba(251, 133, 0, 0.15);
}
.match-title-sm {
  font-size: 1.6rem; font-weight: 800; margin: 1rem 0 0.35rem;
  color: var(--sun-brown);
}
.gradient-text {
  background: linear-gradient(90deg, #ffae00, #fb8500, #ef4444);
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
}

/* Orbit loader */
.orbit {
  position: relative;
  width: 140px; height: 140px;
  margin: 0 auto;
  filter: drop-shadow(0 8px 18px rgba(251, 133, 0, .25));
}
.planet {
  position: absolute; inset: 32px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffd166, #fb8500 60%);
  box-shadow: inset 0 -6px 14px rgba(0,0,0,.15);
}
.satellite {
  position: absolute;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #ffb703;
  top: 50%; left: 50%;
  transform-origin: -42px -42px;
  animation: orbit 2.6s linear infinite;
}
.s1 { transform-origin: -56px -56px; animation-duration: 3.1s; background:#ffd166; }
.s2 { transform-origin: -70px -70px; animation-duration: 3.8s; background:#fb8500; }
.s3 { transform-origin: -84px -84px; animation-duration: 4.3s; background:#ef4444; }

@keyframes orbit { to { transform: rotate(360deg); } }

/* Dots */
.dots { display: flex; justify-content: center; gap: 0.45rem; margin-top: 0.6rem; }
.dot {
  width: 0.5rem; height: 0.5rem; border-radius: 9999px;
  background: #fb8500;
  animation: pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite;
  box-shadow: 0 0 14px rgba(251,133,0,.55);
}
.delay-150 { animation-delay: .15s; }
.delay-300 { animation-delay: .3s; }
@keyframes pulse { 50% { opacity: .5; transform: scale(0.85); } }

/* ---------- Not Found ---------- */
.match-notfound { text-align: center; max-width: 520px; margin: 0 auto; color: var(--sun-brown); }
.ghost-btn :deep(button) {
  background: transparent;
  color: #fb8500;
  border: 1px dashed rgba(251,133,0,.55);
  border-radius: 10px;
}
.ghost-btn:hover :deep(button) {
  background: rgba(255, 183, 3, 0.12);
}

/* ---------- Notice ---------- */
.notice-banner {
  position: fixed; top: 1rem; right: 1rem;
  background: #fff3cd; color: #6a3b00; border: 1px solid #ffdd89;
  border-radius: 0.75rem; padding: 0.75rem 1rem;
  display: flex; gap: 0.75rem; align-items: center; z-index: 50;
  box-shadow: 0 8px 20px rgba(251, 133, 0, 0.18);
}
.notice-close { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; color: inherit; }

/* ---------- Micro motions ---------- */
.fx-rise { animation: fx-rise .4s ease both; }
@keyframes fx-rise { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.fx-pop { animation: fx-pop .2s ease both; }
@keyframes fx-pop { from { transform: scale(.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.fx-fade-in { animation: fx-fade-in .25s ease both; }
@keyframes fx-fade-in { from { opacity: 0 } to { opacity: 1 } }

/* ---------- Reduced Motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .float, .orbit .satellite, .dot, .fx-rise, .fx-pop, .fx-fade-in,
  .logo-hero, .logo-glow, .logo-shine::after {
    animation: none !important;
    transition: none !important;
  }
}

/* ---------- Utilities ---------- */
.mt-4 { margin-top: 1rem; }
</style>
