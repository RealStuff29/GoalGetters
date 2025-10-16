//Wait I just put this here in case the layout stuff is bricked, I know we should make a branch but submission tmr!!!

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import CrudView from '../views/CrudView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfileSetupView from '../views/ProfileSetupView.vue'
import MatchMakingView from '../views/MatchMakingView.vue'
import FeedbackView from '../views/FeedbackView.vue'


const routes = [
  { path: '/', component: HomeView },
  { path: '/login', component: LoginView },
  { path: '/crudview', component: CrudView },
  { path: '/registerview', component: RegisterView },
  { path: '/profilesetupview', component: ProfileSetupView },
  { path: '/matchmakingview', component: MatchMakingView},
  { path: 'feedback', name: 'feedback', component: FeedbackView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
