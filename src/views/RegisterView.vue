<script setup>
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth'


const email = ref('');
const password = ref('');

import logo from '@/assets/images/Logo.png';
import locked from '@/assets/images/LOCKED.jpg';
import router from '@/router';


const { registerUser, error, loading } = useAuth();

const SMU_EMAIL = /^[A-Za-z0-9._%+-]+@smu\.edu\.sg$/i;


// OLD HANDLE REGISTER (PRE-REGEX)
// async function handleRegister() {
//     await registerUser(email.value, password.value);

//     if (error.value) {
//         alert(error.value);
//     } else {
//         alert('Account created!');

//         router.push('/profilesetupview');
//     }
// }

async function handleRegister() {
    if (!SMU_EMAIL.test(email.value)) {
        alert('Please use your SMU email (must end with @smu.edu.sg).');
        return;
    }

    await registerUser(email.value, password.value);

    if (error.value) {
        alert(error.value);
        return;
    }

    router.push('/profilesetupview');
}


</script>

<template>
    <div class="container-fluid vh-100">
        <div class="row h-100">
            <div class="col-4 d-flex flex-column align-items-center justify-content-center shadow-lg m-0 p-0 com-md-12">

                <img v-bind:src="logo" class="img-fluid w-50">

                <div class="mt-3 w-75">
                    <form @submit.prevent="handleRegister()">

                        <div class="mb-3">
                            <label for="email">Email</label>
                            <!-- <InputText type="email" v-model="email" fluid /> -->
                            <InputText type="email" v-model="email" fluid pattern="^[A-Za-z0-9._%+-]+@smu\.edu\.sg$"
                                @invalid="e => e.target.setCustomValidity('Please use your SMU email (must end with @smu.edu.sg).')"
                                @input="e => e.target.setCustomValidity('')" />
                            <div class="form-text">Use your SMU email (must end with @smu.edu.sg).</div>
                        </div>

                        <div class="mb-3">
                            <label for="password">Password</label>
                            <InputText type="password" v-model="password" fluid />
                            <div class="form-text">
                                Already have an account?
                                <RouterLink v-bind:to="{ name: 'login' }" class="fw-medium text-decoration-none">
                                    Log in!
                                </RouterLink>
                            </div>
                        </div>
                        <Button type="submit" label="Submit" />
                    </form>
                </div>



            </div>
            <div class="col-8 bg-dark p-0 h-100 overflow-hidden position-relative">
                <img :src="locked" class="d-block w-100 vh-100 object-fit-cover" alt="Lock image" />
            </div>
        </div>
    </div>
</template>