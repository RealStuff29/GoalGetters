<template>
  <div class="feedback-page-container">
    <transition name="fade-in-out">
      <div v-if="messageText" :class="['message-box', messageType]">
        <span class="message-icon">{{ messageIcon }}</span>
        <p>{{ messageText }}</p>
      </div>
    </transition>

    <div class="feedback-card">
      <header class="text-center mb-4">
        <div class="icon-circle mb-3">
          <i class="pi pi-comment header-icon text-primary"></i>
        </div>
        <h1 class="title">GoalGetters Feedback</h1>
        <p class="subtitle">Tell us what's working and what we can improve.</p>
      </header>

      <div class="form-body">
        <div class="form-group mb-4">
          <label>Which area is your feedback about?</label>
          <Dropdown
            v-model="selectedFeature"
            :options="featureOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a feature area"
            class="w-full"
          />
        </div>

        <div class="form-group mb-4 text-center">
          <label>How would you rate your experience?</label>
          <Rating v-model="rating" :cancel="false" />
        </div>

        <div class="form-group mb-5">
          <label>Detailed Comments</label>
          <Textarea
            v-model="comments"
            rows="5"
            autoResize
            placeholder="What worked well? What specific issue did you face? (Minimum 10 characters)"
            class="w-full"
          />
        </div>

        <div class="submit-footer">
          <div class="anonymous-option flex align-items-center gap-2">
            <Checkbox v-model="sendAnonymously" binary />
            <label>Send feedback anonymously</label>
          </div>

          <div class="button-group flex flex-wrap gap-2 justify-content-end mt-3">
            <Button
              :disabled="!isValid || submitting"
              @click="submitFeedback"
              label="Send Feedback"
              icon="pi pi-send"
              class="p-button-success p-button-rounded"
            />
            <Button
              :disabled="submitting"
              @click="clearForm"
              label="Clear Form"
              icon="pi pi-refresh"
              class="p-button-secondary p-button-rounded"
            />
            <Button
              :disabled="submitting"
              @click="goToHome"
              label="Back to Home"
              icon="pi pi-home"
              class="p-button-info p-button-rounded"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase.js'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Rating from 'primevue/rating'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'

const router = useRouter()
const rating = ref(0)
const selectedFeature = ref('')
const comments = ref('')
const sendAnonymously = ref(false)
const submitting = ref(false)
const messageText = ref('')
const messageType = ref('')

const featureOptions = [
  { label: 'Goal Matching & Partner Finding', value: 'matching' },
  { label: 'Profile Setup & Management', value: 'profile' },
  { label: 'Goal Tracking & Progress', value: 'goals' },
  { label: 'App Design & Usability (UI/UX)', value: 'ui' },
  { label: 'Other/General Feedback', value: 'other' },
]

const messageIcon = computed(() => {
  if (messageType.value === 'success') return '✔'
  if (messageType.value === 'error') return '❌'
  return 'ℹ️'
})

const showMessage = (text, type = 'success') => {
  messageText.value = text
  messageType.value = type
  setTimeout(() => (messageText.value = ''), 4500)
}

const isValid = computed(
  () => rating.value > 0 && selectedFeature.value && comments.value.trim().length >= 10
)

const submitFeedback = async () => {
  if (!isValid.value || submitting.value) {
    showMessage('Please fill all fields and provide at least 10 characters.', 'error')
    return
  }
  submitting.value = true
  const feedbackData = {
    feature: selectedFeature.value,
    rating: rating.value,
    comments: comments.value,
    is_anonymous: sendAnonymously.value,
  }
  try {
    const { error } = await supabase.from('feedback').insert([feedbackData])
    if (error) showMessage(`Submission failed: ${error.message}`, 'error')
    else {
      showMessage('✅ Thank you! Your feedback was sent successfully.', 'success')
      clearForm()
    }
  } catch {
    showMessage('Network error. Please try again later.', 'error')
  } finally {
    submitting.value = false
  }
}

const clearForm = () => {
  if (submitting.value) return
  rating.value = 0
  selectedFeature.value = ''
  comments.value = ''
  sendAnonymously.value = false
  showMessage('Form cleared.', 'info')
}

const goToHome = () => router.push({ name: 'home' })
</script>

<style scoped>
.feedback-page-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: var(--surface-ground);
  padding: 3rem 1rem;
}

.feedback-card {
  width: 100%;
  max-width: 650px;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 2.5rem;
  animation: fadeIn 0.3s ease;
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
}

.subtitle {
  color: var(--text-color-secondary);
  font-size: 1rem;
}

label {
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
}

.icon-circle {
  background: var(--primary-50);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.header-icon {
  font-size: 1.5rem;
}

.submit-footer {
  border-top: 1px solid var(--surface-border);
  padding-top: 1rem;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.message-box {
  position: fixed;
  top: 1rem;
  left: 50%;
  width: 100%;
  transform: translateX(-50%);
  padding: 0.75rem 1.25rem;
  border-radius: var(--border-radius);
  font-weight: 600;
  z-index: 9999;
  background: var(--surface-overlay);
  color: var(--text-color);
  box-shadow: var(--card-shadow);
  animation: fadeInDown 0.4s ease;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translate(-50%, -20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}
</style>
