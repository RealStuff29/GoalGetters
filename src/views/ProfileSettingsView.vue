<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { degrees } from '@/constants/degrees'


const router = useRouter()

// UI state
const loading = ref(true)
const saving  = ref(false)

// Auth + identity
const email = ref('')   // Get email from database 
const emailVerified = ref(false)
const username = ref('')    // Get username from database 
const avatarUrl = ref('')   // Get avatar from database 

// Personality + profile fields
const mbti = ref('')
const degree = ref('')  // Get primary degree from database 
const modules = ref([])      // Get modules from database 
const studyHours = ref(4)           // Get studyHours from database 


// Ratings
const ratingValue = ref(0)          
const reviewCount = ref(0)
const ratingBreakdown = ref([
  { label: '5★', color: 'var(--green-500)', value: 0 },
  { label: '4★', color: 'var(--teal-500)', value: 0 },
  { label: '3★', color: 'var(--blue-500)', value: 0 },
  { label: '2★', color: 'var(--yellow-500)', value: 0 },
  { label: '1★', color: 'var(--red-500)', value: 0 }
])

// Form helpers
const newPassword = ref('')
const activeUserId = ref(null)

onMounted(async () => {
  try {
    loading.value = true

    // 1) Current user
    const { data: { user }, error: uerr } = await supabase.auth.getUser()
    if (uerr || !user) throw new Error('Not signed in')
    activeUserId.value = user.id
    email.value = user.email || ''
    emailVerified.value = !!user.email_confirmed_at

    // 2) Profile row (handle "no row" gracefully)
    const { data: prof, error: perr } = await supabase
      .from('profiles')
      .select('user_id, username, profile_photo, mbti, degree, modules, study_hours, rating_avg, rating_count')
      .eq('user_id', user.id)
      .maybeSingle() // <-- won't throw on 0 rows

    let profile = prof

    if (!profile) {
      // Create skeleton profile
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
    mbti.value       = profile?.mbti ?? ''
    degree.value     = profile?.degree ?? ''

    // modules can be text[], json, or string — normalize
    const rawModules = profile?.modules
    modules.value = Array.isArray(rawModules)
      ? rawModules
      : typeof rawModules === 'string'
        ? rawModules.split(',').map(s => s.trim()).filter(Boolean)
        : Array.isArray(rawModules?.items) // in case it’s stored as {items:[...]}
          ? rawModules.items
          : []

    studyHours.value = Number(profile?.study_hours ?? 4)
    ratingValue.value = Number(profile?.rating_avg ?? 0)
    reviewCount.value = Number(profile?.rating_count ?? 0)

    // 3) Ratings histogram (ensure RLS allows this)
    const { data: ratings, error: rerr } = await supabase
      .from('user_feedback')
      .select('rating')
      .eq('target_user_id', user.id)

    if (!rerr && Array.isArray(ratings)) {
      const counts = {1:0,2:0,3:0,4:0,5:0}
      ratings.forEach(r => { const k = Number(r.rating); if (counts[k] != null) counts[k]++ })
      ratingBreakdown.value = [
        { label: '5★', color: 'var(--green-500)',  value: counts[5] },
        { label: '4★', color: 'var(--teal-500)',   value: counts[4] },
        { label: '3★', color: 'var(--blue-500)',   value: counts[3] },
        { label: '2★', color: 'var(--yellow-500)', value: counts[2] },
        { label: '1★', color: 'var(--red-500)',    value: counts[1] }
      ]
    }
  } catch (e) {
    console.error('[profile load]', e)
    // optional: router.push('/login')
  } finally {
    loading.value = false
  }
})

async function saveAll() {
  if (!canSave.value || !activeUserId.value) return
  try {
    saving.value = true
    const patch = {
      user_id: activeUserId.value,            // needed for upsert onConflict
      profile_photo: avatarUrl.value || null,
      degree: degree.value || null,
      modules: modules.value || [],           // store as array
      study_hours: studyHours.value ?? null
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(patch, { onConflict: 'user_id' }) // <-- ensures row exists
    if (error) throw error

    alert('Saved!')
  } catch (e) {
    console.error('[profile save]', e)
    alert(e?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}


// Uppercase + de-dupe modules as you type
watch(modules, (arr) => {
  const norm = Array.from(
    new Set((arr ?? []).map(v => String(v ?? '').trim().toUpperCase()).filter(Boolean))
  )
  if (JSON.stringify(arr) !== JSON.stringify(norm)) modules.value = norm
})

// Can save when something meaningful is present (tweak as needed)
// const canSave = computed(() =>
//   !loading.value && !!activeUserId.value &&
//   (degree.value || (modules.value?.length ?? 0) > 0 || !!studyHours.value || !!avatarUrl.value)
// )

// Actions
function randomiseAvatar() {
  avatarUrl.value = `https://api.dicebear.com/7.x/notionists/svg?seed=${Math.random().toString(36).slice(2)}`
}

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

// async function saveAll() {
//   if (!canSave.value || !activeUserId.value) return
//   try {
//     saving.value = true
//     const patch = {
//       profile_photo: avatarUrl.value || null,
//       degree: degree.value || null,
//       modules: modules.value || [],
//       study_hours: studyHours.value ?? null
//       // username/email are view-only here on purpose
//     }
//     const { error } = await supabase.from('profiles').update(patch).eq('user_id', activeUserId.value)
//     if (error) throw error
//     alert('Saved!')
//   } catch (e) {
//     console.error(e)
//     alert(e?.message || 'Failed to save')
//   } finally {
//     saving.value = false
//   }
// }

// Navigation to other view
function gotoMatchHistory() { router.push({ name: 'match-history' }) }
function redoMbti() { router.push({ name: 'mbti-quiz' }) }
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
          <div class="d-flex align-items-center gap-3 mb-3">
            <img
              :src="avatarUrl"
              alt="Avatar"
              class="rounded-circle border shadow-sm"
              width="100"
              height="100"
            />
            <div>
              <Button
                label="Randomise"
                icon="pi pi-refresh"
                size="small"
                @click="randomiseAvatar"
              />
            </div>
          </div>

          <!-- Email + Username -->
          <div class="mb-3">
            <label class="form-label fw-semibold">Email</label>
            <div class="d-flex align-items-center gap-2">
              <InputText :value="email" disabled class="flex-grow-1" />
              <Tag v-if="emailVerified" severity="success" value="Verified" />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Username</label>
            <InputText :value="username" disabled fluid />
          </div>

          <!-- Change Password -->
          <div>
            <label class="form-label fw-semibold">Change Password</label>
            <div class="d-flex gap-2">
              <Password v-model="newPassword" toggleMask :feedback="false" placeholder="New password" />
              <Button label="Update" icon="pi pi-lock" @click="changePassword" />
            </div>
          </div>
        </div>

        <!-- Academic -->
        <div class="card p-4 shadow-sm rounded-4">
          <h5 class="fw-bold mb-3">Academic</h5>

          <div class="mb-3">
            <label class="form-label fw-semibold">Primary Degree</label>
            <Select
              v-model="degree"
              :options="degrees"
              optionLabel="label"
              optionValue="value"
              placeholder="Select your degree"
              fluid
            />
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Modules this term</label>
            <InputChips
              v-model="modules"
              :allowDuplicate="false"
              placeholder="Add a module and press Enter"
              fluid
            />
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Study Hours / Day</label>
            <div class="d-flex align-items-center gap-3">
              <Slider v-model="studyHours" :min="1" :max="12" :step="1" class="flex-grow-1" />
              <Knob v-model="studyHours" :min="1" :max="12" :step="1" valueTemplate="{value}h" size="80" />
            </div>
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

          <MeterGroup :value="ratingBreakdown" class="w-100" />

          <ScrollPanel style="height: 220px" class="p-3 bg-light rounded-4 mt-3">
            <div v-if="reviewCount === 0" class="text-center text-muted">No reviews yet</div>
          </ScrollPanel>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="text-end mt-4">
      <Button label="Save Changes" icon="pi pi-check" :loading="saving" :disabled="!canSave" @click="saveAll" />
    </div>
  </section>
</template>


<style scoped>
.page { max-width: 1200px; margin: 0 auto; }



/* Small screens: stack vertically, full width panels, no gutter */
@media (max-width: 768px) {
  .fixed-splitter {
    flex-direction: column !important;
    height: auto !important;
    min-height: 0 !important;
  }
  .fixed-splitter :deep(.p-splitter-panel) {
    flex-basis: auto !important;   /* ignore :size on mobile */
    width: 100% !important;
    overflow: visible;              /* avoid double scrollbars */
  }
  .fixed-splitter :deep(.p-splitter-gutter) {
    display: none;                  /* hide drag handle on mobile */
  }
}
</style>
