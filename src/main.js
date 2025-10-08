// import './assets/main.css' I TOOK THIS OUT TEMPORARILY TO TRY AND FIX ISSUES WITH VIEWS LOADING ONLY IN THE CENTER OF SCREEN

//vue stuff
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

//booty strap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

//Supabase stuff
import { supabase } from '@/lib/supabase'
console.log('Supabase connected:', !!supabase)


createApp(App).use(router).mount('#app')

