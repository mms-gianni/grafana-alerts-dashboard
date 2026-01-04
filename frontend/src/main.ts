import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import App from './App.vue'

// Tailwind CSS
import './index.css'

// PrimeVue CSS
import 'primevue/resources/themes/lara-dark-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(PrimeVue)

app.mount('#app')
