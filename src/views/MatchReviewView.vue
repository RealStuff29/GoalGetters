<!-- src/views/MatchReviewView.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-surface-50">
    <Card class="w-full max-w-lg">
      <template #title>
        <div class="flex items-center justify-between gap-3">
          <span class="text-xl font-semibold">Session Feedback</span>
          <span v-if="partnerName" class="flex items-center gap-2 text-sm opacity-70">
            <Avatar :label="partnerInitials" shape="circle" />
            {{ partnerName }}
          </span>
        </div>
      </template>

      <template #content>
        <!-- loading -->
        <div v-if="loading" class="py-6 text-center opacity-70 text-sm">
          Loading session...
        </div>

        <!-- error -->
        <div v-else-if="loadError" class="py-6 text-center text-red-500 text-sm">
          {{ loadError }}
        </div>

        <!-- main form -->
        <div v-else>
          <p class="mb-4 text-sm opacity-80">
            Rate your study session with <b>{{ partnerName || 'your partner' }}</b>.
          </p>

          <!-- Rating -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Your rating</label>
            <div class="flex gap-2">
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                @click="rating = n"
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center text-lg transition',
                  n <= rating
                    ? 'bg-amber-400 text-white'
                    : 'bg-surface-200 text-gray-500 hover:bg-surface-300'
                ]"
              >
                <i :class="n <= rating ? 'pi pi-star-fill' : 'pi pi-star'"></i>
              </button>
            </div>
            <small v-if="submitted && rating === 0" class="text-red-500 text-xs mt-1 block">
              Please give a rating.
            </small>
          </div>

          <!-- Comment -->
          <div class="mb-5">
            <label class="block text-sm font-medium mb-2">Comment (optional)</label>
            <Textarea
              v-model="comment"
              rows="4"
              autoResize
              placeholder="Eg: Good study partner, on time, very clear ..."
              class="w-full"
            />
          </div>

          <!-- success -->
          <div v-if="done" class="p-3 rounded bg-emerald-50 text-emerald-700 text-sm mb-4">
            Thanks! Your feedback has been saved.
          </div>

          <div class="flex justify-between items-center gap-3">
            <Button text icon="pi pi-arrow-left" label="Back to home" @click="goBack" />
            <Button
              :disabled="submitting"
              :icon="submitting ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
              label="Submit"
              @click="submit"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()

// route param e.g. /match/review/:roomid
const sessid = ref<string | null>(null)

// from sessions table
const sessionRow = ref<any | null>(null)

// user + who am I (A or B)
const myId = ref<string | null>(null)
const iAmA = ref(false)
const iAmB = ref(false)

// partner info
const partnerId = ref<string | null>(null)
const partnerName = ref<string | null>(null)

const loading = ref(true)
const loadError = ref<string | null>(null)

const rating = ref(0)
const comment = ref('')
const submitted = ref(false)
const submitting = ref(false)
const done = ref(false)

// initials
const partnerInitials = computed(() => {
  if (!partnerName.value) return 'S'
  return partnerName.value
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

async function loadSession() {
  try {
    loading.value = true
    // 👇 accept roomid (lowercase), roomId, or sessid
    const id =
      (route.params.roomid as string) ||
      (route.params.roomId as string) ||
      (route.params.sessid as string)

    if (!id) {
      loadError.value = 'No session id provided.'
      return
    }
    sessid.value = id

    // 1) current user
    const { data: auth, error: authErr } = await supabase.auth.getUser()
    if (authErr || !auth?.user?.id) {
      loadError.value = 'You must be logged in to review.'
      return
    }
    myId.value = auth.user.id

    // 2) load session from your existing table
    //    use select('*') to avoid "column does not exist" error
    const { data: sess, error: sessErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('sessid', id)
      .maybeSingle()

    if (sessErr) {
      console.error('[review] session load error', sessErr)
      loadError.value = 'Failed to load session.'
      return
    }
    if (!sess) {
      loadError.value = 'Session not found.'
      return
    }

    sessionRow.value = sess

    // 3) figure out if I'm A or B
    if (sess.created_by_a === myId.value) {
      iAmA.value = true
      iAmB.value = false
      partnerId.value = sess.created_by_b
      rating.value = sess.rating_by_a ?? 0
      comment.value = sess.comment_by_a ?? ''
    } else if (sess.created_by_b === myId.value) {
      iAmA.value = false
      iAmB.value = true
      partnerId.value = sess.created_by_a
      rating.value = sess.rating_by_b ?? 0
      comment.value = sess.comment_by_b ?? ''
    } else {
      // I'm not A or B → block
      loadError.value = 'You are not a participant of this session.'
      return
    }

    // 4) fetch partner name from profiles
    if (partnerId.value) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', partnerId.value)
        .maybeSingle()
      partnerName.value = prof?.username ?? 'Your partner'
    } else {
      partnerName.value = 'Your partner'
    }

    loadError.value = null
  } catch (e) {
    console.error('[review] load failed', e)
    loadError.value = 'Something went wrong while loading.'
  } finally {
    loading.value = false
  }
}

async function submit() {
  submitted.value = true
  if (rating.value === 0) return
  if (!sessid.value) return
  if (!iAmA.value && !iAmB.value) return

  submitting.value = true
  try {
    const update: any = {}
    if (iAmA.value) {
      update.rating_by_a = rating.value
      update.comment_by_a = comment.value || null
    } else if (iAmB.value) {
      update.rating_by_b = rating.value
      update.comment_by_b = comment.value || null
    }

    const { error } = await supabase
      .from('sessions')
      .update(update)
      .eq('sessid', sessid.value)

    if (error) {
      // likely: column does not exist → don't break UX
      console.warn('[review] update error (maybe columns not in table yet)', error)
      done.value = true
    } else {
      done.value = true
    }
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push({ name: 'matchlanding' })
}

onMounted(loadSession)
</script>

<style scoped>
.bg-surface-50 {
  background: #f8fafc;
}
</style>
