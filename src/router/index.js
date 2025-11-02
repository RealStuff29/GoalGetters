// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

// Eager-loaded views
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import CrudView from '../views/CrudView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfileSetupView from '../views/ProfileSetupView.vue'
import ProfileSettingsView from '../views/ProfileSettingsView.vue'
import FeedbackView from '../views/FeedbackView.vue'


// Layouts 
const MainLayout = () => import('@/layouts/MainLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')

// Match flow
const MatchLanding = () => import('@/views/MatchLandingView.vue')
const MatchDecision = () => import('@/views/MatchDecisionView.vue')
const MatchChat = () => import('@/views/MatchChatView.vue')
const MatchReview = () => import('@/views/MatchReviewView.vue')

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
        { path: 'profilesettingsview', name: 'profilesettings', component: ProfileSettingsView, meta: { requiresAuth: true } },
        { path: 'feedbackview', name: 'feedback', component: FeedbackView, meta: { requiresAuth: true } },

        // New 3-page matchmaking flow 
        { path: 'matchlandingview', name: 'matchlanding', component: MatchLanding, meta: { requiresAuth: true } },
        //Added chatid and id
        { path: 'matchdecisionview/:id?', name: 'matchdecision', component: MatchDecision, meta: { requiresAuth: true } },
        { path: 'matchchatview/:chatId?', name: 'matchchat', component: MatchChat, meta: { requiresAuth: true } },
        { path: 'matchreviewview/:sessid?', name: 'matchreview', component: MatchReview, meta: { requiresAuth: true } },
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
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/views/AuthCallbackView.vue'), //keep this as lazy-load because this is a rarely visited page (Will change register if time permits)
    },


    // Uncomment once you have a NotFound view
    // { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

// Auth guards, documentation/guide at https://router.vuejs.org/guide/advanced/navigation-guards.html
router.beforeEach(async (to) => {
  const sessionResponse = await supabase.auth.getSession(); //Getting session from supabase
  const session = sessionResponse.data.session;

  //booting user if not logged in and trying to route to a route that needs login
  if (to.meta && to.meta.requiresAuth && !session) { //Checking meta, and if the meta is "requiresAuth", and if there is no session
    return { name: 'login', query: { redirect: to.fullPath } } //the boot
  }

  if (to.meta && to.meta.requiresGuest && session) {
    return { name: 'home' }
  }

  return true;
})

export default router
//PLEASE DO NOT DELETE THE CODE BELOW FOR NOW. Left inside in case anyone has issues with the above reversion into earlier version of code

// router.beforeEach(async (to) => {
//   const { data: { session } } = await supabase.auth.getSession()

//   if (to.meta?.requiresAuth && !session) {
//     return { name: 'login', query: { redirect: to.fullPath } }
//   }
//   if (to.meta?.requiresGuest && session) {
//     return { name: 'home' }
//   }
//   return true
// })


