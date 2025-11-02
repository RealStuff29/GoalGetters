<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { degrees } from '@/constants/degrees'
import { modules_with_label, module_index } from '@/constants/modules'
import { MBTI_QUESTIONS } from '@/constants/mbtiQuestions'
import { useComputeMBTI } from '@/composables/useComputeMBTI'
import { updateProfile } from '@/services/profileService'  

const router = useRouter()

/* ---------------- UI state ---------------- */
const loading = ref(true)
const saving  = ref(false)

/* -------------- Auth   identity ----------- */
const email = ref('')
const emailVerified = ref(false)
const username = ref('')
const avatarUrl = ref('')

/* -------- Personality   profile fields ---- */
const mbti = ref('')
const { computeMbtiType } = useComputeMBTI()
const degree = ref('')
const modules = ref([])      // keep as array; convert only if your DB uses TEXT CSV
const studyHours = ref(4)
const moduleObjects = ref([])       // [{code,title,label}]
const moduleQuery = ref('')
const moduleSuggestions = ref([])

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
const activeUserId = ref(null)

/* --------------- Avatar shuffle ------------ */
const avatarLoaded = ref(true)
function shuffleAvatar () {
  try {
    const base = avatarUrl.value || 'https://api.dicebear.com/8.x/bottts/svg'
    const u = new URL(base)
    // cache-bust with a new seed param
    u.searchParams.set('seed', Math.random().toString(36).slice(2))
    avatarUrl.value = u.toString()
  } catch {
    // if base wasn't a full URL, just append a query param
    avatarUrl.value = `${avatarUrl.value || ''}?v=${Date.now()}`
  } finally {
    avatarLoaded.value = false
    setTimeout(() => (avatarLoaded.value = true), 0)
  }
}

