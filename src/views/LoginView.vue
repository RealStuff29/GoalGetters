<script setup>
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth'


const email = ref('');
const password = ref('');

import logo from '@/assets/images/Logo.png';
import locked from '@/assets/images/LOCKED.jpg';
import router from '@/router';


const { loginUser, error, loading } = useAuth();

async function handleLogin() {

    await loginUser(email.value, password.value);

    if (error.value) {
        alert(error.value);
    } else {
        router.push('/');
    }
}
</script>

<template>
    <div class="container-fluid vh-100 p-0">
        <div class="row h-100 g-0">
            <div class="col-4 d-flex flex-column align-items-center justify-content-center shadow-lg m-0 p-0 com-md-12">

                <img v-bind:src="logo" class="img-fluid w-50">

                <form @submit.prevent="handleLogin()">

                    <div class="mb-3">
                        <label for="email">Email</label>
                        <InputText type="email" v-model="email" fluid />
                    </div>

                    <div class="mb-3">
                        <label for="password">Password</label>
                        <InputText type="password" v-model="password" fluid />
                    </div>
                    <Button type="submit" label="Submit" />

                </form>

            </div>
            <div class="col-8 bg-dark p-0 h-100 overflow-hidden position-relative">
                <img :src="locked" class="d-block w-100 vh-100 object-fit-cover" alt="Lock image" />
            </div>
        </div>
    </div>
</template>

<!-- <style scoped>
</style> -->