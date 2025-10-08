<template>
  <div>
    <nav class="navbar bg-light px-3">
      <div class="d-flex">
      <router-link to="/" class="nav-link mx-3">Home</router-link>
      <router-link to="/login" class="nav-link mx-3">Login</router-link>
      <router-link to="/crudview" class="nav-link mx-3">Crud Test</router-link>

      </div>
    </nav>

    <div class="container mt-4">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>
