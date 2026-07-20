import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import PlanningView from '../views/PlanningView.vue'
import AssetsView from '../views/AssetsView.vue'
import SettingsView from '../views/SettingsView.vue'
import SavingsGoalView from '../views/SavingsGoalView.vue'
import DebtsView from '../views/DebtsView.vue'
import ReportsView from '../views/ReportsView.vue'
import UtilitiesView from '../views/UtilitiesView.vue'
import PrivacyPolicyView from '../views/PrivacyPolicyView.vue'
import TermsOfServiceView from '../views/TermsOfServiceView.vue'
import WelcomeView from '../views/WelcomeView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/welcome', name: 'welcome', component: WelcomeView },
    { path: '/transactions', name: 'transactions', component: TransactionsView },
    { path: '/planning', name: 'planning', component: PlanningView },
    { path: '/savings-goal', name: 'savings-goal', component: SavingsGoalView },
    { path: '/assets', name: 'assets', component: AssetsView },
    { path: '/debts', name: 'debts', component: DebtsView },
    { path: '/reports', name: 'reports', component: ReportsView },
    { path: '/utilities', name: 'utilities', component: UtilitiesView },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/privacy', name: 'privacy', component: PrivacyPolicyView },
    { path: '/terms', name: 'terms', component: TermsOfServiceView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

router.beforeEach((to, from, next) => {
  const introduced = localStorage.getItem('finance_flow_introduced') === 'true'
  const isPublicPage = to.name === 'welcome' || to.name === 'privacy' || to.name === 'terms'
  
  if (!introduced && !isPublicPage) {
    next({ name: 'welcome' })
  } else if (introduced && to.name === 'welcome') {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
