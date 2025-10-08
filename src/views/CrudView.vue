

<!-- THIS IS CHATGPT JUST TO TEST CRUD AND DATABASE CONNECTION. IDK WHAT'S GOING ON YET!! -->

<script setup>
import { ref, onMounted } from 'vue'
import { addDummyUser, getAllUsers } from '@/services/userService'

const users = ref([])
const msg = ref('')
const loading = ref(false)

async function fetchUsers() {
  loading.value = true
  msg.value = ''
  try {
    users.value = await getAllUsers()
  } catch (err) {
    msg.value = err.message
  } finally {
    loading.value = false
  }
}

async function handleAdd() {
  msg.value = ''
  try {
    const newUser = await addDummyUser()
    users.value.unshift(newUser) // instantly show at top
    msg.value = `Added: ${newUser.username}`
  } catch (err) {
    msg.value = err.message
  }
}

onMounted(fetchUsers)
</script>

<template>
  <main class="container mt-3">
    <h1 class="mb-3">Users (Public Demo)</h1>

    <div class="d-flex gap-2 mb-3">
      <button class="btn btn-primary" @click="handleAdd" :disabled="loading">
        Add Dummy User
      </button>
      <button class="btn btn-outline-secondary" @click="fetchUsers" :disabled="loading">
        Refresh
      </button>
    </div>

    <p v-if="loading">Loading...</p>
    <p class="text-muted">{{ msg }}</p>

    <ul class="list-group mt-3">
      <li
        v-for="u in users"
        :key="u.id"
        class="list-group-item d-flex align-items-center justify-content-between"
      >
        <div>
          <strong>{{ u.username }}</strong>
          <div class="small text-muted">{{ u.email }}</div>
        </div>
        <img :src="u.profile_photo" alt="photo" width="40" height="40" class="rounded-circle" />
      </li>
    </ul>
  </main>
</template>
