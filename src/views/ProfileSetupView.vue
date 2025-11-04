<!-- src/views/ProfileSetupView.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { usernameClash, saveAccountAcademicBundle, updateProfile } from '@/services/profileService'
import { useProfileSetup } from '@/composables/useProfileSetup'
import { degrees } from '@/constants/degrees'
import { useModulesPicker } from '@/composables/useModulesPicker'
import { mbtiQuestions } from '@/constants/mbti'
import { useComputeMBTI } from '@/composables/useComputeMBTI'
import { useNotify } from '@/composables/useNotify'


const router = useRouter()
const notify = useNotify('setup')
const { username, gender, avatarUrl, isComplete, errors, shuffleAvatar, randomiseUsername } = useProfileSetup()
const { computeMbtiType } = useComputeMBTI()


// Step 1 Acccount Infomation
const activeStep = ref('1')
const avatarLoaded = ref(false)

// Check if the required fields are filled in step 1
const isStep1Valid = computed(() => !!isComplete.value)

function handleShuffle() {
  avatarLoaded.value = false
  shuffleAvatar()
}

// watch when gender changes, loading spinner appears
watch(gender, () => {
  avatarLoaded.value = false
})

// Step 2 Academic Info
const degree = ref('')
const studyHours = ref(4)

const {
  moduleObjects,     // [{ code,title,label }]
  modules,           // ['IS113','IS216', ...] stays in sync with moduleObjects
  moduleQuery,
  moduleSuggestions,
  searchModules,
  addModuleOption,
  addFreeTypedCourseCode,
  removeModuleAt
} = useModulesPicker()


// Check if the required fields are filled in step 2
const isStep2Valid = computed(() => {
  const hasDegree = !!degree.value
  const hasModules =
    Array.isArray(modules.value) && modules.value.some(m => String(m ?? '').trim().length > 0)
  return hasDegree && hasModules
})

const saving = ref(false)

// Save Steps 1 + 2 before moving to Step 3
async function handleAcademicNext(activateCallback) {
  if (!isStep2Valid.value) return
  try {
    saving.value = true
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) throw new Error('You are not signed in')

    // Check duplicate username (excluding the current user)
    const clash = await usernameClash(username.value, user.id)
    if (clash) {
      // alert('Username already taken! Please randomise again.')
      notify.warn('Username taken', 'Try shuffling your username again')
      return
    }

    await saveAccountAcademicBundle(user.id, {
      username: username.value,
      gender: gender.value,
      profile_photo: avatarUrl.value,
      degree: degree.value,
      modules: modules.value.join(','),  
      study_hours: studyHours.value
    })

    activateCallback('3');
  } catch (e) {
    // alert(e?.message || 'Failed to save academic info');
    notify.error('Failed to save account & academic info', notify.fromError(e))
  } finally {
    saving.value = false;
  }
}



// CHANGE 1
// --- Step 3: MBTI state + logic (NEW) ---
const mbtiAnswers = ref(Array(  mbtiQuestions.length).fill(null))
const mbtiResult = ref("");
const isStep3Answered = computed(() => mbtiAnswers.value.every(a => a !== null));

function handleComputeMbti() {
  mbtiResult.value = computeMbtiType(mbtiAnswers.value,   mbtiQuestions)
  console.log("Result stored:", mbtiResult.value) 
}

// Final save including personality
async function handleSavePersonality() {
  if (!mbtiResult.value) {
    // alert('Please compute your MBTI result first.');
    notify.warn('Please compute MBTI first', 'Tap “Compute Result” before saving')
    return;
  }
  try {
    saving.value = true;
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) throw new Error('You are not signed in');

    await updateProfile(user.id, {
      // resend steps 1+2 safely
      username: username.value,
      gender: gender.value,
      profile_photo: avatarUrl.value,
      degree: degree.value,
      modules: modules.value.join(','), 
      study_hours: studyHours.value,
      // step 3
      personality: mbtiResult.value,
    });

    // alert('Profile successfully created!');
    router.push({ path: '/', query: { flash: 'profile_created' } });
  } catch (e) {
    // alert(e?.message || 'Failed to save personality info');
    notify.error('Failed to save personality', notify.fromError(e))
  } finally {
    saving.value = false;
  }
}

</script>

