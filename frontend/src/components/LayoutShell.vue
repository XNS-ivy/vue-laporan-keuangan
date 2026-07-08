<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const theme = ref(localStorage.getItem('finance-theme') || 'light')

const applyTheme = () => {
  document.documentElement.setAttribute('data-theme', theme.value)
}

onMounted(() => {
  applyTheme()
  window.addEventListener('theme-preference-changed', ((event: Event) => {
    const customEvent = event as CustomEvent<{ theme: string }>
    theme.value = customEvent.detail.theme
    applyTheme()
  }) as EventListener)
})
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand-block">
        <div>
          <p class="eyebrow">Personal Finance</p>
          <h2>Finance Flow</h2>
        </div>
        <p class="subtitle">Pantau uang Anda dengan lebih tenang dan terarah.</p>
      </div>

      <nav>
        <RouterLink to="/" class="nav-link">Dashboard</RouterLink>
        <RouterLink to="/transactions" class="nav-link">Transaksi</RouterLink>
        <RouterLink to="/planning" class="nav-link">Planning</RouterLink>
        <RouterLink to="/assets" class="nav-link">Aset</RouterLink>
        <RouterLink to="/settings" class="nav-link">Settings</RouterLink>
      </nav>
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
  background: var(--bg-soft);
}

.sidebar {
  padding: 1.4rem;
  background: linear-gradient(180deg, var(--sidebar-bg) 0%, var(--sidebar-accent) 100%);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 12px 0 30px rgba(15, 23, 42, 0.14);
}

.brand-block {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 0.72rem;
  opacity: 0.8;
  margin: 0;
}

.sidebar h2 {
  margin: 0;
  font-size: 1.2rem;
}

.subtitle {
  margin: 0.2rem 0 0;
  color: var(--muted);
  line-height: 1.5;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-top: 0.6rem;
}

.nav-link {
  color: var(--sidebar-text);
  text-decoration: none;
  padding: 0.8rem 0.95rem;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255,255,255,0.16);
  color: white;
  transform: translateX(2px);
}

.content {
  padding: 1.35rem;
}

@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-bottom: 1px solid var(--border);
  }
}
</style>
