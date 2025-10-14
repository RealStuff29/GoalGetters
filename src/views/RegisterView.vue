<script setup>
import {ref} from 'vue';
import {useAuth} from '@/composables/useAuth'

//TEST FOR NAME GEN
// import { generateName } from '@/services/nameService';
// const name = generateName();
// =========

const email = ref('');
const password = ref('');

const {registerUser, error, loading} = useAuth();

async function handleRegister(){

    //ADD LOGIC TO CHECK FOR EMPTY STUFF LATER

    //ALSO, MAKE USE OF "loading" TO TELL THE USER THEIR REQUEST IS LOADING!

    await registerUser(email.value, password.value);

    if (error.value) {
        alert(error.value);
    } else{
        alert('Account created!');

        //LINK to QL VIEW
    }
}
</script>

<template>
    <p>{{ name }}</p>
    <div class="container py-1">
        <h1 class="text-primary">Register test</h1>
        <h3>Create account</h3>
        <form @submit.prevent="handleRegister()">
            <div class="mb-3">
                <label class="form-label">Email</label>
                <input v-model="email" type="email" class="form-control" required></input>
            </div>
            <div class="mb-3">
                <label class="form-label">Password</label>
                <input v-model="password" type="password" class="form-control" required></input>
            </div>
            <!-- <button class="btn btn-primary">Sign up</button> -->
             <Button type="submit" label="Submit" />
        </form>
    </div>
</template>