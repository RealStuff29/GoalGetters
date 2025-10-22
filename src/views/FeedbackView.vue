<template>
  <div class="feedback-page-container">
    
    <transition name="fade-in-out">
        <div v-if="messageText" :class="['message-box', messageType]">
            <span class="message-icon">{{ messageIcon }}</span>
            <p>{{ messageText }}</p>
        </div>
    </transition>

    <!-- Feedback Form View - always visible now, as the router handles routing away -->
    <div class="feedback-card">
      <header class="card-header">
        <div class="icon-circle">
          <svg
            class="header-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM7 9h10v2H7V9zm0 3h7v2H7v-2z"
            />
          </svg>
        </div>
        <h1 class="title">GoalGetters Feedback</h1>
        <p class="subtitle">
          Tell us what's working and what we can improve to help you crush your
          goals.
        </p>
      </header>

      <div class="form-body">
        <div class="form-group">
          <label for="feature" class="form-label"
            >Which area is your feedback about?</label
          >
          <div class="custom-select-wrapper">
            <select id="feature" v-model="selectedFeature" class="custom-select">
              <option disabled value="">— Select a feature area —</option>
              <option value="matching">Goal Matching & Partner Finding</option>
              <option value="profile">Profile Setup & Management</option>
              <option value="goals">Goal Tracking & Progress</option>
              <option value="ui">App Design & Usability (UI/UX)</option>
              <option value="other">Other/General Feedback</option>
            </select>
            <span class="dropdown-arrow">▼</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label"
            >How would you rate your experience with this feature?</label
          >
          <div class="rating-section">
            <span
              v-for="n in 5"
              :key="n"
              class="star"
              :class="{ filled: n <= rating }"
              @click="rating = n"
              >★</span
            >
          </div>
        </div>

        <div class="form-group">
          <label for="comments" class="form-label">Detailed Comments</label>
          <textarea
            id="comments"
            v-model="comments"
            placeholder="What worked well? What specific issue did you face? (Minimum 10 characters)"
            rows="7"
            class="comments-textarea"
          ></textarea>
        </div>

        <div class="submit-footer">
          <label class="anon-label">
            <input
              type="checkbox"
              v-model="sendAnonymously"
              class="anon-checkbox"
            />
            Send feedback anonymously
          </label>

          <div class="button-group">
            <Button
              :disabled="!isValid || submitting"
              @click="submitFeedback"
              class="button-base send-btn p-button-rounded p-button-success"
            >
                <template v-if="submitting">
                    <span class="spinner"></span> Sending...
                </template>
                <template v-else>
                    Send Feedback
                </template>
            </Button>
            
            <Button
              :disabled="submitting"
              @click="clearForm"
              label="Clear Form"
              class="button-base clear-btn p-button-rounded p-button-secondary"
            />
            
            <Button
              label="Back to Home"
              :disabled="submitting"
              @click="goToHome"
              class="button-base home-btn p-button-rounded p-button-info"
            />
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
// We assume 'vue-router' is available in the user's environment since they provided the router configuration.
import { useRouter } from 'vue-router'; 
import { supabase } from '@/lib/supabase.js' 

const router = useRouter(); // Initialize router instance

const rating = ref(0);
const selectedFeature = ref('');
const comments = ref(''); 
const sendAnonymously = ref(false);
const submitting = ref(false);

const messageText = ref('');
const messageType = ref('');

const messageIcon = computed(() => {
  if (messageType.value === 'success') return '✔';
  if (messageType.value === 'error') return '❌';
  return 'ℹ️';
});

const showMessage = (text, type = 'success') => {
  messageText.value = text;
  messageType.value = type;
  setTimeout(() => {
      messageText.value = '';
  }, 4500);
};

const isValid = computed(() => {
  return (
    rating.value > 0 &&
    selectedFeature.value !== '' &&
    comments.value.trim().length >= 10
  );
});

