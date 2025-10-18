// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

// Eager-loaded views
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import CrudView from '../views/CrudView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfileSetupView from '../views/ProfileSetupView.vue'
import FeedbackView from '../views/FeedbackView.vue'

// Layouts 
const MainLayout = () => import('@/layouts/MainLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')

// Match flow
const MatchLanding = () => import('@/views/MatchLandingView.vue')
const MatchDecision = () => import('@/views/MatchDecisionView.vue')
const MatchChat = () => import('@/views/MatchChatView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'home', component: HomeView, meta: { requiresAuth: true } },
        { path: 'crudview', name: 'crud', component: CrudView, meta: { requiresAuth: true } },
        { path: 'profilesetupview', name: 'profilesetup', component: ProfileSetupView, meta: { requiresAuth: true } },
        { path: 'feedbackview', name: 'feedback', component: FeedbackView, meta: { requiresAuth: true } },

        // New 3-page matchmaking flow
        { path: 'match', name: 'match-landing', component: MatchLanding, meta: { requiresAuth: true } },
        { path: 'match/decision', name: 'match-decision', component: MatchDecision, meta: { requiresAuth: true } },
        { path: 'match/chat', name: 'match-chat', component: MatchChat, meta: { requiresAuth: true } },
        { path: 'matchmakingview', redirect: { name: 'match-landing' } }, //legacy
      ],
    },
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        { path: 'login', name: 'login', component: LoginView, meta: { requiresGuest: true } },
        { path: 'register', name: 'register', component: RegisterView, meta: { requiresGuest: true } },
      ],
    },
    // Uncomment once you have a NotFound view
    // { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

// Auth guards
router.beforeEach(async (to) => {
  const { data: { session } } = await supabase.auth.getSession()

  if (to.meta?.requiresAuth && !session) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta?.requiresGuest && session) {
    return { name: 'home' }
  }
  return true
})

export default router
