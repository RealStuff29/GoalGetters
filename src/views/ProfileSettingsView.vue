<!--  src/views/ProfileSettingsView.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAvatar } from '@/composables/useAvatar'
import { degrees } from '@/constants/degrees'
import { useModulesPicker } from '@/composables/useModulesPicker'
import { moduleIndex } from '@/constants/modules'
import { mbtiQuestions } from '@/constants/mbti'
import { useComputeMBTI } from '@/composables/useComputeMBTI'
import { updateProfile } from '@/services/profileService'
import { useNotify } from '@/composables/useNotify'

const router = useRouter()
const notify = useNotify('settings')

/* ---------------- UI state ---------------- */
const loading = ref(true)
const saving  = ref(false)

/* -------------- Auth / identity ----------- */
const email = ref('')
const emailVerified = ref(false)
const username = ref('')

/* -------- Personality ---- */
const mbti = ref('')
const { computeMbtiType } = useComputeMBTI()

/* ----------------- Academics ---------------- */
const degree = ref('')
const studyHours = ref(4)
const {
  moduleObjects, modules, moduleQuery, moduleSuggestions,
  searchModules, addModuleOption, addFreeTypedCourseCode, removeModuleAt
} = useModulesPicker()

/* ----------------- Ratings ---------------- */
const reviews = ref([])
const ratingValue = ref(0)
const reviewCount = ref(0)
const ratingBreakdown = ref([
  { star: 5, label: '5★', color: 'var(--green-500)',  value: 0 },
  { star: 4, label: '4★', color: 'var(--teal-500)',   value: 0 },
  { star: 3, label: '3★', color: 'var(--blue-500)',   value: 0 },
  { star: 2, label: '2★', color: 'var(--yellow-500)', value: 0 },
  { star: 1, label: '1★', color: 'var(--red-500)',    value: 0 }
])

/* --------------- Form helpers ------------- */
const newPassword = ref('')
const canUpdatePwd = computed(() => (newPassword.value?.length ?? 0) >= 6)
const activeUserId = ref(null)

/* --------------- Avatar shuffle & notifications ------------ */
const savingAvatar = ref(false)
const pendingAvatarToast = ref(false)      // gate toast until image load
const lastSavedAvatarUrl = ref(null)       // URL we just saved

const {
  avatarUrl,
  avatarLoaded,
  setSeedFromUrl,
  ensureDefaultAvatar,
  shuffleAvatar,
  onImageLoad
} = useAvatar()

// Prevent auto-save + toast on the very first avatarUrl change caused by setSeedFromUrl()
const skipNextAvatarSave = ref(true)

function handleShuffle() {
  if (savingAvatar.value) return
  avatarLoaded.value = false
  shuffleAvatar()
}

// Auto-save avatar when user shuffles, but ignore the initial load
watch(avatarUrl, async (val, oldVal) => {
  if (!activeUserId.value || !val || val === oldVal) return

  // Skip the first change that happens after setSeedFromUrl(...) on load
  if (skipNextAvatarSave.value) {
    skipNextAvatarSave.value = false
    return
  }

  try {
    savingAvatar.value = true
    await updateProfile(activeUserId.value, { profile_photo: val })
    // Defer toast until <img> has actually loaded the new src
    lastSavedAvatarUrl.value = val
    pendingAvatarToast.value = true
    avatarLoaded.value = false // keep spinner until the actual <img> load event
  } catch (e) {
    notify.error('Failed to save avatar', notify.fromError?.(e) ?? (e?.message || ''))
  } finally {
    savingAvatar.value = false
  }
})

// Fire toast only after the image has finished loading the just-saved URL
function handleAvatarLoad() {
  onImageLoad() // keep existing load behavior (sets avatarLoaded, etc.)
  if (pendingAvatarToast.value && avatarUrl.value === lastSavedAvatarUrl.value) {
    notify.clearGroup?.()
    notify.success('Avatar updated', 'Looking sharp ✨')
    pendingAvatarToast.value = false
  }
}

// In case the image fails to load (bad URL/network), it doesnt leave user hanging
function handleAvatarError() {
  if (pendingAvatarToast.value && avatarUrl.value === lastSavedAvatarUrl.value) {
    pendingAvatarToast.value = false
    notify.error('Avatar failed to load', 'Please try shuffling again')
  }
  // Stop spinner even on error so UI isn’t stuck
  avatarLoaded.value = true
}

