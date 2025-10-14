import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import CrudView from '../views/CrudView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfileSetupView from '../views/ProfileSetupView.vue'


const routes = [
  { path: '/', component: HomeView },
  { path: '/login', component: LoginView },
  { path: '/crudview', component: CrudView },
  { path: '/registerview', component: RegisterView },
  { path: '/profilesetupview', component: ProfileSetupView }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
