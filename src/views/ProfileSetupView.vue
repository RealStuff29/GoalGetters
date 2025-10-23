<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { updateProfile } from '@/services/profileService'
import { useProfileSetup } from '@/composables/useProfileSetup'
import { degrees } from '@/constants/degrees'


const router = useRouter()
const { username, gender, avatarUrl, isComplete, errors, shuffleAvatar, randomiseUsername } = useProfileSetup()

// Step 1 
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

// Step 2
const degree = ref('')
const modules = ref([])
const studyHours = ref(4)

// Check if the required fields are filled in step 2
const isStep2Valid = computed(() => {
  const hasDegree = !!degree.value
  const hasModules =
    Array.isArray(modules.value) && modules.value.some(m => String(m ?? '').trim().length > 0)
  return hasDegree && hasModules
})

const saving = ref(false)


async function handleSave() {
  if (!isStep2Valid.value) return
  try {
    saving.value = true

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) throw new Error('You are not signed in')

    await updateProfile(user.id, {
      // Step 1 data
      username: username.value,
      gender: gender.value,
      profile_photo: avatarUrl.value,
      // Step 2 data
      degree: degree.value,
      modules: modules.value,
      study_hours: studyHours.value
    })
    alert('Profile successfully created!')
    router.push('/')
  } catch (e) {
    // e? will avoid crashing when non-Error values are thrown
    alert(e?.message || 'Failed to save profile')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="container mt-3 position-relative">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h1 class="h2 mb-0">Profile Setup</h1>
    </div>

    <Stepper v-model:value="activeStep" linear>
      <!-- Step 1 -->
      <StepItem value="1">
        <Step>Account Info</Step>
        <StepPanel v-slot="{ activateCallback }">
          <div class="form-container my-3">
            <!-- Avatar -->
            <div class="text-center my-3">
              <div class="mx-auto rounded-circle border overflow-hidden position-relative" style="max-width: 220px; height: 220px;">
                <ProgressSpinner
                  v-if="!avatarLoaded"
                  class="position-absolute top-50 start-50 translate-middle w-25 h-25"
                  strokeWidth="4"
                />
                <img
                  :key="avatarUrl"
                  :src="avatarUrl"
                  alt="avatar"
                  class="w-100 h-100 object-fit-cover"
                  :class="{ show: avatarLoaded }"
                  @load="avatarLoaded = true"
                />
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
              <Button
                rounded
                raised
                aria-label="Next"
                icon="pi pi-angle-double-down"
                :disabled="!isStep1Valid"
                @click="activateCallback('2')"
              />
            </div>
          </div>
        </StepPanel>
      </StepItem>

      <!-- Step 2 -->
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
              <Select
                v-model="degree"
                :options="degrees"
                optionLabel="label"
                optionValue="value"
                placeholder="Select your primary degree"
                fluid
              />
            </div>

            <!-- Modules -->
            <div class="my-4">
              <label class="fw-semibold mb-2 d-block ">
                Your Current Modules <span class="text-danger">*</span>
              </label>
              <InputChips
                v-model="modules"
                :allowDuplicate="false"
                class="w-100"
                placeholder="Add a module code and press Enter"
                fluid
              />
              <small class="text-muted d-block mt-1">e.g. IS216</small>
            </div>

            <!-- Study Hours -->
            <div class="my-4">
              <label class="fw-semibold mb-2 d-block">Study hours per day</label>
              <div class="d-flex align-items-center gap-3">
                <Slider v-model="studyHours" :min="1" :max="12" :step="1" class="flex-grow-1" />
              </div>
              <small class="text-muted d-block mt-2">{{ studyHours }} hrs</small>
            </div>

            <!-- Save -->
            <div class="d-flex justify-content-center mt-4">
              <Button
                label="Save & Finish"
                icon="pi pi-check"
                :disabled="!isStep2Valid || saving"
                :loading="saving"
                @click="handleSave"
              />
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
.text-muted { color: #6b7280; }
</style>