/* ---------------- Unsaved Changes --------------- */
const initial = ref({
  degree: '',
  modulesCsv: '',
  studyHours: 4,
})

const hasUnsavedChanges = computed(() => {
  const nowCsv = (modules.value || []).join(',')
  return (
    degree.value !== initial.value.degree ||
    Number(studyHours.value ?? 0) !== Number(initial.value.studyHours ?? 0) ||
    nowCsv !== initial.value.modulesCsv 
  )
})

/* ----------------- Mounted ----------------- */
onMounted(async () => {
  try {
    loading.value = true
    avatarLoaded.value = false

    // 1) Current user
    const { data: { user }, error: uerr } = await supabase.auth.getUser()
    if (uerr || !user) throw new Error('Not signed in')
    activeUserId.value = user.id
    email.value = user.email || ''
    emailVerified.value = !!user.email_confirmed_at

    // 2) Profile row (create skeleton if missing so future UPDATEs work)
    const { data: prof } = await supabase
      .from('profiles')
      .select('user_id, username, profile_photo, personality, degree, modules, study_hours, avg_rating, rating_count')
      .eq('user_id', user.id)
      .maybeSingle()

    let profile = prof
    if (!profile) {
      const { data: created, error: cerr } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          username: (user.email || '').split('@')[0],
          profile_photo: null,
          degree: null,
          modules: [],
          study_hours: 4
        })
        .select()
        .single()
      if (cerr) throw cerr
      profile = created
    }

    username.value   = profile?.username ?? ''
    degree.value     = profile?.degree ?? ''
    mbti.value       = String(profile?.personality || '').trim().toUpperCase()

    setSeedFromUrl(profile?.profile_photo)
    ensureDefaultAvatar()

    const rawModules = profile?.modules
    modules.value = Array.isArray(rawModules)
      ? rawModules
      : typeof rawModules === 'string'
        ? rawModules.split(',').map(s => s.trim()).filter(Boolean)
        : Array.isArray(rawModules?.items)
          ? rawModules.items
          : []

    moduleObjects.value = (modules.value || []).map(code => {
      const m = moduleIndex[code]
      return m ? { ...m, label: `${m.code} ${m.title}` } : { code, title: '', label: code }
    })

    studyHours.value  = Number(profile?.study_hours ?? 4)
    ratingValue.value = Number(profile?.avg_rating ?? 0)
    reviewCount.value = Number(profile?.rating_count ?? 0)

    // 3) Ratings histogram & review list
    const { data: rows } = await supabase
      .from('sessions')
      .select('sessid, created_by_a, created_by_b, rating_by_a, rating_by_b, comment_by_a, comment_by_b, created_at, started_at')
      .or(`created_by_a.eq.${user.id},created_by_b.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (Array.isArray(rows)) {
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      const list = []

      for (const row of rows) {
        const isA = row.created_by_a === user.id
        const isB = row.created_by_b === user.id

        if (isA) {
          const r = row.rating_by_b
          const c = row.comment_by_b ?? ''
          if (r != null && counts[r] != null) counts[r]++
          if (c || r != null) list.push({ id: `${row.sessid}-b`, rating: Number(r ?? 0), comment: c || '' })
        }
        if (isB) {
          const r = row.rating_by_a
          const c = row.comment_by_a ?? ''
          if (r != null && counts[r] != null) counts[r]++
          if (c || r != null) list.push({ id: `${row.sessid}-a`, rating: Number(r ?? 0), comment: c || '' })
        }
      }

      ratingBreakdown.value = [
        { star: 5, label: '5★', color: 'var(--green-500)',  value: counts[5] },
        { star: 4, label: '4★', color: 'var(--teal-500)',   value: counts[4] },
        { star: 3, label: '3★', color: 'var(--blue-500)',   value: counts[3] },
        { star: 2, label: '2★', color: 'var(--yellow-500)', value: counts[2] },
        { star: 1, label: '1★', color: 'var(--red-500)',    value: counts[1] }
      ]

      reviews.value = list
      reviewCount.value = list.length
    }

    // 4) Take initial snapshot for dirty checking
    initial.value = {
      degree: degree.value || '',
      modulesCsv: (modules.value || []).join(','),
      studyHours: Number(studyHours.value ?? 0) || 0,
      avatarUrl: avatarUrl.value || ''
    }

  } catch (e) {
    console.error('[profile load]', e)
  } finally {
    loading.value = false
  }
})

/* ---------------- Actions ------------------ */
async function changePassword() {
  if (!canUpdatePwd.value) {
    notify.warn('Password too short', 'Minimum 6 characters')
    return
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword.value })
  if (error) {
    notify.error('Failed to change password', notify.fromError?.(error) ?? (error?.message || ''))
  } else {
    newPassword.value = ''
    notify.success('Password updated', 'Your new password is ready to use')
  }
}

async function saveAll() {
  if (!activeUserId.value) return
  try {
    saving.value = true
    const modulesForDb = (modules.value || []).join(',')

    const patch = {
      profile_photo: avatarUrl.value || null,
      degree: degree.value || null,
      modules: modulesForDb,
      study_hours: Number(studyHours.value ?? 0) || null,
    }

    await updateProfile(activeUserId.value, patch)

    // reset snapshot on success
    initial.value = {
      degree: degree.value || '',
      modulesCsv: (modules.value || []).join(','),
      studyHours: Number(studyHours.value ?? 0) || 0,
      avatarUrl: avatarUrl.value || ''
    }

    notify.clearGroup?.()
    notify.success('Profile saved', 'Your changes have been updated')
  } catch (e) {
    notify.error('Save failed', notify.fromError?.(e) ?? (e?.message || ''))
  } finally {
    saving.value = false
  }
}

/* ----------- Match history modal ----------- */
const SG_TZ = 'Asia/Singapore'
const fmtSGDate    = new Intl.DateTimeFormat('en-SG', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: SG_TZ })
const fmtSGTime    = new Intl.DateTimeFormat('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: SG_TZ })
const fmtSGWeekday = new Intl.DateTimeFormat('en-SG', { weekday: 'short', timeZone: SG_TZ })
function toDate(input) { const d = input ? new Date(input) : null; return isNaN(d?.getTime?.()) ? null : d }
function formatSessionStartDate(startedAt) { const d = toDate(startedAt); return d ? fmtSGDate.format(d) : '-' }
function formatSessionStartTime(startedAt) { const d = toDate(startedAt); return d ? fmtSGTime.format(d) : '-' }
function formatSessionStartWeekday(startedAt) { const d = toDate(startedAt); return d ? fmtSGWeekday.format(d) : '-' }
function formatSessionStartLabel(startedAt) {
  const date = formatSessionStartDate(startedAt)
  const weekday = formatSessionStartWeekday(startedAt)
  const time = formatSessionStartTime(startedAt)
  return `You had a session on ${weekday}, ${date} at ${time}`
}

const showMatchHistory = ref(false)
const matchRows = ref([])
const selectedStar = ref(null)
const visibleReviews = computed(() =>
  selectedStar.value == null ? reviews.value : reviews.value.filter(r => Number(r.rating) === Number(selectedStar.value))
)
function toggleStarFilter(star) { selectedStar.value = (selectedStar.value === star) ? null : star }

async function openMatchHistory() {
  if (!activeUserId.value) return
  showMatchHistory.value = true

  const { data: rows, error } = await supabase
    .from('sessions')
    .select('sessid, created_at, started_at, created_by_a, created_by_b')
    .or(`created_by_a.eq.${activeUserId.value},created_by_b.eq.${activeUserId.value}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[match history]', error)
    matchRows.value = []
    return
  }

  const items = []
  const partnerIds = new Set()
  for (const row of rows || []) {
    const isA = row.created_by_a === activeUserId.value
    const partnerId = isA ? row.created_by_b : row.created_by_a
    partnerIds.add(partnerId)
    items.push({
      id: row.sessid,
      createdAt: row.created_at,
      started_at: row.started_at,
      partnerId
    })
  }

  let partnerMap = new Map()
  if (partnerIds.size) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, username, profile_photo')
      .in('user_id', Array.from(partnerIds))
    if (Array.isArray(profs)) {
      partnerMap = new Map(profs.map(p => [p.user_id, p]))
    }
  }

  matchRows.value = items.map(it => {
    const p = partnerMap.get(it.partnerId)
    const startedAt = it.started_at ?? it.createdAt
    return {
      id: it.id,
      startedAt,
      partnerName: p?.username || 'Anonymous',
      partnerAvatar: p?.profile_photo || ''
    }
  })
}
function gotoMatchHistory() { openMatchHistory() }

