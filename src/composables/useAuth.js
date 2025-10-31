// src/composables/useAuth.js (your file)
import { supabase } from '@/lib/supabase.js'
import { ref, onMounted } from 'vue'

export function useAuth() {
  const user = ref(null)
  const error = ref(null)
  const loading = ref(false)

  // SIGN UP
  async function registerUser(email, password) {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
    })

    loading.value = false

    if (err) {
      error.value = err.message
      return null
    }

    // ⚠️ IMPORTANT:
    // If your Supabase project requires email confirmation,
    // signUp will NOT give you an active session yet.
    // So we do NOT do: user.value = data.user
    // Just return it so the UI can show "check your email".
    return data.user
  }

  // LOGIN (email/password)
  async function loginUser(email, password) {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    loading.value = false

    if (err) {
      error.value = err.message
      return null
    }

    user.value = data.user
    return data.user
  }

  // LOGOUT
  async function logoutUser() {
    loading.value = true
    error.value = null

    const { error: err } = await supabase.auth.signOut()

    loading.value = false

    if (err) {
      error.value = err.message
      return null
    }

    user.value = null
    return true
  }

  // LOGIN WITH GOOGLE
  async function loginUserWithGoogle() {
    loading.value = true
    error.value = null

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // make sure this URL is added in Supabase Auth → Redirect URLs
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    loading.value = false

    if (err) {
      error.value = err.message
      return null
    }

    // after redirect, onAuthStateChange will fire and set the user
    return true
  }

  // listen to auth changes (token refresh, other tabs, OAuth redirect, etc.)
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session && session.user) {
      user.value = session.user
    } else {
      user.value = null
    }
  })

  // restore user on refresh
  async function loadUser() {
    const { data, error: err } = await supabase.auth.getUser()

    if (err) {
      // no session → make sure we clear it
      console.log('If you are seeing this, you are logged out')
      user.value = null
      return
    }

    if (data && data.user) {
      user.value = data.user
    } else {
      user.value = null
    }
  }

  onMounted(loadUser)

  return {
    user,
    error,
    loading,
    registerUser,
    loginUser,
    logoutUser,
    loginUserWithGoogle,
  }
}
