<template>
  <div class="homepage-container">
    <!-- Hero Welcome Section -->
    <section class="hero-section">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-lg-7">
            <div class="welcome-content">
              <div v-if="isLoggedIn" class="welcome-badge">
                <i class="pi pi-check-circle"></i>
                <span>You're logged in</span>
              </div>
              <h1 class="welcome-heading">
                Welcome back, <span class="user-name">{{ userName }}</span>!
              </h1>
              <p class="welcome-subtitle">
                Ready to achieve your goals today? Let's find you the perfect study partner.
              </p>
              <div class="cta-buttons">
                <RouterLink to="/matchlandingview" class="no-decoration">
                  <Button label="Find Study Partner" icon="pi pi-users" class="primary-cta" />
                </RouterLink>
                <RouterLink to="/profilesettingsview" class="no-decoration">
                  <Button label="View Profile" icon="pi pi-user" outlined class="secondary-cta"
                    @click="navigateTo('/profilesettingsview')" />
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- Animated Illustration -->
          <div class="col-lg-5 d-none d-lg-block">
            <div class="hero-illustration">
              <div class="illustration-circle circle-1"></div>
              <div class="illustration-circle circle-2"></div>
              <div class="illustration-circle circle-3"></div>
              <div class="logo-display">
                <div class="logo-icon">
                  <img v-bind:src="logo" class="img-fluid w-100 h-100">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Stats Section -->
    <transition name="fade">
      <section v-if="isLoggedIn" class="stats-section">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-card stat-card--large">
              <div class="stat-icon">
                <i class="pi pi-book" style="font-size: 1.3rem;"></i>
              </div>
              <div class="stat-content">
                <h3 class="stat-number stat-number--small">{{ major }}</h3>
                <p class="stat-label">Your School</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-star" style="font-size: 1.3rem;"></i>
              </div>
              <div class="stat-content">
                <h3 class="stat-number">{{ userRating }}</h3>
                <p class="stat-label">Average Rating</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-clock" style="font-size: 1.3rem;"></i>
              </div>
              <div class="stat-content">
                <h3 class="stat-number">{{ studyHours }}h</h3>
                <p class="stat-label">Total Study Hours</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-users" style="font-size: 1.3rem;"></i>
              </div>
              <div class="stat-content">
                <h3 class="stat-number">{{ studyPartners }}</h3>
                <p class="stat-label">Study Partners</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </transition>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">What would you like to do today?</h2>
        <div class="features-grid">
          <Card class="feature-card" @click="navigateTo('/matchlandingview')">
            <template #content>
              <div class="feature-icon orange">
                <i class="pi pi-search" style="font-size: 1.3rem;"></i>
              </div>
              <h3 class="feature-title">Find a Study Partner</h3>
              <p class="feature-description">
                Connect with students studying the same subjects and achieve your goals together.
              </p>

              <RouterLink to="/matchlandingview" class="no-decoration">
                <Button label="Start Matching" icon="pi pi-arrow-right" iconPos="right" text class="feature-btn" />
              </RouterLink>
            </template>
          </Card>

          <Card class="feature-card" @click="navigateTo('/profilesetupview')">
            <template #content>
              <div class="feature-icon orange">
                <i class="pi pi-user-edit" style="font-size: 1.3rem;"></i>
              </div>
              <h3 class="feature-title">Update Profile</h3>
              <p class="feature-description">
                Keep your profile up-to-date with your current subjects and study preferences.
              </p>
              <RouterLink to="/profilesetupview" class="no-decoration">
                <Button label="Edit Profile" icon="pi pi-arrow-right" iconPos="right" text class="feature-btn" />
              </RouterLink>
            </template>
          </Card>

          <Card class="feature-card" @click="navigateTo('/feedbackview')">
            <template #content>
              <div class="feature-icon orange">
                <i class="pi pi-comment" style="font-size: 1.3rem;"></i>
              </div>
              <h3 class="feature-title">Share Feedback</h3>
              <p class="feature-description">
                Help us improve GoalGetters by sharing your experience and suggestions.
              </p>
              <RouterLink to="/feedbackview" class="no-decoration">
                <Button label="Give Feedback" icon="pi pi-arrow-right" iconPos="right" text class="feature-btn" />
              </RouterLink>
            </template>
          </Card>
        </div>
      </div>
    </section>

    <!-- Recent Activity Section -->
    <!-- <section class="activity-section">
      <div class="container">
        <h2 class="section-title">Recent Activity</h2>
        <div class="activity-list">
          <Card v-for="activity in recentActivities" :key="activity.id" class="activity-card">
            <template #content>
              <div class="activity-content">
                <div class="activity-icon" :class="activity.type">
                  <i :class="activity.icon"></i>
                </div>
                <div class="activity-details">
                  <h4 class="activity-title">{{ activity.title }}</h4>
                  <p class="activity-description">{{ activity.description }}</p>
                  <small class="activity-time">{{ activity.time }}</small>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </section> -->

    <!-- Motivational Quote Section -->
    <section class="quote-section">
      <div class="container">
        <Card class="quote-card" @click="changeQuote" :class="{ 'quote-fade': isChanging }">
          <template #content>
            <i class="pi pi-quote-right quote-icon"></i>
            <blockquote class="quote-text">
              "{{ motivationalQuote.text }}"
            </blockquote>
            <p class="quote-author"> {{ motivationalQuote.author }}</p>
            <small class="quote-hint">Click for another quote</small>
          </template>
        </Card>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Card from 'primevue/card';