/* --------------- MBTI dialog --------------- */
const showMbtiDialog = ref(false)
const mbtiAnswers = ref(Array(mbtiQuestions.length).fill(null))
const mbtiWorking = ref(false)
const mbtiResult = ref('')

const mbtiCtaLabel = computed(() => (mbti.value ? 'Redo MBTI' : 'Take MBTI Test'))
const allAnswered = computed(() => mbtiAnswers.value.every(a => a !== null))

function openMbtiDialog() {
  mbtiAnswers.value = Array(mbtiQuestions.length).fill(null)
  mbtiResult.value = ''
  showMbtiDialog.value = true
}
function computeMbtiNow() {
  mbtiResult.value = computeMbtiType(mbtiAnswers.value, mbtiQuestions)
}
async function saveMbtiToProfile() {
  if (!mbtiResult.value) return notify.warn('Please compute MBTI first', 'Click “Compute” before saving')
  try {
    mbtiWorking.value = true
    const { data: { user }, error: uerr } = await supabase.auth.getUser()
    if (uerr || !user) throw new Error('Not signed in')

    const { error } = await supabase
      .from('profiles')
      .update({ personality: mbtiResult.value })
      .eq('user_id', user.id)

    if (error) throw error
    mbti.value = mbtiResult.value
    showMbtiDialog.value = false
  } catch (e) {
    notify.error('Failed to save MBTI', notify.fromError?.(e) ?? (e?.message || ''))
  } finally {
    mbtiWorking.value = false
  }
}
</script>

