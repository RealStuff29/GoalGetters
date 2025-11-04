<template>
  <div class="feedback-page-container">
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>
    <div class="bg-blob blob-3"></div>
    <transition name="fade-in-out">
      <div v-if="messageText" :class="['message-box', messageType]">
        <span class="message-icon">{{ messageIcon }}</span>
        <p>{{ messageText }}</p>
      </div>
    </transition>

    <div class="feedback-card glass-card">
      <header class="header-section">
        <div class="icon-circle mb-4">
          <i class="pi pi-comment header-icon text-primary"></i>
        </div>
        <h1 class="title">GoalGetters Feedback</h1>
        <p class="subtitle">Tell us what's working and what we can improve.</p>
      </header>

      <div class="form-body">
        <div class="form-group">
          <label class="form-label">Which area is your feedback about?</label>
          <Dropdown v-model="selectedFeature" :options="featureOptions" optionLabel="label" optionValue="value"
            placeholder="Select a feature area" class="w-full rounded-input" />
        </div>

        <div class="form-group">
          <label class="form-label">How would you rate your experience?</label>
          <Rating v-model="rating" :cancel="false" class="w-full rating-input rating-large" />
        </div>

        <div class="form-group">
          <label class="form-label">Detailed Comments</label>
          <Textarea v-model="comments" rows="6" autoResize
            placeholder="What worked well? What specific issue did you face? (Minimum 10 characters)"
            class="w-full rounded-input textarea-input" />
        </div>

        <div class="button-group">
          <Button :disabled="!isValid || submitting" @click="submitFeedback" label="Send Feedback" icon="pi pi-send"
            class="p-button p-button-rounded hover-button" />
          <Button :disabled="submitting" @click="clearForm" label="Clear Form" icon="pi pi-refresh"
            class="p-button p-button-rounded hover-button" />
          <Button :disabled="submitting" @click="goToHome" label="Back to Home" icon="pi pi-home"
            class="p-button p-button-rounded hover-button" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase.js'
import emailjs from 'emailjs-com'

const router = useRouter()
const rating = ref(0)
const selectedFeature = ref('')
const comments = ref('')
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

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user || !user.email) {
      showMessage('User not logged in. Please login to submit feedback.', 'error')
      submitting.value = false
      return
    }

    const feedbackData = {
      user_id: user.id,
      feature: selectedFeature.value,
      rating: rating.value,
      comments: comments.value,
    }

    const { error } = await supabase.from('feedback').insert([feedbackData])
    if (error) {
      showMessage(`Supabase submission failed: ${error.message}`, 'error')
      submitting.value = false
      return
    }

    const serviceID = 'service_5y8iu0y'
    const templateID = 'template_wm3esoj'
    const publicKey = 'FIKMLHASOC5ulQfhe'

    const templateParams = {
      user_name: user.email.split('@')[0],
      user_email: user.email,
      feature: selectedFeature.value,
      rating: rating.value.toString(),
      comments: comments.value
    }

    await emailjs.send(serviceID, templateID, templateParams, publicKey)

    showMessage('✅ Feedback submitted and email sent successfully!', 'success')
    clearForm()

  } catch (err) {
    console.error(err)
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
  showMessage('Form cleared.', 'info')
}

const goToHome = () => router.push({ name: 'home' })
</script>

<style>
.feedback-page-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
  font-family: 'Inter', sans-serif;
  background: radial-gradient(1200px 600px at 10% -10%, #fff0e0 0%, transparent 60%),
              radial-gradient(1200px 600px at 110% 10%, #ffe6ff 0%, transparent 55%),
              linear-gradient(180deg, #ffffff 0%, #fffaf5 100%);
}
.feedback-card {
  width: 100%;
  max-width: 650px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 2.5rem;
  transition: transform 0.2s ease;
}

.feedback-card:hover {
  transform: translateY(-3px);
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.icon-circle {
  width: 60px;
  height: 60px;
  background: #ffedd5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
  font-size: 1.5rem;
}

.header-icon {
  font-size: 1.8rem;
}

.title {
  font-size: 1.85rem;
  font-weight: 700;
  color: #111827;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
  margin-top: 0.25rem;
}

.form-group {
  margin-bottom: 1.75rem;
}

.form-label {
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
  color: #111827;
}

.rounded-input {
  border-radius: 10px;
}

.textarea-input {
  width: 100%;
  min-height: 140px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.textarea-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.rating-input {
  padding: 0.25rem 0;
}

.rating-large .pi-star,
.rating-large .pi-star-o {
  font-size: 3rem !important;
  margin-right: 0.5rem;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.hover-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.message-box {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  min-width: 250px;
  padding: 1rem 1.5rem;
  text-align: center;
  font-weight: 600;
  z-index: 9999;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* === Decorative Animated Blobs (copied from ProfileSettingsView) === */
.bg-blob {
  position: absolute;
  filter: blur(40px);
  opacity: 0.35;
  border-radius: 50%;
  animation: floaty 12s ease-in-out infinite;
  pointer-events: none; /* so they never block clicking UI */
}

.blob-1 { 
  width: 360px; height: 360px; 
  top: -80px; left: -80px;
  background: linear-gradient(135deg,#ffb85c,#ff7d7d);
}

.blob-2 { 
  width: 300px; height: 300px;
  top: 20%; right: -100px;
  background: linear-gradient(135deg,#9ecbff,#b49bff);
  animation-delay: 2s;
}

.blob-3 { 
  width: 260px; height: 260px;
  bottom: -80px; left: 20%;
  background: linear-gradient(135deg,#ffef9e,#ffa7d1);
  animation-delay: 4s;
}

@keyframes floaty {
  0%,100%{ transform: translateY(0) }
  50%{ transform: translateY(-16px) }
}

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
</style>
