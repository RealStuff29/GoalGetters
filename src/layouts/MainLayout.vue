<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/composables/useAuth';
import Button from 'primevue/button';

const router = useRouter();
const { logoutUser } = useAuth();
const userSession = ref(null);
const checkedSession = ref(false);

// Watch authentication state
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  userSession.value = session;
  checkedSession.value = true; // ✅ mark session as checked

  // Keep session reactive on login/logout
  supabase.auth.onAuthStateChange((_event, session) => {
    userSession.value = session;
    checkedSession.value = true; // ensure state is settled
  });
});

async function handleLogout() {
  const logoutOK = await logoutUser();
  if (logoutOK) {
    userSession.value = null;
    router.push({ name: 'landing' });
  }
}

function handleLogin() {
  router.push({ name: 'login' });
}

function handleRegister() {
  router.push({ name: 'register' });
}

// Redirect to login if user not logged in
function handleProtectedNavigation(path) {
  if (!userSession.value) {
    router.push({ name: 'login' });
  } else {
    router.push(path);
  }
}

function handleHomeNav() {
  if (userSession.value) {
    router.push({ name: 'home' });      // goes to /home when logged in
  } else {
    router.push({ name: 'landing' });   // goes to / when logged out
  }
}

</script>

<template>
  <div>
    <nav class="navbar bg-light px-3 d-flex justify-content-between align-items-center">
      <!-- Left navigation links -->
      <div class="d-flex align-items-center">
        <a @click="handleHomeNav" class="nav-link mx-3" style="cursor: pointer;">Home</a>
        <a @click="handleProtectedNavigation('/crudview')" class="nav-link mx-3" style="cursor: pointer;">Crud Test</a>
        <a @click="handleProtectedNavigation('/profilesetupview')" class="nav-link mx-3"
          style="cursor: pointer;">Profile Setup</a>
        <a @click="handleProtectedNavigation('/profilesettingsview')" class="nav-link mx-3"
          style="cursor: pointer;">Profile Settings</a>
        <a @click="handleProtectedNavigation('/matchlandingview')" class="nav-link mx-3"
          style="cursor: pointer;">Matchmake Now</a>
        <a @click="handleProtectedNavigation('/feedbackview')" class="nav-link mx-3"
          style="cursor: pointer;">Feedback</a>
        <a @click="handleProtectedNavigation('/matchchatview')" class="nav-link mx-3"
          style="cursor: pointer;">MatchChat</a>
      </div>

      <!-- Right side: Conditional buttons -->
      <div v-if="checkedSession">
        <!-- Logged in -->
        <Button v-if="userSession" severity="warn" label="Log Out" @click="handleLogout" />

        <!-- Not logged in -->
        <div v-else class="d-flex gap-2">
          <Button severity="secondary" label="Log In" @click="handleLogin" />
          <Button severity="warn" label="Sign Up" @click="handleRegister" />
        </div>
      </div>

      <!-- 👇 This shows while session check is in progress -->
      <div v-else>
        <span>Loading...</span>
      </div>
    </nav>

    <!-- Page Content -->
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
</style>