import logo from '@/assets/images/Logo.png';
import { supabase } from '@/lib/supabase'

const isLoggedIn = ref(false);
const router = useRouter();

// User data (replace with actual user data from your store/API)
const userName = ref('');
const major = ref('');
const userRating = ref(0);
const studyHours = ref(0);
const studyPartners = ref(0);

const motivationalQuote = ref({
  text: "The secret of getting ahead is getting started.",
  author: "Mark Twain"
});

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Learning is not attained by chance, it must be sought for with ardor and diligence.", author: "Abigail Adams" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" }
];

const changeQuote = () => {
  // console.log('changeQuote called');
  console.log('Current quote:', motivationalQuote.value.text);

  let randomIndex;
  let newQuote;

  // Keep picking until we get a different quote
  do {
    randomIndex = Math.floor(Math.random() * quotes.length);
    newQuote = quotes[randomIndex];
    // console.log('Trying quote:', newQuote.text);
  } while (newQuote.text === motivationalQuote.value.text && quotes.length > 1);

  motivationalQuote.value = newQuote;
  console.log('New quote:', motivationalQuote.value.text);
};

// const recentActivities = ref([
//   {
//     id: 1,
//     type: 'match',
//     icon: 'pi pi-users',
//     title: 'New Study Match',
//     description: 'You matched with Alex for Calculus study session',
//     time: '2 hours ago'
//   },
//   {
//     id: 2,
//     type: 'session',
//     icon: 'pi pi-calendar',
//     title: 'Study Session Completed',
//     description: 'Completed a 2-hour session with Jamie',
//     time: '1 day ago'
//   },
//   {
//     id: 3,
//     type: 'achievement',
//     icon: 'pi pi-star',
//     title: 'Achievement Unlocked',
//     description: 'Earned "Study Streak" badge - 7 days in a row!',
//     time: '2 days ago'
//   }
// ]);

const navigateTo = (path) => {
  router.push(path);
};

onMounted(async () => {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  isLoggedIn.value = !!session;

  // Watch for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    isLoggedIn.value = !!session;
  });

  // If no user logged in, skip fetching profile
  if (!session) {
    console.warn('No user logged in');
    return;
  }

  const user = session.user;
  //Fetch user data
  const { data, error } = await supabase
    .from('profiles')
    .select('username, degree, avg_rating, study_hours, review_count')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return
  }

  function formatDegree(degree) {
    if (!degree) return ''
    const lower = degree.toLowerCase()

    if (lower.includes('information-systems')) {
      return 'Information Systems'
    }

    if (lower.includes('business-management')) {
      return 'Business Management'
    }

    // Default: just capitalize first letter
    return degree.charAt(0).toUpperCase() + degree.slice(1)
  }

  // Assign the data to refs
  userName.value = data.username
  major.value = formatDegree(data.degree)
  // console.log(major.value)
  userRating.value = data.avg_rating
  studyHours.value = data.study_hours
  studyPartners.value = data.review_count

});
</script>

<style scoped>
.homepage-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff5e6 0%, #ffffff 50%, #fff5e6 100%);
}

