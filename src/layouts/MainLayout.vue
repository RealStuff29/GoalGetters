<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import Button from 'primevue/button'
import { useMatchStore } from '@/stores/match'

const router = useRouter()
const { logoutUser } = useAuth()
const userSession = ref(null)
const checkedSession = ref(false)
const store = useMatchStore()

// Watch authentication state
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  userSession.value = session
  checkedSession.value = true

  // try to hydrate/auto-resume so the nav reflects reality after refresh
  await store.hydrateFromCache()
  // fire-and-forget; if nothing to resume, it’s a no-op
  store.resumeSilently().catch(() => {})

  supabase.auth.onAuthStateChange((_event, session) => {
    userSession.value = session
    checkedSession.value = true
  })
})

async function handleLogout() {
  const logoutOK = await logoutUser()
  if (logoutOK) {
    userSession.value = null
    router.push({ name: 'landing' })
  }
}
function handleLogin() { router.push({ name: 'login' }) }
function handleRegister() { router.push({ name: 'register' }) }

function handleProtectedNavigation(path) {
  if (!userSession.value) router.push({ name: 'login' })
  else router.push(path)
}

function handleHomeNav() {
  if (userSession.value) {
    router.push({ name: 'home' })      // goes to /home when logged in
  } else {
    router.push({ name: 'landing' })   // goes to / when logged out
  }
}

// Only show MatchChat when users are actually in chat (both accepted and entered chat)
const showMatchChat = computed(() => store.stage === 'chat')
</script>

<template>
  <div>
    <nav class="navbar bg-light px-4 d-flex align-items-center shadow-sm position-relative" style="height: 64px;">
      <!-- Left -->
      <div class="d-flex align-items-center gap-2">
        <h3 class="brand-title mb-0" :class="{ 'brand-clickable': userSession }" @click="userSession && handleHomeNav()"
          title="Go to Home">
          GoalGetters
        </h3>
      </div>

      <!-- Center navigation -->
      <div
        class="center-nav d-flex align-items-center justify-content-center gap-4 position-absolute top-50 start-50 translate-middle">
        <template v-if="userSession">
          <RouterLink to="/profilesettingsview" class="nav-link">Profile Settings</RouterLink>
          <RouterLink to="/matchlandingview" class="nav-link">Matchmake Now</RouterLink>
          <RouterLink to="/feedbackview" class="nav-link">Feedback</RouterLink>

          <!-- ⬇️ Only show when actually in chat -->
          <RouterLink
            v-if="showMatchChat"
            to="/matchchatview"
            class="nav-link"
          >
            MatchChat
          </RouterLink>
        </template>
      </div>

      <!-- Right side buttons (unchanged) -->
      <div v-if="checkedSession">
        <Button v-if="userSession" label="Log Out" class="btn-gradient" @click="handleLogout" />
        <div v-else class="d-flex gap-2">
          <Button severity="secondary" label="Log In" @click="handleLogin" class="btn-glass" />
          <Button severity="warn" label="Sign Up" @click="handleRegister" class="btn-gradient" />
        </div>
      </div>
      <div v-else>
        <i class="pi pi-spin pi-spinner text-muted"></i>
      </div>
    </nav>

    <div class="mx-0 p-0">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.nav-link {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
  color: #333;
}

.nav-link:hover {
  transform: translateY(-2px);
}

/* For PrimeVue Button */
:deep(.p-button) {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

:deep(.p-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.navbar {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.text-gradient {
  background: linear-gradient(90deg, #ff9800, #ffb347);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #ff9800;
  transform: translateY(-2px);
}

.btn-gradient {
  background: linear-gradient(90deg, #ff9800, #ffb347);
  border: none;
  color: white !important;
  transition: all 0.3s ease;
  border-radius: 50px;
}

.btn-gradient:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.btn-glass {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #333;
  transition: all 0.3s ease;
  border-radius: 50px;
}

.btn-glass:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.brand-title {
  font-weight: 800;
  font-size: 1.4rem;
  background: linear-gradient(90deg, #ff9800, #ffb347);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: all 0.3s ease;
  cursor: default;
}

/* Only clickable (home) when user is logged in */
.brand-clickable {
  cursor: pointer;
  position: relative;
}

.brand-clickable::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 0%;
  height: 2px;
  background: linear-gradient(90deg, #ff9800, #ffb347);
  transition: width 0.3s ease;
}

.brand-clickable:hover::after {
  width: 100%;
}

.brand-clickable:hover {
  transform: translateY(-1px);
  text-shadow: 0 0 8px rgba(255, 152, 0, 0.4);
}

/* Subtle style for marketing links on landing */
.nav-link[href^="#"] {
  opacity: 0.8;
}

.nav-link[href^="#"]:hover {
  opacity: 1;
  color: #ff9800;
}

.center-nav a {
  opacity: 0.9;
  transition: opacity 0.3s ease, transform 0.2s ease;
}

.center-nav a:hover {
  opacity: 1;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .center-nav {
    display: none;
    /* hide nav links on mobile for cleaner design */
  }
}
</style>
