<!-- src/views/MatchReviewView.vue -->
<template>
  <div class="review-shell">
    <div class="d-flex align-items-center justify-content-between">
      <!-- Header -->
      <header class="page-header">
        <h1 class="title"><span class="title-accent">Match</span> Review</h1>
        <p class="subtitle">Thanks for studying together! Share how it went.</p>
        <!-- <div class="session-tag">
          <Tag :value="sessionShort" severity="secondary" />
        </div> -->
      </header>
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
            <Tag :value="sessionSlotLabel" severity="secondary" />
          </div>
        </div>
      </div>

      <!-- Card Body -->
      <div class="card-body">
        <!-- Rating -->
        <section class="section-block mb-3">
          <label class="form-label section-head">Your Rating</label>
          <div class="rating-row">
            <div class="rating-anim">
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
            <label class="form-label">Your Comment (optional)</label>
            <small class="count">{{ myComment.length }}/500</small>
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
            label="Submit Review"
            class="submit-review"
            @click="submit"
          />
        </section>
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
const startedAt = ref<string | null>(null)

/* ---------- Derived ---------- */
const sessionShort = computed(() =>
  sessid.value ? `Session ${sessid.value.substring(0, 8)}…` : 'Session —'
)
const SG_TZ = 'Asia/Singapore'
const fmtSGDate = new Intl.DateTimeFormat('en-SG', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: SG_TZ })
const fmtSGTime = new Intl.DateTimeFormat('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: SG_TZ })
function toDate(v?: string | null) {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}
const sessionSlotLabel = computed(() => {
  const d = toDate(startedAt.value)
  if (!d) return 'Session time unknown'
  return `${fmtSGDate.format(d)} • ${fmtSGTime.format(d)}`
})
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

/* ---------- Confetti + star pulse ---------- */
const confettiLayer = ref<HTMLElement | null>(null)
const ratingEl = ref<HTMLElement | null>(null)
const pulseStars = ref(false)

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
    const el = document.createElement('span'); el.className = `confetti-piece ${dir}`
    const inner = document.createElement('span'); inner.className = 'confetti-inner'; el.appendChild(inner)
    const spread = dir === 'up' ? 95 : 28
    const angle = Math.random() * (spread * 2) - spread
    const dist = (dir === 'up' ? 200 : 60) + Math.random() * (dir === 'up' ? 260 : 40)
    const time = (dir === 'up' ? 1100 : 800) + Math.random() * (dir === 'up' ? 900 : 400)
    const delay = Math.random() * (dir === 'up' ? 100 : 140)
    const hue = Math.floor(Math.random() * 60)
    const size = 14 + Math.random() * (dir === 'up' ? 12 : 8)
    const rad = (angle * Math.PI) / 180
    const tx = Math.cos(rad) * dist
    const ty = (dir === 'up' ? -1 : 1) * (Math.sin(((90 - angle) * Math.PI) / 180) * (dist * 0.58) + (dir === 'up' ? 190 : 110))
    el.style.setProperty('--x', `${baseX}px`)
    el.style.setProperty('--y', `${baseY}px`)
    el.style.setProperty('--tx', `${tx}px`)
    el.style.setProperty('--ty', `${ty}px`)
    el.style.setProperty('--time', `${time}ms`)
    el.style.setProperty('--delay', `${delay}ms`)
    inner.style.setProperty('--size', `${size}px`)
    inner.style.setProperty('--color', `hsl(${hue} 95% 55%)`)
    inner.style.setProperty('--rot', `${Math.random() * 960 - 480}deg`)
    layer.appendChild(el)
    window.setTimeout(() => el.remove(), time + delay + 220)
  }
}
watch(myRating, (rawVal, rawOld) => {
  if (alreadySubmitted.value) return
  const val = Number(rawVal ?? 0)
  const oldVal = Number(rawOld ?? 0)
  if (val <= oldVal) return
  pulseStars.value = false
  requestAnimationFrame(() => {
    pulseStars.value = true
    setTimeout(() => (pulseStars.value = false), 260)
  })
  const rect = ratingEl.value?.getBoundingClientRect()
  const cx = rect ? rect.left + rect.width / 2 : undefined
  const cy = rect ? rect.top + rect.height / 2 : undefined
  if (val >= 3) spawnConfetti(50, 'up', cx, cy)
  else spawnConfetti(10, 'down', cx, cy)
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
  const { data: sRow, error: sErr } = await supabase
    .from('sessions')
    .select('rating_by_a, rating_by_b, ended_at')
    .eq('sessid', sessid.value)
    .maybeSingle()
  if (sErr || !sRow) return
  const bothRated = !!sRow.rating_by_a && !!sRow.rating_by_b
  if (!bothRated) return
  if (!sRow.ended_at) {
    const { error: endErr } = await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('sessid', sessid.value)
    if (endErr) console.debug('[finalize] could not set ended_at]:', endErr.message)
  }
  const { error: chatDelErr } = await supabase.from('match_chat').delete().eq('room_id', roomId.value)
  if (chatDelErr) console.debug('[finalize] match_chat delete ignored]:', chatDelErr.message)
  const { error: roomDelErr } = await supabase.from('match_room').delete().eq('id', roomId.value)
  if (roomDelErr) console.debug('[finalize] match_room delete ignored]:', roomDelErr.message)
}

async function loadExistingReviewAndState() {
  if (!sessid.value || iAmA.value === null) return
  const { data: sRow, error } = await supabase
    .from('sessions')
    .select('rating_by_a, rating_by_b, comment_by_a, comment_by_b, ended_at, started_at, created_at')
    .eq('sessid', sessid.value)
    .maybeSingle()
  if (error) throw error
  if (!sRow) {
    sessionEnded.value = null
    return
  }

  sessionEnded.value = !!sRow.ended_at
  startedAt.value = sRow.started_at ?? sRow.created_at ?? null

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
/* ---------- Background (soft, layered) ---------- */
.review-shell {
  min-height: 100dvh; /* ensure full viewport background */
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  align-content: start; /* stack from top, not center */
  padding-block: 8px 12px; /* smaller top/bottom spacing */
  padding-inline: 16px; /* keep side padding */
  row-gap: 8px; /* space between header and card */

  background:
    radial-gradient(1200px 380px at 50% -220px, rgba(24,119,242,.08), transparent 60%),
    radial-gradient(420px 320px at 12% 14%, rgba(255,152,0,.10), transparent 60%),
    radial-gradient(520px 380px at 88% 18%, rgba(244,91,0,.10), transparent 65%),
    linear-gradient(180deg, #ffffff, #f8fafc);
}

/* ---------- Header ---------- */
.page-header {
  max-width: 1100px;
  text-align: center;
  margin: 0;
  padding: 35px 0 35px;
}
.page-header .title {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: 0.2px;
  margin: 0;
  line-height: 1.1;
  background: linear-gradient(135deg, #333, #777);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-header .title-accent {
  background: linear-gradient(135deg, #ff9800, #f45b00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-header .subtitle {
  margin: 2px 0 0;
  opacity: .75;
  line-height: 1.25;
}

/* ---------- Card (glass + pattern + warm halo) ---------- */
.review-card {
  position: relative;
  width: 100%;
  max-width: 920px;

  /* background: rgba(255,255,255,0.80); */
  border: 1px solid rgba(255,168,88,0.25);
  border-radius: 16px;
  backdrop-filter: blur(10px);

  box-shadow: 0 10px 30px rgba(255,152,0,0.08), 0 2px 12px rgba(0,0,0,0.05);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  overflow: hidden;               /* clip overlays to avoid “double border” illusion */
  background-clip: padding-box;   /* keep bg out of the border area */
}

/* subtle brand pattern living INSIDE the card, away from the edges */
.review-card::before {
  content: '';
  position: absolute;
  inset: 2px;                     /* 2px gutter inside the 1px border */
  border-radius: 14px;
  pointer-events: none;
  z-index: 0;
  background-image:
    radial-gradient(rgba(255,152,0,.07) 1px, transparent 1.3px),
    radial-gradient(rgba(24,119,242,.05) 1px, transparent 1.3px);
  background-size: 18px 18px, 28px 28px;
  background-position: 0 0, 6px 8px;
  /* mask-image: linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.15) 35%, transparent 75%); */
}

/* warm halo under the card */
.review-card::after {
  content: '';
  position: absolute;
  inset: -28px;
  border-radius: 30px;
  pointer-events: none;
  z-index: -1;
  /* background:
    radial-gradient(420px 200px at 20% 0%, rgba(255,152,0,.20), transparent 60%),
    radial-gradient(520px 260px at 85% 10%, rgba(244,91,0,.16), transparent 65%),
    radial-gradient(620px 320px at 50% 100%, rgba(24,119,242,.10), transparent 70%); */
  filter: blur(26px);
}

@media (hover: hover) and (pointer: fine) {
  .review-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 36px rgba(255,152,0,0.14), 0 3px 14px rgba(0,0,0,0.06);
    border-color: rgba(255,152,0,0.45);
  }
}

/* Card header strip */
.card-title {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(15,23,42,.08);
  background: linear-gradient(180deg, rgba(248,250,252,.92), rgba(255,255,255,.88));
}
.title-stack { display: grid; justify-items: center; gap: 8px; }
.card-heading { font-size: 18px; font-weight: 700; }
.tag-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.card-body { padding: 20px 24px 24px; }

/* ---------- Toast ---------- */
:global(.p-toast-detail) {
  color: #1e293b !important; 
  font-size: 0.875rem;
}


/* ---------- Sections & labels ---------- */
.section-head { font-size: 14px; opacity: .9; margin-bottom: 10px; }
.form-label {
  display: inline-block;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: .2px;
  margin-bottom: 6px;
}

.rating-row { display: flex; align-items: center; gap: 12px; }
.rating-anim { transform-origin: left center; animation: popIn .35s ease-out both .1s; }

/* Bigger stars + interactions */
.rating-enhanced :deep(.p-rating) { display: inline-flex; gap: 8px; }
.rating-enhanced :deep(.p-rating-item) { transition: transform .15s ease; }
.rating-enhanced :deep(.p-rating-icon) {
  font-size: 2.15rem;
  cursor: pointer;
  transition: transform .18s ease, color .18s ease, filter .25s ease;
}
.rating-enhanced :deep(.p-rating-item:hover .p-rating-icon) {
  transform: translateY(-1px) scale(1.18) rotate(-6deg);
  color: #ffb300;
  filter: drop-shadow(0 0 4px rgba(255,179,0,.45));
}
.rating-enhanced :deep(.p-rating-item:active .p-rating-icon) { transform: translateY(0) scale(1.05); }
.rating-enhanced.pulse :deep(.p-rating-icon.pi.pi-star-fill),
.rating-enhanced.pulse :deep(.p-rating-item-active .p-rating-icon) {
  color: #ffb300;
  filter: drop-shadow(0 0 4px rgba(255,179,0,.4));
  animation: starPop .22s ease-out;
}
@keyframes starPop { 0%{transform:scale(1)} 40%{transform:scale(1.35)} 100%{transform:scale(1)} }
.rating-enhanced.is-readonly :deep(.p-rating-icon) { cursor: default; }
.rating-enhanced.is-readonly :deep(.p-rating-item:hover .p-rating-icon) { transform: none; filter: none; color: inherit; }

.section-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.count { font-size: 12px; color: rgba(15,23,42,.6); }
.w-100 { width: 100%; }

.helper-row { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; font-size: 12px; }
.helper-left { display: flex; align-items: center; gap: 8px; }

/* Progress */
.prog-wrap { position: relative; margin-top: 10px; }
.prog-shimmer {
  pointer-events: none; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
  transform: translateX(-100%); animation: shimmer 2.2s infinite linear; mix-blend-mode: overlay;
}
@keyframes shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }

.error-text { display: block; margin-top: 8px; color: #dc2626; text-align: center; }

/* Divider */
.divider { border: none; height: 1px; background: linear-gradient(90deg, transparent, rgba(15,23,42,.12), transparent); margin: 18px 0 16px; }

/* Buttons */
.actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
.btn { min-height: 44px; min-width: 160px; border-radius: 12px; }
.fx-press { transition: transform .08s ease, filter .18s ease; }
.fx-press:active { transform: translateY(1px) scale(.995); filter: brightness(.98); }

/* Tag */
:deep(.p-tag.p-tag-secondary) {
  background: linear-gradient(135deg, #fff7ea, #ffe9d3);
  color: #9a3d00;
  border: 1px solid rgba(255, 152, 0, .35);
  border-radius: 999px;
  padding: .35rem .65rem;
  font-weight: 600;
}

/* Submit review button (verify-style sweep) */
:deep(button.p-button.submit-review),
:deep(.p-button.submit-review) {
  background: linear-gradient(135deg, #ff9800, #f45b00);
  border: none;
  color: #fff;
  border-radius: 12px;
  min-height: 44px;
  min-width: 160px;
  position: relative;
  overflow: hidden;
  transition: transform .3s ease, box-shadow .3s ease, filter .2s ease;
  box-shadow: 0 10px 22px rgba(255, 152, 0, .16), 0 2px 8px rgba(0,0,0,.06);
}
:deep(.p-button.submit-review)::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
  transform: translateX(-100%);
  transition: transform .6s;
  pointer-events: none;
}
:deep(.p-button.submit-review:hover)::before { transform: translateX(100%); }
:deep(.p-button.submit-review:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  filter: brightness(1.03);
}
:deep(.p-button.submit-review:active) { transform: translateY(1px); }
:deep(.p-button.submit-review:focus-visible) {
  outline: 2px solid rgba(255, 152, 0, .5);
  outline-offset: 2px;
}
:deep(.p-button.submit-review.p-disabled),
:deep(.p-button.submit-review:disabled) {
  filter: saturate(.85) brightness(.95);
  opacity: .85;
  box-shadow: none;
  transform: none;
}
:deep(.p-button.submit-review .p-button-label),
:deep(.p-button.submit-review .p-button-icon) { color: #fff; }

/* Textarea: force light look (prevents dark token spill) */
:deep(.p-inputtextarea) {
  background: #fff !important;
  color: #0f172a !important;
  border: 1px solid rgba(15,23,42,.12) !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 10px 12px;
}
:deep(.p-inputtextarea::placeholder) { color: rgba(15,23,42,.55); }
:deep(.p-inputtextarea:focus) {
  border-color: #ff9800 !important;
  box-shadow: 0 0 0 4px rgba(255,152,0,0.15);
}

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

/* ProgressBar tweak */
:deep(.p-progressbar) { border-radius: 8px; overflow: hidden; height: 10px; }
:deep(.p-progressbar-value) { transition: width .25s ease; }
</style>

<!-- Global (unscoped) so dynamically added confetti spans are styled -->
<style>
.confetti-layer-root {
  position: fixed;
  inset: 0;
  overflow: clip;
  pointer-events: none;
  z-index: 9999;
}
html, body { overflow-x: hidden; }
.confetti-piece { position: absolute; left: var(--x); top: var(--y); transform: translate(-50%, -50%); opacity: 0; will-change: transform, opacity; }
.confetti-piece.up { animation: confetti-rise var(--time) cubic-bezier(.3,.8,.5,1) var(--delay) forwards; }
.confetti-piece.down { animation: confetti-fall var(--time) cubic-bezier(.3,.8,.5,1) var(--delay) forwards; }
.confetti-inner {
  display: block; width: var(--size, 10px); height: var(--size, 10px);
  background: var(--color, gold); filter: drop-shadow(0 0 3px rgba(255, 200, 0, 0.6));
  clip-path: polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
  animation: star-spin var(--time) linear var(--delay) forwards;
}
@keyframes confetti-rise { 0%{opacity:0; transform:translate(-50%,-50%)} 10%{opacity:1} 55%{opacity:1} 100%{opacity:0; transform:translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) } }
@keyframes confetti-fall  { 0%{opacity:0; transform:translate(-50%,-50%)} 10%{opacity:1} 100%{opacity:0; transform:translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) } }
@keyframes star-spin { 0%{transform:rotate(0deg) scale(1)} 30%{transform:rotate(120deg) scale(1.05)} 60%{transform:rotate(240deg) scale(0.96)} 100%{transform:rotate(360deg) scale(1)} }
</style>