/* Hero Section */
.hero-section {
  padding: 4rem 2rem;
  position: relative;
  overflow: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.welcome-content {
  max-width: 600px;
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  animation: slideInLeft 0.8s ease-out 0.2s both;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.welcome-heading {
  font-size: 3rem;
  font-weight: 800;
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.2;
  animation: fadeInUp 0.8s ease-out 0.3s both;
}

.user-name {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  animation: fadeInUp 0.8s ease-out 0.5s both;
}

.primary-cta {
  background: linear-gradient(135deg, #ff9800, #f57c00) !important;
  border: none !important;
  padding: 0.875rem 2rem !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  border-radius: 50px !important;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3) !important;
  transition: all 0.3s ease !important;
}

.hero-section .primary-cta:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4) !important;
}

.secondary-cta {
  padding: 0.875rem 2rem !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  border-radius: 50px !important;
  border: 2px solid #ff9800 !important;
  color: #ff9800 !important;
  transition: all 0.3s ease !important;
}

.hero-section .secondary-cta:hover {
  transform: translateY(-4px);
  background: rgba(255, 152, 0, 0.05) !important;
}

/* Hero Illustration */
.hero-illustration {
  position: relative;
  width: 100%;
  height: 400px;
}

.illustration-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.6;
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(245, 124, 0, 0.1));
  animation: float 6s ease-in-out infinite;
  top: 0;
  left: 0;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(245, 124, 0, 0.15));
  top: 50px;
  left: 50px;
  animation: float 4s ease-in-out infinite reverse;
}

.circle-3 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(245, 124, 0, 0.2));
  top: 100px;
  left: 100px;
  animation: float 5s ease-in-out infinite;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

.logo-display {
  position: absolute;
  top: 50%;
  left: 42%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.logo-icon {
  width: 200px;
  height: 200px;
  /* background: linear-gradient(135deg, #ff9800, #f57c00); */
  /* opacity: 50%; */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* box-shadow: 0 10px 40px rgba(255, 152, 0, 0.4); */
  animation: bounce 3s ease-in-out infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-15px);
  }
}

/* Stats Section */
.stats-section {
  padding: 2rem;
  margin-top: -2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
  animation: fadeInUp 0.8s ease-out both;
}

.stat-card--large {
  flex: 1.5;
  /* makes it wider relative to others */
  min-width: 250px;
  padding: 1rem;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 8px 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: 800;
  color: #333;
  margin: 0;
}

.stat-number--small {
  font-size: 0.9rem;
  font-weight: 800;
  color: #333;
  margin-bottom: 13px;
  margin-top: 10px;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

/* Features Section */
.features-section {
  padding: 4rem 2rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.8s ease-out both;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  width: 70px;
  height: 70px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.feature-icon.orange {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.feature-icon.blue {
  background: linear-gradient(135deg, #2196f3, #1976d2);
}

.feature-icon.green {
  background: linear-gradient(135deg, #4caf50, #388e3c);
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
}

.feature-description {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.feature-btn {
  color: #ff9800 !important;
  font-weight: 600 !important;
}

.feature-btn:hover {
  transform: translateY(-2px);
  background: #ff9800 !important;
  color: white !important;
}

/* Activity Section */
.activity-section {
  padding: 4rem 2rem;
  background: white;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-card {
  animation: fadeInUp 0.8s ease-out both;
  transition: all 0.3s ease;
}

.activity-card:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.activity-content {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.activity-icon {
  width: 50px;
  height: 50px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.activity-icon.match {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.activity-icon.session {
  background: linear-gradient(135deg, #2196f3, #1976d2);
}

.activity-icon.achievement {
  background: linear-gradient(135deg, #ffc107, #ff9800);
}

.activity-details {
  flex: 1;
}

.activity-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.activity-description {
  color: #666;
  margin: 0 0 0.5rem 0;
}

.activity-time {
  color: #999;
  font-size: 0.875rem;
}

/* Quote Section */
.quote-section {
  padding: 4rem 2rem;
}

.quote-card {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  text-align: center;
  padding: 2rem;
  animation: fadeInUp 0.8s ease-out both;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.quote-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(255, 153, 0, 0.592);
}

.quote-hint {
  display: block;
  margin-top: 1rem;
  opacity: 0.7;
  font-size: 0.875rem;
  font-style: italic;
}

.quote-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 1rem;
}

.quote-text {
  font-size: 1.5rem;
  font-style: italic;
  margin: 1rem 0;
  line-height: 1.6;
}

.quote-author {
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 600;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .welcome-heading {
    font-size: 2rem;
  }

  .welcome-subtitle {
    font-size: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
