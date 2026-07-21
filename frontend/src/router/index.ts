import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
    { path: '/welcome', name: 'welcome', component: () => import('../views/WelcomeView.vue') },
    { path: '/transactions', name: 'transactions', component: () => import('../views/TransactionsView.vue') },
    { path: '/planning', name: 'planning', component: () => import('../views/PlanningView.vue') },
    { path: '/savings-goal', name: 'savings-goal', component: () => import('../views/SavingsGoalView.vue') },
    { path: '/assets', name: 'assets', component: () => import('../views/AssetsView.vue') },
    { path: '/debts', name: 'debts', component: () => import('../views/DebtsView.vue') },
    { path: '/reports', name: 'reports', component: () => import('../views/ReportsView.vue') },
    { path: '/utilities', name: 'utilities', component: () => import('../views/UtilitiesView.vue') },
    { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
    { path: '/privacy', name: 'privacy', component: () => import('../views/PrivacyPolicyView.vue') },
    { path: '/terms', name: 'terms', component: () => import('../views/TermsOfServiceView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
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
