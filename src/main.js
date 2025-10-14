// import './assets/main.css' I TOOK THIS OUT TEMPORARILY TO TRY AND FIX ISSUES WITH VIEWS LOADING ONLY IN THE CENTER OF SCREEN

//vue stuff
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

//bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

//Supabase stuff
import { supabase } from '@/lib/supabase';
console.log('Supabase connected:', !!supabase);

//Primevue stuff
import PrimeVue from 'primevue/config';
// import Aura from '@primeuix/themes/aura'; //https://primevue.org/theming/styled
import Lara from '@primeuix/themes/lara'; //https://primevue.org/theming/styled



//I'm not sure what to call this part, I am just following PrimeVue's guide: https://primevue.org/vite

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
    theme: {
        // preset:Aura
        preset:Lara
    }
})

//Importing PrimeVue components we want to use
import Button from "primevue/button"
import RadioButton from 'primevue/radiobutton'
app.component('Button', Button);
app.component('RadioButton', RadioButton);



app.mount('#app');

