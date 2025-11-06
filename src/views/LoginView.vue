<script setup>
import { ref, onMounted, onUnmounted } from 'vue';   // ⬅️ added lifecycle imports

import { useAuth } from '@/composables/useAuth'


const email = ref('');
const password = ref('');

import logo from '@/assets/images/Logo.png';
import login1 from '@/assets/images/login1.jpg'
import login2 from '@/assets/images/login2.jpg'
import login3 from '@/assets/images/login3.jpg'
import login4 from '@/assets/images/login4.jpg'
import router from '@/router';
import { useNotify } from '@/composables/useNotify'


const notify = useNotify('authToast')
const { loginUser, loginUserWithGoogle, error, loading } = useAuth();

const SMU_EMAIL = /^[A-Za-z0-9._%+-]+@smu\.edu\.sg$/i;

// ✨ Dynamic quote rotator (UI only)
const quotes = [
    { text: "Small progress is still progress.", author: "GoalGetters" },
    { text: "Focus on consistency, not perfection.", author: "GoalGetters" },
    { text: "Your goals are valid — chase them daily.", author: "GoalGetters" },
    { text: "Every day is a fresh start.", author: "GoalGetters" },
];
const currentQuote = ref(quotes[0]);

let quoteIndex = 0;
let quoteInterval = null;

// Background slideshow (UI only)
const backgrounds = [login1, login2, login3, login4];
const currentBackground = ref(backgrounds[0]);
let bgIndex = 0;
let bgInterval = null;

onMounted(() => {
    quoteInterval = setInterval(() => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        currentQuote.value = quotes[quoteIndex];
    }, 4000);

    // 🖼️ background rotator
    bgInterval = setInterval(() => {
        bgIndex = (bgIndex + 1) % backgrounds.length;
        currentBackground.value = backgrounds[bgIndex];
    }, 4000); // ⬅️ faster cycle (4s)
});

onUnmounted(() => {
    clearInterval(quoteInterval);
    if (bgInterval) clearInterval(bgInterval);
});


async function handleLogin() {

    if (!SMU_EMAIL.test(email.value)) {
        // alert('Please log in with your SMU email (must end with @smu.edu.sg).');
        notify.error('Please log in with your SMU email (must end with @smu.edu.sg).')
        return;
    }

    await loginUser(email.value, password.value);

    if (error.value) {
        notify.error(error.value)
        // alert(error.value);
    } else {
        router.push('/');
    }
}

async function handleGoogleLogin() {
    if (!loading.value) {
        await loginUserWithGoogle();
    }
}


</script>



<template>
    <div class="login-page">

        <Toast position="top-center" group="authToast" />

        <!-- 🧭 Left side: Login form -->
        <div class="login-left">
            <div class="login-container">
                <div class="logo-section">
                    <img :src="logo" class="login-logo" alt="GoalGetters Logo" />
                    <h1 class="app-title">Welcome to GoalGetters</h1>
                    <p class="quote-text fade">{{ currentQuote.text }}</p>
                </div>

                <div class="form-section">
                    <form @submit.prevent="handleLogin" class="login-form">
                        <label>Email</label>
                        <InputText type="email" v-model="email" placeholder="you@smu.edu.sg" class="w-full" />

                        <label>Password</label>
                        <InputText type="password" v-model="password" placeholder="••••••••" class="w-full" />

                        <div class="register-text">
                            New to GoalGetters?
                            <RouterLink :to="{ name: 'register' }" class="highlight-link">Sign up</RouterLink>
                        </div>

                        <Button type="submit" label="Log In" class="w-full login-btn" />

                        <div class="divider">
                            <hr /><span>or</span>
                            <hr />
                        </div>

                        <button class="google-btn" type="button" @click="handleGoogleLogin" :disabled="loading">
                            <i class="pi pi-google"></i>
                            Continue with Google
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <!-- 🖼️ Right side: Background slideshow -->
        <div class="login-right">
            <transition name="bgfade" mode="out-in">
                <div class="bg-image" :key="currentBackground"
                    :style="{ backgroundImage: `url(${currentBackground})` }"></div>
            </transition>
            <div class="overlay"></div>
        </div>
    </div>
</template>


<style scoped>
.login-page {
    display: flex;
    height: 100vh;
    overflow: hidden;
}

.login-left {
    flex: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #ffffff 0%, #fff9f2 100%);
    /* ⬅️ subtle warm tone, matches GoalGetters orange */
    box-shadow: 10px 0 40px rgba(0, 0, 0, 0.05);
    z-index: 2;
}

/* Right: now image area */
.login-right {
    flex: 3;
    position: relative;
    overflow: hidden;
}


.bg-image {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    transition: opacity 0.6s ease-in-out;
    z-index: 0;
}

.overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    z-index: 1;
}

.login-container {
    max-width: 380px;
    width: 100%;
    padding: 3rem 2rem;
    text-align: center;
}

.bgfade-enter-active,
.bgfade-leave-active {
    transition: opacity 0.6s ease-in-out;
}

.bgfade-enter-from,
.bgfade-leave-to {
    opacity: 0;
}


.login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: white;
    border-radius: 1.5rem;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
    padding: 3rem 2rem;
    max-width: 420px;
    width: 100%;
    text-align: center;
    animation: slideIn 0.6s ease-out;
}

.logo-section {
    margin-bottom: 2rem;
}

.login-logo {
    width: 120px;
    margin-bottom: 1rem;
    animation: bounce 3s ease-in-out infinite;
}

.app-title {
    font-weight: 700;
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 0.5rem;
}

.quote-text {
    font-style: italic;
    color: #444;
    /* darker text so it’s visible */
    font-size: 1rem;
    margin: 0.75rem 0 0.25rem;
    min-height: 1.5rem;
    opacity: 1;
    transition: opacity 0.6s ease;
}

.fade {
    transition: opacity 0.8s ease;
}

.login-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.login-btn {
    background: linear-gradient(135deg, #ff9800, #f57c00) !important;
    border: none !important;
    color: white !important;
    font-weight: 600 !important;
    padding: 0.75rem !important;
    border-radius: 10px !important;
    transition: all 0.25s ease !important;
}

.login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 152, 0, 0.35);
}

.google-btn {
    width: 100%;
    border: 1px solid #ddd;
    background: white;
    border-radius: 10px;
    padding: 0.6rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    transition: background 0.2s ease;
}

.google-btn:hover {
    background: #f8f8f8;
}

.register-text {
    font-size: 0.9rem;
    color: #666;
}

.highlight-link {
    color: #ff9800;
    font-weight: 600;
    text-decoration: none;
}

.highlight-link:hover {
    text-decoration: underline;
}

.divider {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.75rem;
    margin: 0.75rem 0;
    color: #aaa;
    font-size: 0.85rem;
}

.divider hr {
    border: none;
    border-top: 1px solid #e5e5e5;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideIn {
    from {
        transform: translateY(24px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-8px);
    }
}

.quote-text.fade {
    animation: fadeQuote 4s ease-in-out infinite;
}

@keyframes fadeQuote {

    0%,
    100% {
        opacity: 0;
    }

    10%,
    90% {
        opacity: 1;
    }
}

@media (max-width: 480px) {
    .login-container {
        padding: 2rem 1.25rem;
        border-radius: 1rem;
    }

    .login-logo {
        width: 96px;
    }
}
</style>
