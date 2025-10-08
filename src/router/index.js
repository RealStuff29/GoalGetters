import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import CrudView from '../views/CrudView.vue'


const routes = [
  { path: '/', component: HomeView },
  { path: '/login', component: LoginView },
  { path: '/crudview', component: CrudView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
