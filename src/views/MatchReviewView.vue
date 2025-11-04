<!-- src/views/MatchReviewView.vue -->
<template>
  <div class="review-shell">
    <div class="review-header">
      <h1 class="title">Match Review</h1>
      <p class="subtitle">Thanks for studying together—share how it went.</p>
      <div class="session-tag">
        <Tag :value="sessionShort" severity="secondary" />
      </div>
    </div>

    <!-- Error -->
    <div v-if="errorMsg" class="row">
      <Message severity="error" :closable="false" class="fx-fade">
        {{ errorMsg }}
      </Message>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="review-card fx-rise">
      <div class="card-body">
        <div class="loading-line">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <span>Loading session…</span>
        </div>
        <Skeleton height="2.6rem" class="sk" />
        <Skeleton height="7rem" class="sk" />
        <div class="sk-row">
          <Skeleton height="2.6rem" width="10rem" />
          <Skeleton height="2.6rem" width="10rem" />
        </div>
      </div>
    </div>

    <!-- Review -->
    <div v-else class="review-card fx-rise" ref="cardEl">
      <!-- Card Title -->
      <div class="card-title">
        <div class="title-stack">
          <span class="card-heading">Your Review</span>
          <div class="tag-row">
            <Tag :value="`You are ${mySideLabel}`" severity="info" />
            <Tag :value="partnerStatusLabel" :severity="partnerRated ? 'success' : 'warn'" />
          </div>
        </div>
      </div>

      <!-- Card Body -->
      <div class="card-body">
        <!-- Rating -->
        <section class="section-block">
          <div class="section-head">Your rating</div>
          <div class="rating-row">
            <div class="rating-anim">
              <!-- toggle 'pulse' to re-trigger star animations -->
              <div
                class="rating-enhanced"
                :class="{ 'is-readonly': alreadySubmitted, pulse: pulseStars }"
                ref="ratingEl"
              >
                <Rating v-model="myRating" :cancel="false" :readonly="alreadySubmitted" />
              </div>
            </div>
            <small v-if="alreadySubmitted" class="dim">Submitted</small>
          </div>
        </section>

        <!-- Comment -->
        <section class="section-block">
          <div class="section-label">
            <label>Your comment (optional)</label>
            <small class="count dim">{{ myComment.length }}/500</small>
          </div>

          <Textarea
            v-model="myComment"
            rows="5"
            autoResize
            class="w-100"
            :maxlength="500"
            :disabled="alreadySubmitted"
            placeholder="What went well? Any suggestions for next time?"
            @keyup.ctrl.enter="trySubmit"
          />

          <div class="helper-row">
            <div class="helper-left dim">
              <i class="pi pi-shield"></i>
              <span>Be kind, specific, and avoid personal/identifying details.</span>
            </div>
            <span v-if="remainingChars < 50" class="dim">{{ remainingChars }} left</span>
          </div>

          <!-- Progress -->
          <div class="prog-wrap">
            <ProgressBar
              :value="Math.min(Math.round((myComment.length / 500) * 100), 100)"
              :showValue="false"
            />
            <div class="prog-shimmer"></div>
          </div>

          <small v-if="commentError" class="error-text">{{ commentError }}</small>
        </section>

        <hr class="divider" />

        <!-- Actions -->
        <section class="actions">
          <Button
            v-if="canGoBackToChat"
            outlined
            severity="secondary"
            icon="pi pi-comments"
            label="Back to Chat"
            class="btn fx-press"
            @click="goChat"
          />
          <Button
            :disabled="!canSubmitEnhanced"
            :loading="submitting"
            icon="pi pi-check"
            label="Submit review"
            class="btn primary fx-press"
            @click="submit"
          />
        </section>

        <Transition name="fade">
          <Message v-if="alreadySubmitted" severity="success" :closable="false" class="fx-pop">
            Review submitted — thanks for your feedback!
          </Message>
        </Transition>
      </div>

      <!-- kept for structure; drawing now uses global root -->
      <div class="confetti-layer" ref="cardConfettiLayer"></div>
    </div>

    <Toast position="top-center" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

