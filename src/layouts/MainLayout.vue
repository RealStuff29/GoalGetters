<script setup>
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router'; //RESEARCH WHY IT'S PREFERRED TO IMPORT "useRouter", instead of just doing "import router from '@/router'", like done in registerView
const {logoutUser} = useAuth();
const router = useRouter();
async function handleLogout(){
  const logoutOK = await logoutUser();
  if (logoutOK){
    router.push({name: 'login'});
  }
}
</script>

<template>
  <div>
    <nav class="navbar bg-light px-3">
      <div class="d-flex">
        <!-- INCONSISTENCIES WITH V-BIND ARE BECAUSE I ONLY REFACTORED /AUTH PATHS (TIME CRUNCH, WILL REFACTOR AFTER PRESENTATION) -->
        <router-link to="/" class="nav-link mx-3">Home</router-link>
        <!-- <router-link v-bind:to="{name: 'login'}" class="nav-link mx-3">Login</router-link> -->
        <router-link to="/crudview" class="nav-link mx-3">Crud Test</router-link>
        <!-- <router-link v-bind:to="{name: 'register'}" class="nav-link mx-3">Register Test</router-link> -->
        <router-link to="/profilesetupview" class="nav-link mx-3">Profile Setup</router-link>
        <router-link to="/matchmakingview" class="nav-link mx-3">Matchmake Now</router-link>
        <router-link to="/feedbackview" class="nav-link mx-3">Feedback</router-link>
      </div>
      <div>
        <Button label="Logout" @click="handleLogout()"/>
      </div>
    </nav>

    <!-- <div class="container mt-4 mx-5 p-0"> -->
    <div class="mx-0 p-0">
      <router-view />
    </div>
  </div>
</template>