const submitFeedback = async () => {
  if (!isValid.value || submitting.value) {
    showMessage('Please fill out all required fields and provide at least 10 characters of feedback.', 'error');
    return;
  }
  
  submitting.value = true;
  
  const feedbackData = {
    // Corrected column names based on conversation history and common conventions
    feature: selectedFeature.value, 
    rating: rating.value,
    comments: comments.value,
    is_anonymous: sendAnonymously.value, 
  };

  try {
    const { error } = await supabase
      .from('feedback') 
      .insert([feedbackData]);

    if (error) {
      console.error('❌ Supabase Insert Error:', error);
      // Display the database error message to the user
      showMessage(`Submission failed: ${error.message || 'Database error.'}`, 'error');
    } else {
      showMessage('✅ Thank you! Your feedback has been sent successfully.', 'success');
      clearForm();
      // We removed the call to goToHome() here. The user must now explicitly click the 'Back to Home' button.
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    showMessage('An unexpected network error occurred.', 'error');
  } finally {
    submitting.value = false;
  }
};

const clearForm = () => {
  if (submitting.value) return;
  rating.value = 0;
  selectedFeature.value = '';
  comments.value = '';
  sendAnonymously.value = false;
  showMessage('Form fields cleared.', 'info');
};

// Function to handle "Back to Home" - now uses Vue Router
const goToHome = () => {
    // Navigates to the route defined with name: 'home' in router.js, which is the path '/'
    router.push({ name: 'home' });
};

</script>

<style scoped>
@import url('https://unpkg.com/primevue@3.52.0/resources/primevue.min.css');
@import url('https://unpkg.com/primevue@3.52.0/resources/themes/lara-light-blue/theme.css');
@import url('https://unpkg.com/primeicons@7.0.0/primeicons.css');

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

:root {
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-success: #34d399;
  --color-success-dark: #10b981;
  --color-secondary: #9ca3af;
  --color-secondary-dark: #6b7280;
  --color-info: #60a5fa;
  --color-info-dark: #3b82f6;
  --color-gold: #ffc107;
  --color-text: #1f2937;
  --color-subtle: #6b7280;
  --color-border: #e5e7eb;
  --color-bg-light: #f0f4f8;
  --color-white: #ffffff;
  --color-error: #ef4444; 
}

.feedback-page-container {
  min-height: 100vh; 
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #dbeafe 0%, #f0fdfa 100%);
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

.feedback-card {
  width: 100%;
  max-width: 650px;
  background: rgba(255, 255, 255, 0.85); 
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  padding: 50px 40px;
  animation: fadeInUp 0.6s ease;
  box-sizing: border-box;
  text-align: center;
}

.card-header { text-align: center; margin-bottom: 40px; }
.icon-circle { display: inline-flex; justify-content: center; align-items: center; width: 60px; height: 60px; border-radius: 50%; background-color: #dbeafe; margin-bottom: 15px; }
.header-icon { width: 32px; height: 32px; color: var(--color-primary); }
.title { font-size: 2.1rem; font-weight: 800; color: var(--color-text); margin: 0; }
.subtitle { font-size: 1.05rem; color: var(--color-subtle); margin-top: 8px; max-width: 80%; margin-left: auto; margin-right: auto; }
.form-group { margin-bottom: 30px; }
.form-label { font-weight: 700; color: var(--color-text); margin-bottom: 10px; display: block; }
.custom-select-wrapper { position: relative; }
.custom-select, .comments-textarea { width: 100%; padding: 14px 18px; border: 1px solid var(--color-border); border-radius: 12px; background-color: #f9fafb; font-size: 1rem; color: var(--color-text); transition: all 0.2s ease; box-sizing: border-box; }
.custom-select:focus, .comments-textarea:focus { border-color: #3b82f6; background-color: #fff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); outline: none; }
.custom-select { appearance: none; -webkit-appearance: none; -moz-appearance: none; }
.comments-textarea { resize: vertical; }
.dropdown-arrow { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--color-subtle); font-size: 0.8rem; }
.rating-section { display: flex; justify-content: center; gap: 18px; font-size: 38px; margin-top: 5px; }
.star { cursor: pointer; color: #d1d5db; transition: color 0.2s, transform 0.2s; }
.star:hover { transform: scale(1.1); }
.star.filled { color: var(--color-gold); text-shadow: 0 0 5px rgba(255, 193, 7, 0.5); }
.submit-footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.anon-label { display: flex; align-items: center; font-size: 1rem; color: var(--color-subtle); cursor: pointer; }
.anon-checkbox { margin-right: 10px; accent-color: var(--color-primary); width: 18px; height: 18px; }
.button-group { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }


.button-base {
    padding: 0.8rem 1.5rem; 
    font-size: 1rem;
    font-weight: 700;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 2rem !important; 
    border: none !important;
}

.send-btn { 
    background-color: var(--color-success) !important; 
    color: var(--color-white) !important;
}
.clear-btn { 
    background-color: var(--color-secondary) !important; 
    color: var(--color-white) !important;
}
.home-btn { 
    background-color: var(--color-info) !important; 
    color: var(--color-white) !important;
}

.send-btn:hover:not(:disabled) { 
    background-color: var(--color-success-dark) !important; 
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); 
}
.clear-btn:hover:not(:disabled) { 
    background-color: var(--color-secondary-dark) !important; 
    box-shadow: 0 0 10px rgba(107, 114, 128, 0.4); 
}
.home-btn:hover:not(:disabled) { 
    background-color: var(--color-info-dark) !important; 
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); 
}

.p-button:disabled {
    opacity: 0.7 !important;
    cursor: not-allowed !important;
    filter: brightness(0.9) !important;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.message-box {
  position: fixed;
  top: 25px;
  left: 50%;
  transform: translateX(-50%);
  padding: 15px 25px;
  border-radius: 10px;
  font-weight: 600;
  z-index: 9999; 
  display: flex;
  align-items: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); 
  min-width: 300px;
  color: var(--color-white); 
}

.message-box p { 
    margin: 0; 
    font-weight: 700; 
}
.message-icon { 
    margin-right: 12px; 
    font-size: 1.5rem; 
    line-height: 1; 
}

.message-box.success { background-color: var(--color-success-dark); }
.message-box.error { background-color: var(--color-error); }
.message-box.info { background-color: var(--color-info-dark); }

.fade-in-out-enter-active,
.fade-in-out-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
.fade-in-out-enter-from { opacity: 0; transform: translateX(-50%) translateY(-60px); }
.fade-in-out-leave-to { opacity: 0; transform: translateX(-50%) translateY(-20px); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 640px) {
  .feedback-card { padding: 30px 20px; }
  .title { font-size: 1.8rem; }
  .submit-footer { flex-direction: column; align-items: flex-start; }
  .button-group { justify-content: center; width: 100%; }
  .button-base { flex-grow: 1; } 
}
</style>