/* ---------- State ---------- */
const loading = ref(true)
const submitting = ref(false)
const errorMsg = ref<string>('')

const roomId = ref<string | null>(null)
const sessid = ref<string | null>(null)
const iAmA = ref<boolean | null>(null)

const myRating = ref<number>(0)
const myComment = ref<string>('')

const partnerRated = ref<boolean>(false)
const alreadySubmitted = ref<boolean>(false)
const sessionEnded = ref<boolean | null>(null)

/* ---------- Derived ---------- */
const mySideLabel = computed(() => (iAmA.value === null ? '…' : iAmA.value ? 'Side A' : 'Side B'))
const sessionShort = computed(() =>
  sessid.value ? `Session ${sessid.value.substring(0, 8)}…` : 'Session —'
)
const partnerStatusLabel = computed(() =>
  partnerRated.value ? 'Partner reviewed' : 'Partner pending'
)
const remainingChars = computed(() => 500 - myComment.value.length)

/* ---------- Comment validation ---------- */
const bannedWords = ['fuck', 'shit', 'bitch']
const trimmedComment = computed(() => (myComment.value || '').trim())
const commentHasOnlyWhitespace = computed(
  () => myComment.value.length > 0 && trimmedComment.value.length === 0
)
const commentHasBanned = computed(() => {
  if (!trimmedComment.value) return false
  const lower = trimmedComment.value.toLowerCase()
  return bannedWords.some((w) => lower.includes(w))
})
const commentError = computed(() => {
  if (alreadySubmitted.value) return ''
  if (commentHasOnlyWhitespace.value) return 'Comment cannot be only whitespace.'
  if (commentHasBanned.value) return 'Please avoid offensive language.'
  return ''
})

/* ---------- Form guards ---------- */
const canSubmitEnhanced = computed(
  () =>
    !!myRating.value &&
    !alreadySubmitted.value &&
    !submitting.value &&
    !commentHasOnlyWhitespace.value &&
    !commentHasBanned.value
)
const canGoBackToChat = computed(() => sessionEnded.value === false && !!roomId.value)

function trySubmit() {
  if (canSubmitEnhanced.value) submit()
}
function goChat() {
  router.replace({ name: 'matchchat', params: { chatId: roomId.value } })
}

/* ---------- Confetti (global layer) + star pulse retrigger ---------- */
const cardEl = ref<HTMLElement | null>(null)
const cardConfettiLayer = ref<HTMLElement | null>(null) // kept for structure
const confettiLayer = ref<HTMLElement | null>(null) // viewport-wide layer
const ratingEl = ref<HTMLElement | null>(null)
const pulseStars = ref(false) // toggled to retrigger CSS animations

function ensureConfettiRoot() {
  let root = document.getElementById('confetti-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'confetti-root'
    root.className = 'confetti-layer-root'
    root.style.overflow = 'clip'
    root.style.contain = 'paint'
    document.body.appendChild(root)
  }
  confettiLayer.value = root
}

