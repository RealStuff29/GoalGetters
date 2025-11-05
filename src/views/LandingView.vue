<template>
    <div class="homepage-container">
        <!-- HERO SECTION -->
        <section class="hero-section" id="hero">
            <div class="hero-bg">
                <div class="bubble bubble1"></div>
                <div class="bubble bubble2"></div>
                <div class="bubble bubble3"></div>
                <div class="bubble bubble4"></div>
            </div>

            <div class="hero-content">
                <div class="logo-display">
                    <img v-bind:src="logo">
                </div>
                <h1 class="hero-title">GoalGetters</h1>
                <p class="hero-subtitle">
                    Achieve your goals together with accountability partners
                </p>

                <div class="hero-buttons">
                    <RouterLink to="/auth/login" class="no-decoration">
                        <Button label="Get Started" icon="pi pi-play" class="primary-cta" />
                    </RouterLink>
                    <RouterLink to="/auth/login" class="no-decoration">
                        <Button label="Learn More" icon="pi pi-info-circle" outlined class="secondary-cta" />
                    </RouterLink>
                </div>

                <div class="hero-community">
                    <div class="community-avatars">
                        <div class="avatar1">G</div>
                        <div class="avatar2">G</div>
                        <div class="avatar3">G</div>
                    </div>
                    <p class="community-text">Join 1000+ students achieving their goals together</p>
                </div>

                <button class="scroll-down" @click="scrollToFeatures">
                    <i class="pi pi-arrow-down"></i>
                </button>
            </div>
        </section>


        <!-- WHY CHOOSE SECTION -->
        <section class="features-section">
            <div class="container">
                <h2 class="section-title">Why Choose GoalGetters?</h2>
                <p class="section-subtitle">
                    The platform designed specifically for students who want to achieve more together
                </p>

                <div class="features-grid">
                    <Card v-for="(feature, index) in features" :key="index" class="feature-card">
                        <template #content>
                            <div class="feature-icon orange">
                                <i :class="feature.icon"></i>
                            </div>
                            <h3 class="feature-title">{{ feature.title }}</h3>
                            <p class="feature-description">{{ feature.description }}</p>
                        </template>
                    </Card>
                </div>
            </div>
        </section>

        <!-- Motivational Quote Section -->
        <section class="quote-section">
            <div class="container">
                <Card class="quote-card" @click="changeQuote">
                    <template #content>
                        <i class="pi pi-quote-right quote-icon"></i>
                        <blockquote class="quote-text">
                            "{{ motivationalQuote.text }}"
                        </blockquote>
                        <p class="quote-author">{{ motivationalQuote.author }}</p>
                        <small class="quote-hint">Click for another quote</small>
                    </template>
                </Card>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import logo from '@/assets/images/Logo-crop.png'

const scrollToFeatures = () => {
    const featuresSection = document.querySelector('.features-section')
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
}

const features = ref([
    {
        icon: 'pi pi-heart',
        title: 'Built for Students',
        description:
            'Designed with student life in mind. From exam prep to gym goals, we support your journey.',
    },
    {
        icon: 'pi pi-user',
        title: 'Verified Community',
        description:
            'Only verified students can join. Stay safe in a community of genuine, determined peers.',
    },
    {
        icon: 'pi pi-plus',
        title: 'Perfect Matches',
        description:
            'Our algorithm matches you based on goals, schedule, location, and compatibility rating.',
    },
    {
        icon: 'pi pi-shield',
        title: 'Privacy First',
        description:
            'Your data is protected with strict privacy controls and end-to-end encryption.',
    },
    {
        icon: 'pi pi-check-circle',
        title: 'Flexible Goals',
        description:
            'Adjust your goals anytime to fit your study schedule and personal pace.',
    },
    {
        icon: 'pi pi-clock',
        title: 'Real-Time Features',
        description:
            'Enjoy live chat, instant feedback, and smart recommendations tailored for you.',
    },
])

const motivationalQuote = ref({
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
})