<template>
  <section class="settings-wrap">
    <!-- Decorative animated blobs -->
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>
    <div class="bg-blob blob-3"></div>

    <Toast position="top-center" group="settings" />

    <!-- Header -->
    <header class="page-header">
      <h1 class="title">
        <span class="title-accent">Profile</span> Settings
      </h1>
      <p class="subtitle">Tune your identity, study preferences while viewing your ratings and reviews</p>
    </header>

    <!-- Skeleton while loading -->
    <Transition name="slide-fade" mode="out-in">
      <div v-if="loading" key="skeleton" class="container grid two-col">
        <div class="glass-card skeleton h-32"></div>
        <div class="glass-card skeleton h-32"></div>
      </div>

      <!-- Main Content -->
      <div v-else key="content" class="container grid two-col">
        <!-- LEFT COLUMN -->
        <Transition name="rise-in" appear>
          <div class="glass-card">
            <h5 class="section-heading ">Profile Information</h5>

            <!-- Avatar -->
            <div class="row-flex gap-3 my-3 align-center">
              <div class="avatar-shell">
                <div class="avatar-ring" :class="{ 'spin': !avatarLoaded }"></div>
                <img
                  :key="avatarUrl"
                  :src="avatarUrl"
                  alt="Avatar"
                  width="112"
                  height="112"
                  class="avatar-img"
                  @load="handleAvatarLoad"
                  @error="handleAvatarError"
                />
                <ProgressSpinner v-if="!avatarLoaded" strokeWidth="4" class="avatar-spinner" />
              </div>

              <Button label="Shuffle" icon="pi pi-refresh" size="small" @click="handleShuffle()" :disabled="!avatarLoaded || savingAvatar" :loading="savingAvatar" class="btn-press" />
              <small class="text-muted" v-if="savingAvatar">Saving avatar…</small>
            </div>
            
            <Message closable severity="info" class="soft-message" size="small">
              <i class="pi pi-info-circle">&nbsp;</i> Tap “Shuffle Avatar” for a new look.
            </Message>

            <!-- Email -->
            <div class="my-3">
              <label class="form-label fw-semibold">Email</label>
              <div class="position-relative">
                <InputText :value="email" disabled class="w-100 glow-input" />
                <Tag
                  v-if="emailVerified"
                  severity="success"
                  value="Verified"
                  class="tag-float"
                  style="font-size:.75rem"
                />
              </div>
            </div>

            <!-- Username -->
            <div class="mb-3">
              <label class="form-label fw-semibold">Username</label>
              <InputText :value="username" disabled class="w-100 glow-input" />
            </div>

            <!-- MBTI -->
            <div class="mb-3">
              <label class="form-label fw-semibold">Personality (MBTI)</label>
              <div class="row-flex gap-2 align-center">
                <Tag v-if="mbti" severity="info" :value="mbti" />
                <span v-else class="text-muted">Not set yet</span>

                <Button
                  :label="mbtiCtaLabel"
                  icon="pi pi-user-edit"
                  @click="openMbtiDialog"
                  variant="outlined"
                  size="small"
                  class="btn-press"
                />
              </div>
              <small class="text-muted d-block mt-1">This value comes from your latest personality quiz.</small>
            </div>

            <!-- Change Password -->
            <div class="mb-2">
              <label class="form-label fw-semibold mb-2">Change Password</label>
              <div class="row-flex gap-2 align-start">
                <Password
                  v-model="newPassword"
                  toggleMask
                  :feedback="true"
                  placeholder="New password"
                  input-class="w-100 glow-input"
                  class="flex-grow-1"
                >
                  <template #header><div class="fw-semibold mb-2">Reset Password</div></template>
                  <template #footer>
                    <Divider />
                    <ul class="ps-3 mb-0 small text-muted">
                      <li>At least one lowercase</li>
                      <li>At least one uppercase</li>
                      <li>At least one numeric</li>
                      <li>Minimum 6 characters</li>
                    </ul>
                  </template>
                </Password>
                <Button
                  label="Update"
                  icon="pi pi-lock"
                  class="flex-shrink-0 btn-press"
                  :disabled="!canUpdatePwd"
                  @click="changePassword"
                />
              </div>
              <small class="hint" :class="{ ok: canUpdatePwd }">
                {{ canUpdatePwd ? 'Looks good — you can update now.' : 'Enter at least 6 characters.' }}
              </small>
            </div>
          </div>
        </Transition>

        <!-- RIGHT COLUMN -->
        <Transition name="rise-in" appear>
          <div class="glass-card">
            <h5 class="section-heading">Academic</h5>

            <div class="my-3">
              <label class="form-label fw-semibold">Primary Degree</label>
              <Select
                v-model="degree"
                :options="degrees"
                optionLabel="label"
                optionValue="value"
                placeholder="Select your degree"
                class="w-100 glow-input"
              />
            </div>

            <!-- Modules -->
            <div class="my-3">
              <label class="form-label fw-semibold">Your Current Modules</label>
              <AutoComplete
                v-model="moduleQuery"
                :suggestions="moduleSuggestions"
                optionLabel="label"
                placeholder="Type course code or name (e.g. IS216)"
                class="w-100 glow-input"
                @complete="searchModules"
                @item-select="(e) => addModuleOption(e.value)"
                @keyup.enter="addFreeTypedCourseCode"
              />

              <TransitionGroup name="chip-fade" tag="div" class="d-flex flex-wrap gap-2 mt-2">
                <span
                  v-for="(m, idx) in moduleObjects"
                  :key="m.code"
                  class="chip"
                >
                  <span class="me-2">{{ m.label || m.code }}</span>
                  <button
                    type="button"
                    class="chip-x"
                    aria-label="Remove"
                    @click="removeModuleAt(idx)"
                  >×</button>
                </span>
              </TransitionGroup>

              <small class="text-muted d-block mt-2">
                Selected course codes: {{ modules.join(', ') || '—' }}
              </small>
            </div>

            <div class="my-3">
              <label class="form-label fw-semibold">Study Hours / per day</label>
              <div class="row-flex gap-3 align-center">
                <Slider v-model="studyHours" :min="1" :max="12" :step="1" class="flex-grow-1" />
                <span class="pill">{{ studyHours }}h</span>
              </div>
            </div>

            <!-- Academic card actions -->
            <div class="card-actions mt-4">
              <span class="save-hint">Review your changes</span>
              <Button label="Save Changes" icon="pi pi-check" :loading="saving" :disabled="saving || !hasUnsavedChanges" class="btn-press" @click="saveAll" />
            </div>
          </div>
        </Transition>

        <!-- REVIEWS PANEL -->
        <Transition name="rise-in" appear>
          <div class="glass-card col-span-2">
            <div class="row-flex space-between align-center mb-2">
              <h5 class="section-heading">Rating & Reviews</h5>
            </div>

            <!-- rating block -->
            <div class="row-flex align-center center-row my-2 wrap gap-5">
              <div class="score-block">
                <div class="score-top">
                  <i class="pi pi-star text-warning"></i>
                  <span class="fw-bold score-value">{{ ratingValue.toFixed(1) }}</span>
                </div>
                <small class="text-muted reviews-count">{{ reviewCount }} reviews</small>
              </div>
            </div>

            <!-- Match History Button -->
            <div class="row-flex center-row my-3">
              <Button
                label="Match History"
                icon="pi pi-history"
                class="btn-press"
                @click="gotoMatchHistory"
              />
            </div>


            <!-- Breakdown chips -->
            <div class="row-flex gap-3 wrap center-row mt-4">
              <button
                v-for="m in ratingBreakdown"
                :key="m.star"
                class="breakdown btn-press"
                :class="{ active: selectedStar === m.star }"
                @click="toggleStarFilter(m.star)"
              >
                <span>{{ m.label }}</span>
                <small>({{ m.value }})</small>
              </button>
            </div>

            <!-- Reviews -->
            <ScrollPanel style="height: 220px" class="p-3 bg-panel rounded-4 mt-3">
              <div v-if="visibleReviews.length === 0" class="text-center text-muted">
                {{ selectedStar == null ? 'No reviews yet' : `No ${selectedStar} ★ reviews` }}
              </div>

              <TransitionGroup name="list-fade" tag="div" class="d-flex flex-column gap-3">
                <div v-for="r in visibleReviews" :key="r.id" class="review-card">
                  <div class="fw-semibold mb-1">Anonymous</div>
                  <div class="small text-warning mb-1">
                    <span v-for="i in 5" :key="i">{{ i <= r.rating ? '★' : '☆' }}</span>
                    <span class="ms-1 text-muted">({{ r.rating || 0 }})</span>
                  </div>
                  <div class="text-body">{{ r.comment || '—' }}</div>
                </div>
              </TransitionGroup>
            </ScrollPanel>
          </div>
        </Transition>

      </div>
    </Transition>
    
    <!-- Match History Dialog -->
    <Dialog
      v-model:visible="showMatchHistory"
      modal
      header="Match History"
      class="w-100"
      :style="{ maxWidth: '720px' }"
    >
      <div v-if="matchRows.length === 0" class="text-center text-muted py-3">
        No past matches yet
      </div>

      <div v-else class="d-flex flex-column">
        <div
          v-for="m in matchRows"
          :key="m.id"
          class="d-flex align-items-center gap-3 py-2 px-1 border-bottom"
        >
          <img
            :src="m.partnerAvatar || '/placeholder-avatar.png'"
            alt="avatar"
            width="40"
            height="40"
            class="rounded-circle border flex-shrink-0"
          />
          <div class="flex-grow-1">
            <div class="fw-semibold">{{ m.partnerName }}</div>
            <small class="text-muted">{{ formatSessionStartLabel(m.startedAt) }}</small>
          </div>
        </div>
      </div>
    </Dialog>


    <!-- MBTI Dialog -->
    <Dialog v-model:visible="showMbtiDialog" modal header="MBTI Quick Quiz" class="w-100" :style="{ maxWidth: '720px' }">
      <!-- BEFORE COMPUTE -->
      <div v-if="!mbtiResult">
        <div class="small text-muted mb-3">Answer each statement. You can agree, feel neutral, or disagree.</div>
        <div class="d-flex flex-column gap-3" style="max-height: 60vh; overflow: auto;">
          <div v-for="(q, i) in mbtiQuestions" :key="q.id" class="border rounded p-3">
            <p class="mb-2">{{ i + 1 }}. {{ q.text }}</p>
            <div class="d-flex gap-4 flex-wrap">
              <label class="d-flex align-items-center gap-2">
                <RadioButton v-model="mbtiAnswers[i]" :inputId="`q${q.id}-agree`" :name="`mbti-${q.id}`" value="POS" />
                <span>Agree</span>
              </label>
              <label class="d-flex align-items-center gap-2">
                <RadioButton v-model="mbtiAnswers[i]" :inputId="`q${q.id}-neutral`" :name="`mbti-${q.id}`" value="NEUTRAL" />
                <span>Neutral</span>
              </label>
              <label class="d-flex align-items-center gap-2">
                <RadioButton v-model="mbtiAnswers[i]" :inputId="`q${q.id}-disagree`" :name="`mbti-${q.id}`" value="NEG" />
                <span>Disagree</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- AFTER COMPUTE -->
      <div v-else class="text-center py-4">
        <h3 class="fw-semibold mb-2">Your MBTI Type</h3>
        <p class="display-6 fw-bold mb-0">{{ mbtiResult }}</p>
        <small class="text-muted">Click Save to store this in your profile.</small>
      </div>

      <template #footer>
        <Button v-if="!mbtiResult" label="Compute" icon="pi pi-calculator" @click="computeMbtiNow" :disabled="!allAnswered" />
        <Button v-else label="Save" icon="pi pi-check" :loading="mbtiWorking" :disabled="mbtiWorking" @click="saveMbtiToProfile" />
      </template>
    </Dialog>
  </section>
