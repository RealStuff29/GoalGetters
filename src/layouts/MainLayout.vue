<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import { useMatchStore } from '@/stores/match'

const route = useRoute()
const router = useRouter()
const { logoutUser } = useAuth()
const userSession = ref(null)
const checkedSession = ref(false)
const store = useMatchStore()

const navMenu = ref()
const showMatchChat = computed(() => store.stage === 'chat')

const allMenuItems = computed(() => {
  if (!userSession.value) return []
  const items = [
    { label: 'Profile Settings', icon: 'pi pi-cog', command: () => router.push('/profilesettingsview') },
    { label: 'Matchmake Now', icon: 'pi pi-sparkles', command: () => router.push('/matchlandingview') },
    { label: 'Feedback', icon: 'pi pi-comment', command: () => router.push('/feedbackview') },
  ]
  if (showMatchChat.value) items.push({ label: 'MatchChat', icon: 'pi pi-comments', command: () => router.push('/matchchatview') })
  items.push({ label: 'Log Out', icon: 'pi pi-sign-out', command: () => handleLogout() })
  return items
})

const toggleNav = (event) => navMenu.value?.toggle(event)

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  userSession.value = session
  checkedSession.value = true
  await store.hydrateFromCache()
  store.resumeSilently().catch(() => {})
  supabase.auth.onAuthStateChange((_event, session) => {
    userSession.value = session
    checkedSession.value = true
  })
})

async function handleLogout() {
  const ok = await logoutUser()
  if (ok) {
    userSession.value = null
    router.push({ name: 'landing' })
  }
}

function handleLogin() { router.push({ name: 'login' }) }
function handleRegister() { router.push({ name: 'register' }) }
function handleHomeNav() { userSession.value ? router.push({ name: 'home' }) : router.push({ name: 'landing' }) }
</script>

<template>
  <div>
    <nav class="nav-shell shadow-sm px-3">
      <!-- LEFT: hamburger + brand -->
      <div class="left d-flex align-items-center gap-2">
        <Button
          v-if="userSession"
          class="btn-glass"
          icon="pi pi-bars"
          aria-haspopup="true"
          aria-controls="nav_menu"
          @click="toggleNav($event)"
        />
        <h3
          class="brand-title mb-0"
          :class="{ 'brand-clickable': userSession }"
          @click="userSession && handleHomeNav()"
          title="Go to Home"
        >
          GoalGetters
        </h3>
      </div>

      <div class="right">
        <template v-if="checkedSession">
          <template v-if="!userSession">
            <div class="d-flex gap-2">
              <Button severity="secondary" label="Log In" @click="handleLogin" class="btn-glass" />
              <Button severity="warn" label="Sign Up" @click="handleRegister" class="btn-gradient" />
            </div>
          </template>
        </template>
        <template v-else>
          <i class="pi pi-spin pi-spinner text-muted" />
        </template>
      </div>

      <Menu
        ref="navMenu"
        id="nav_menu"
        :model="allMenuItems"
        :popup="true"
        appendTo="body"
        class="app-menu"
      >
        <template #item="{ item, props }">
          <a v-bind="props.action" class="app-menu-item">
            <i :class="['app-menu-icon', item.icon]" aria-hidden="true" />
            <span class="app-menu-label">{{ item.label }}</span>
          </a>
        </template>
      </Menu>
    </nav>

    <div class="mx-0 p-0">
      <router-view />
    </div>

    <Button
      v-if="userSession && route.path !== '/feedbackview'"
      icon="pi pi-comment"
      class="feedback-icon-btn"
      @click="router.push('/feedbackview')"
      rounded
      text
    />
  </div>
</template>

<style scoped>
.nav-shell {

  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  height: 64px;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  gap: 12px;
  position: relative;
}
.left { justify-self: start; }
.center { justify-self: center; }
.right { justify-self: end; display: flex; align-items: center; gap: 8px; }

