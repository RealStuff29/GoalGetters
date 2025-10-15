<script setup>
import { generateName } from '@/services/nameService'
import { ref, computed } from 'vue'

const username = ref(generateName())
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

function shuffleAvatar() {
  seed.value = makeSeed()
}


function makeSeed() {
  return 'u-' + Math.random().toString(36).slice(2, 7)
}

function randomiseUsername() { 
    username.value = generateName() 
}

</script>


<template>
  <section class="container" style="max-width: 720px; padding: 32px 16px;">
    <h1 class="mb-3">Profile Setup</h1>
    
    <!-- Avatar -->
    <div class="text-center mb-3">
        <img :src="avatarUrl" alt="avatar" style="width: 200px; height: 200px; border-radius: 100px; border:1px solid #e5e7eb; object-fit: cover;" />
        <p class="text-muted mt-4">Select a gender and feel free to shuffle until you like the avatar</p>
        <small class="text-muted d-block mb-2 visually-hidden" hidden="true">
            Avatar Link → <code>{{ avatarUrl }}</code>
        </small>
        <div style="margin-top:12px; display:flex; gap:8px; justify-content:center;">

        <Button @click="shuffleAvatar()" label="Shuffle" />
      </div>
      
    </div>

    <!-- Gender -->
    <div class="my-3">
      <label class="label mb-3">Gender</label>
      <div class="radio-row">
        <RadioButton v-model="gender" inputId="boy" value="boy" size="small"/>
        <label for="boy">Boy</label>
        <RadioButton v-model="gender" inputId="girl" value="girl" size="small" />
        <label for="girl" >Girl</label>
      </div>
    </div>

    <!-- Username -->
    <div class="mt-5 username-section">
        <label for="username" class="label mb-1">Username</label>
        <div id="username" class="username" style="width: 60%;" aria-live="polite">
            {{ username }}
        </div>

        <small class="text-muted">Click on “Randomise” to generate your favourite username</small>

        <Button label="Randomise" @click="randomiseUsername" />
    </div>
  </section>
</template>



<style scoped>
.label { font-weight: 600; }
.username-section{display: flex; flex-direction: column; align-items: flex-start; gap: 8px;}
.username{
  padding:10px 12px;
  border:1px solid #e5e7eb;
  border-radius:8px;
  background:#fff;
  min-height:42px;
  display:flex;
  align-items:center;
  font-weight:600;
}
.radio-row{display:flex; gap:16px; flex-wrap:wrap;}
.text-muted{color:#6b7280;}
</style>
