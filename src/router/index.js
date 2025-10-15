
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import CrudView from '../views/CrudView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfileSetupView from '../views/ProfileSetupView.vue'
import MatchMakingView from '../views/MatchMakingView.vue'

const MainLayout = () => import('@/layouts/MainLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'crudview', name: 'crud', component: CrudView },
        { path: 'profilesetupview', name: 'profile-setup', component: ProfileSetupView },
        { path: 'matchmakingview', name: 'matchmaking', component: MatchMakingView },
      ],
    },
    {
      path: '/',
      component: AuthLayout,
      children: [
        { path: 'login', name: 'login', component: LoginView, meta: { public: true } },
        { path: 'register', name: 'register', component: RegisterView, meta: { public: true } },
      ],
    },
    // { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound }, COMMENTED OUT FOR NOW UNTIL VIEW IS MADE


  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
