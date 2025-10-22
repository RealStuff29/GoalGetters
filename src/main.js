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
import 'primeicons/primeicons.css' 
// import Aura from '@primeuix/themes/aura'; //https://primevue.org/theming/styled
import Lara from '@primeuix/themes/lara'; //https://primevue.org/theming/styled
import InputGroup from 'primevue/inputgroup';




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
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Divider from 'primevue/divider'
import Avatar from 'primevue/avatar'
import ProgressBar from 'primevue/progressbar'
import ProgressSpinner from 'primevue/progressspinner'
import RadioButton from 'primevue/radiobutton'
app.component('Button', Button);
app.component('RadioButton', RadioButton);
app.component('Card', Card);
app.component('Tag', Tag);
app.component('InputText', InputText);
app.component('Divider', Divider);
app.component('Avatar', Avatar);
app.component('ProgressBar', ProgressBar);
app.component('ProgressSpinner', ProgressSpinner);
app.component('Carousel', Carousel);
app.component('Message', Message);
app.component('Slider', Slider);
app.component('SelectButton', SelectButton);
app.component('AutoComplete', AutoComplete);
app.component('Stepper', Stepper);
app.component('StepList', StepList);
app.component('Step', Step);
app.component('StepItem', StepItem);
app.component('StepPanel',StepPanel)
app.component('Select',Select)
app.component('InputChips',InputChips)






app.mount('#app');

