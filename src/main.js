// import './assets/main.css' I TOOK THIS OUT TEMPORARILY TO TRY AND FIX ISSUES WITH VIEWS LOADING ONLY IN THE CENTER OF SCREEN

//vue stuff
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
//To create a persist state that fixes hard refreshing bug during matchmaking
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)


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





//I'm not sure what to call this part, I am just following PrimeVue's guide: https://primevue.org/vite

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
    theme: {
        // preset:Aura
        preset:Lara
    }
})

app.use(createPinia())

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

import Carousel from 'primevue/carousel';
import Message from 'primevue/message';
import Slider from 'primevue/slider'
import SelectButton from 'primevue/selectbutton'


import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import Step from 'primevue/step'
import StepItem from 'primevue/stepitem'
import StepPanel from 'primevue/steppanel'
import Select from 'primevue/select'
import InputChips from 'primevue/inputchips'

import InputGroup from 'primevue/inputgroup';

import Image from 'primevue/image';
import Password from 'primevue/password';
import MeterGroup from 'primevue/metergroup';
import ScrollPanel from 'primevue/scrollpanel';

import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Rating from 'primevue/rating'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'











// import Select from 'primevue/select'
// import MultiSelect from 'primevue/multiselect'
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
app.component('Stepper', Stepper);
app.component('StepList', StepList);
app.component('Step', Step);
app.component('StepItem', StepItem);
app.component('StepPanel',StepPanel);
app.component('Select',Select);
app.component('InputChips',InputChips);
app.component('InputGroup', InputGroup);
app.component('Image', Image);
app.component('Password', Password);
app.component('MeterGroup', MeterGroup);
app.component('ScrollPanel', ScrollPanel);

app.component('Dropdown', Dropdown);
app.component('Textarea', Textarea);
app.component('Rating', Rating);
app.component('Checkbox', Checkbox);
app.component('Dialog', Dialog)

app.mount('#app');

