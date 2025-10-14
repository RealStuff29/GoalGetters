import { supabase } from '@/lib/supabase.js';
import { ref } from 'vue';

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




    return {user, error, loading, registerUser};
}

