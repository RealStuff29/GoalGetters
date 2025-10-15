<script setup>
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth'


const email = ref('');
const password = ref('');

import logo from '@/assets/images/Logo.png';


const { registerUser, error, loading } = useAuth();

async function handleRegister() {

    //ADD LOGIC TO CHECK FOR EMPTY STUFF LATER

    //ALSO, MAKE USE OF "loading" TO TELL THE USER THEIR REQUEST IS LOADING!

    await registerUser(email.value, password.value);

    if (error.value) {
        alert(error.value);
    } else {
        alert('Account created!');

        //LINK to QL VIEW
    }
}
</script>

<template>
    <div class="container-fluid vh-100">
        <div class="row h-100">
            <div class="col-4 d-flex flex-column align-items-center justify-content-center shadow-lg m-0 p-0 com-md-12">
                <!-- 
                    <form @submit.prevent="handleRegister()">
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input v-model="email" type="email" class="form-control" required></input>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input v-model="password" type="password" class="form-control" required></input>
                        </div>
                        <Button type="submit" label="Submit" />
                    </form> -->

                <img v-bind:src="logo" class="img-fluid w-50">

                <form @submit.prevent="handleRegister()">

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
            <div class="col-8 bg-dark">
            </div>
        </div>
    </div>
</template>