a { text-decoration: none; color: inherit; }
.nav-link { color:#333; font-weight:500; transition: transform .2s ease, color .2s ease; }
.nav-link:hover { color:#ff9800; transform: translateY(-2px); }

.brand-title {
  font-weight: 800;
  font-size: 1.4rem;
  background: linear-gradient(90deg, #ff9800, #ffb347);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: transform .2s ease;
}
.brand-clickable { cursor: pointer; position: relative; }
.brand-clickable:hover { transform: translateY(-1px); text-shadow: 0 0 8px rgba(255,152,0,.4); }
.brand-clickable::after {
  content: ''; position: absolute; left: 0; bottom: -4px; width: 0%; height: 2px;
  background: linear-gradient(90deg, #ff9800, #ffb347); transition: width .3s ease;
}
.brand-clickable:hover::after { width: 100%; }

:deep(.p-button){ border-radius: 50px; transition: transform .2s ease, box-shadow .2s ease; }
:deep(.p-button:hover){ transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,.15); }
.btn-gradient{ background: linear-gradient(90deg,#ff9800,#ffb347); border:none; color:#fff !important; }
.btn-glass{ background: rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.4); color:#333; }

.feedback-icon-btn {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 2000;
  background: linear-gradient(90deg, #ff9800, #ffb347);
  border: none;
  color: white !important;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  transition: transform .2s ease, box-shadow .2s ease;
}
.feedback-icon-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2);
}

@media (max-width: 991.98px) { .center { display: none; } }
</style>
<style>
:root {
  /* menu */
  --menu-bg: #fff;
  --menu-fg: #1f2937;
  --menu-border: rgba(0,0,0,.06);
  --menu-hover: #f6f7f9;
  --menu-icon: #6b7280;
  --menu-focus-bg: #fff7ed;
  --menu-shadow-1: 0 10px 24px rgba(0,0,0,.08);
  --menu-shadow-2: 0 2px 6px rgba(0,0,0,.04);

  /* trigger button */
  --ham-fg: #1f2937;
  --ham-bg: rgba(255,255,255,.6);
  --ham-border: rgba(0,0,0,.15);
  --ham-hover: rgba(255,255,255,.8);
}

@media (prefers-color-scheme: dark) {
  :root {
    --menu-bg: #0f172a;
    --menu-fg: #e5e7eb;
    --menu-border: rgba(255,255,255,.08);
    --menu-hover: rgba(255,255,255,.06);
    --menu-icon: #9ca3af;
    --menu-focus-bg: rgba(251,146,60,.12);
    --menu-shadow-1: 0 10px 24px rgba(0,0,0,.4);
    --menu-shadow-2: 0 2px 6px rgba(0,0,0,.3);

    --ham-fg: #1f2937;
    --ham-bg: rgba(255,255,255,.08);
    --ham-border: rgba(255,255,255,.18);
    --ham-hover: rgba(255,255,255,.14);
  }
}


.dark, [data-theme="dark"] {
  --menu-bg: #0f172a;
  --menu-fg: #e5e7eb;
  --menu-border: rgba(255,255,255,.08);
  --menu-hover: rgba(255,255,255,.06);
  --menu-icon: #9ca3af;
  --menu-focus-bg: rgba(251,146,60,.12);
  --menu-shadow-1: 0 10px 24px rgba(0,0,0,.4);
  --menu-shadow-2: 0 2px 6px rgba(0,0,0,.3);

  --ham-fg: #1f2937;
  --ham-bg: rgba(255,255,255,.08);
  --ham-border: rgba(255,255,255,.18);
  --ham-hover: rgba(255,255,255,.14);

}

/* ---------- TRIGGER BUTTON (hamburger) ---------- */
.btn-glass {
  color: var(--ham-fg) !important;
  background: var(--ham-bg) !important;
  border: 1px solid var(--ham-border) !important;
  backdrop-filter: blur(8px);
}
.btn-glass:hover { background: var(--ham-hover) !important; }

/* PrimeVue icon inside the button should inherit */
.btn-glass .p-button-icon, .btn-glass .pi { color: currentColor; }

/* ---------- MENU POPUP ---------- */
.app-menu.p-menu {
  border-radius: 12px;
  padding: 6px;
  border: 1px solid var(--menu-border);
  box-shadow: var(--menu-shadow-1), var(--menu-shadow-2);
  background: var(--menu-bg);
  color: var(--menu-fg);
}
.app-menu .p-menu-list        { padding: 4px; margin: 0; }
.app-menu .p-menuitem         { margin: 0; }
.app-menu .p-menuitem-content { padding: 0; }

.app-menu-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 10px;
  color: var(--menu-fg); text-decoration: none;
  min-width: 200px; min-height: 36px; line-height: 1.1;
  transition: background .15s ease, transform .06s ease;
}
.app-menu-item:hover  { background: var(--menu-hover); }
.app-menu-item:active { transform: translateY(1px); }

.app-menu-icon { font-size: 1rem; width: 20px; text-align: center; color: var(--menu-icon); }

.app-menu-item:focus-visible {
  outline: 2px solid #ff9800; outline-offset: 2px; background: var(--menu-focus-bg);
}

/* Make sure it's above your blurred navbar */
.p-menu { z-index: 2005; }
</style>