/* ----------------- Mounted ----------------- */
onMounted(async () => {
  try {
    loading.value = true

    // 1) Current user
    const { data: { user }, error: uerr } = await supabase.auth.getUser()
    if (uerr || !user) throw new Error('Not signed in')
    activeUserId.value = user.id
    email.value = user.email || ''
    emailVerified.value = !!user.email_confirmed_at

    // 2) Profile row (create skeleton if missing so future UPDATEs work)
    const { data: prof } = await supabase
      .from('profiles')
      .select('user_id, username, profile_photo, personality, gender, degree, modules, study_hours, avg_rating, rating_count')
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
    avatarUrl.value  = profile?.profile_photo ?? ''
    degree.value     = profile?.degree ?? ''
    mbti.value       = String(profile?.personality || '').trim().toUpperCase()

    
    const rawModules = profile?.modules
    modules.value = Array.isArray(rawModules)
      ? rawModules
      : typeof rawModules === 'string'
        ? rawModules.split(',').map(s => s.trim()).filter(Boolean)
        : Array.isArray(rawModules?.items)  
          ? rawModules.items
          : []

    // hydrate chip objects from codes we just normalized
    moduleObjects.value = (modules.value || []).map(code => {
      const m = module_index[code]
      return m ? { ...m, label: `${m.code} ${m.title}` } : { code, title: '', label: code }
    })

    studyHours.value  = Number(profile?.study_hours ?? 4)
    ratingValue.value = Number(profile?.avg_rating ?? 0)
    reviewCount.value = Number(profile?.rating_count ?? 0)

    // 3) Ratings histogram   review list (about current user) from `sessions`
    const { data: rows, error: sErr } = await supabase
      .from('sessions')
      .select('sessid, created_by_a, created_by_b, rating_by_a, rating_by_b, comment_by_a, comment_by_b, created_at, started_at')
      .or(`created_by_a.eq.${user.id},created_by_b.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!sErr && Array.isArray(rows)) {
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      const list = []

      for (const row of rows) {
        const isA = row.created_by_a === user.id
        const isB = row.created_by_b === user.id

        if (isA) {
          const r = row.rating_by_b
          const c = row.comment_by_b ?? ''
          if (r != null && counts[r] != null) counts[r]  
          if (c || r != null) list.push({ id: `${row.sessid}-b`, rating: Number(r ?? 0), comment: c || '' })
        }
        if (isB) {
          const r = row.rating_by_a
          const c = row.comment_by_a ?? ''
          if (r != null && counts[r] != null) counts[r]  
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

  } catch (e) {
    console.error('[profile load]', e)
  } finally {
    loading.value = false
  }
})

/* --- Keep `modules` (codes) in sync with chip objects --- */
watch(moduleObjects, (objs) => {
  const uniqueCodes = Array.from(new Set((objs || []).map(o => o.code))).filter(Boolean)
  modules.value = uniqueCodes}, { deep: true })

/* ---------------- Actions ------------------ */
async function changePassword() {
  if (!newPassword.value) return
  const { error } = await supabase.auth.updateUser({ password: newPassword.value })
  if (error) {
    alert(error.message || 'Failed to change password')
  } else {
    newPassword.value = ''
    alert('Password updated')
  }
}

function searchModules(event) {
  const q = String(event.query || '').trim().toLowerCase()
  if (!q) {
    moduleSuggestions.value = modules_with_label
    return
  }
  moduleSuggestions.value = modules_with_label.filter(m =>
    m.code.toLowerCase().includes(q) || m.title.toLowerCase().includes(q)
  )
}

function addModuleOption(opt) {
  if (!opt?.code) return
  const exists = moduleObjects.value.some(o => o.code === opt.code)
  if (!exists) moduleObjects.value = [...moduleObjects.value, opt]
  moduleQuery.value = ''
}

function addFreeTypedCode() {
  const raw = String(moduleQuery.value || '').trim().toUpperCase()
  if (!raw) return
  const opt = module_index[raw]
    ? { ...module_index[raw], label: `${raw} ${module_index[raw].title}` }
    : { code: raw, title: '', label: raw } // unknown code fallback
  addModuleOption(opt)
}

function removeModuleAt(idx) {
  const next = [...moduleObjects.value]
  next.splice(idx, 1)
  moduleObjects.value = next
}

async function saveAll() {
  if (!activeUserId.value) return
  try {
    saving.value = true

    // If profiles.modules is text[]/jsonb, keep as array (default).
    // If your DB column is TEXT (CSV), use: const modulesForDb = modules.value.join(',')
    const modulesForDb = (modules.value || []).join(',')


    const patch = {
      profile_photo: avatarUrl.value || null,
      degree: degree.value || null,
      modules: modulesForDb,
      study_hours: Number(studyHours.value ?? 0) || null,
    }

    console.log('[profile save] patch →', patch)
    const saved = await updateProfile(activeUserId.value, patch)  // UPDATE only
    console.log('[profile save] saved row →', saved)

    alert('Saved!')
  } catch (e) {
    console.error('[profile save]', e)
    alert(e?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}

/* ----------- Match history modal ----------- */
/* Session datetime formatters (Singapore) */
const SG_TZ = 'Asia/Singapore'
const fmtSGDate    = new Intl.DateTimeFormat('en-SG', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: SG_TZ })
const fmtSGTime    = new Intl.DateTimeFormat('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: SG_TZ })
const fmtSGWeekday = new Intl.DateTimeFormat('en-SG', { weekday: 'short', timeZone: SG_TZ })

function toDate(input) {
  const d = input ? new Date(input) : null
  return isNaN(d?.getTime?.()) ? null : d
}
function formatSessionStartDate(startedAt) {
  const d = toDate(startedAt)
  return d ? fmtSGDate.format(d) : '-'
}
function formatSessionStartTime(startedAt) {
  const d = toDate(startedAt)
  return d ? fmtSGTime.format(d) : '-'
}
function formatSessionStartWeekday(startedAt) {
  const d = toDate(startedAt)
  return d ? fmtSGWeekday.format(d) : '-'
}
/** "DD/MM/YYYY (Mon) - HH:mm" */
function formatSessionStartLabel(startedAt) {
  const date = formatSessionStartDate(startedAt)
  const weekday = formatSessionStartWeekday(startedAt)
  const time = formatSessionStartTime(startedAt)
  return `${date} (${weekday}) - ${time}`
}

const showMatchHistory = ref(false)
const matchRows = ref([]) // [{ id, startedAt, partnerName, partnerAvatar }]
const selectedStar = ref(null) // filter
const visibleReviews = computed(() =>
  selectedStar.value == null ? reviews.value : reviews.value.filter(r => Number(r.rating) === Number(selectedStar.value))
)
function toggleStarFilter(star) {
  selectedStar.value = (selectedStar.value === star) ? null : star
}

async function openMatchHistory() {
  if (!activeUserId.value) return
  showMatchHistory.value = true

  const { data: rows, error } = await supabase
    .from('sessions')
    .select('sessid, created_at, created_by_a, created_by_b') // keep it simple; we'll prefer started_at if it exists on the row
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
    // carry both fields; started_at may be undefined if not in DB
    items.push({
      id: row.sessid,
      createdAt: row.created_at,
      started_at: row.started_at, // harmless if absent
      partnerId
    })
  }

  let partnerMap = new Map()
  if (partnerIds.size) {
    const { data: profs, error: perr } = await supabase
      .from('profiles')
      .select('user_id, username, profile_photo')
      .in('user_id', Array.from(partnerIds))
    if (!perr && Array.isArray(profs)) {
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
const mbtiAnswers = ref(Array(MBTI_QUESTIONS.length).fill(null))
const mbtiWorking = ref(false)
const mbtiResult = ref('')

const mbtiCtaLabel = computed(() => (mbti.value ? 'Redo MBTI' : 'Take MBTI Test'))
const allAnswered = computed(() => mbtiAnswers.value.every(a => a !== null))

function openMbtiDialog() {
  mbtiAnswers.value = Array(MBTI_QUESTIONS.length).fill(null)
  mbtiResult.value = ''
  showMbtiDialog.value = true
}
function computeMbtiNow() {
  mbtiResult.value = computeMbtiType(mbtiAnswers.value, MBTI_QUESTIONS)
}
async function saveMbtiToProfile() {
  if (!mbtiResult.value) return alert('Please compute your MBTI result first.')
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
    alert(e?.message || 'Failed to save MBTI')
  } finally {
    mbtiWorking.value = false
  }
}
</script>

<template>
  <section class="container py-4">
    <h1 class="text-center mb-4 fw-semibold">Profile Settings</h1>

    <div class="row g-4">
      <!-- LEFT COLUMN -->
      <div class="col-lg-7">
        <!-- Profile Info -->
        <div class="card p-4 mb-4 shadow-sm rounded-4">
          <h5 class="fw-bold mb-3">Profile Information</h5>

          <!-- Avatar -->
          <div class="row">
            <div class="d-flex align-items-center gap-3 mb-3">
              <img :src="avatarUrl" alt="Avatar" class="rounded-circle border shadow-sm" width="100" height="100" />
              <div>
                <Button label="Shuffle" icon="pi pi-refresh" size="small" @click="shuffleAvatar()" />
              </div>
            </div>
            <Message closable size="small"><i class="pi pi-info-circle">&nbsp;</i> Tap on “Shuffle” to change your avatar</Message>
          </div>

          <!-- Email -->
          <div class="mb-3">
            <label for="email" class="form-label fw-semibold">Email</label>
            <div class="position-relative">
              <InputText id="email" :value="email" disabled class="w-100" style="padding-right: 90px;" />
              <Tag
                v-if="emailVerified"
                severity="success"
                value="Verified"
                class="position-absolute top-50 end-0 translate-middle-y me-2"
                style="font-size: .75rem;"
              />
            </div>
          </div>

          <!-- Username -->
          <div class="mb-3">
            <label class="form-label fw-semibold">Username</label>
            <InputText :value="username" disabled fluid />
          </div>

          <!-- MBTI -->
          <div class="mb-3">
            <label class="form-label fw-semibold">Personality (MBTI)</label>
            <div class="d-flex align-items-center gap-2">
              <Tag v-if="mbti" severity="info" :value="mbti" />
              <span v-else class="text-muted">Not set yet</span>

              <Button
                :label="mbtiCtaLabel"
                icon="pi pi-user-edit"
                @click="openMbtiDialog"
                variant="outlined"
                size="small"
              />
            </div>
            <small class="text-muted d-block mt-1">This value comes from your latest personality quiz.</small>
          </div>

          <!-- Change Password -->
          <div class="mb-4">
            <label class="form-label fw-semibold mb-2">Change Password</label>
            <div class="d-flex align-items-start gap-2">
              <Password v-model="newPassword" toggleMask :feedback="true" placeholder="New password" class="flex-grow-1" input-class="w-100">
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
              <Button label="Update" icon="pi pi-lock" @click="changePassword" class="flex-shrink-0" />
            </div>
          </div>
        </div>

        <!-- Academic -->
        <div class="card p-4 shadow-sm rounded-4">
          <h5 class="fw-bold mb-3">Academic</h5>

          <div class="mb-3">
            <label class="form-label fw-semibold">Primary Degree</label>
            <Select v-model="degree" :options="degrees" optionLabel="label" optionValue="value" placeholder="Select your degree" fluid />
          </div>

          <!-- Modules -->
          <div class="my-3">
            <label class="fw-semibold mb-2 d-block">Your Current Modules</label>
        
            <AutoComplete
              v-model="moduleQuery"
              :suggestions="moduleSuggestions"
              optionLabel="label"
              placeholder="Type code or name, e.g. 'IS216' or 'Web Application...'"
              class="w-100"
              fluid
              @complete="searchModules"
              @item-select="(e) => addModuleOption(e.value)"
              @keyup.enter="addFreeTypedCode"
            />
        
            <div class="d-flex flex-wrap gap-2 mt-2">
              <span
                v-for="(m, idx) in moduleObjects"
                :key="m.code"
                class="badge rounded-pill text-bg-light border d-inline-flex align-items-center px-3 py-2"
              >
                <span class="me-2">{{ m.label || m.code }}</span>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary py-0 px-2"
                  aria-label="Remove"
                  @click="removeModuleAt(idx)"
                >
                  ×
                </button>
              </span>
            </div>
        
            <small class="text-muted d-block mt-2">
              Selected codes: {{ modules.join(', ') || '—' }}
            </small>
          </div>

          <div class="my-3">
            <label class="form-label fw-semibold">Study Hours / per day</label>
            <div class="d-flex align-items-center gap-3">
              <Slider v-model="studyHours" :min="1" :max="12" :step="1" class="flex-grow-1" />
            </div>
            <small class="text-muted d-block mt-2">{{ studyHours }} hrs</small>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="col-lg-5">
        <div class="card p-4 shadow-sm rounded-4">
          <h5 class="fw-bold mb-3">Rating & Reviews</h5>

          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div class="d-flex align-items-center gap-2">
                <i class="pi pi-star text-warning"></i>
                <span class="fs-4 fw-bold">{{ ratingValue.toFixed(1) }}</span>
              </div>
              <small class="text-muted">{{ reviewCount }} reviews</small>
            </div>
            <Button label="Match History" icon="pi pi-history" @click="gotoMatchHistory" />
          </div>

          <Dialog v-model:visible="showMatchHistory" modal header="Match History" class="w-100" :style="{ maxWidth: '720px' }">
            <div v-if="matchRows.length === 0" class="text-center text-muted py-3">No past matches yet</div>
            <div v-else class="d-flex flex-column">
              <div v-for="m in matchRows" :key="m.id" class="d-flex align-items-center gap-3 py-2 px-1 border-bottom">
                <img :src="m.partnerAvatar || '/placeholder-avatar.png'" alt="avatar" width="40" height="40" class="rounded-circle border flex-shrink-0" />
                <div class="flex-grow-1">
                  <div class="fw-semibold">{{ m.partnerName }}</div>
                  <small class="text-muted">{{ formatSessionStartLabel(m.startedAt) }}</small>
                </div>
              </div>
            </div>
          </Dialog>

          <!-- Rating Clickable Counts -->
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-2">
            <button
              v-for="m in ratingBreakdown"
              :key="m.star"
              type="button"
              class="btn btn-link p-0 text-decoration-none"
              :class="{ 'fw-bold text-primary': selectedStar === m.star, 'text-body': selectedStar !== m.star }"
              @click="toggleStarFilter(m.star)"
              :aria-pressed="selectedStar === m.star"
            >
              <span class="me-1">{{ m.label }}</span>
              <small class="text-muted">({{ m.value }})</small>
            </button>
          </div>

          <ScrollPanel style="height: 220px" class="p-3 bg-light rounded-4 mt-3">
            <div v-if="visibleReviews.length === 0" class="text-center text-muted">
              {{ selectedStar == null ? 'No reviews yet' : `No ${selectedStar}★ reviews` }}
            </div>
            <div v-else class="d-flex flex-column gap-3">
              <div v-for="r in visibleReviews" :key="r.id" class="p-3 bg-white rounded-3 shadow-sm">
                <div class="fw-semibold mb-1">Anonymous</div>
                <div class="small text-warning mb-1">
                  <span v-for="i in 5" :key="i">{{ i <= r.rating ? '★' : '☆' }}</span>
                  <span class="ms-1 text-muted">({{ r.rating || 0 }})</span>
                </div>
                <div class="text-body">{{ r.comment || '—' }}</div>
              </div>
            </div>
          </ScrollPanel>

          <!-- MBTI Dialog -->
          <Dialog v-model:visible="showMbtiDialog" modal header="MBTI Quick Quiz" class="w-100" :style="{ maxWidth: '720px' }">
            <!-- BEFORE COMPUTE -->
            <div v-if="!mbtiResult">
              <div class="small text-muted mb-3">Answer each statement. You can agree, feel neutral, or disagree.</div>
              <div class="d-flex flex-column gap-3" style="max-height: 60vh; overflow: auto;">
                <div v-for="(q, i) in MBTI_QUESTIONS" :key="q.id" class="border rounded p-3">
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
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="text-center mt-4">
      <Button label="Save Changes" icon="pi pi-check" @click="saveAll" />
    </div>
  </section>
</template>

<style scoped>
</style>
