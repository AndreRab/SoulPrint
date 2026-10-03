import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: App, meta: { screen: 'landing' } },
    { path: '/home', component: App, meta: { screen: 'home' } },
    { path: '/people', component: App, meta: { screen: 'people' } },
    { path: '/people/:id', component: App, meta: { screen: 'profile' } },
    { path: '/chat', component: App, meta: { screen: 'chat' } },
    { path: '/assistant', component: App, meta: { screen: 'assistant' } },
    { path: '/date-plan', component: App, meta: { screen: 'date' } },
    { path: '/plans', component: App, meta: { screen: 'plans' } },
    { path: '/plans/new', component: App, meta: { screen: 'newplan' } },
    { path: '/settings', component: App, meta: { screen: 'settings' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

createApp(App).use(router).mount('#app')