const quotes = [
    { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
    { text: 'Dream big. Start small. Act now.', author: 'Robin Sharma' },
    { text: 'Believe you can and you’re halfway there.', author: 'Theodore Roosevelt' },
    { text: 'It always seems impossible until it’s done.', author: 'Nelson Mandela' },
]

const changeQuote = () => {
    let newQuote
    do {
        newQuote = quotes[Math.floor(Math.random() * quotes.length)]
    } while (newQuote.text === motivationalQuote.value.text)
    motivationalQuote.value = newQuote
}
</script>

<style scoped>
@keyframes dynamicLogo {
  0% {
    transform: translateY(0px) rotate(0deg) scale(1);
  }
  25% {
    transform: translateY(-15px) rotate(-3deg) scale(1.05);
  }
  50% {
    transform: translateY(-25px) rotate(0deg) scale(1.08);
  }
  75% {
    transform: translateY(-15px) rotate(3deg) scale(1.05);
  }
  100% {
    transform: translateY(0px) rotate(0deg) scale(1);
  }
}

.logo-display img {
  width: 200px;
  animation: dynamicLogo 4s ease-in-out infinite;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.15));
  transition: filter 0.3s ease;
}

.logo-display img:hover {
  animation-play-state: paused;
  filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.25));
  transform: scale(1.1);
}

/* Optional: Add a subtle glow effect */
@keyframes glow {
  0%, 100% {
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.15));
  }
  50% {
    filter: drop-shadow(0 10px 25px rgba(59, 130, 246, 0.3));
  }
}

/* Uncomment below to add the glow effect */

.logo-display img {
  animation: dynamicLogo 4s ease-in-out infinite, glow 3s ease-in-out infinite;
}

/* GENERAL */
.homepage-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #fff5e6 0%, #ffffff 50%, #fff5e6 100%);
}

/* HERO */
.hero-section {
    padding: 4rem 2rem;
    position: relative;
    overflow: hidden;
}

.welcome-heading {
    font-size: 3rem;
    font-weight: 800;
    color: #333;
}

.welcome-subtitle {
    font-size: 1.25rem;
    color: #666;
    margin-bottom: 2rem;
}

.cta-buttons {
    display: flex;
    gap: 1rem;
}

.primary-cta {
    background: linear-gradient(135deg, #ff9800, #f57c00) !important;
    border: none !important;
    border-radius: 50px !important;
    box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3) !important;
    transition: all 0.3s ease !important;
}

.primary-cta:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4) !important;
}

.secondary-cta {
    border: 2px solid #ff9800 !important;
    color: #ff9800 !important;
    border-radius: 50px !important;
    transition: all 0.3s ease !important;
}

.secondary-cta:hover {
    transform: translateY(-4px);
    background: rgba(255, 152, 0, 0.05) !important;
}

/* ---------- HERO SECTION ---------- */
.hero-section {
    position: relative;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background: radial-gradient(circle at top left, #fff5e8, #ffffff 70%);
}

/* Live Apple-style bubbles */
.hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
}

.bubble {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.6;
    animation: float 10s infinite ease-in-out alternate;
}

.bubble1 {
    width: 300px;
    height: 300px;
    background: #ffb84d;
    top: 10%;
    left: 15%;
    animation-delay: 0s;
}

.bubble2 {
    width: 400px;
    height: 400px;
    background: #ffe4b3;
    top: 40%;
    right: 10%;
    animation-delay: 2s;
}

.bubble3 {
    width: 250px;
    height: 250px;
    background: #ffc266;
    bottom: 10%;
    left: 25%;
    animation-delay: 4s;
}

.bubble4 {
    width: 350px;
    height: 350px;
    background: #fff0cc;
    bottom: 0%;
    right: 25%;
    animation-delay: 6s;
}

@keyframes float {
    0% {
        transform: translateY(0px) translateX(0px);
    }

    100% {
        transform: translateY(-40px) translateX(20px);
    }
}

/* Hero content */
.hero-content {
    text-align: center;
    position: relative;
    z-index: 2;
    padding: 2rem;
}

.hero-title {
    font-size: 5rem;
    font-weight: 900;
    color: #222;
    letter-spacing: -1px;
    margin-bottom: 1rem;
}

.hero-subtitle {
    font-size: 1.3rem;
    color: #555;
    margin-bottom: 2.5rem;
}

/* Buttons */
.hero-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 3rem;
}

