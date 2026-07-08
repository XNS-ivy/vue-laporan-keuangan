import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import PlanningView from '../views/PlanningView.vue'
import AssetsView from '../views/AssetsView.vue'
import SettingsView from '../views/SettingsView.vue'
import SavingsGoalView from '../views/SavingsGoalView.vue'
import DebtsView from '../views/DebtsView.vue'
import ReportsView from '../views/ReportsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/transactions', name: 'transactions', component: TransactionsView },
    { path: '/planning', name: 'planning', component: PlanningView },
    { path: '/savings-goal', name: 'savings-goal', component: SavingsGoalView },
    { path: '/assets', name: 'assets', component: AssetsView },
    { path: '/debts', name: 'debts', component: DebtsView },
    { path: '/reports', name: 'reports', component: ReportsView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

export default router