function spawnConfetti(pieces: number, dir: 'up' | 'down', centerX?: number, centerY?: number) {
  const layer = confettiLayer.value
  if (!layer) return

  const baseX = centerX ?? window.innerWidth / 2
  const baseY = centerY ?? 120

  for (let i = 0; i < pieces; i++) {
    const el = document.createElement('span')
    el.className = `confetti-piece ${dir}`

    const spread = dir === 'up' ? 70 : 35
    const angle = Math.random() * (spread * 2) - spread
    const dist = (dir === 'up' ? 110 : 70) + Math.random() * (dir === 'up' ? 180 : 60)
    const time = (dir === 'up' ? 950 : 800) + Math.random() * (dir === 'up' ? 800 : 500)
    const delay = Math.random() * 140
    const sizeW = 6 + Math.random() * 7
    const sizeH = 8 + Math.random() * 12
    const hue = Math.floor(200 + Math.random() * 140)

    const rad = (angle * Math.PI) / 180
    const tx = Math.cos(rad) * dist
    const ty =
      (dir === 'up' ? -1 : 1) *
      (Math.sin(((90 - angle) * Math.PI) / 180) * (dist * 0.6) + (dir === 'up' ? 160 : 120))

    el.style.setProperty('--x', `${baseX}px`)
    el.style.setProperty('--y', `${baseY}px`)
    el.style.setProperty('--tx', `${tx}px`)
    el.style.setProperty('--ty', `${ty}px`)
    el.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`)
    el.style.setProperty('--time', `${time}ms`)
    el.style.setProperty('--delay', `${delay}ms`)
    el.style.width = `${sizeW}px`
    el.style.height = `${sizeH}px`
    el.style.background = `hsl(${hue} 90% 60%)`

    layer.appendChild(el)
    window.setTimeout(() => {
      el.remove()
    }, time + delay + 160)
  }
}

/* Fire on rating increase: 1–2 => small down; 3–5 => big up. */
watch(myRating, (val, oldVal) => {
  if (alreadySubmitted.value) return
  if (typeof oldVal !== 'number') oldVal = 0
  if (val <= oldVal) return

  // retrigger star "pop"
  pulseStars.value = false
  requestAnimationFrame(() => {
    pulseStars.value = true
    setTimeout(() => (pulseStars.value = false), 260)
  })

  const starRect = ratingEl.value?.getBoundingClientRect()
  const cx = starRect ? starRect.left + starRect.width / 2 : undefined
  const cy = starRect ? starRect.top + 10 : undefined

  if (val >= 3) {
    spawnConfetti(56, 'up', cx, cy)
  } else {
    spawnConfetti(10, 'down', cx, cy)
  }
})

/* ---------- Data flow ---------- */
async function resolveRoomAndSide() {
  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr) throw authErr
  const myId = auth?.user?.id
  if (!myId) throw new Error('Not authenticated')

  const paramId = route.params.id ? String(route.params.id) : null
  if (paramId) {
    roomId.value = paramId
  } else {
    const { data: last, error: lastErr } = await supabase
      .from('match_room')
      .select('id, user1, user2, session_id, created_at')
      .or(`user1.eq.${myId},user2.eq.${myId}`)
      .not('session_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
    if (lastErr) throw lastErr
    roomId.value = last?.[0]?.id ?? null
  }

  if (!roomId.value) throw new Error('No room to review')

  const { data: room, error } = await supabase
    .from('match_room')
    .select('user1, user2, session_id')
    .eq('id', roomId.value)
    .maybeSingle()
  if (error || !room) throw new Error('Room not found')
  if (!room.session_id) throw new Error('No session for this room')

  sessid.value = room.session_id
  iAmA.value = room.user1 === myId
}

async function tryFinalizeAndDeleteRoom() {
  if (!sessid.value || !roomId.value) return

  // Confirm both sides rated
  const { data: sRow, error: sErr } = await supabase
    .from('sessions')
    .select('rating_by_a, rating_by_b, ended_at')
    .eq('sessid', sessid.value)
    .maybeSingle()
  if (sErr || !sRow) return

  const bothRated = !!sRow.rating_by_a && !!sRow.rating_by_b
  if (!bothRated) return

  // Ensure session is marked ended
  if (!sRow.ended_at) {
    const { error: endErr } = await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('sessid', sessid.value)
    if (endErr) console.debug('[finalize] could not set ended_at:', endErr.message)
  }

  // Best-effort cleanup (ignore errors)
  const { error: chatDelErr } = await supabase.from('match_chat').delete().eq('room_id', roomId.value)
  if (chatDelErr) console.debug('[finalize] match_chat delete ignored:', chatDelErr.message)

  const { error: roomDelErr } = await supabase.from('match_room').delete().eq('id', roomId.value)
  if (roomDelErr) console.debug('[finalize] match_room delete ignored:', roomDelErr.message)
}

async function loadExistingReviewAndState() {
  if (!sessid.value || iAmA.value === null) return
  const { data: sRow, error } = await supabase
    .from('sessions')
    .select('rating_by_a, rating_by_b, comment_by_a, comment_by_b, ended_at')
    .eq('sessid', sessid.value)
    .maybeSingle()
  if (error) throw error
  if (!sRow) {
    sessionEnded.value = null
    return
  }

  sessionEnded.value = !!sRow.ended_at

  if (iAmA.value) {
    myRating.value = Number(sRow.rating_by_a ?? 0)
    myComment.value = String(sRow.comment_by_a ?? '')
    alreadySubmitted.value = !!sRow.rating_by_a
    partnerRated.value = !!sRow.rating_by_b
  } else {
    myRating.value = Number(sRow.rating_by_b ?? 0)
    myComment.value = String(sRow.comment_by_b ?? '')
    alreadySubmitted.value = !!sRow.rating_by_b
    partnerRated.value = !!sRow.rating_by_a
  }
}

async function submit() {
  if (!sessid.value || !myRating.value || iAmA.value === null) return
  submitting.value = true
  errorMsg.value = ''
  try {
    const payload = iAmA.value
      ? { rating_by_a: myRating.value, comment_by_a: trimmedComment.value || null }
      : { rating_by_b: myRating.value, comment_by_b: trimmedComment.value || null }

    const { error } = await supabase.from('sessions').update(payload).eq('sessid', sessid.value)
    if (error) throw error

    alreadySubmitted.value = true
    toast.add({
      severity: 'success',
      summary: 'Review submitted',
      detail: 'Thanks for your feedback!',
      life: 1600
    })

    await tryFinalizeAndDeleteRoom()
    setTimeout(() => router.replace({ name: 'home' }), 1100)
  } catch (e: any) {
    errorMsg.value = 'Could not submit your review. Please try again.'
    toast.add({
      severity: 'error',
      summary: 'Submission failed',
      detail: e?.message || 'Unknown error',
      life: 2500
    })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    ensureConfettiRoot()
    await resolveRoomAndSide()
    await loadExistingReviewAndState()
    await tryFinalizeAndDeleteRoom()
  } catch (e: any) {
    errorMsg.value = e?.message || 'Failed to load review session.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ---------- Layout ---------- */
.review-shell {
  min-height: 100vh;
  padding: 32px 16px 56px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  background:
    radial-gradient(1400px 220px at 50% -40px, rgba(24, 119, 242, .06), transparent 60%),
    linear-gradient(180deg, #ffffff, #f8fafc);
}
.review-header { text-align: center; margin-bottom: 20px; animation: fadeIn .35s ease-out both; }
.title { margin: 0; font-size: 34px; font-weight: 700; letter-spacing: .2px; }
.subtitle { margin: 6px 0 12px; opacity: .75; }
.session-tag { display: flex; justify-content: center; }

/* Card */
.review-card {
  position: relative;
  width: 100%;
  max-width: 920px;
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(15,23,42,.08);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(2, 6, 23, .06), 0 2px 6px rgba(2, 6, 23, .04);
  backdrop-filter: blur(6px);
}
.card-title {
  padding: 22px 28px;
  border-bottom: 1px solid rgba(15,23,42,.08);
  background: linear-gradient(180deg, rgba(248,250,252,.85), rgba(255,255,255,.8));
}
.title-stack { display: grid; justify-items: center; gap: 10px; }
.card-heading { font-size: 18px; font-weight: 600; }
.tag-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.card-body { padding: 26px 28px 30px; }

/* ---------- Sections ---------- */
.section-block { margin: 8px 0 22px; }
.section-head { font-size: 14px; opacity: .8; margin-bottom: 8px; }

.rating-row { display: flex; align-items: center; gap: 10px; }
.rating-anim { transform-origin: left center; animation: popIn .35s ease-out both .1s; }

/* Bigger stars + interactions */
.rating-enhanced :deep(.p-rating) { display: inline-flex; gap: 8px; }
.rating-enhanced :deep(.p-rating-item) { transition: transform .15s ease; }
.rating-enhanced :deep(.p-rating-icon) {
  font-size: 2.15rem;
  cursor: pointer;
  transition: transform .18s ease, color .18s ease, filter .25s ease;
}
/* hover flair */
.rating-enhanced :deep(.p-rating-item:hover .p-rating-icon) {
  transform: translateY(-1px) scale(1.18) rotate(-6deg);
  color: #ffb300;
  filter: drop-shadow(0 0 4px rgba(255,179,0,.45));
}
.rating-enhanced :deep(.p-rating-item:active .p-rating-icon) {
  transform: translateY(0) scale(1.05);
}

/* ⭐ pop when container gets .pulse */
.rating-enhanced.pulse :deep(.p-rating-icon.pi.pi-star-fill),
.rating-enhanced.pulse :deep(.p-rating-item-active .p-rating-icon) {
  color: #ffb300;
  filter: drop-shadow(0 0 4px rgba(255,179,0,.4));
  animation: starPop .22s ease-out;
}
@keyframes starPop { 0%{transform:scale(1)} 40%{transform:scale(1.35)} 100%{transform:scale(1)} }

.rating-enhanced.is-readonly :deep(.p-rating-icon) { cursor: default; }
.rating-enhanced.is-readonly :deep(.p-rating-item:hover .p-rating-icon) { transform: none; filter: none; color: inherit; }

.section-label { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.section-label label { font-size: 14px; opacity: .8; }
.count { font-size: 12px; }
.w-100 { width: 100%; }
.helper-row { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; font-size: 12px; }
.helper-left { display: flex; align-items: center; gap: 8px; }

/* Progress */
.prog-wrap { position: relative; margin-top: 6px; }
.prog-shimmer {
  pointer-events: none; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
  transform: translateX(-100%); animation: shimmer 2.2s infinite linear; mix-blend-mode: overlay;
}
@keyframes shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }

.error-text { display: block; margin-top: 8px; color: #dc2626; text-align: center; }

/* Divider */
.divider { border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(15,23,42,.12), transparent); margin: 12px 0 18px; }

/* Buttons */
.actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
.btn { min-height: 44px; min-width: 160px; border-radius: 12px; }
.fx-press { transition: transform .08s ease, filter .18s ease; }
.fx-press:active { transform: translateY(1px) scale(.995); filter: brightness(.98); }

/* Skeleton helpers */
.sk { width: 260px; }
.sk-row { display: flex; gap: 12px; }

/* Micro-animations */
.fx-fade { animation: fadeIn .25s ease-out both; }
.fx-rise { animation: riseIn .38s ease-out both; }
.fx-pop  { animation: popIn .28s ease-out both; }

@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes riseIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes popIn { 0% { opacity: 0; transform: scale(.97); } 100% { opacity: 1; transform: scale(1); } }

/* Utilities */
.row { max-width: 920px; width: 100%; }
.dim { opacity: .72; }

/* PrimeVue ProgressBar tweak */
:deep(.p-progressbar) { border-radius: 8px; overflow: hidden; height: 10px; }
:deep(.p-progressbar-value) { transition: width .25s ease; }
</style>

<!-- Global (unscoped) so dynamically added confetti spans are styled -->
<style>
/* Old in-card layer (kept harmless) */
.confetti-layer {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
  z-index: 3;
}

/* Viewport-wide root appended to <body> */
.confetti-layer-root {
  position: fixed;
  inset: 0;
  overflow: clip;
  pointer-events: none;
  z-index: 9999;
}

/* Optional belt-and-suspenders for very old browsers */
html, body { overflow-x: hidden; }

.confetti-piece {
  position: absolute;
  left: var(--x);
  top: var(--y);
  transform: translate(-50%, -50%) translate3d(0,0,0);
  border-radius: 2px;
  opacity: 0;
  animation: confetti-fall var(--time) cubic-bezier(.3,.8,.5,1) var(--delay) forwards;
}

/* Directional variants */
.confetti-piece.up   { animation-name: confetti-rise; }
.confetti-piece.down { animation-name: confetti-fall; }

/* Upward burst */
@keyframes confetti-rise {
  0%   { opacity: 0; transform: translate(50%, 50%) translate3d(0, 24px, 0) rotate(0deg) scale(1); }
  10%  { opacity: 1; }
  55%  { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rot)) scale(1); }
}

/* Downward sprinkle */
@keyframes confetti-fall {
  0%   { opacity: 0; transform: translate(50%, 50%) translate3d(9,60px,9) rotate(45deg) scale(1); }
  10%  { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rot)) scale(1); }
}
</style>