<template>
  <Toast position="top-center" group="setup" />
  <section class="container mt-3 position-relative">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h1 class="h2 mb-0">Profile Setup</h1>
    </div>

    <Stepper v-model:value="activeStep" linear>
      <!-- Step 1 Account Info -->
      <StepItem value="1">
        <Step>Account Info</Step>
        <StepPanel v-slot="{ activateCallback }">
          <div class="form-container my-3">
            <!-- Avatar -->
            <div class="text-center my-3">
              <div class="mx-auto rounded-circle border overflow-hidden position-relative"
                style="max-width: 220px; height: 220px;">
                <ProgressSpinner v-if="!avatarLoaded"
                  class="position-absolute top-50 start-50 translate-middle w-25 h-25" strokeWidth="4" />
                <img :key="avatarUrl" :src="avatarUrl" alt="avatar" class="w-100 h-100 object-fit-cover"
                  :class="{ show: avatarLoaded }" @load="avatarLoaded = true" />
              </div>

              <Message closable size="small" class="mx-auto my-3" style="width: fit-content;">
                <i class="pi pi-info-circle">&nbsp;</i> Select a gender and tap “Shuffle” until you like the avatar
              </Message>

              <Button label="Shuffle" @click="handleShuffle" class="mt-2" :disabled="!avatarLoaded" />
            </div>

            <!-- Gender -->
            <div class="mx-auto my-4 w-100" style="max-width: 600px;">
              <label for="gender" class="fw-semibold mb-2 d-block">
                Gender <span class="text-danger">*</span>
              </label>

              <div class="d-flex align-items-center gap-lg-5 gap-3 flex-wrap">
                <div class="d-flex align-items-center gap-3">
                  <RadioButton v-model="gender" inputId="gender-m" name="gender" value="boy" />
                  <label for="gender-m" class="mb-0">Male</label>
                </div>

                <div class="d-flex align-items-center gap-3">
                  <RadioButton v-model="gender" inputId="gender-f" name="gender" value="girl" />
                  <label for="gender-f" class="mb-0">Female</label>
                </div>
              </div>

              <small v-if="errors?.gender" class="text-danger d-block mt-1">{{ errors.gender }}</small>
            </div>

            <!-- Username -->
            <div class="mx-auto w-100" style="max-width: 600px;">
              <label for="username" class="fw-semibold mb-2 d-block">Username</label>

              <div class="mx-auto w-100" style="max-width: 600px;">
                <div class="d-flex flex-column flex-sm-row gap-2">
                  <InputText :value="username" readonly class="flex-grow-1" />
                  <Button class="align-self-center align-self-sm-auto" icon="pi pi-sync" @click="randomiseUsername" />
                </div>

                <Message closable size="small" class="my-2" style="width: fit-content;">
                  <i class="pi pi-info-circle"></i>&nbsp; Tap <i class="pi pi-sync"></i> to regenerate
                </Message>
              </div>
            </div>

            <!-- Forward -->
            <div class="d-flex justify-content-center mt-5">
              <Button rounded raised aria-label="Next" icon="pi pi-angle-double-down" :disabled="!isStep1Valid"
                @click="activateCallback('2')" />
            </div>
          </div>
        </StepPanel>
      </StepItem>

      <!-- Step 2 Academic Info -->
      <StepItem value="2">
        <Step>Academic Info</Step>
        <StepPanel v-slot="{ activateCallback }">
          <div class="form-container my-3">
            <div class="d-flex justify-content-center mb-5">
              <Button rounded raised aria-label="Back" icon="pi pi-angle-double-up" @click="activateCallback('1')" />
            </div>

            <!-- Degree -->
            <div class="my-4">
              <label class="fw-semibold mb-2 d-block">
                Primary Degree <span class="text-danger">*</span>
              </label>
              <Select v-model="degree" :options="degrees" optionLabel="label" optionValue="value"
                placeholder="Select your primary degree" fluid />
            </div>

            <!-- Modules -->
            <div class="my-4">
              <label class="fw-semibold mb-2 d-block">
                Your Current Modules <span class="text-danger">*</span>
              </label>

              <!-- AutoComplete for searching the list -->
              <AutoComplete
                v-model="moduleQuery"
                :suggestions="moduleSuggestions"
                optionLabel="label"
                placeholder="Type in course code or name (e.g. IS216 or Web Application...)"
                class="w-100"
                fluid
                @complete="searchModules"
                @item-select="(e) => addModuleOption(e.value)"
                @keyup.enter="addFreeTypedCourseCode"
              />

              <!-- Chips display -->
              <div class="d-flex flex-wrap gap-2 mt-2">
                <span v-for="(m, idx) in moduleObjects" :key="m.code" class="badge rounded-pill text-bg-light border d-inline-flex align-items-center px-3 py-2">
                  <span class="me-2">{{ m.label || m.code }}</span>
                  <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" aria-label="Remove" @click="removeModuleAt(idx)"> x </button>
                </span>
              </div>

              <small class="text-muted d-block mt-2">
                Selected course codes: {{ modules.join(', ') || '—' }}
              </small>
            </div>

            <!-- Study Hours -->
            <div class="my-4">
              <label class="fw-semibold mb-2 d-block">Study hours per day</label>
              <div class="d-flex align-items-center gap-3">
                <Slider v-model="studyHours" :min="1" :max="12" :step="1" class="flex-grow-1" />
              </div>
              <small class="text-muted d-block mt-2">{{ studyHours }} hrs</small>
            </div>


            <!--CHANGE 2-->
            <!-- Next: save steps 1+2, then proceed to Step 3 -->
            <div class="d-flex justify-content-center mt-4">
              <Button label="Next" icon="pi pi-arrow-right" :disabled="!isStep2Valid || saving" :loading="saving"
                @click="handleAcademicNext(activateCallback)" />
            </div>
          </div>
        </StepPanel>
      </StepItem>

      <!--CHANGE 3-->
      <!-- Step 3 Personality Info (NEW) -->
      <StepItem value="3">
        <Step>Personality Info</Step>
        <StepPanel v-slot="{ activateCallback }">
          <div class="form-container my-3">
            <div class="d-flex justify-content-center mb-4">
              <Button rounded raised aria-label="Back" icon="pi pi-angle-double-up" @click="activateCallback('2')" />
            </div>

            <h5 class="fw-semibold mb-3">Tell us about yourself</h5>

            <!-- 10 questions -->
            <div v-for="(q, i) in   mbtiQuestions" :key="q.id" class="border rounded p-3 mb-3">
              <p class="mb-2">{{ i + 1 }}. {{ q.text }}</p>

              <div class="d-flex gap-3 flex-wrap">
                <div class="d-flex align-items-center gap-2">
                  <RadioButton v-model="mbtiAnswers[i]" :inputId="`q${q.id}-agree`" :name="`mbti-${q.id}`"
                    value="POS" />
                  <label :for="`q${q.id}-agree`">Agree</label>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <RadioButton v-model="mbtiAnswers[i]" :inputId="`q${q.id}-neutral`" :name="`mbti-${q.id}`"
                    value="NEUTRAL" />
                  <label :for="`q${q.id}-neutral`">Neutral</label>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <RadioButton v-model="mbtiAnswers[i]" :inputId="`q${q.id}-disagree`" :name="`mbti-${q.id}`"
                    value="NEG" />
                  <label :for="`q${q.id}-disagree`">Disagree</label>
                </div>
              </div>
            </div>

            <!-- compute -->
            <div class="d-flex justify-content-center my-4">
              <Button label="Compute Result" icon="pi pi-check-circle"
                class="bg-orange-500 border-none hover:bg-orange-600 text-white" :disabled="!isStep3Answered || saving"
                @click="handleComputeMbti" />
            </div>

            <!-- result -->
            <div v-if="mbtiResult" class="text-center mt-3">
              <h3 class="text-lg fw-semibold text-orange-600 mb-2">Your MBTI Type:</h3>
              <p class="h3 fw-bold mb-3">{{ mbtiResult }}</p>
            </div>

            <!-- final save -->
            <div class="d-flex justify-content-center mt-4">
              <Button label="Save & Finish" icon="pi pi-check" :disabled="!mbtiResult || saving" :loading="saving"
                @click="handleSavePersonality" />
            </div>
          </div>
        </StepPanel>
      </StepItem>
    </Stepper>
  </section>
