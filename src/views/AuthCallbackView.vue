<!-- THIS IS FILE IS CURRENTLY GPT GENERATED FOR TESTING FUNCTIONALITY, DO NOT REFERENCE -->

<script setup>
import { supabase } from '@/lib/supabase'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth';

const { checkProfileComplete } = useAuth();
const router = useRouter()

  // Run immediately when this page loads
  ; (async () => {
    // Exchange the OAuth code in the URL for a Supabase session
    const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)

    if (error) {
      console.error('OAuth exchange failed:', error.message)
      router.replace({ name: 'login', query: { err: 'oauth-failed' } })
      return

    }

    // If successful, Supabase stores the session automatically.
    // Your router guard will then detect the session and allow access.

    // Old method
    // router.replace({ name: 'home' })

    //New method with checking registration
    // if (await checkProfileComplete()) {
    //   router.replace({ name: 'home' });
    // } else {
    //   router.replace({ name: 'profilesetup' });
    // }

  })()
</script>

<template>
  <div class="container p-4 text-center">
    <h5>Signing you in…</h5>
    <p>Please wait a moment while we complete your login.</p>
  </div>
</template>
