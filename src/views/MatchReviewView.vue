<!-- src/views/MatchReviewView.vue -->
<template>
  <div class="min-h-screen grid place-items-center p-4 md:p-6 lg:p-8">
    <div class="w-full max-w-xl space-y-4">
      <!-- Header -->
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-semibold">Match Review</h1>
        <p class="text-sm opacity-70">Thanks for studying together! Tell us how it went.</p>
        <div class="flex justify-center">
          <Tag :value="sessionShort" severity="secondary" />
        </div>
      </div>

      <!-- Error -->
      <Message v-if="errorMsg" severity="error" :closable="false" class="mx-auto w-full max-w-md text-center">
        {{ errorMsg }}
      </Message>

      <!-- Loading -->
      <Card v-if="loading" :pt="{ content: { class: 'py-6 px-6 flex flex-col items-center gap-4' } }">
        <template #content>
          <div class="flex items-center gap-2 opacity-70">
            <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
            Loading session…
          </div>
          <Skeleton height="2.25rem" class="w-56" />
          <Skeleton height="6rem" class="w-80" />
          <div class="flex gap-2">
            <Skeleton height="2.5rem" width="9rem" />
            <Skeleton height="2.5rem" width="9rem" />
          </div>
        </template>
      </Card>

      <!-- Review Form -->
      <Card v-else :pt="{ title: { class: 'text-center' }, content: { class: 'py-6 px-6 flex flex-col items-center gap-6' } }">
        <template #title>
          <div class="flex flex-col items-center gap-2">
            <span class="text-lg font-medium">Your Review</span>
            <div class="flex flex-wrap justify-center gap-2">
              <Tag :value="`You are ${mySideLabel}`" severity="info" />
              <Tag :value="partnerStatusLabel" :severity="partnerRated ? 'success' : 'warn'" />
            </div>
          </div>
        </template>

        <template #content>
          <!-- Rating -->
          <div class="flex flex-col items-center gap-2">
            <span class="text-sm opacity-80">Your rating</span>
            <div class="flex items-center gap-2">
              <Rating v-model="myRating" :cancel="false" :readonly="alreadySubmitted" />
              <small v-if="alreadySubmitted" class="opacity-60">Submitted</small>
            </div>
          </div>

          <!-- Comment -->
          <div class="w-full max-w-md mx-auto space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm opacity-80">Your comment (optional)</label>
              <small class="text-xs opacity-60">{{ myComment.length }}/500</small>
            </div>

            <Textarea
              v-model="myComment"
              rows="4"
              autoResize
              class="w-full"
              :maxlength="500"
              :disabled="alreadySubmitted"
              placeholder="What went well? Any suggestions?"
              @keyup.ctrl.enter="trySubmit"
            />

            <div class="flex items-center justify-between text-xs opacity-70">
              <div class="flex items-center gap-2">
                <i class="pi pi-shield" aria-hidden="true"></i>
                <span> Be kind and specific. Avoid personal details and offensive language.</span>
              </div>
              <span v-if="remainingChars < 50">{{ remainingChars }} left</span>
            </div>

            <ProgressBar
              class="mt-1"
              :value="Math.min(Math.round((myComment.length / 500) * 100), 100)"
              :showValue="false"
            />

            <small v-if="commentError" class="block text-center text-red-500">{{ commentError }}</small>
          </div>

          <Divider class="w-full max-w-md mx-auto" />

          <!-- Actions -->
          <div class="flex justify-center">
            <div class="flex flex-col sm:flex-row gap-2">
              <Button
                v-if="canGoBackToChat"
                outlined
                severity="secondary"
                icon="pi pi-comments"
                label="Back to Chat"
                @click="goChat"
              />
              <Button
                :disabled="!canSubmitEnhanced"
                :loading="submitting"
                icon="pi pi-check"
                label="Submit review"
                @click="submit"
              />
            </div>
          </div>

          <!-- Post-submit note -->
          <Message v-if="alreadySubmitted" severity="success" :closable="false" class="mx-auto w-full max-w-md text-center">
            Review submitted — thanks for your feedback!
          </Message>
        </template>
      </Card>

      <Toast position="top-center" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToast } from 'primevue/usetoast'

// router / toast
const router = useRouter()
const route = useRoute()
const toast = useToast()

// state
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
const sessionEnded = ref<boolean | null>(null) // null=unknown, false=ongoing, true=ended

// computed
const mySideLabel = computed(() => (iAmA.value === null ? '…' : iAmA.value ? 'Side A' : 'Side B'))
const sessionShort = computed(() => (sessid.value ? `Session ${sessid.value.substring(0, 8)}…` : 'Session —'))
const partnerStatusLabel = computed(() => (partnerRated.value ? 'Partner reviewed' : 'Partner pending'))
const remainingChars = computed(() => 500 - myComment.value.length)

// simple soft-check (client UX)
const bannedWords = ['fuck', 'shit', 'bitch']
const trimmedComment = computed(() => (myComment.value || '').trim())
const commentHasOnlyWhitespace = computed(() => myComment.value.length > 0 && trimmedComment.value.length === 0)
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

// gating
const canSubmitEnhanced = computed(
  () => !!myRating.value && !alreadySubmitted.value && !submitting.value && !commentHasOnlyWhitespace.value && !commentHasBanned.value
)
// Back to Chat shows only if session is ongoing and we know the room
const canGoBackToChat = computed(() => sessionEnded.value === false && !!roomId.value)

function trySubmit() {
  if (canSubmitEnhanced.value) submit()
}

function goChat() {
  router.replace({ name: 'matchchat', params: { chatId: roomId.value } })
}

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

async function loadExistingReviewAndState() {
  if (!sessid.value || iAmA.value === null) return
  // Only select fields that exist
  const { data: sRow, error } = await supabase
    .from('sessions')
    .select('rating_by_a, rating_by_b, comment_by_a, comment_by_b, ended_at')
    .eq('sessid', sessid.value)
    .maybeSingle()
  if (error) throw error
  if (!sRow) { sessionEnded.value = null; return }

  // Ended status is strictly from ended_at
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
    toast.add({ severity: 'success', summary: 'Review submitted', detail: 'Thanks for your feedback!', life: 2000 })
    setTimeout(() => router.replace({ name: 'matchlanding' }), 1200)
  } catch (e: any) {
    errorMsg.value = 'Could not submit your review. Please try again.'
    toast.add({ severity: 'error', summary: 'Submission failed', detail: e?.message || 'Unknown error', life: 2500 })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    await resolveRoomAndSide()
    await loadExistingReviewAndState()
  } catch (e: any) {
    errorMsg.value = e?.message || 'Failed to load review session.'
  } finally {
    loading.value = false
  }
})
</script>