.primary-cta {
    background: linear-gradient(135deg, #ff9800, #f57c00) !important;
    border: none !important;
    border-radius: 50px !important;
    padding: 0.9rem 2rem !important;
    box-shadow: 0 8px 25px rgba(255, 152, 0, 0.3) !important;
    transition: all 0.3s ease !important;
}

.primary-cta:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(255, 152, 0, 0.4) !important;
}

.secondary-cta {
    border: 2px solid #ff9800 !important;
    color: #ff9800 !important;
    border-radius: 50px !important;
    padding: 0.9rem 2rem !important;
    transition: all 0.3s ease !important;
}

.secondary-cta:hover {
    transform: translateY(-4px);
    background: rgba(255, 152, 0, 0.05) !important;
}

/* Community avatars */
.hero-community {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
}

.community-avatars {
    display: flex;
    gap: -0.5rem;
}

.avatar1 {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #ff9800, #f57c00);
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    margin-right: -10px;
    box-shadow: 0 3px 8px rgba(255, 152, 0, 0.25);
}

.avatar2 {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #ff9500a9, #f57c00);
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    margin-right: -10px;
    box-shadow: 0 3px 8px rgba(255, 152, 0, 0.25);
}

.avatar3 {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #ff950023, #f57c00);
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    margin-right: -10px;
    box-shadow: 0 3px 8px rgba(255, 152, 0, 0.25);
}

.community-text {
    color: #444;
    font-size: 0.95rem;
}

/* Down Arrow */
.scroll-down {
    background: none;
    border: none;
    color: #ff9800;
    font-size: 1.8rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.scroll-down:hover {
    transform: translateY(5px);
    color: #f57c00;
}

/* WHY CHOOSE SECTION */
.features-section {
    padding: 4rem 2rem;
    background: #fafafa;
    text-align: center;
}

.section-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #222;
    margin-bottom: 0.5rem;
}

.section-subtitle {
    color: #666;
    font-size: 1.1rem;
    margin-bottom: 3rem;
}

/* ✅ FIXED GRID: Always 3 per row on desktop */
.features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
}

@media (max-width: 992px) {
    .features-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 600px) {
    .features-grid {
        grid-template-columns: 1fr;
    }
}

/* Feature Cards */
.feature-card {
    border-radius: 1.5rem;
    background: #fff;
    box-shadow: 0 6px 20px rgba(255, 152, 0, 0.08);
    transform: translateY(0);
    transition: all 0.35s ease;
}

.feature-card:hover {
    transform: translateY(-10px) scale(1.03);
    box-shadow: 0 16px 45px rgba(255, 152, 0, 0.25);
    background: #fff8f0;
}

.feature-card .p-card-body {
    padding: 2rem;
}

/* Icons */
.feature-icon {
    width: 70px;
    height: 70px;
    border-radius: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
}

.feature-icon.orange {
    background: linear-gradient(135deg, #fff2e0, #ffe4c2);
    color: #ff9800;
    box-shadow: 0 3px 8px rgba(255, 152, 0, 0.25);
}

.feature-card:hover .feature-icon.orange {
    background: linear-gradient(135deg, #ffb84d, #ff9800);
    color: #fff;
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.35);
}

/* Titles & Text */
.feature-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 0.75rem;
}

.feature-description {
    color: #666;
    font-size: 1rem;
    line-height: 1.6;
}

/* QUOTE SECTION */
.quote-section {
    padding: 4rem 2rem;
}

.quote-card {
    background: linear-gradient(135deg, #ff9800, #f57c00);
    color: white;
    text-align: center;
    padding: 2rem;
    border-radius: 1rem;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.quote-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(255, 153, 0, 0.6);
}

.quote-icon {
    font-size: 3rem;
    opacity: 0.3;
    margin-bottom: 1rem;
}

.quote-text {
    font-size: 1.5rem;
    font-style: italic;
    margin: 1rem 0;
    line-height: 1.6;
}

.quote-author {
    font-size: 1rem;
    opacity: 0.9;
    font-weight: 600;
}

.quote-hint {
    display: block;
    margin-top: 1rem;
    opacity: 0.7;
    font-size: 0.875rem;
    font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
    .welcome-heading {
        font-size: 2rem;
    }

    .section-title {
        font-size: 2rem;
    }
}
</style>
