import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import PlanningView from '../views/PlanningView.vue'
import AssetsView from '../views/AssetsView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/transactions', name: 'transactions', component: TransactionsView },
    { path: '/planning', name: 'planning', component: PlanningView },
    { path: '/assets', name: 'assets', component: AssetsView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

export default router
