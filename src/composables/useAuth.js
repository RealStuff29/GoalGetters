import { supabase } from '@/lib/supabase.js';
import { ref, onMounted } from 'vue';

export function useAuth() {
    const user = ref(null);
    const error = ref(null);
    const loading = ref(false);


    async function registerUser(email, password) {
        loading.value = true;
        error.value = null;

        const { data, error: err } = await supabase.auth.signUp( //error:err is destructuring Supabase's expected and given "error" as "err", because we already have an "error" we are using and do not want to overwrite (I think)
            {
                email: email,
                password: password,
            })

        loading.value = false;

        if (err) {
            error.value = err.message;
            return null;
        }

        user.value = data.user;
        return data.user;
    }

    async function loginUser(email, password) {
        loading.value = true;
        error.value = null;

        const { data, error: err } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        loading.value = false;

        if (err) {
            error.value = err.message;
            return null;
        }

        user.value = data.user;
        return data.user;
    }

    async function logoutUser() {
        loading.value = true;
        error.value = null;

        const { error: err } = await supabase.auth.signOut();

        loading.value = false;

        if (err) {
            error.value = err.message;
            return null;
        }

        user.value = null;
        return true;
    }

    async function loginUserWithGoogle() {
        loading.value = true;
        error.value = null;

        const {error : err} = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`

            }
        
        });

        loading.value = false;

        if(err){
            error.value = err.message;
            return null;
        }
        return true;
            
    }

    // I am just following documentation for this code chunk, check here if you want to see: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
    // Please ignore the comments here, I will remove them for final submission. I keep forgetting what is going on here
    supabase.auth.onAuthStateChange((_event, session) => {
        if (session && session.user){ //If session exists, AND session has a "user" property, then do whatever
            user.value = session.user;
        } else {
            user.value = null;
        }
    });
    
    //Following chunk is for checking if there is a logged in user when refreshing the page, so we don't boot the guy after a refresh
    async function loadUser() {
        const {data, error:err} = await supabase.auth.getUser();
        if (err){
            // console.error('Error getting user:' + err.message);
            console.log('If you are seeing this, you are logged out');
            return;
        }

        if (data && data.user){
            user.value = data.user;
        } else {
            user.value = null;
        }
    }

    onMounted(loadUser);




    return { user, error, loading, registerUser, loginUser, logoutUser, loginUserWithGoogle };
}

