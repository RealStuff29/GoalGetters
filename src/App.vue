<template>
  <!-- Only render the router after we know the session status -->
  <RouterView v-if="checkedSession" />

  <!-- Optional: fallback while checking -->
  <div v-else class="d-flex justify-content-center align-items-center" style="height: 100vh;">
    <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #ff9800;"></i>
    <span class="ms-2 text-muted">Loading...</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const checkedSession = ref(false)

onMounted(async () => {
  // Wait until Supabase restores or confirms session (cached in localStorage)
  await supabase.auth.getSession()
  checkedSession.value = true
})
</script>