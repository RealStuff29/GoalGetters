<script setup>
import { ref, computed } from 'vue'

const seed = ref(makeSeed())
const gender = ref('') // 'boy', 'girl', ''(public)
const saving = ref(false)

const base = 'https://avatar.iran.liara.run/public'
const avatarUrl = computed(() => {
  const q = `?username=${encodeURIComponent(seed.value)}`
  if (gender.value === 'boy')  return `${base}/boy${q}`
  if (gender.value === 'girl') return `${base}/girl${q}`
  return `${base}${q}`
})


function shuffle() {
  seed.value = makeSeed()
}


function makeSeed() {
  return 'u-' + Math.random().toString(36).slice(2, 7)
}
</script>


<template>
  <section class="container" style="max-width: 720px; padding: 32px 16px;">
    <h1 class="mb-3">Profile Setup</h1>
    <p class="text-muted mb-4">Select a gender and feel free to shuffle until you like the avatar</p>

    <!-- Gender -->
    <div class="mb-3">
      <label class="label mb-3">Gender</label>
      <div class="radio-row">
        <RadioButton v-model="gender" inputId="boy" value="boy" size="small"/>
        <label for="boy">Boy</label>
        <RadioButton v-model="gender" inputId="girl" value="girl" size="small" />
        <label for="girl" >Girl</label>
      </div>
    </div>

    <!-- Avatar -->
    <div class="text-center mb-3">
      <img :src="avatarUrl" alt="avatar"
           style="width: 200px; height: 200px; border-radius: 100px; border:1px solid #e5e7eb; object-fit: cover;" />
      <div style="margin-top:12px; display:flex; gap:8px; justify-content:center;">
        <Button @click="shuffle()" label="Shuffle" />
      </div>
      <small class="text-muted d-block mt-2">
        Link → <code>{{ avatarUrl }}</code>
      </small>
    </div>

  </section>
</template>



<style scoped>
.radio-row{display:flex; gap:16px; flex-wrap:wrap;}
.text-muted{color:#6b7280;}
</style>