</template>

<style scoped>
/* ===== Layout & background ===== */
.settings-wrap {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  padding-bottom: 96px; /* space reserved previously for sticky bar */
  background: radial-gradient(1200px 600px at 10% -10%, #fff0e0 0%, transparent 60%),
              radial-gradient(1200px 600px at 110% 10%, #ffe6ff 0%, transparent 55%),
              linear-gradient(180deg, #ffffff 0%, #fffaf5 100%);
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px 48px;
}

.grid.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}
.col-span-2 { grid-column: 1 / -1; }

/* Decorative blobs */
.bg-blob {
  position: absolute;
  filter: blur(40px);
  opacity: 0.35;
  border-radius: 50%;
  animation: floaty 12s ease-in-out infinite;
}
.blob-1 { width: 360px; height: 360px; top: -80px; left: -80px; background: linear-gradient(135deg,#ffb85c,#ff7d7d); }
.blob-2 { width: 300px; height: 300px; top: 20%; right: -100px; background: linear-gradient(135deg,#9ecbff,#b49bff); animation-delay: 2s; }
.blob-3 { width: 260px; height: 260px; bottom: -80px; left: 20%; background: linear-gradient(135deg,#ffef9e,#ffa7d1); animation-delay: 4s; }
@keyframes floaty {
  0%,100%{ transform: translateY(0) }
  50%{ transform: translateY(-16px) }
}

/* ===== Header ===== */
.page-header {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 16px 8px;
  text-align: center;
}
.title {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: 0.2px;
  margin: 0;
  background: linear-gradient(135deg,#333,#777);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.title-accent {
  background: linear-gradient(135deg,#ff9800,#f45b00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle {
  margin-top: 6px;
  color: #6b6b6b;
}

/* ===== Cards ===== */
.glass-card {
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(255, 168, 88, 0.25);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(255,152,0,0.08), 0 2px 12px rgba(0,0,0,0.05);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}
.glass-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 36px rgba(255,152,0,0.14), 0 3px 14px rgba(0,0,0,0.06);
  border-color: rgba(255, 152, 0, 0.45);
}

.section-heading {
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 14px;
  display: inline-block;
  position: relative;
}
.section-heading:after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 48px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg,#ff9800,#ff6a00);
}

/* ===== Avatar ===== */
.row-flex { display:flex; }
.align-center { align-items: center; }
.align-start { align-items: flex-start; }
.space-between { justify-content: space-between; }
.wrap { flex-wrap: wrap; }
.gap-2 { gap: .5rem; }
.gap-3 { gap: .75rem; }
.mb-2 { margin-bottom: .5rem; }
.mb-3 { margin-bottom: .9rem; }

.avatar-shell {
  position: relative;
  width: 112px; height: 112px;
}
.avatar-img {
  width: 112px; height: 112px; object-fit: cover;
  border-radius: 999px;
  border: 3px solid #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  position: relative;
  z-index: 1;
}
.avatar-ring {
  position: absolute; inset: -6px;
  border-radius: 999px;
  background: conic-gradient(from 0deg, #ff9800, #f45b00, #ff9800);
  filter: blur(0.6px);
  z-index: 0;
  animation: ringPulse 2.8s linear infinite;
}
.avatar-ring.spin { animation: ringSpin 1.2s linear infinite; }
.avatar-spinner { position:absolute; inset:0; margin:auto; width:36px;height:36px; z-index:2; }
@keyframes ringPulse {
  0% { transform: rotate(0deg); opacity: .7; }
  50%{ opacity:.9 }
  100%{ transform: rotate(360deg); opacity:.7 }
}
@keyframes ringSpin {
  from { transform: rotate(0) } to { transform: rotate(360deg) }
}

/* ===== Inputs / chips ===== */
.glow-input :deep(input),
.glow-input :deep(.p-inputtext),
.glow-input,
.w-100 {
  width: 100%;
}
.glow-input :deep(.p-inputtext),
.glow-input :deep(.p-autocomplete-input),
.glow-input :deep(.p-dropdown-label) {
  transition: box-shadow .2s ease, border-color .2s ease;
}
.glow-input :deep(.p-inputtext:focus),
.glow-input :deep(.p-autocomplete-input:focus) {
  box-shadow: 0 0 0 4px rgba(255,152,0,0.15);
  border-color: #ff9800;
}

.tag-float {
  position:absolute; right:8px; top:50%; transform: translateY(-50%);
}

.chip {
  display: inline-flex; align-items: center;
  background: #fff;
  border: 1px solid rgba(255,152,0,0.25);
  padding: 6px 10px; border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.chip-x {
  border: none; background: transparent; cursor: pointer;
  padding: 0 6px; font-size: 16px; line-height: 1;
  color: #ff7b20;
}
.pill {
  display: inline-block;
  padding: 6px 10px;
  background: linear-gradient(135deg,#ffeed9,#ffdaba);
  color: #ba5b00;
  border-radius: 999px;
  font-weight: 600;
}

/* ===== Buttons ===== */
.btn-press {
  transform: translateY(0);
  transition: transform .08s ease, box-shadow .2s ease;
  box-shadow: 0 8px 18px rgba(255,152,0,0.18);
}
.btn-press:active { transform: translateY(2px); box-shadow: 0 4px 10px rgba(255,152,0,0.16); }

/* ===== Reviews ===== */
.bg-panel { background: rgba(255,255,255,0.7); }
.breakdown {
  border: 1px dashed rgba(255,152,0,0.35);
  border-radius: 999px;
  padding: 6px 12px;
  background: #fff;
}
.breakdown.active {
  border-style: solid;
  background: linear-gradient(135deg,#fff5e6,#fff);
}
.review-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.04);
}

/* Centered rating stack */
/* Center any flex row */
.center-row { justify-content: center; }

/* Center the rating text block */
.score-block { display: flex; flex-direction: column; align-items: center; text-align: center; }

/* Keep the star + number inline and centered */
.score-top { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }


/* Sizing */
.score-top i { font-size: 1.8rem; }
.score-value { font-size: 2.2rem; line-height: 1; }
.reviews-count { font-size: 1.05rem; }

/* Keep button on the side; allow wrapping on small screens */
.wrap { flex-wrap: wrap; }
.space-between { justify-content: space-between; }




/* ===== Card footer (Academic) ===== */
.card-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255,152,0,0.35);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-actions .save-hint { color: #666; }

/* ===== Transitions ===== */
.slide-fade-enter-active, .slide-fade-leave-active { transition: all .28s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateY(10px); }
.slide-fade-leave-to   { opacity: 0; transform: translateY(10px); }

.rise-in-enter-active { animation: rise .4s ease both; }
@keyframes rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }

.list-fade-enter-active, .list-fade-leave-active { transition: all .2s ease; }
.list-fade-enter-from { opacity: 0; transform: translateY(6px); }
.list-fade-leave-to { opacity: 0; transform: translateY(-6px); }

.chip-fade-enter-active, .chip-fade-leave-active { transition: all .18s ease; }
.chip-fade-enter-from { opacity: 0; transform: scale(.96); }
.chip-fade-leave-to   { opacity: 0; transform: scale(.94); }

/* ===== Skeletons ===== */
.skeleton {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
}
.h-32 { height: 280px; }
.skeleton:after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(0,0,0,0), rgba(255,255,255,0.65), rgba(0,0,0,0));
  transform: translateX(-100%);
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%) }
  100% { transform: translateX(100%) }
}

/* ===== Responsive ===== */
@media (max-width: 992px) {
  .grid.two-col { grid-template-columns: 1fr; }
}

@media (min-width: 768px) {
  .score-top i { font-size: 1.8rem; }
  .score-value { font-size: 2rem; }
  .reviews-count { font-size: 1.15rem; }
}
</style>