</template>

<style scoped>
.form-container {
  max-width: 600px;
  margin: auto;
}

.text-muted {
  color: #6b7280;
}

/* .p-button{
    background: linear-gradient(135deg, #ff9800, #f57c00) !important;
    border: none !important;
    color: white !important;
    font-weight: 600 !important;
    padding: 0.75rem !important;
    border-radius: 10px !important;
    transition: all 0.25s ease !important;
}

:deep(.p-step-title),
:deep(.p-step-active .p-step-title),
:deep(.p-step-activated .p-step-title) {
  color: #ff9800 !important;
  font-weight: 600;
}


:deep(.p-step-number),
:deep(.p-step-number::after) {
  background: linear-gradient(135deg, #ff9800, #f57c00) !important;
  border: none !important;
  color: #fff !important; /* number text */
/* } */

/* :deep(.p-step-separator),
:deep(.p-stepper-separator) {
  border-top-color: #f57c00 !important;
}







:deep(.p-slider .p-slider-range) {
  background: linear-gradient(135deg, #ff9800, #f57c00) !important;
}

:deep(.p-slider .p-slider-handle) {
  border: 2px solid #f57c00 !important;
  background: #fff !important;
  transition: transform 0.2s ease;
}

:deep(.p-slider .p-slider-handle:hover) {
  transform: scale(1.1);
  background: #ff9800 !important;
  border-color: #f57c00 !important;
} */


</style>
