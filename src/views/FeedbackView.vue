<template>
    <div class="feedback-page-container">
      <div class="feedback-card">
        
        <header class="card-header">
          <div class="icon-circle">
              <svg class="header-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM7 9h10v2H7V9zm0 3h7v2H7v-2z"/>
              </svg>
          </div>
          <h1 class="title">GoalGetters Feedback</h1>
          <p class="subtitle">Tell us what's working and what we can improve to help you crush your goals.</p>
        </header>
        
        <div class="form-body">
          
          <div class="form-group">
            <label for="feature" class="form-label">Which area is your feedback about?</label>
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
            <label class="form-label">How would you rate your experience with this feature?</label>
            <div class="rating-section">
              <span 
                v-for="n in 5" 
                :key="n" 
                class="star" 
                :class="{ 'filled': n <= rating }"
                @click="rating = n"
              >★</span>
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
                  <input type="checkbox" v-model="sendAnonymously" class="anon-checkbox">
                  Send feedback anonymously
              </label>
              
              <button 
                  class="submit-button" 
                  :class="{ 'disabled': !isValid }"
                  :disabled="!isValid" 
                  @click="submitFeedback"
              >
                  Send Feedback
              </button>
          </div>
          
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  
  // Form data state
  const rating = ref(0);
  const selectedFeature = ref(''); 
  const comments = ref('');
  const sendAnonymously = ref(false);
  
  // Validation Check: Requires rating, feature selection, and at least 10 chars in comments
  const isValid = computed(() => {
      return rating.value > 0 && selectedFeature.value !== '' && comments.value.trim().length >= 10;
  });
  
  const submitFeedback = () => {
      if (!isValid.value) {
          // Use console.error or a proper notification/toast in a real app
          console.error('Validation failed. Please complete the form.'); 
          return;
      }
      
      // Log data (replace with actual API call)
      console.log('Feedback submitted:', {
          rating: rating.value,
          feature: selectedFeature.value,
          comments: comments.value,
          anonymous: sendAnonymously.value,
      });
      
      // ----- Success Action (Placeholder) -----
      alert('Thank you for your valuable feedback! We appreciate your help.');
  
      // Reset form after submission
      rating.value = 0;
      selectedFeature.value = '';
      comments.value = '';
      sendAnonymously.value = false;
  };
  </script>
  
  <style scoped>
  /* Define a primary brand color for consistency */
  :root {
      --color-primary: #3b82f6; /* Blue */
      --color-primary-dark: #2563eb;
      --color-gold: #ffc107;
      --color-text: #1f2937;
      --color-subtle: #6b7280;
      --color-border: #e5e7eb;
      --color-bg-light: #f7f7f9;
      --color-white: #ffffff;
  }
  
  /* Base Font and Background */
  .feedback-page-container {
    min-height: calc(100vh - 56px); 
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--color-bg-light); 
    padding: 40px 20px;
    /* Use a modern, readable font */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  
  /* Card Styling: Clean, Elevated Look */
  .feedback-card {
    width: 100%;
    max-width: 650px; 
    background-color: var(--color-white);
    border-radius: 16px; /* Slightly more rounded corners */
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 6px 15px rgba(0, 0, 0, 0.05);
    padding: 50px 40px;
    transition: transform 0.3s ease;
  }
  
  /* Header Styling */
  .card-header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 25px;
  }
  
  .icon-circle {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #dbeafe; /* Light blue background */
      margin-bottom: 15px;
  }
  
  .header-icon {
      width: 32px;
      height: 32px;
      color: var(--color-primary);
  }
  
  .title {
    font-size: 2.2rem;
    font-weight: 800; /* Bold and impactful */
    color: var(--color-text);
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }
  
  .subtitle {
    font-size: 1.1rem;
    color: var(--color-subtle); 
    margin: 0;
    max-width: 80%;
    margin: 0 auto;
  }
  
  /* Form Elements */
  .form-group {
    margin-bottom: 30px;
  }
  
  .form-label {
    display: block;
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 10px;
  }
  
  /* Custom Select & Textarea Styles */
  .custom-select-wrapper {
    position: relative;
  }
  
  .custom-select, .comments-textarea {
    width: 100%;
    padding: 14px 18px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background-color: var(--color-white);
    font-size: 1rem;
    color: var(--color-text);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  
  .custom-select:focus, .comments-textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  }
  
  .custom-select {
      appearance: none; 
      cursor: pointer;
  }
  
  .dropdown-arrow {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--color-subtle);
  }
  
  /* Rating Section */
  .rating-section {
    display: flex;
    justify-content: center;
    gap: 18px;
    font-size: 40px; 
    margin-top: 5px;
  }
  
  .star {
    cursor: pointer;
    color: #d1d5db; 
    transition: color 0.2s, transform 0.1s;
  }
  
  .star:hover {
      transform: scale(1.1);
  }
  
  .star.filled {
    color: var(--color-gold); 
  }
  
  /* Submit Footer */
  .submit-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 40px;
    flex-wrap: wrap; 
    gap: 20px;
  }
  
  .anon-label {
    display: flex;
    align-items: center;
    font-size: 1rem;
    color: var(--color-subtle);
    cursor: pointer;
  }
  
  .anon-checkbox {
    margin-right: 10px;
    width: 18px;
    height: 18px;
    accent-color: var(--color-primary); /* Use brand color for checkbox */
  }
  
  .submit-button {
    background-color: var(--color-primary); 
    color: var(--color-white);
    border: none;
    border-radius: 10px;
    padding: 14px 30px;
    font-weight: 700;
    font-size: 1.05rem;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
    min-width: 200px;
  }
  
  .submit-button:hover:not(.disabled) {
    background-color: var(--color-primary-dark);
    box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
  }
  
  .submit-button.disabled {
    background-color: #bfdbfe; 
    opacity: 0.8;
    cursor: not-allowed;
  }
  </style>