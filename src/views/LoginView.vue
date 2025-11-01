<script setup>
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth'


const email = ref('');
const password = ref('');

import logo from '@/assets/images/Logo.png';
import locked from '@/assets/images/LOCKED.jpg';
import router from '@/router';


const { loginUser, loginUserWithGoogle, error, loading } = useAuth();

const SMU_EMAIL = /^[A-Za-z0-9._%+-]+@smu\.edu\.sg$/i;


async function handleLogin() {

    if (!SMU_EMAIL.test(email.value)) {
        alert('Please log in with your SMU email (must end with @smu.edu.sg).');
        return;
    }

    await loginUser(email.value, password.value);

    if (error.value) {
        alert(error.value);
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
    <div class="container-fluid vh-100 p-0">
        <div class="row h-100 g-0">
            <div class="col-4 d-flex flex-column align-items-center justify-content-center shadow-lg m-0 p-0 com-md-12">

                <img v-bind:src="logo" class="img-fluid w-50">

                <div class="mt-3 w-75">
                    <form @submit.prevent="handleLogin()">

                        <div class="mb-3">
                            <label for="email">Email</label>
                            <InputText type="email" v-model="email" fluid pattern="^[A-Za-z0-9._%+-]+@smu\.edu\.sg$"
                                @invalid="e => e.target.setCustomValidity('Please use your SMU email (must end with @smu.edu.sg).')"
                                @input="e => e.target.setCustomValidity('')" />
                        </div>

                        <div class="mb-3">
                            <label for="password">Password</label>
                            <InputText type="password" v-model="password" fluid />
                            <div class="form-text">
                                New to GoalGetters?
                                <RouterLink v-bind:to="{ name: 'register' }" class="fw-medium text-decoration-none">
                                    Sign up!
                                </RouterLink>
                            </div>
                        </div>
                        <Button type="submit" label="Submit" />
                    </form>


                    <hr class="my-3" />
                    <button class="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center gap-2"
                        type="button" @click="handleGoogleLogin" v-bind:disabled="loading">
                        <i class="pi pi-google"></i>
                        Continue with Google
                    </button>
                </div>

            </div>
            <div class="col-8 bg-dark p-0 h-100 overflow-hidden position-relative">
                <img :src="locked" class="d-block w-100 vh-100 object-fit-cover" alt="Lock image" />
            </div>
        </div>
    </div>
</template>