
import { createRouter, createWebHistory } from 'vue-router';
import { supabase } from '@/lib/supabase';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import CrudView from '../views/CrudView.vue';
import RegisterView from '../views/RegisterView.vue';
import ProfileSetupView from '../views/ProfileSetupView.vue';
import MatchMakingView from '../views/MatchMakingView.vue';
import FeedbackView from '../views/FeedbackView.vue';

const MainLayout = () => import('@/layouts/MainLayout.vue');
const AuthLayout = () => import('@/layouts/AuthLayout.vue');


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'home', component: HomeView, meta: {requiresAuth: true} },
        { path: 'crudview', name: 'crud', component: CrudView, meta: {requiresAuth: true} },
        { path: 'profilesetupview', name: 'profilesetup', component: ProfileSetupView, meta: {requiresAuth: true} },
        { path: 'matchmakingview', name: 'matchmaking', component: MatchMakingView, meta: {requiresAuth: true} },
        { path: 'feedbackview', name: 'feedback', component: FeedbackView, meta: {requiresAuth: true} },
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
    // { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound }, COMMENTED OUT FOR NOW UNTIL VIEW IS MADE


  ],
  scrollBehavior() {
    return { top: 0 }
  },
})


//Barely understand what's going on next, shooting in the dark with stuff from https://router.vuejs.org/guide/advanced/navigation-guards.html and GPT. Please refactor if you see it's glaringly bad
router.beforeEach(async (to) => {
  const sessionResponse = await supabase.auth.getSession(); //Getting session from supabase
  const session = sessionResponse.data.session; 

  //booting user if not logged in and trying to route to a route that needs login
  if (to.meta && to.meta.requiresAuth && !session){ //Checking meta, and if the meta is "requiresAuth", and if there is no session
    return {name: 'login', query: { redirect: to.fullPath }} //the boot
  }

  //idek tbh, I think this is to boot a logged in user from a non-logged in screen?
  if (to.meta && to.meta.requiresGuest && session){
    return {name: 'home'}
  }

  return true;
})



export default router
