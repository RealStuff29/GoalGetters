<template>
  <div>
    <nav class="navbar bg-light px-3">
      <div class="d-flex">
        <router-link to="/" class="nav-link mx-3">Home</router-link>
        <router-link to="/login" class="nav-link mx-3">Login</router-link>
        <router-link to="/crudview" class="nav-link mx-3">Crud Test</router-link>
        <router-link to="/registerview" class="nav-link mx-3">Register Test</router-link>
        <router-link to="/profilesetupview" class="nav-link mx-3">Profile Setup</router-link>
        <router-link to="/matchmakingview" class="nav-link mx-3">Matchmake Now</router-link>
      </div>
    </nav>

    <div class="container mt-4 mx-5 p-0">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>
